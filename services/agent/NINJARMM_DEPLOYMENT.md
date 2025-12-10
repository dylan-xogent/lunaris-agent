# Lunaris Agent - NinjaRMM Deployment Guide

## Overview

This guide explains how to deploy the Lunaris Agent using NinjaRMM's scripting capabilities.

---

## Prerequisites

1. **Upload Agent to GitHub Releases** (recommended) or host it on your own server
2. **NinjaRMM Account** with script deployment capabilities
3. **API Server** accessible from target machines

---

## Deployment Methods

### Method 1: One-Line Installation (Recommended for NinjaRMM)

Use this PowerShell one-liner in NinjaRMM script deployment:

```powershell
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://your-api-server.com/api/agent"
```

**Parameters you can customize:**
- `-ApiUrl` - Your Lunaris API server URL (required)
- `-HeartbeatInterval` - Heartbeat interval in seconds (default: 30)
- `-UpdateScanInterval` - Update scan interval in minutes (default: 60)
- `-ForceReinstall` - Force reinstallation even if already installed

**Example with all parameters:**
```powershell
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://lunaris.company.com/api/agent" -HeartbeatInterval 30 -UpdateScanInterval 60 -ForceReinstall
```

---

### Method 2: Full Script Deployment

#### Step 1: Create Script in NinjaRMM

1. Go to **Administration** → **Library** → **Automation** → **Scripts**
2. Click **Add** → **New Script**
3. Name: `Install Lunaris Agent`
4. Description: `Installs and configures Lunaris Agent for update monitoring`
5. Category: `Deployment`
6. Script Type: `PowerShell`

#### Step 2: Add Script Content

Copy the entire content of `Install-LunarisAgent.ps1` into the script editor.

#### Step 3: Configure Script Variables

In NinjaRMM, you can use custom fields or hardcode values. Add this at the top of the script:

```powershell
# NinjaRMM Configuration Variables
$ApiUrl = "https://your-lunaris-api.com/api/agent"  # Change this!
$HeartbeatInterval = 30
$UpdateScanInterval = 60
$ForceReinstall = $false
```

#### Step 4: Deploy Script

1. Go to **Devices** and select target machines
2. Click **Actions** → **Run Script**
3. Select "Install Lunaris Agent" script
4. Click **Run**

---

### Method 3: Software Deployment (With Custom Installer)

If you prefer using NinjaRMM's software deployment:

#### Step 1: Create Installer Package

1. Download the agent executable
2. Download the installation script
3. Create a ZIP file containing:
   - `lunaris-agent.exe`
   - `Install-LunarisAgent.ps1`

#### Step 2: Upload to NinjaRMM

1. Go to **Administration** → **Library** → **Software**
2. Click **Add Software**
3. Name: `Lunaris Agent`
4. Upload your ZIP file
5. Set install command:
   ```
   powershell.exe -ExecutionPolicy Bypass -File Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent"
   ```

#### Step 3: Deploy to Devices

1. Go to **Devices** → Select devices
2. Click **Actions** → **Install Software**
3. Select "Lunaris Agent"
4. Click **Install**

---

## Configuration Options

### Environment-Specific Deployments

You can use NinjaRMM's custom fields or organizational variables:

```powershell
# Example: Different API URLs per organization
$OrgName = $env:NINJA_ORGANIZATION_NAME

$ApiUrl = switch ($OrgName) {
    "Prod-Environment"    { "https://lunaris-prod.company.com/api/agent" }
    "Test-Environment"    { "https://lunaris-test.company.com/api/agent" }
    default               { "https://lunaris.company.com/api/agent" }
}

# Then call the installer
Install-LunarisAgent -ApiUrl $ApiUrl
```

### Dynamic Configuration

```powershell
# Use NinjaRMM custom fields
$ApiUrl = Ninja-Property-Get lunarisApiUrl
if ([string]::IsNullOrEmpty($ApiUrl)) {
    $ApiUrl = "https://default-lunaris-api.com/api/agent"
}

Install-LunarisAgent -ApiUrl $ApiUrl
```

---

## Verification Script

Create a separate verification script in NinjaRMM:

```powershell
#Requires -RunAsAdministrator

# Check if Lunaris Agent is installed and running
$ServiceName = "LunarisAgent"

Write-Host "=== Lunaris Agent Status Check ===" -ForegroundColor Cyan

# Check service existence
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "[ERROR] Lunaris Agent service not found" -ForegroundColor Red
    exit 1
}

# Check service status
Write-Host "Service Name: $($service.Name)" -ForegroundColor White
Write-Host "Display Name: $($service.DisplayName)" -ForegroundColor White
Write-Host "Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Yellow' })
Write-Host "Start Type: $($service.StartType)" -ForegroundColor White

# Check installation path
$installPath = "C:\Program Files\Lunaris Agent"
if (Test-Path $installPath) {
    Write-Host "Installation Path: $installPath" -ForegroundColor White

    $exePath = Join-Path $installPath "lunaris-agent.exe"
    if (Test-Path $exePath) {
        $version = (Get-Item $exePath).VersionInfo.FileVersion
        Write-Host "Version: $version" -ForegroundColor White
    }

    $configPath = Join-Path $installPath "config.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        Write-Host "API URL: $($config.apiURL)" -ForegroundColor White
        Write-Host "Device ID: $(if ($config.deviceID) { $config.deviceID } else { 'Not registered yet' })" -ForegroundColor White
    }
}

# Exit with appropriate code
if ($service.Status -eq 'Running') {
    Write-Host "`n[SUCCESS] Lunaris Agent is installed and running" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n[WARNING] Lunaris Agent is installed but not running" -ForegroundColor Yellow
    exit 2
}
```

---

## Uninstallation Script

For NinjaRMM uninstallation:

```powershell
#Requires -RunAsAdministrator

