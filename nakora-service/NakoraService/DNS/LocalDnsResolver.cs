using System.Diagnostics;
using System.Net;
using ARSoft.Tools.Net;
using ARSoft.Tools.Net.Dns;
using Microsoft.Extensions.Logging;

namespace NakoraService.DNS;

/// <summary>
/// Local protective DNS resolver using ARSoft.Tools.Net.
/// &lt;30ms target: uses in-memory blocklist cache only; async analysis runs after returning.
/// </summary>
public sealed class LocalDnsResolver : IDnsResolver
{
    // Same upstreams as DnsForwarder. Never use system-configured servers here:
    // once DnsActivator points the system at 127.0.0.1, they resolve to ourselves.
    private static readonly IPAddress[] Upstreams =
    [
        IPAddress.Parse("8.8.8.8"),
        IPAddress.Parse("1.1.1.1"),
        IPAddress.Parse("8.8.4.4"),
    ];

    private const int QueryTimeoutMs = 25;

    private readonly DnsClient _client;
    private readonly ILogger<LocalDnsResolver> _logger;
    private readonly BlocklistCache _blocklist;

    public LocalDnsResolver(ILogger<LocalDnsResolver> logger, BlocklistCache blocklist)
    {
        _logger = logger;
        _blocklist = blocklist;
        _client = new DnsClient(Upstreams, QueryTimeoutMs);
    }

    public async Task<DnsResolutionResult> ResolveAsync(string domain, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();

        // Blocklist check is O(1) — in-memory HashSet, always within budget
        if (_blocklist.IsBlocked(domain, out var reason))
        {
            _logger.LogInformation("Blocked {Domain} ({Reason}) in {Ms}ms", domain, reason, sw.ElapsedMilliseconds);
            return new DnsResolutionResult(domain, [], true, reason, sw.ElapsedMilliseconds);
        }

        try
        {
            var response = await _client.ResolveAsync(
                DomainName.Parse(domain), RecordType.A, RecordClass.INet, token: ct);

            var addresses = response?.AnswerRecords
                .OfType<ARecord>()
                .Select(r => r.Address.ToString())
                .ToList() ?? [];

            sw.Stop();
            if (sw.ElapsedMilliseconds > 30)
                _logger.LogWarning("DNS resolution for {Domain} exceeded 30ms budget: {Ms}ms", domain, sw.ElapsedMilliseconds);

            return new DnsResolutionResult(domain, addresses, false, string.Empty, sw.ElapsedMilliseconds);
        }
        catch (OperationCanceledException)
        {
            return new DnsResolutionResult(domain, [], false, string.Empty, sw.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            // Includes invalid names from DomainName.Parse and upstream timeouts.
            // Resolver fails open: empty answer, never an unhandled fault.
            _logger.LogDebug("DNS error for {Domain}: {Msg}", domain, ex.Message);
            return new DnsResolutionResult(domain, [], false, string.Empty, sw.ElapsedMilliseconds);
        }
    }
}
