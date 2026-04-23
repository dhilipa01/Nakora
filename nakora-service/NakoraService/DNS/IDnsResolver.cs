namespace NakoraService.DNS;

public interface IDnsResolver
{
    /// <summary>
    /// Resolves a domain and returns the result within the <30ms budget.
    /// Resolution is always performed; analysis is async and does not block the caller.
    /// </summary>
    Task<DnsResolutionResult> ResolveAsync(string domain, CancellationToken ct = default);
}

public record DnsResolutionResult(
    string Domain,
    IReadOnlyList<string> Addresses,
    bool IsBlocked,
    string BlockReason,
    long ElapsedMs
);
