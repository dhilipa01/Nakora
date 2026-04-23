using Microsoft.EntityFrameworkCore;

namespace NakoraService.Storage;

public sealed class NakoraDbContext : DbContext
{
    public NakoraDbContext(DbContextOptions<NakoraDbContext> options) : base(options) { }

    public DbSet<DnsEventEntity> DnsEvents => Set<DnsEventEntity>();
    public DbSet<AuditLogEntity> AuditLog  => Set<AuditLogEntity>();
    public DbSet<DomainListEntry> DomainList => Set<DomainListEntry>();
    public DbSet<SettingEntity> Settings   => Set<SettingEntity>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<DnsEventEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Timestamp);
            e.HasIndex(x => x.Domain);
            e.Property(x => x.VerdictType).HasMaxLength(16);
        });

        mb.Entity<AuditLogEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Timestamp);
        });

        mb.Entity<DomainListEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Domain, x.ListType }).IsUnique();
            e.Property(x => x.ListType).HasMaxLength(16);
        });

        mb.Entity<SettingEntity>(e =>
        {
            e.HasKey(x => x.Key);
        });
    }
}

public sealed class DnsEventEntity
{
    public long Id { get; set; }
    public string Domain { get; set; } = "";
    public string Url { get; set; } = "";
    public float Score { get; set; }
    public string VerdictType { get; set; } = "Clean";
    public string Details { get; set; } = "";
    public DateTimeOffset Timestamp { get; set; }
}

public sealed class AuditLogEntity
{
    public long Id { get; set; }
    public string Action { get; set; } = "";
    public string Channel { get; set; } = "";
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTimeOffset Timestamp { get; set; }
}

public sealed class DomainListEntry
{
    public long Id { get; set; }
    public string Domain { get; set; } = "";
    public string ListType { get; set; } = ""; // "whitelist" | "blacklist"
    public string Reason { get; set; } = "";
    public DateTimeOffset AddedAt { get; set; }
}

public sealed class SettingEntity
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}
