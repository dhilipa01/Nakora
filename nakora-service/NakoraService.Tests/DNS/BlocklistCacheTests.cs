using Microsoft.Extensions.Logging.Abstractions;
using NakoraService.DNS;
using Xunit;

namespace NakoraService.Tests.DNS;

public sealed class BlocklistCacheTests
{
    private static BlocklistCache NewCache() => new(NullLogger<BlocklistCache>.Instance);

    [Fact]
    public void FilterListMatch_IsBlocked_WithListIdAsReason()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "evil.com", "phish.net" });

        Assert.True(cache.IsBlocked("evil.com", out var reason));
        Assert.Equal("openphish", reason);
    }

    [Fact]
    public void UnknownDomain_IsNotBlocked()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "evil.com" });

        Assert.False(cache.IsBlocked("example.org", out var reason));
        Assert.Equal(string.Empty, reason);
    }

    [Fact]
    public void Lookup_IsCaseInsensitive()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "Evil.COM" });

        Assert.True(cache.IsBlocked("EVIL.com", out _));
    }

    [Fact]
    public void UserWhitelist_AlwaysWins_OverListsAndBlacklist()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "evil.com" });
        cache.AddToUserBlacklist("evil.com");
        cache.AddToUserWhitelist("evil.com");

        Assert.False(cache.IsBlocked("evil.com", out _));
    }

    [Fact]
    public void UserBlacklist_TakesPriorityOverFilterListReason()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "evil.com" });
        cache.AddToUserBlacklist("evil.com");

        Assert.True(cache.IsBlocked("evil.com", out var reason));
        Assert.Equal("user_blacklist", reason);
    }

    [Fact]
    public void RemoveFromUserBlacklist_Unblocks()
    {
        var cache = NewCache();
        cache.AddToUserBlacklist("evil.com");
        cache.RemoveFromUserBlacklist("evil.com");

        Assert.False(cache.IsBlocked("evil.com", out _));
    }

    [Fact]
    public void ReloadingList_ReplacesPreviousEntries()
    {
        var cache = NewCache();
        cache.LoadList("openphish", new[] { "old.com" });
        cache.LoadList("openphish", new[] { "new.com" });

        Assert.False(cache.IsBlocked("old.com", out _));
        Assert.True(cache.IsBlocked("new.com", out _));
    }

    [Fact]
    public void ConcurrentReadsAndWrites_DoNotThrow()
    {
        var cache = NewCache();
        cache.LoadList("seed", new[] { "evil.com" });

        var tasks = new List<Task>();
        for (int i = 0; i < 8; i++)
        {
            int n = i;
            tasks.Add(Task.Run(() =>
            {
                for (int j = 0; j < 500; j++)
                {
                    if (n % 2 == 0)
                        cache.IsBlocked("evil.com", out _);
                    else
                        cache.AddToUserBlacklist($"domain{n}-{j}.com");
                }
            }));
        }

        Task.WaitAll(tasks.ToArray());
        Assert.True(cache.IsBlocked("evil.com", out _));
    }
}
