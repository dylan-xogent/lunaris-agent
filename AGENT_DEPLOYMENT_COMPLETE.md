# Lunaris Agent - Deployment Package Complete

## Summary

The Lunaris Agent has been **rebuilt** with Phase 1 improvements and packaged with comprehensive deployment tools for both **manual installation** and **NinjaRMM deployment**.

---

## What's Included

### Agent Executable
- **File:** `services/agent/lunaris-agent.exe`
- **Version:** 1.0.0
- **Features:**
  - ✅ Heartbeat retry logic with exponential backoff (5s, 10s, 20s)
  - ✅ Winget integration for package detection and installation
  - ✅ Metrics collection (CPU, memory, disk)
  - ✅ Command execution (install_updates, run_scan)
  - ✅ Automatic service recovery
  - ✅ Windows Service integration

### Universal Installer Script
- **File:** `services/agent/Install-LunarisAgent.ps1`
- **Size:** 11.6 KB
- **Features:**
  - One-script installation solution
  - Works standalone or with GitHub releases
  - Automatic service configuration
  - Error handling and logging
  - Uninstall capability
  - Force reinstall option
  - Configurable parameters

### Documentation
1. **`README-INSTALLATION.md`** (11.2 KB)
   - Complete installation guide
   - Configuration options
   - Troubleshooting guide
   - Post-installation verification
   - FAQ

2. **`NINJARMM_DEPLOYMENT.md`** (12.5 KB)
   - NinjaRMM-specific deployment guide
   - Script templates for NinjaRMM
   - Monitoring and alerting setup
   - Bulk deployment procedures
   - Verification scripts

---

## Quick Start

### For Manual Installation (Local Network)

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to the agent directory
cd "C:\path\to\lunaris-agent\services\agent"

# 3. Run the installer
.\Install-LunarisAgent.ps1 -ApiUrl "http://your-api-server:3001/api/agent"
```

### For NinjaRMM Deployment (One-Liner)

```powershell
# Option 1: If hosted on GitHub (update YOUR_USERNAME)
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://your-api-server.com/api/agent"

# Option 2: If using custom hosting
irm https://your-server.com/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://your-api-server.com/api/agent" -DownloadUrl "https://your-server.com/lunaris-agent.exe"
```

---

## Deployment Methods

### Method 1: Local Network Deployment

**Best for:** Internal deployments where you have file server access

1. **Copy files to network share:**
   ```
   \\fileserver\software\lunaris-agent\
   ├── lunaris-agent.exe
   └── Install-LunarisAgent.ps1
   ```

2. **Deploy via GPO startup script:**
   ```powershell
   \\fileserver\software\lunaris-agent\Install-LunarisAgent.ps1 -ApiUrl "http://lunaris-api.company.local:3001/api/agent"
   ```

3. **Or run manually on each machine:**
   ```powershell
   net use Z: \\fileserver\software
   cd Z:\lunaris-agent
   .\Install-LunarisAgent.ps1 -ApiUrl "http://lunaris-api.company.local:3001/api/agent"
   ```

### Method 2: GitHub Releases (Recommended)

**Best for:** Remote deployments, automatic updates, version control

1. **Upload to GitHub:**
   - Create release tag (e.g., v1.0.0)
   - Upload `lunaris-agent.exe`
   - Upload `Install-LunarisAgent.ps1`

2. **Update installer script:**
   Edit line 20 in `Install-LunarisAgent.ps1`:
   ```powershell
   $GitHubRepo = "YOUR_USERNAME/lunaris-agent"
   ```

3. **Deploy anywhere:**
   ```powershell
   irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://api.example.com/api/agent"
   ```

### Method 3: NinjaRMM Script Deployment

**Best for:** Managed service providers, large deployments

1. **Create script in NinjaRMM:**
   - Copy content from `Install-LunarisAgent.ps1`
   - Set API URL variable at top
   - Save as "Install Lunaris Agent"

2. **Deploy to devices:**
   - Select target devices
   - Run script
   - Monitor deployment status

3. **Set up monitoring:**
   - Create condition for service status
   - Create alerts for failures
   - Schedule health checks

**See `NINJARMM_DEPLOYMENT.md` for detailed instructions**

### Method 4: Custom Web Server

**Best for:** Air-gapped environments, custom hosting

1. **Host files on your web server:**
   ```
   https://downloads.company.com/
   ├── lunaris-agent.exe
   └── Install-LunarisAgent.ps1
   ```

2. **Deploy with custom URL:**
   ```powershell
   irm https://downloads.company.com/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://lunaris-api.company.com/api/agent" -DownloadUrl "https://downloads.company.com/lunaris-agent.exe"
   ```

---

## Configuration Options

The installer supports multiple configuration parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `ApiUrl` | http://localhost:3001/api/agent | Your Lunaris API server URL |
| `HeartbeatInterval` | 30 | Heartbeat interval in seconds |
| `UpdateScanInterval` | 60 | Update scan interval in minutes |
| `InstallPath` | C:\Program Files\Lunaris Agent | Installation directory |
| `ForceReinstall` | false | Force reinstall even if exists |
| `DownloadUrl` | (GitHub) | Custom download URL for executable |
| `Version` | latest | Version to install from GitHub |
| `Uninstall` | false | Uninstall the agent |

**Example with all options:**
```powershell
.\Install-LunarisAgent.ps1 `
    -ApiUrl "https://lunaris.company.com/api/agent" `
    -HeartbeatInterval 45 `
    -UpdateScanInterval 120 `
    -InstallPath "D:\Programs\Lunaris" `
    -ForceReinstall
```

