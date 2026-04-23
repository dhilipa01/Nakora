using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace NakoraService.DNS;

/// <summary>
/// Forwards raw DNS UDP bytes to an upstream resolver and relays the response.
/// Fail-open: any error returns null so the caller can return SERVFAIL gracefully.
/// </summary>
public sealed class DnsForwarder
{
    private static readonly IPEndPoint[] Upstreams =
    [
        new(IPAddress.Parse("8.8.8.8"),   53),
        new(IPAddress.Parse("1.1.1.1"),   53),
        new(IPAddress.Parse("8.8.4.4"),   53),
    ];

    private const int TimeoutMs  = 2000;
    private const int MaxRetries = 1;

    private readonly ILogger<DnsForwarder> _logger;

    public DnsForwarder(ILogger<DnsForwarder> logger) => _logger = logger;

    /// <summary>
    /// Returns the raw upstream DNS response bytes, or null on failure.
    /// </summary>
    public async Task<byte[]?> ForwardAsync(byte[] query, CancellationToken ct)
    {
        foreach (var upstream in Upstreams)
        {
            for (int attempt = 0; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    using var udp = new UdpClient();
                    udp.Client.SendTimeout    = TimeoutMs;
                    udp.Client.ReceiveTimeout = TimeoutMs;

                    await udp.SendAsync(query, query.Length, upstream).WaitAsync(
                        TimeSpan.FromMilliseconds(TimeoutMs), ct);

                    var result = await udp.ReceiveAsync(ct)
                        .AsTask()
                        .WaitAsync(TimeSpan.FromMilliseconds(TimeoutMs), ct);

                    return result.Buffer;
                }
                catch (OperationCanceledException) { return null; }
                catch (Exception ex) when (attempt == MaxRetries)
                {
                    _logger.LogDebug("Upstream {IP} failed: {Msg}", upstream.Address, ex.Message);
                }
                catch { /* retry */ }
            }
        }

        _logger.LogWarning("All upstream DNS resolvers failed for query");
        return null;
    }

    /// <summary>Builds a minimal SERVFAIL response from the original query bytes.</summary>
    public static byte[] BuildServFail(byte[] query)
    {
        var r = (byte[])query.Clone();
        if (r.Length >= 4)
        {
            r[2] = 0x81; // QR=1 RD=1
            r[3] = 0x82; // RA=1 RCODE=2 (SERVFAIL)
            if (r.Length >= 12) { r[6]=0; r[7]=0; r[8]=0; r[9]=0; r[10]=0; r[11]=0; }
        }
        return r;
    }

    /// <summary>Builds a minimal NXDOMAIN response from the original query bytes.</summary>
    public static byte[] BuildNxDomain(byte[] query)
    {
        var r = (byte[])query.Clone();
        if (r.Length >= 4)
        {
            r[2] = 0x81; // QR=1 RD=1
            r[3] = 0x83; // RA=1 RCODE=3 (NXDOMAIN)
            if (r.Length >= 12) { r[6]=0; r[7]=0; r[8]=0; r[9]=0; r[10]=0; r[11]=0; }
        }
        return r;
    }
}
