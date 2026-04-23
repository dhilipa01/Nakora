using Microsoft.Extensions.Logging;

namespace NakoraService.DNS;

/// <summary>
/// In-memory O(1) blocklist. Mirrors the filter-list approach from the Electron prototype.
/// Populated at startup from SQLite; updated when filter lists are toggled.
/// </summary>
public sealed class BlocklistCache
{
    private readonly ILogger<BlocklistCache> _logger;
    private readonly ReaderWriterLockSlim _lock = new();

    // Separate sets per list so individual lists can be toggled
    private readonly Dictionary<string, HashSet<string>> _lists = new();
    private readonly HashSet<string> _userBlacklist = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _userWhitelist = new(StringComparer.OrdinalIgnoreCase);

    public BlocklistCache(ILogger<BlocklistCache> logger) => _logger = logger;

    public void LoadList(string listId, IEnumerable<string> domains)
    {
        _lock.EnterWriteLock();
        try
        {
            _lists[listId] = new HashSet<string>(domains, StringComparer.OrdinalIgnoreCase);
            _logger.LogInformation("Loaded filter list {ListId}: {Count} entries", listId, _lists[listId].Count);
        }
        finally { _lock.ExitWriteLock(); }
    }

    public void AddToUserBlacklist(string domain)
    {
        _lock.EnterWriteLock();
        try { _userBlacklist.Add(domain.ToLowerInvariant()); }
        finally { _lock.ExitWriteLock(); }
    }

    public void RemoveFromUserBlacklist(string domain)
    {
        _lock.EnterWriteLock();
        try { _userBlacklist.Remove(domain.ToLowerInvariant()); }
        finally { _lock.ExitWriteLock(); }
    }

    public void AddToUserWhitelist(string domain)
    {
        _lock.EnterWriteLock();
        try { _userWhitelist.Add(domain.ToLowerInvariant()); }
        finally { _lock.ExitWriteLock(); }
    }

    public bool IsBlocked(string domain, out string reason)
    {
        var d = domain.ToLowerInvariant();
        _lock.EnterReadLock();
        try
        {
            // Whitelist always wins (CLAUDE.md §5)
            if (_userWhitelist.Contains(d)) { reason = string.Empty; return false; }

            if (_userBlacklist.Contains(d)) { reason = "user_blacklist"; return true; }

            foreach (var (listId, set) in _lists)
            {
                if (set.Contains(d)) { reason = listId; return true; }
            }

            reason = string.Empty;
            return false;
        }
        finally { _lock.ExitReadLock(); }
    }
}
