using System.Net.Http.Json;
using Microsoft.Extensions.Logging;

namespace NakoraService.IPC;

public interface IGoAnalyzerClient
{
    Task<GoAnalyzerResponse> AnalyzeAsync(string url, CancellationToken ct = default);
}

public record GoSignal(string Name, double Score, double Confidence, string Details);
public record GoAnalyzerResponse(string Domain, List<GoSignal> Signals, double Score, string Verdict, long Ms);

/// <summary>
/// HTTP client for the Go analyzer microservice running on localhost:8080.
/// Async call — must not block DNS resolution path (CLAUDE.md §17).
/// </summary>
public sealed class GoAnalyzerClient : IGoAnalyzerClient
{
    private readonly HttpClient _http;
    private readonly ILogger<GoAnalyzerClient> _logger;

    public GoAnalyzerClient(HttpClient http, ILogger<GoAnalyzerClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<GoAnalyzerResponse> AnalyzeAsync(string url, CancellationToken ct)
    {
        try
        {
            var response = await _http.PostAsJsonAsync("/analyze", new { url }, ct);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<GoAnalyzerResponse>(ct);
            return result ?? EmptyResponse(url);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Go analyzer unavailable for {Url}", url);
            return EmptyResponse(url);
        }
    }

    private static GoAnalyzerResponse EmptyResponse(string url) =>
        new(ExtractDomain(url), [], 0, "clean", 0);

    private static string ExtractDomain(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var u))
            return u.Host;
        return url;
    }
}
