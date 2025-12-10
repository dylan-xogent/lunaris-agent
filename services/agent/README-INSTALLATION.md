# Lunaris Agent - Installation Guide

## Quick Start

### Prerequisites
- Windows 10 or Windows 11
- PowerShell 5.1 or higher
- Administrator privileges
- Lunaris API server accessible from the target machine

### One-Line Installation

Open PowerShell as Administrator and run:

```powershell
# Download and run installer
cd "C:\path\to\lunaris-agent\services\agent"
.\Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent"
```

Or with remote script:

```powershell
irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex; Install-LunarisAgent -ApiUrl "https://your-api-server.com/api/agent"
```

---

## Installation Methods

### Method 1: Local Installation (Recommended for Testing)

1. **Download or build the agent:**
   ```powershell
   cd services/agent
   go build -o lunaris-agent.exe ./cmd/lunaris-agent
   ```

2. **Run the installer:**
   ```powershell
   .\Install-LunarisAgent.ps1 -ApiUrl "http://localhost:3001/api/agent"
   ```

   The installer will:
   - Create installation directory (`C:\Program Files\Lunaris Agent`)
   - Copy the executable
   - Create configuration file
   - Install Windows service
   - Start the service

3. **Verify installation:**
   ```powershell
   Get-Service LunarisAgent
   ```

### Method 2: Remote Installation (GitHub Releases)

1. **Upload agent to GitHub releases:**
   - Create a new release on GitHub
   - Upload `lunaris-agent.exe`
   - Note the release tag/version

2. **Install on target machine:**
   ```powershell
   # Install latest version
   .\Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent"

   # Install specific version
   .\Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent" -Version "v1.0.0"
   ```

### Method 3: Custom Download URL

If you host the agent on your own server:

```powershell
.\Install-LunarisAgent.ps1 `
    -ApiUrl "https://your-api-server.com/api/agent" `
    -DownloadUrl "https://your-server.com/downloads/lunaris-agent.exe"
```

---

## Configuration Options

### Basic Configuration

```powershell
.\Install-LunarisAgent.ps1 -ApiUrl "https://api.example.com/api/agent"
```

### Advanced Configuration

```powershell
.\Install-LunarisAgent.ps1 `
    -ApiUrl "https://api.example.com/api/agent" `
    -HeartbeatInterval 30 `
    -UpdateScanInterval 60 `
    -InstallPath "D:\CustomPath\Lunaris Agent"
```

### All Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `ApiUrl` | Lunaris API server URL | http://localhost:3001/api/agent | No |
| `DownloadUrl` | URL to download agent from | GitHub releases | No |
| `Version` | Version to install | latest | No |
| `InstallPath` | Installation directory | C:\Program Files\Lunaris Agent | No |
| `HeartbeatInterval` | Heartbeat interval (seconds) | 30 | No |
| `UpdateScanInterval` | Update scan interval (minutes) | 60 | No |
| `ForceReinstall` | Force reinstallation | false | No |
| `Uninstall` | Uninstall the agent | false | No |

---

## Post-Installation

### Verify Service Status

```powershell
Get-Service LunarisAgent
```

Expected output:
```
Status   Name           DisplayName
------   ----           -----------
Running  LunarisAgent   Lunaris Agent
```

### Check Configuration

```powershell
Get-Content "C:\Program Files\Lunaris Agent\config.json"
```

Example output:
```json
{
  "apiURL": "https://your-api-server.com/api/agent",
  "heartbeatIntervalSec": 30,
  "updateScanIntervalMin": 60,
  "deviceID": ""
}
```

**Note:** `deviceID` will be populated automatically after first registration.

### View Logs

Check Windows Event Viewer:
```powershell
Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 20
```

Or use Event Viewer GUI:
1. Open Event Viewer
2. Navigate to: Windows Logs → Application
3. Filter by Source: "Lunaris Agent"

---

## Managing the Service

### Start Service

```powershell
Start-Service LunarisAgent
```

### Stop Service

```powershell
Stop-Service LunarisAgent
```

### Restart Service

```powershell
Restart-Service LunarisAgent
```

### Check Service Status

```powershell
Get-Service LunarisAgent | Format-List *
```

---

## Upgrading

### Method 1: Force Reinstall

```powershell
.\Install-LunarisAgent.ps1 -ApiUrl "https://your-api-server.com/api/agent" -ForceReinstall
```

This will:
1. Stop the service
2. Remove existing installation
3. Install the new version
4. Preserve device registration (deviceID from server)

### Method 2: Manual Upgrade

```powershell
# Stop service
Stop-Service LunarisAgent

# Replace executable
Copy-Item -Path ".\lunaris-agent.exe" -Destination "C:\Program Files\Lunaris Agent\lunaris-agent.exe" -Force

# Start service
Start-Service LunarisAgent
```

---

## Uninstallation

### Using the Installer

```powershell
.\Install-LunarisAgent.ps1 -Uninstall
```

This will:
1. Stop the service
2. Remove the Windows service
3. Delete the installation directory

### Manual Uninstallation

```powershell
# Stop and remove service
Stop-Service LunarisAgent -Force
sc.exe delete LunarisAgent

# Remove installation directory
Remove-Item -Path "C:\Program Files\Lunaris Agent" -Recurse -Force
```

---

## Troubleshooting

### Service Won't Start

**Check Event Logs:**
```powershell
Get-EventLog -LogName Application -Source "Lunaris Agent" -Newest 10
```

