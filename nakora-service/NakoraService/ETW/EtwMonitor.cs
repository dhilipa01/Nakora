using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
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
/// ETW monitor using Microsoft.Diagnostics.Tracing.TraceEvent (same library as Sysmon).
/// Subscribes to: Microsoft-Windows-TCPIP (network) + Microsoft-Windows-Kernel-Process (CPU/mem).
/// Requires elevated privileges (Windows service runs as LocalSystem or admin).
/// </summary>
public sealed class EtwMonitor : IEtwMonitor
{
    private readonly ILogger<EtwMonitor> _logger;
    private TraceEventSession? _session;
    private Thread? _thread;

    public event EventHandler<EtwEvent>? EventReceived;

    public EtwMonitor(ILogger<EtwMonitor> logger) => _logger = logger;

    public void Start()
    {
        if (!TraceEventSession.IsElevated() ?? false)
        {
            _logger.LogWarning("ETW requires elevation — monitor disabled for this session");
            return;
        }

        _session = new TraceEventSession("NakoraEtw");

        // Network events — detect DoH bypass (port 443 to known resolver IPs)
        _session.EnableProvider(KernelTraceEventParser.ProviderGuid,
            TraceEventLevel.Informational,
            (ulong)(KernelTraceEventParser.Keywords.NetworkTCPIP));

        // Process CPU/memory events
        _session.EnableProvider(KernelTraceEventParser.ProviderGuid,
            TraceEventLevel.Informational,
            (ulong)(KernelTraceEventParser.Keywords.Process));

        _session.Source.Kernel.TcpIpConnect += OnTcpConnect;
        _session.Source.Kernel.ProcessStart += OnProcessStart;

        _thread = new Thread(() => _session.Source.Process()) { IsBackground = true, Name = "EtwThread" };
        _thread.Start();
        _logger.LogInformation("ETW monitor started");
    }

    public void Stop()
    {
        _session?.Dispose();
        _logger.LogInformation("ETW monitor stopped");
    }

    private void OnTcpConnect(TcpIpConnectTraceData data)
    {
        // Detect DoH bypass: HTTPS (port 443) to known public DNS resolver IPs
        var dohResolvers = new[] { "8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1", "9.9.9.9" };
        var dest = data.daddr.ToString();

        if (data.dport == 443 && Array.Exists(dohResolvers, r => r == dest))
        {
            _logger.LogWarning("DoH bypass detected: process {Pid} connecting to {IP}:443", data.ProcessID, dest);
            EventReceived?.Invoke(this, new EtwEvent(
                "TCPIP", "DoHBypassDetected",
                0, 0, data.ProcessID, data.ProcessName, DateTimeOffset.UtcNow));
        }
    }

    private void OnProcessStart(ProcessTraceData data)
    {
        EventReceived?.Invoke(this, new EtwEvent(
            "Process", "Start",
            0, 0, data.ProcessID, data.ProcessName(), DateTimeOffset.UtcNow));
    }

    public void Dispose() => _session?.Dispose();
}
