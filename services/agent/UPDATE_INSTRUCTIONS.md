# Agent Update Installation Instructions

This guide will help you update the Lunaris Agent with the latest fixes and features.

## What's New in This Update

✅ **Fixed winget upgrade parsing** - Now correctly detects all available updates (including packages with spaces in names like "Python 3.14.1 (64-bit)")

✅ **Added forced sync functionality** - "Sync Now" button in the UI now triggers immediate update scans

✅ **Improved line wrapping handling** - Better parsing of winget output with continuation lines

## Prerequisites

- Windows 10/11
- Administrator privileges
- Go 1.21+ (if building from source)
- WinGet installed

## Installation Steps

### Option 1: Automated Installation (Recommended)

1. **Open PowerShell as Administrator**
   - Right-click PowerShell
   - Select "Run as Administrator"

2. **Navigate to the agent directory**
   ```powershell
   cd "C:\Users\DylanJohnston\OneDrive - XOGENT INC\Desktop\Lunaris-Agent\lunaris-agent\services\agent"
   ```

3. **Run the installation script**
   ```powershell
   .\install-and-start.ps1
   ```

   This script will:
   - Stop the existing service
   - Uninstall the old version
   - Install the new version
   - Start the service

### Option 2: Manual Installation

1. **Open PowerShell as Administrator**

2. **Navigate to the agent directory**
   ```powershell
   cd "C:\Users\DylanJohnston\OneDrive - XOGENT INC\Desktop\Lunaris-Agent\lunaris-agent\services\agent"
   ```

3. **Stop the existing service**
   ```powershell
   .\lunaris-agent.exe -stop
   ```

4. **Uninstall the old version**
   ```powershell
   .\lunaris-agent.exe -uninstall
   ```

5. **Install the new version**
   ```powershell
   .\lunaris-agent.exe -install
   ```

6. **Start the service**
   ```powershell
   .\lunaris-agent.exe -start
   ```

## Verification

### Check Service Status

```powershell
Get-Service -Name "LunarisAgentService"
```

Expected output:
```
Status   Name                   DisplayName
------   ----                   -----------
Running  LunarisAgentService    Lunaris Agent Service
```

### Check Recent Logs

```powershell
Get-EventLog -LogName Application -Source LunarisAgentService -Newest 10
```

### Test Sync Functionality

1. Open the web console: http://localhost:3000
2. Navigate to your device
3. Click the "Sync Now" button
4. Wait a few seconds
5. Check that updates are refreshed

### Verify Update Detection

The agent should now detect all available winget upgrades. To verify:

1. Run manually: `winget upgrade --include-unknown`
2. Count the number of updates shown
3. Check the web console - it should show the same number of updates

## Troubleshooting

### Service Won't Start

1. Check if port 3001 is accessible:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 3001
   ```

2. Verify Docker containers are running:
   ```powershell
   docker-compose ps
   ```

3. Check configuration:
   ```powershell
   Get-Content "C:\ProgramData\LunarisAgent\config.json"
   ```

### Updates Not Showing

1. Wait for the next scan cycle (agent scans every 5 minutes)
2. Or click "Sync Now" button to force immediate scan
3. Check agent logs for parsing errors:
   ```powershell
   Get-EventLog -LogName Application -Source LunarisAgentService -Newest 50 | Where-Object {$_.Message -like "*scan*" -or $_.Message -like "*update*"}
   ```

### Permission Errors

- Ensure PowerShell is running as Administrator
- Check that the service account has necessary permissions

## Rollback (If Needed)

If you need to rollback to a previous version:

1. Stop the service: `.\lunaris-agent.exe -stop`
2. Uninstall: `.\lunaris-agent.exe -uninstall`
3. Restore previous `lunaris-agent.exe` from backup
4. Reinstall: `.\lunaris-agent.exe -install`
5. Start: `.\lunaris-agent.exe -start`

## Support

For issues or questions:
- Check the logs in Windows Event Viewer
- Review the agent README: `README.md`
- Check installation guide: `INSTALL_GUIDE.md`

---

**Last Updated:** December 9, 2025
**Agent Version:** 1.0.0

