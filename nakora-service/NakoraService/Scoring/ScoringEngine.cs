using Microsoft.Extensions.Logging;
using NakoraService.DNS;
using NakoraService.IPC;
using NakoraService.ML;
using NakoraService.Models;
using NakoraService.Storage;

namespace NakoraService.Scoring;

public interface IScoringEngine
{
    Task<Verdict> ScoreAsync(string domain, string url, DnsResolutionResult dns, CancellationToken ct = default);
}

/// <summary>
/// Weight matrix for combining analyzer signals into a verdict.
/// Weights are data-driven — stored in policy file, regression-tested (CLAUDE.md §6).
/// </summary>
public sealed class ScoringEngine : IScoringEngine
{
    // Default weights — Phase 2: load from versioned policy file + regression tests
    private static readonly Dictionary<string, float> Weights = new()
    {
        ["homoglyph"]          = 0.20f,
        ["dga_entropy"]        = 0.18f,
        ["redirect_chain"]     = 0.15f,
        ["cert_transparency"]  = 0.12f,
        ["nlp_irregularity"]   = 0.08f, // low weight — high FP risk (CLAUDE.md §10)
        ["openphish_feed"]     = 0.22f,
        ["phishtank_feed"]     = 0.25f,
        ["onnx_model"]         = 0.20f,
    };

    private readonly IGoAnalyzerClient _goClient;
    private readonly IOnnxInferenceService _onnx;
    private readonly NakoraDbContext _db;
    private readonly IIpcServer _ipc;
    private readonly ILogger<ScoringEngine> _logger;

    public ScoringEngine(
        IGoAnalyzerClient goClient,
        IOnnxInferenceService onnx,
        NakoraDbContext db,
        IIpcServer ipc,
        ILogger<ScoringEngine> logger)
    {
        _goClient = goClient;
        _onnx = onnx;
        _db = db;
        _ipc = ipc;
        _logger = logger;
    }

    public async Task<Verdict> ScoreAsync(string domain, string url, DnsResolutionResult dns, CancellationToken ct)
    {
        if (dns.IsBlocked)
        {
            var blocked = new Verdict(domain, url, 1.0f, VerdictType.Blocked, dns.BlockReason, DateTimeOffset.UtcNow);
            await PersistAndBroadcastAsync(blocked, ct);
            return blocked;
        }

        var signals = new Dictionary<string, float>();

        // Fan-out to Go analyzer microservice and ML.NET in parallel
        var goTask = _goClient.AnalyzeAsync(url, ct);
        var onnxTask = _onnx.PredictAsync(domain, url);

        await Task.WhenAll(goTask, onnxTask);

        var goResult = goTask.Result;
        foreach (var sig in goResult.Signals)
            signals[sig.Name] = (float)sig.Score;

        signals["onnx_model"] = onnxTask.Result;

        float aggregate = ComputeWeightedScore(signals);
        var verdictType = ClassifyScore(aggregate);

        var verdict = new Verdict(domain, url, aggregate, verdictType,
            BuildDetails(signals), DateTimeOffset.UtcNow);

        await PersistAndBroadcastAsync(verdict, ct);
        return verdict;
    }

    private static float ComputeWeightedScore(Dictionary<string, float> signals)
    {
        float weightedSum = 0f;
        float totalWeight = 0f;

        foreach (var (name, score) in signals)
        {
            float w = Weights.GetValueOrDefault(name, 0.10f);
            weightedSum += score * w;
            totalWeight += w;
        }

        return totalWeight > 0 ? Math.Clamp(weightedSum / totalWeight, 0f, 1f) : 0f;
    }

    private static VerdictType ClassifyScore(float score) => score switch
    {
        >= 0.70f => VerdictType.Blocked,
        >= 0.35f => VerdictType.Suspicious,
        _        => VerdictType.Clean,
    };

    private static string BuildDetails(Dictionary<string, float> signals) =>
        string.Join(", ", signals.Select(kv => $"{kv.Key}={kv.Value:F2}"));

    private async Task PersistAndBroadcastAsync(Verdict verdict, CancellationToken ct)
    {
        try
        {
            _db.DnsEvents.Add(new DnsEventEntity
            {
                Domain     = verdict.Domain,
                Url        = verdict.Url,
                Score      = verdict.Score,
                VerdictType = verdict.Type.ToString(),
                Details    = verdict.Details,
                Timestamp  = verdict.Timestamp,
            });
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist verdict for {Domain}", verdict.Domain);
        }

        // Push to WinUI shell via IPC
        await _ipc.BroadcastAsync("verdict", verdict, ct);
    }
}