---

## Verification Steps

### 1. Check Service Status

```powershell
Get-Service LunarisAgent
```

**Expected:**
```
Status   Name           DisplayName
------   ----           -----------
Running  LunarisAgent   Lunaris Agent
```

### 2. Verify Files

```powershell
Get-ChildItem "C:\Program Files\Lunaris Agent"
```

**Expected:**
```
lunaris-agent.exe    (Agent executable)
config.json          (Configuration file)
```

### 3. Check Configuration

```powershell
Get-Content "C:\Program Files\Lunaris Agent\config.json" | ConvertFrom-Json
```

**Expected:**
```json
{
  "apiURL": "https://your-api-server.com/api/agent",
  "heartbeatIntervalSec": 30,
  "updateScanIntervalMin": 60,
  "deviceID": "auto-populated-after-registration"
}
```

### 4. Check Dashboard

1. Open Lunaris web dashboard: `http://your-api-server:3000`
2. Navigate to Devices
3. Verify new device appears
4. Check device status is "Online"

### 5. View Logs

```powershell
Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 10
```

**Look for:**
- "Device registered successfully"
- "Heartbeat OK"
- "Scanning for updates..."

---

## Troubleshooting

### Quick Diagnostic Script

```powershell
# Run this to diagnose issues
$ServiceName = "LunarisAgent"
$InstallPath = "C:\Program Files\Lunaris Agent"

Write-Host "=== Lunaris Agent Diagnostics ===" -ForegroundColor Cyan

# Service check
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
Write-Host "Service Status: $(if ($service) { $service.Status } else { 'Not Installed' })" -ForegroundColor $(if ($service -and $service.Status -eq 'Running') { 'Green' } else { 'Red' })

# File check
$exeExists = Test-Path (Join-Path $InstallPath "lunaris-agent.exe")
$configExists = Test-Path (Join-Path $InstallPath "config.json")
Write-Host "Files Present: $(if ($exeExists -and $configExists) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($exeExists -and $configExists) { 'Green' } else { 'Red' })

# Configuration check
if ($configExists) {
    $config = Get-Content (Join-Path $InstallPath "config.json") | ConvertFrom-Json
    Write-Host "API URL: $($config.apiURL)" -ForegroundColor White

    # Test connectivity
    try {
        $testUrl = ($config.apiURL -replace '/agent$', '/health')
        $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
        Write-Host "API Connectivity: OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "API Connectivity: Failed" -ForegroundColor Red
    }
}
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **Service won't start** | Check Event Viewer logs<br>Verify API URL is correct<br>Ensure winget is installed |
| **Can't download agent** | Use local installation method<br>Check firewall rules<br>Verify URL is accessible |
| **Agent not registering** | Test API connectivity<br>Check API server logs<br>Verify network allows outbound HTTPS |
| **High resource usage** | Increase update scan interval<br>Check for large number of pending updates |

**For detailed troubleshooting, see `README-INSTALLATION.md`**

---

## Upgrade Process

### Upgrade Existing Installations

```powershell
# Method 1: Force reinstall (preserves device registration)
.\Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent" -ForceReinstall

