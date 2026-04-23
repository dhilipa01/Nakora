using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace NakoraService.ETW;

/// <summary>
/// Starts/stops the ETW monitor as a hosted service.
/// Phase 1: starts monitor but all events are informational only.
/// Failures are non-fatal — ETW unavailability must never crash the DNS service.
/// </summary>
public sealed class EtwWorker : BackgroundService
{
    private readonly IEtwMonitor _monitor;
    private readonly ILogger<EtwWorker> _logger;

    public EtwWorker(IEtwMonitor monitor, ILogger<EtwWorker> logger)
    {
        _monitor = monitor;
        _logger  = logger;
    }

    protected override Task ExecuteAsync(CancellationToken ct)
    {
        try
        {
            _monitor.EventReceived += (_, e) =>
                _logger.LogInformation("ETW [{Provider}] {Event} pid={Pid} proc={Proc}",
                    e.Provider, e.EventName, e.ProcessId, e.ProcessName);

            _monitor.Start();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ETW monitor failed to start — continuing without ETW");
        }

        // Block until cancelled; ETW runs on its own thread inside EtwMonitor
        return Task.Delay(Timeout.Infinite, ct)
            .ContinueWith(_ =>
            {
                try { _monitor.Stop(); }
                catch (Exception ex) { _logger.LogDebug(ex, "ETW stop error"); }
            }, TaskScheduler.Default);
    }
}
