using Microsoft.EntityFrameworkCore;
using NakoraService.DNS;
using NakoraService.ETW;
using NakoraService.IPC;
using NakoraService.ML;
using NakoraService.Scoring;
using NakoraService.Storage;
using NakoraService.Workers;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/nakora-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
    .CreateLogger();

try
{
    Log.Information("nakora service starting");

    IHost host = Host.CreateDefaultBuilder(args)
        .UseWindowsService(options => options.ServiceName = "NakoraService")
        .UseSerilog()
        .ConfigureServices((ctx, services) =>
        {
            var config = ctx.Configuration;
            var connStr = config.GetConnectionString("Default") ?? "Data Source=nakora.db";

            // Storage — singleton lifetime matches ScoringEngine (avoids captive dependency).
            // SQLite single-writer WAL mode is safe with one shared context instance.
            services.AddDbContext<NakoraDbContext>(
                opts => opts.UseSqlite(connStr),
                contextLifetime: ServiceLifetime.Singleton,
                optionsLifetime: ServiceLifetime.Singleton);

            // DNS pipeline
            services.AddSingleton<BlocklistCache>();
            services.AddSingleton<DnsForwarder>();
            services.AddSingleton<IDnsResolver, LocalDnsResolver>();

            // ETW (non-fatal if elevation missing)
            services.AddSingleton<IEtwMonitor, EtwMonitor>();

            // ML inference (non-fatal if model absent)
            services.AddSingleton<IOnnxInferenceService, OnnxInferenceService>();

            // Scoring
            services.AddSingleton<IScoringEngine, ScoringEngine>();

            // Go analyzer HTTP client — isolated from Node.js; timeout generous (async, off hot path)
            services.AddHttpClient<IGoAnalyzerClient, GoAnalyzerClient>(c =>
            {
                c.BaseAddress = new Uri(config["GoAnalyzer:BaseUrl"] ?? "http://localhost:8080");
                c.Timeout = TimeSpan.FromSeconds(10);
            });

            // IPC named-pipe server (WinUI 3 shell / Electron shell ↔ service)
            services.AddSingleton<IIpcServer, NamedPipeIpcServer>();

            // Background workers — order matters: DnsActivator before DnsWorker
            services.AddHostedService<DnsActivator>();
            services.AddHostedService<FeedRefreshWorker>();
            services.AddHostedService<DnsWorker>();
            services.AddHostedService<EtwWorker>();
        })
        .Build();

    // Run DB migrations; non-fatal if DB is unavailable (service continues without persistence)
    try
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NakoraDbContext>();
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "DB migration failed — service continues without persistent storage");
    }

    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "nakora service terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
