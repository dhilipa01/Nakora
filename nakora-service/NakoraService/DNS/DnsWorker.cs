using System.Net;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NakoraService.Scoring;

namespace NakoraService.DNS;

/// <summary>
/// Real UDP DNS server. Listens on port 53 (falls back to 5353 if unavailable).
/// Per-packet error isolation: one bad packet never crashes the receive loop.
/// Fail-open: parse failure → forward blindly to upstream (never block on error).
/// Scoring is fire-and-forget — never delays the DNS response.
/// </summary>
public sealed class DnsWorker : BackgroundService
{
    private const int PreferredPort  = 53;
    private const int FallbackPort   = 5353;

    private readonly IScoringEngine  _scoring;
    private readonly BlocklistCache  _blocklist;
    private readonly DnsForwarder    _forwarder;
    private readonly ILogger<DnsWorker> _logger;

    public DnsWorker(
        IScoringEngine  scoring,
        BlocklistCache  blocklist,
        DnsForwarder    forwarder,
        ILogger<DnsWorker> logger)
    {
        _scoring   = scoring;
        _blocklist = blocklist;
        _forwarder = forwarder;
        _logger    = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        UdpClient? udp = TryBind(PreferredPort) ?? TryBind(FallbackPort);

        if (udp is null)
        {
            _logger.LogError("Could not bind DNS server on port {P1} or {P2} — DNS worker inactive",
                PreferredPort, FallbackPort);
            return;
        }

        var localPort = ((IPEndPoint)udp.Client.LocalEndPoint!).Port;
        _logger.LogInformation("DNS server listening on UDP port {Port}", localPort);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var recv = await udp.ReceiveAsync(ct);
                // Each packet handled in its own task — one slow/bad packet cannot block others
                _ = HandlePacketAsync(udp, recv.RemoteEndPoint, recv.Buffer, ct);
            }
            catch (OperationCanceledException) { break; }
            catch (ObjectDisposedException)    { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DNS receive loop error — continuing");
                await Task.Delay(50, ct); // brief back-off to avoid tight error loops
            }
        }

        udp.Dispose();
        _logger.LogInformation("DNS server stopped");
    }

    private async Task HandlePacketAsync(UdpClient udp, IPEndPoint client, byte[] data, CancellationToken ct)
    {
        if (data.Length < 12)
        {
            _logger.LogDebug("Malformed DNS packet from {Client} ({Len} bytes) — dropping", client, data.Length);
            return;
        }

        byte[] response;
        string? domain = null;

        try
        {
            domain = TryParseDomain(data);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Domain parse failed — forwarding packet blind");
        }

        if (domain is not null && _blocklist.IsBlocked(domain, out var reason))
        {
            _logger.LogInformation("Blocked {Domain} (list: {Reason})", domain, reason);
            response = DnsForwarder.BuildNxDomain(data);

            // Async scoring — never awaited on hot path
            if (domain is not null)
                _ = ScoreSafeAsync(domain, $"dns://{domain}", ct);
        }
        else
        {
            // Forward raw bytes upstream — no re-encoding, preserves EDNS0 and flags exactly
            byte[]? upstream = null;
            try
            {
                upstream = await _forwarder.ForwardAsync(data, ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Forward failed for {Domain}", domain ?? "?");
            }

            response = upstream ?? DnsForwarder.BuildServFail(data);

            // Async scoring for non-blocked domains (verdict may flip to suspicious later)
            if (domain is not null)
                _ = ScoreSafeAsync(domain, $"dns://{domain}", ct);
        }

        try
        {
            await udp.SendAsync(response, response.Length, client).WaitAsync(
                TimeSpan.FromSeconds(1), ct);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Send response to {Client} failed", client);
        }
    }

    private async Task ScoreSafeAsync(string domain, string url, CancellationToken ct)
    {
        try
        {
            var dnsResult = new DnsResolutionResult(domain, [], false, string.Empty, 0);
            await _scoring.ScoreAsync(domain, url, dnsResult, ct);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Scoring failed for {Domain} — non-fatal", domain);
        }
    }

    // ── DNS wire format ───────────────────────────────────────────────────────

    /// <summary>
    /// Extracts the first QNAME from a DNS query packet.
    /// Returns null on any parse error — caller must treat null as "forward blindly".
    /// RFC 1035 §4.1.2: labels are length-prefixed, terminated by 0x00.
    /// Compression pointers (0xC0 mask) are not followed — return null so we forward.
    /// </summary>
    internal static string? TryParseDomain(ReadOnlySpan<byte> data)
    {
        // Header is 12 bytes; question section begins at offset 12
        if (data.Length < 17) return null; // 12 + min 1-char label(2) + null(1) + type(2) + class(2)

        int pos = 12;
        var labels = new List<string>(8);

        while (pos < data.Length)
        {
            byte len = data[pos];

            if (len == 0) break; // root label — end of QNAME

            // Compression pointer — we don't follow it in this minimal parser
            if ((len & 0xC0) == 0xC0) return null;

            // Sanity: label max length is 63 per RFC 1035
            if (len > 63) return null;

            pos++;
            if (pos + len > data.Length) return null;

            // Labels must be ASCII-printable for legit domains; silently accept non-ASCII
            labels.Add(Encoding.ASCII.GetString(data.Slice(pos, len)));
            pos += len;

            if (labels.Count > 127) return null; // sanity guard
        }

        if (labels.Count == 0) return null;

        var domain = string.Join('.', labels);

        // Basic sanity: reject obviously invalid
        if (domain.Length > 253) return null;

        return domain;
    }

    // ── bind helpers ─────────────────────────────────────────────────────────

    private UdpClient? TryBind(int port)
    {
        try
        {
            var udp = new UdpClient(port);
            udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
            return udp;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Cannot bind UDP port {Port}: {Msg}", port, ex.Message);
            return null;
        }
    }
}
