using Microsoft.Extensions.Logging;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace NakoraService.ML;

public interface IOnnxInferenceService
{
    Task<float> PredictAsync(string domain, string url);
}

public class OnnxInput
{
    [VectorType(30)]
    [ColumnName("float_input")]
    public float[] Features { get; set; } = new float[30];
}

public class OnnxOutput
{
    [ColumnName("probabilities")]
    public float[] Probabilities { get; set; } = [];
}

/// <summary>
/// ML.NET + ONNX inference using XGBoost model trained on PhishTank dataset.
/// Model path configured via appsettings.json → "ML:ModelPath".
/// Falls back gracefully if model not present (prototype mode).
/// </summary>
public sealed class OnnxInferenceService : IOnnxInferenceService
{
    private readonly ILogger<OnnxInferenceService> _logger;
    private readonly PredictionEngine<OnnxInput, OnnxOutput>? _engine;
    private readonly bool _modelLoaded;

    public OnnxInferenceService(IConfiguration config, ILogger<OnnxInferenceService> logger)
    {
        _logger = logger;
        var modelPath = config["ML:ModelPath"];

        if (string.IsNullOrEmpty(modelPath) || !File.Exists(modelPath))
        {
            _logger.LogWarning("ONNX model not found at {Path} — ML inference disabled (prototype mode)", modelPath);
            return;
        }

        try
        {
            var mlContext = new MLContext();
            var pipeline = mlContext.Transforms.ApplyOnnxModel(
                outputColumnNames: ["probabilities"],
                inputColumnNames: ["float_input"],
                modelFile: modelPath);

            var emptyData = mlContext.Data.LoadFromEnumerable(Array.Empty<OnnxInput>());
            var model = pipeline.Fit(emptyData);
            _engine = mlContext.Model.CreatePredictionEngine<OnnxInput, OnnxOutput>(model);
            _modelLoaded = true;
            _logger.LogInformation("ONNX model loaded from {Path}", modelPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load ONNX model");
        }
    }

    public Task<float> PredictAsync(string domain, string url)
    {
        if (!_modelLoaded || _engine is null)
            return Task.FromResult(0f);

        var features = ExtractFeatures(domain, url);
        var output = _engine.Predict(new OnnxInput { Features = features });

        // Index 1 = phishing probability (class 1)
        float score = output.Probabilities.Length > 1 ? output.Probabilities[1] : 0f;
        return Task.FromResult(score);
    }

    /// <summary>
    /// Extracts the 30-feature vector matching the XGBoost training schema.
    /// See: Phishing-Detection-System/Detection-Chrome-Extension feature set.
    /// </summary>
    private static float[] ExtractFeatures(string domain, string url)
    {
        var features = new float[30];
        var uri = Uri.TryCreate(url, UriKind.Absolute, out var u) ? u : null;

        features[0] = url.Length;
        features[1] = domain.Length;
        features[2] = url.Count(c => c == '.');
        features[3] = url.Count(c => c == '-');
        features[4] = url.Count(c => c == '/');
        features[5] = url.Count(c => c == '?');
        features[6] = url.Count(c => c == '=');
        features[7] = url.Count(c => c == '@');
        features[8] = url.Contains("https") ? 1 : 0;
        features[9] = url.Contains("login") || url.Contains("signin") ? 1 : 0;
        features[10] = url.Contains("secure") ? 1 : 0;
        features[11] = domain.Split('.').Length - 1; // subdomain depth
        features[12] = uri?.PathAndQuery.Length ?? 0;
        // Features 13–29: reserved for Phase 2 (RDAP age, cert data, redirect count, etc.)

        return features;
    }
}
