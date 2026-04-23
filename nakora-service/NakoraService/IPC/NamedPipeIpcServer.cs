using System.IO.Pipes;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace NakoraService.IPC;

public interface IIpcServer
{
    Task BroadcastAsync<T>(string eventType, T payload, CancellationToken ct = default);
}

/// <summary>
/// Named-pipe IPC server for WinUI 3 shell ↔ service communication.
/// Pipe name: "nakora-service" — WinUI shell connects as client.
/// </summary>
public sealed class NamedPipeIpcServer : IIpcServer, IAsyncDisposable
{
    private const string PipeName = "nakora-service";
    private readonly ILogger<NamedPipeIpcServer> _logger;
    private readonly List<NamedPipeServerStream> _clients = [];
    private readonly SemaphoreSlim _lock = new(1, 1);

    public NamedPipeIpcServer(ILogger<NamedPipeIpcServer> logger) => _logger = logger;

    public async Task BroadcastAsync<T>(string eventType, T payload, CancellationToken ct)
    {
        var message = JsonSerializer.Serialize(new { type = eventType, data = payload });
        var bytes = System.Text.Encoding.UTF8.GetBytes(message + "\n");

        await _lock.WaitAsync(ct);
        try
        {
            var dead = new List<NamedPipeServerStream>();
            foreach (var pipe in _clients)
            {
                try
                {
                    if (pipe.IsConnected)
                        await pipe.WriteAsync(bytes, ct);
                    else
                        dead.Add(pipe);
                }
                catch
                {
                    dead.Add(pipe);
                }
            }
            foreach (var d in dead)
            {
                _clients.Remove(d);
                d.Dispose();
            }
        }
        finally { _lock.Release(); }
    }

    /// <summary>Starts accepting new pipe connections in background.</summary>
    public void StartAccepting(CancellationToken ct) =>
        Task.Run(() => AcceptLoopAsync(ct), ct);

    private async Task AcceptLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var pipe = new NamedPipeServerStream(PipeName, PipeDirection.Out,
                NamedPipeServerStream.MaxAllowedServerInstances,
                PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
            try
            {
                await pipe.WaitForConnectionAsync(ct);
                _logger.LogInformation("IPC client connected");
                await _lock.WaitAsync(ct);
                try { _clients.Add(pipe); }
                finally { _lock.Release(); }
            }
            catch (OperationCanceledException) { pipe.Dispose(); break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IPC accept error");
                pipe.Dispose();
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _lock.WaitAsync();
        try
        {
            foreach (var p in _clients) p.Dispose();
            _clients.Clear();
        }
        finally { _lock.Release(); }
    }
}
