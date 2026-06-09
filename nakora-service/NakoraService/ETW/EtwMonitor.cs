using System.Security.Principal;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Session;
using Microsoft.Extensions.Logging;

namespace NakoraService.ETW;

public interface IEtwMonitor : IDisposable
{
    event EventHandler<EtwEvent> EventReceived;
    void Start();
    void Stop();
}

public record EtwEvent(
    string Provider,
    string EventName,
    double CpuPercent,
    long MemoryBytes,
    int ProcessId,
    string ProcessName,
    DateTimeOffset Timestamp
);

/// <summary>
/// Real ETW monitor using Microsoft.Diagnostics.Tracing.TraceEvent.
/// Subscribes to Microsoft-Windows-TCPIP and Microsoft-Windows-Kernel-Process.
/// Requires Administrator — degrades gracefully if elevation is missing.
/// Source.Process() blocks; runs on dedicated background thread.
/// </summary>
public sealed class EtwMonitor : IEtwMonitor
{
    private const string SessionName = "NakoraEtwSession";

    private static readonly string[] Providers =
    [
        "Microsoft-Windows-TCPIP",
        "Microsoft-Windows-Kernel-Process",
    ];

    // Filter noise — only relay events relevant to threat detection
    private static readonly HashSet<string> WatchedEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        // TCPIP — connection events for mining-pool correlation
        "TcpIpConnect", "TcpIpConnectIPV6",
        "TcpIpDisconnect", "TcpIpDisconnectIPV6",
        "UdpIpSend", "UdpIpSendIPV6",
        // Kernel-Process — process lifecycle for CPU attribution
        "ProcessStart", "ProcessStop",
    };

    private readonly ILogger<EtwMonitor> _logger;
    private TraceEventSession? _session;
    private Thread? _thread;
    private volatile bool _running;

    public event EventHandler<EtwEvent>? EventReceived;

    public EtwMonitor(ILogger<EtwMonitor> logger) => _logger = logger;

    public void Start()
    {
        if (_running) return;

        if (!IsAdministrator())
        {
            _logger.LogWarning("ETW monitor skipped — Administrator required. " +
                               "Re-launch service as Administrator to enable kernel event tracing.");
            return;
        }

        try
        {
            CleanupStaleSession();

            _session = new TraceEventSession(SessionName);

            foreach (var provider in Providers)
                _session.EnableProvider(provider);

            _session.Source.Dynamic.All += OnEvent;

            _thread = new Thread(RunProcessingLoop)
            {
                IsBackground = true,
                Name = "NakoraEtw",
            };
            _thread.Start();

            _running = true;
            _logger.LogInformation("ETW monitor started — providers: {Providers}",
                string.Join(", ", Providers));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ETW monitor failed to start");
            SafeDisposeSession();
        }
    }

    public void Stop()
    {
        if (!_running) return;
        _running = false;

        try
        {
            // StopProcessing() unblocks Source.Process() on the background thread
            _session?.Source.StopProcessing();
            _thread?.Join(TimeSpan.FromSeconds(3));
            SafeDisposeSession();
            _logger.LogInformation("ETW monitor stopped");
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "ETW stop error");
        }
    }

    public void Dispose() => Stop();

    private void RunProcessingLoop()
    {
        try
        {
            _session?.Source.Process(); // blocks until StopProcessing() is called
        }
        catch (Exception ex) when (_running)
        {
            _logger.LogError(ex, "ETW processing loop crashed");
        }
    }

    private void OnEvent(TraceEvent data)
    {
        if (!WatchedEvents.Contains(data.EventName)) return;

        try
        {
            var evt = new EtwEvent(
                Provider:    data.ProviderName,
                EventName:   data.EventName,
                CpuPercent:  0,
                MemoryBytes: 0,
                ProcessId:   data.ProcessID,
                ProcessName: data.ProcessName,
                Timestamp:   new DateTimeOffset(data.TimeStamp)
            );
            EventReceived?.Invoke(this, evt);
        }
        catch
        {
            // Never throw from a TraceEvent callback — doing so corrupts the session
        }
    }

    private void CleanupStaleSession()
    {
        try
        {
            if (!TraceEventSession.GetActiveSessionNames().Contains(SessionName)) return;
            using var stale = new TraceEventSession(SessionName, TraceEventSessionOptions.Attach);
            stale.Stop();
            _logger.LogDebug("Cleaned up stale ETW session '{Name}'", SessionName);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not clean stale ETW session — proceeding");
        }
    }

    private void SafeDisposeSession()
    {
        try { _session?.Dispose(); } catch { }
        _session = null;
    }

    private static bool IsAdministrator()
    {
        using var identity = WindowsIdentity.GetCurrent();
        return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
    }
}
