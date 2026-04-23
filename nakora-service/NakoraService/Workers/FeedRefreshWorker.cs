using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NakoraService.DNS;

namespace NakoraService.Workers;

/// <summary>
/// Periodically refreshes threat feed blocklists into BlocklistCache.
/// Phase 1: loads bundled seed lists from disk on startup; HTTP feed refresh is Phase 2.
/// Any load failure is logged and skipped — never crashes the service.
/// </summary>
public sealed class FeedRefreshWorker : BackgroundService
{
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromHours(12);
    private static readonly string[] SeedListPaths   =
    [
        "lists/openphish.txt",
        "lists/coinblocker.txt",
        "lists/urlhaus.txt",
    ];

    private readonly BlocklistCache _cache;
    private readonly ILogger<FeedRefreshWorker> _logger;

    public FeedRefreshWorker(BlocklistCache cache, ILogger<FeedRefreshWorker> logger)
    {
        _cache  = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Load seed lists immediately on startup
        LoadSeedLists();

        // Periodic refresh loop (Phase 2: replace with real HTTP feed download)
        using var timer = new PeriodicTimer(RefreshInterval);
        while (await timer.WaitForNextTickAsync(ct))
        {
            LoadSeedLists();
        }
    }

    private void LoadSeedLists()
    {
        foreach (var path in SeedListPaths)
        {
            try
            {
                if (!File.Exists(path)) continue;

                var domains = File.ReadLines(path)
                    .Select(l => l.Trim())
                    .Where(l => l.Length > 0 && !l.StartsWith('#'))
                    .ToList();

                var listId = Path.GetFileNameWithoutExtension(path);
                _cache.LoadList(listId, domains);
                _logger.LogInformation("Loaded {Count} entries from {List}", domains.Count, listId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load seed list {Path} — skipping", path);
            }
        }
    }
}