**Common Issues:**
1. **API URL Incorrect:** Verify URL in config.json
2. **Network Connectivity:** Test connection to API server
   ```powershell
   Test-NetConnection -ComputerName your-api-server.com -Port 443
   ```
3. **Winget Not Installed:** The agent requires winget
   ```powershell
   winget --version
   ```

### Agent Not Registering

1. **Check API URL:**
   ```powershell
   Get-Content "C:\Program Files\Lunaris Agent\config.json" | ConvertFrom-Json | Select-Object apiURL
   ```

2. **Test API Connectivity:**
   ```powershell
   Invoke-WebRequest -Uri "https://your-api-server.com/api/health" -UseBasicParsing
   ```

3. **Check Firewall Rules:**
   - Ensure outbound HTTPS (443) is allowed
   - Verify corporate proxy settings if applicable

### High CPU/Memory Usage

1. **Check Update Scan Interval:**
   - Default is 60 minutes
   - Increase if needed in config.json

2. **Review Recent Scans:**
   - Check event logs for scan activity
   - Large number of pending updates may cause high resource usage

### Can't Download Agent

**If using GitHub releases:**
1. Verify release exists on GitHub
2. Check internet connectivity
3. Verify GitHub is not blocked by firewall

**Alternative: Use Local File**
1. Place `lunaris-agent.exe` in same directory as installer
2. Run installer - it will automatically use local file

---

## Advanced Topics

### Custom Installation Path

```powershell
.\Install-LunarisAgent.ps1 `
    -ApiUrl "https://api.example.com/api/agent" `
    -InstallPath "D:\Apps\Lunaris"
```

### Service Recovery Options

The installer automatically configures service recovery:
- First failure: Restart after 5 seconds
- Second failure: Restart after 10 seconds
- Subsequent failures: Restart after 30 seconds
- Reset failure count: After 24 hours

View recovery options:
```powershell
sc.exe qfailure LunarisAgent
```

### Running as Different User

By default, the service runs as Local System. To change:

```powershell
$cred = Get-Credential
sc.exe config LunarisAgent obj= "$($cred.UserName)" password= "$($cred.GetNetworkCredential().Password)"
```

**Note:** Ensure the user has necessary permissions.

---

## Security Considerations

### Network Security

- **HTTPS Recommended:** Always use HTTPS for API communication in production
- **Firewall Rules:** Only allow outbound connections to your API server
- **Certificate Validation:** Ensure SSL certificates are valid

### File Permissions

Installation directory permissions (default):
- Administrators: Full Control
- SYSTEM: Full Control
- Users: Read & Execute

Configuration file contains:
- API URL (not sensitive)
- Device ID (assigned by server, not sensitive)
- No credentials or secrets stored

### Service Security

The service runs with:
- **Account:** Local System
- **Privileges:** Required for Windows Update access
- **Network:** Outbound HTTPS only

---

## Integration with Existing Systems

### Active Directory

Deploy via Group Policy:
1. Create GPO for software installation
2. Use startup script to run installer
3. Configure API URL via GPO environment variable

### SCCM/Intune

Package as Windows Installer:
1. Create MSI wrapper around PowerShell script
2. Deploy through SCCM/Intune
3. Monitor deployment status

### Configuration Management Tools

**Ansible:**
```yaml
- name: Install Lunaris Agent
  win_shell: |
    irm https://raw.githubusercontent.com/YOUR_USERNAME/lunaris-agent/main/services/agent/Install-LunarisAgent.ps1 | iex
    Install-LunarisAgent -ApiUrl "{{ lunaris_api_url }}"
```

**Puppet:**
```puppet
exec { 'install_lunaris_agent':
  command => 'powershell.exe -ExecutionPolicy Bypass -Command "irm https://... | iex; Install-LunarisAgent -ApiUrl ${api_url}"',
  creates => 'C:\Program Files\Lunaris Agent\lunaris-agent.exe',
}
```

---

## FAQ

**Q: Does the agent require internet access?**
A: Yes, it needs to communicate with your Lunaris API server. The API server can be on your internal network.

**Q: What Windows versions are supported?**
A: Windows 10 and Windows 11. Windows Server support coming in Phase 6.

**Q: Can I run multiple agents on the same machine?**
A: No, only one agent instance per machine is supported.

**Q: How do I change the API URL after installation?**
A: Edit `C:\Program Files\Lunaris Agent\config.json` and restart the service.

**Q: What happens if the API server is unreachable?**
A: The agent will retry heartbeats with exponential backoff (5s, 10s, 20s) and log failures.

**Q: How do I know if the agent is working?**
A: Check the service status and verify the device appears in the Lunaris dashboard.

**Q: Does it require winget?**
A: Yes, the agent uses winget to detect and install updates. Winget is included in Windows 11 and Windows 10 (with App Installer).

**Q: Can I use this with Chocolatey or WSUS?**
A: Currently only winget is supported. Chocolatey and WSUS support planned for Phase 3.

---

## Getting Help

- **Documentation:** Check `PHASE_1_COMPLETE.md` and `V1_RELEASE_CHECKLIST.md`
- **API Docs:** Visit `http://your-api-server:3001/api/docs`
- **Logs:** Windows Event Viewer → Application → Lunaris Agent
- **Issues:** Report on GitHub (if open source)

---

## Version History

- **v1.0.0** (2025-12-09)
  - Initial release
  - Winget integration
  - Heartbeat retry logic
  - Service auto-recovery
  - Configuration management
