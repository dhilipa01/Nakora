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
/// ETW monitor stub — Phase 1 placeholder.
/// Phase 2 will integrate Microsoft.Diagnostics.Tracing.TraceEvent for real kernel event monitoring.
/// Currently: logs that ETW is disabled, never crashes.
/// </summary>
public sealed class EtwMonitor : IEtwMonitor
{
    private readonly ILogger<EtwMonitor> _logger;

    public event EventHandler<EtwEvent>? EventReceived;

    public EtwMonitor(ILogger<EtwMonitor> logger) => _logger = logger;

    public void Start()
    {
        _logger.LogInformation("ETW monitor started (Phase 1: stub only — real kernel events disabled)");
    }

    public void Stop()
    {
        _logger.LogInformation("ETW monitor stopped");
    }

    public void Dispose() { }