# One-liner uninstall
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -Uninstall

# Or if using full script:
Install-LunarisAgent -Uninstall
```

---

## Monitoring & Alerting

### Create NinjaRMM Condition

1. Go to **Administration** → **Policies** → **Conditions**
2. Create new condition: "Lunaris Agent Not Running"
3. Condition Type: `Windows Service`
4. Service Name: `LunarisAgent`
5. Condition: `Service is not running`

### Create Alert

1. Go to **Administration** → **Policies** → **Automation**
2. Create new automation rule
3. Trigger: Condition "Lunaris Agent Not Running"
4. Action: Send notification or run restart script

### Restart Script

```powershell
$ServiceName = "LunarisAgent"
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -ne 'Running') {
        Write-Host "Restarting Lunaris Agent..." -ForegroundColor Yellow
        Restart-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 3

        $service = Get-Service -Name $ServiceName
        if ($service.Status -eq 'Running') {
            Write-Host "Service restarted successfully" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Failed to restart service" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Service is already running" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "Service not found - reinstallation required" -ForegroundColor Red
    exit 1
}
```

---

## Bulk Deployment

### Deploy to All Windows Devices

1. Go to **Devices** → **All Devices**
2. Filter: Operating System = Windows
3. Select all devices (or use smart groups)
4. **Actions** → **Run Script**
5. Select "Install Lunaris Agent"
6. Click **Run**

### Deploy to Specific Organization

1. Go to **Organizations** → Select organization
2. Click **Devices**
3. Select devices
4. **Actions** → **Run Script**
5. Select "Install Lunaris Agent"

### Scheduled Deployment

1. Create a **Scheduled Task** in NinjaRMM
2. Set frequency (e.g., daily at 2 AM)
3. Target: All Windows devices
4. Action: Run "Install Lunaris Agent" script
5. This ensures new devices get the agent automatically

---

## Troubleshooting

### Common Issues

**Issue: Script execution is disabled**
```powershell
# Run this first
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
```

**Issue: Download fails**
- Check firewall rules
- Verify GitHub is accessible
- Use alternative download URL

**Issue: Service won't start**
- Check Event Viewer → Application logs
- Verify API URL is correct and reachable
- Check if winget is installed on the machine

**Issue: Agent not registering**
- Verify API URL in config.json
- Check network connectivity to API server
- Review API server logs for connection attempts

### Diagnostic Script

```powershell
# Run diagnostics
$ServiceName = "LunarisAgent"
$InstallPath = "C:\Program Files\Lunaris Agent"

Write-Host "=== Lunaris Agent Diagnostics ===" -ForegroundColor Cyan

# 1. Check service
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
Write-Host "Service installed: $(if ($service) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($service) { 'Green' } else { 'Red' })

# 2. Check files
$exeExists = Test-Path (Join-Path $InstallPath "lunaris-agent.exe")
$configExists = Test-Path (Join-Path $InstallPath "config.json")
Write-Host "Executable exists: $(if ($exeExists) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($exeExists) { 'Green' } else { 'Red' })
Write-Host "Config exists: $(if ($configExists) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($configExists) { 'Green' } else { 'Red' })

# 3. Check configuration
if ($configExists) {
    $config = Get-Content (Join-Path $InstallPath "config.json") | ConvertFrom-Json
    Write-Host "API URL: $($config.apiURL)" -ForegroundColor White

    # Test API connectivity
    try {
        $response = Invoke-WebRequest -Uri ($config.apiURL -replace '/agent$', '/health') -UseBasicParsing -TimeoutSec 10
        Write-Host "API reachable: Yes (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "API reachable: No ($($_.Exception.Message))" -ForegroundColor Red
    }
}

# 4. Check recent event logs
$events = Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 5 -ErrorAction SilentlyContinue
if ($events) {
    Write-Host "`nRecent Events:" -ForegroundColor Cyan
    $events | ForEach-Object {
        Write-Host "  [$($_.TimeGenerated)] $($_.Message)" -ForegroundColor Gray
    }
}
```

---

## Best Practices

1. **Test in Staging First**
   - Deploy to a test organization before production
   - Verify agent registration and functionality

2. **Use Versioning**
   - Tag releases in GitHub
   - Deploy specific versions, not always "latest"

3. **Monitor Deployment**
   - Use NinjaRMM's activity log
   - Create alerts for failed deployments

4. **Document API URLs**
   - Keep a list of API URLs per environment
   - Use NinjaRMM custom fields for dynamic configuration

5. **Regular Updates**
   - Schedule periodic checks for new versions
   - Test updates in staging before production rollout

---

## Quick Reference

**Install:**
```powershell
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://api.example.com/api/agent"
```

**Reinstall:**
```powershell
Install-LunarisAgent -ApiUrl "https://api.example.com/api/agent" -ForceReinstall
```

**Uninstall:**
```powershell
Install-LunarisAgent -Uninstall
```

**Check Status:**
```powershell
Get-Service LunarisAgent
```

**Restart:**
```powershell
Restart-Service LunarisAgent
```

**View Logs:**
```powershell
Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 20
```

---

## Support

For issues or questions:
- Check logs in Windows Event Viewer
- Review API server logs
- Contact support with device details and error messages
