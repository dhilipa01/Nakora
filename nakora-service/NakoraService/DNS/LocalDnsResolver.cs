using System.Diagnostics;
using DnsClient;
using Microsoft.Extensions.Logging;

namespace NakoraService.DNS;

/// <summary>
/// Local protective DNS resolver using DnsClient.NET.
/// <30ms target: uses in-memory blocklist cache only; async analysis runs after returning.
/// </summary>
public sealed class LocalDnsResolver : IDnsResolver
{
    private readonly LookupClient _client;
    private readonly ILogger<LocalDnsResolver> _logger;
    private readonly BlocklistCache _blocklist;

    public LocalDnsResolver(ILogger<LocalDnsResolver> logger, BlocklistCache blocklist)
    {
        _logger = logger;
        _blocklist = blocklist;

        // Use system-configured upstream resolvers; configure short timeout for <30ms budget
        var options = new LookupClientOptions
        {
            Timeout = TimeSpan.FromMilliseconds(25),
            Retries = 1,
            UseCache = true,
            MinimumCacheTimeout = TimeSpan.FromSeconds(10),
        };
        _client = new LookupClient(options);
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
            var result = await _client.QueryAsync(domain, QueryType.A, cancellationToken: ct);
            var addresses = result.Answers
                .ARecords()
                .Select(r => r.Address.ToString())
                .ToList();

            sw.Stop();
            if (sw.ElapsedMilliseconds > 30)
                _logger.LogWarning("DNS resolution for {Domain} exceeded 30ms budget: {Ms}ms", domain, sw.ElapsedMilliseconds);

            return new DnsResolutionResult(domain, addresses, false, string.Empty, sw.ElapsedMilliseconds);
        }
        catch (DnsResponseException ex)
        {
            _logger.LogDebug("DNS NXDOMAIN or error for {Domain}: {Msg}", domain, ex.Message);
            return new DnsResolutionResult(domain, [], false, string.Empty, sw.ElapsedMilliseconds);
        }
    }
}