# Method 2: Manual upgrade
Stop-Service LunarisAgent
Copy-Item -Path ".\lunaris-agent.exe" -Destination "C:\Program Files\Lunaris Agent\lunaris-agent.exe" -Force
Start-Service LunarisAgent
```

---

## Uninstallation

```powershell
# Using installer
.\Install-LunarisAgent.ps1 -Uninstall

# Or manually
Stop-Service LunarisAgent -Force
sc.exe delete LunarisAgent
Remove-Item -Path "C:\Program Files\Lunaris Agent" -Recurse -Force
```

---

## What's Next

### Immediate Steps

1. **✅ Agent rebuilt** with Phase 1 improvements
2. **✅ Installer created** and tested
3. **✅ Documentation complete**
4. **⏭️ Upload to GitHub** (if using GitHub releases method)
   - Create release v1.0.0
   - Upload `lunaris-agent.exe`
   - Upload `Install-LunarisAgent.ps1`
5. **⏭️ Update installer script** with your GitHub repo name
6. **⏭️ Test deployment** on a few machines
7. **⏭️ Roll out** to production

### GitHub Release Steps

```bash
# 1. Tag the release
git tag -a v1.0.0 -m "Release v1.0.0 - Phase 1 Complete"
git push origin v1.0.0

# 2. Create release on GitHub
# - Go to Releases → New Release
# - Select tag v1.0.0
# - Upload lunaris-agent.exe
# - Upload Install-LunarisAgent.ps1
# - Publish release

# 3. Update installer with your repo
# Edit services/agent/Install-LunarisAgent.ps1 line 20:
# $GitHubRepo = "YOUR_USERNAME/lunaris-agent"
```

---

## Files Reference

### Essential Files

```
services/agent/
├── lunaris-agent.exe              # Agent executable (built)
├── Install-LunarisAgent.ps1       # Universal installer
├── README-INSTALLATION.md         # Installation guide
└── NINJARMM_DEPLOYMENT.md         # NinjaRMM guide
```

### Supporting Documentation

```
lunaris-agent/
├── PHASE_1_COMPLETE.md            # Phase 1 completion guide
├── V1_RELEASE_CHECKLIST.md        # Release checklist
├── AGENT_DEPLOYMENT_COMPLETE.md   # This file
└── .env.example                   # API configuration example
```

---

## Success Metrics

After deployment, monitor these metrics:

- **Service Status:** All agents should show "Running"
- **Registration Rate:** Devices appear in dashboard within 1 minute
- **Heartbeat Success:** 99%+ heartbeat success rate
- **Update Detection:** Updates detected within scan interval
- **Resource Usage:** < 50 MB RAM, < 5% CPU average

---

## Support Resources

### Documentation
- **Installation Guide:** `README-INSTALLATION.md`
- **NinjaRMM Guide:** `NINJARMM_DEPLOYMENT.md`
- **Phase 1 Complete:** `PHASE_1_COMPLETE.md`
- **API Docs:** http://your-api-server:3001/api/docs

### Diagnostics
- **Event Viewer:** Application → Lunaris Agent
- **Service Status:** `Get-Service LunarisAgent`
- **Configuration:** `C:\Program Files\Lunaris Agent\config.json`
- **API Health:** `http://your-api-server:3001/api/health`

### Testing
- Install on test machine first
- Verify service starts automatically after reboot
- Check device appears in dashboard
- Test update detection and installation
- Monitor for 24 hours before production rollout

---

## Version Information

- **Agent Version:** 1.0.0
- **Installer Version:** 1.0.0
- **Release Date:** December 9, 2025
- **Phase:** 1 (Foundation) - Complete
- **Platform:** Windows 10/11

---

## Summary

✅ **Agent rebuilt** with Phase 1 retry logic and improvements
✅ **Universal installer** created for all deployment scenarios
✅ **NinjaRMM ready** with one-liner deployment
✅ **Documentation complete** with guides and troubleshooting
✅ **Production ready** for v1.0 release

**You now have everything needed to deploy the Lunaris Agent to any number of Windows machines, whether manually, via network share, GitHub releases, or NinjaRMM!**
