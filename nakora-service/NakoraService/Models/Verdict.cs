namespace NakoraService.Models;

public enum VerdictType { Clean, Suspicious, Blocked }

public record Verdict(
    string Domain,
    string Url,
    float Score,
    VerdictType Type,
    string Details,
    DateTimeOffset Timestamp
);
