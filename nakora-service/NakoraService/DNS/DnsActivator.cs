using System.Diagnostics;
using System.Net.NetworkInformation;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace NakoraService.DNS;

/// <summary>
/// Configures Windows system DNS to route through nakora on startup and restores on stop.
/// Strategy:
///   1. Stop the Windows DNS Client (dnscache) service to free port 53.
///   2. Set all active network adapters' DNS to 127.0.0.1 (fallback: 8.8.8.8).
///      The 8.8.8.8 fallback means DNS keeps working even if nakora crashes.
///   3. On stop: restore original adapter DNS and restart dnscache.
///
/// Any step may fail (permissions, group policy, etc.) — logs a warning and continues.
/// The DNS server still runs; interception just won't be active.
/// </summary>
public sealed class DnsActivator : IHostedService
{
    private readonly ILogger<DnsActivator> _logger;
    private bool _dnscacheWasStopped;

    // Per-adapter original DNS: adapter name → original server addresses
    private readonly Dictionary<string, string[]> _originalDns = new();

    public DnsActivator(ILogger<DnsActivator> logger) => _logger = logger;

    public async Task StartAsync(CancellationToken ct)
    {
        if (!OperatingSystem.IsWindows()) return;

        await StopDnsCacheAsync(ct);
        await SetAdapterDnsAsync(ct);
    }

    public async Task StopAsync(CancellationToken ct)
    {
        if (!OperatingSystem.IsWindows()) return;

        await RestoreAdapterDnsAsync(ct);

        if (_dnscacheWasStopped)
            await StartDnsCacheAsync(ct);
    }

    // ── dnscache service ─────────────────────────────────────────────────────

    private async Task StopDnsCacheAsync(CancellationToken ct)
    {
        try
        {
            var exit = await RunAsync("sc.exe", "stop dnscache", ct);
            if (exit == 0)
            {
                _dnscacheWasStopped = true;
                _logger.LogInformation("Stopped dnscache service — port 53 now available");
                // Brief wait for port to be released
                await Task.Delay(400, ct);
            }
            else
            {
                _logger.LogWarning("sc stop dnscache exited {Code} — DNS interception may be inactive", exit);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to stop dnscache — continuing in passive mode");
        }
    }

    private async Task StartDnsCacheAsync(CancellationToken ct)
    {
        try
        {
            await RunAsync("sc.exe", "start dnscache", ct);
            _logger.LogInformation("Restarted dnscache service");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to restart dnscache — user may need to restart manually");
        }
    }

    // ── adapter DNS settings ─────────────────────────────────────────────────

    private async Task SetAdapterDnsAsync(CancellationToken ct)
    {
        try
        {
            // Capture current DNS per adapter for later restore
            foreach (var iface in GetActiveAdapters())
            {
                try
                {
                    var current = GetAdapterDns(iface);
                    _originalDns[iface] = current;
                }
                catch { /* skip this adapter */ }
            }

            // Set all active adapters to 127.0.0.1 primary, 8.8.8.8 fallback
            var ps = "Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object { " +
                     "Set-DnsClientServerAddress -InterfaceAlias $_.Name " +
                     "-ServerAddresses ('127.0.0.1','8.8.8.8') }";

            int exit = await RunPowerShellAsync(ps, ct);
            if (exit == 0)
                _logger.LogInformation("Adapter DNS set to 127.0.0.1 (fallback: 8.8.8.8)");
            else
                _logger.LogWarning("Set adapter DNS exited {Code} — interception may be inactive", exit);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set adapter DNS — continuing in passive mode");
        }
    }

    private async Task RestoreAdapterDnsAsync(CancellationToken ct)
    {
        if (_originalDns.Count == 0)
        {
            // If we have no saved state, just reset all adapters to DHCP-assigned DNS
            try
            {
                var ps = "Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object { " +
                         "Set-DnsClientServerAddress -InterfaceAlias $_.Name -ResetServerAddresses }";
                await RunPowerShellAsync(ps, ct);
                _logger.LogInformation("Adapter DNS restored to DHCP defaults");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to restore adapter DNS");
            }
            return;
        }

        foreach (var (adapter, servers) in _originalDns)
        {
            try
            {
                string serverList = servers.Length == 0
                    ? "-ResetServerAddresses"
                    : $"-ServerAddresses ('{string.Join("','", servers)}')";

                var ps = $"Set-DnsClientServerAddress -InterfaceAlias '{adapter}' {serverList}";
                await RunPowerShellAsync(ps, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to restore DNS for adapter {Adapter}", adapter);
            }
        }

        _logger.LogInformation("Adapter DNS settings restored");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static IEnumerable<string> GetActiveAdapters()
    {
        try
        {
            return NetworkInterface.GetAllNetworkInterfaces()
                .Where(n => n.OperationalStatus == OperationalStatus.Up &&
                            n.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                .Select(n => n.Name);
        }
        catch { return []; }
    }

    private static string[] GetAdapterDns(string adapterName)
    {
        var iface = NetworkInterface.GetAllNetworkInterfaces()
            .FirstOrDefault(n => n.Name == adapterName);
        if (iface is null) return [];

        return iface.GetIPProperties().DnsAddresses
            .Select(a => a.ToString())
            .ToArray();
    }

    private static async Task<int> RunAsync(string exe, string args, CancellationToken ct)
    {
        var psi = new ProcessStartInfo(exe, args)
        {
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            UseShellExecute        = false,
            CreateNoWindow         = true,
        };

        using var p = Process.Start(psi) ?? throw new InvalidOperationException($"Could not start {exe}");
        await p.WaitForExitAsync(ct);
        return p.ExitCode;
    }

    private static async Task<int> RunPowerShellAsync(string script, CancellationToken ct)
    {
        return await RunAsync("powershell.exe",
            $"-NonInteractive -NoProfile -ExecutionPolicy Bypass -Command \"{script}\"", ct);
    }
}
