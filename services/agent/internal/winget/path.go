package winget

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// findWingetPath finds the winget executable path
// Windows services don't have the user's PATH, so we need to search for it
func findWingetPath() (string, error) {
	// First, try to find it in PATH (works in console mode)
	if path, err := exec.LookPath("winget"); err == nil {
		return path, nil
	}

	// Common locations for winget on Windows (try system locations first for services)
	commonPaths := []string{
		// System Program Files (accessible to services) - search for AppInstaller
		filepath.Join(os.Getenv("ProgramFiles"), "WindowsApps", "Microsoft.DesktopAppInstaller_8wekyb3d8bbwe", "winget.exe"),
		// Alternative system location
		filepath.Join(os.Getenv("ProgramFiles(x86)"), "WindowsApps", "Microsoft.DesktopAppInstaller_8wekyb3d8bbwe", "winget.exe"),
		// System32 (less common but possible)
		filepath.Join(os.Getenv("SystemRoot"), "System32", "winget.exe"),
	}
	
	// Search ProgramFiles\WindowsApps for any AppInstaller directory
	if programFiles := os.Getenv("ProgramFiles"); programFiles != "" {
		windowsAppsPath := filepath.Join(programFiles, "WindowsApps")
		if entries, err := os.ReadDir(windowsAppsPath); err == nil {
			for _, entry := range entries {
				if entry.IsDir() && strings.Contains(entry.Name(), "AppInstaller") {
					wingetPath := filepath.Join(windowsAppsPath, entry.Name(), "winget.exe")
					commonPaths = append([]string{wingetPath}, commonPaths...)
				}
			}
		}
	}
	
	// User AppData (works if service runs as user) - add this last
	commonPaths = append(commonPaths, filepath.Join(os.Getenv("LOCALAPPDATA"), "Microsoft", "WindowsApps", "winget.exe"))

	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}

	// Try to find it in ProgramFiles WindowsApps directory (search for AppInstaller)
	if programFiles := os.Getenv("ProgramFiles"); programFiles != "" {
		windowsAppsPath := filepath.Join(programFiles, "WindowsApps")
		if entries, err := os.ReadDir(windowsAppsPath); err == nil {
			for _, entry := range entries {
				if entry.IsDir() && (entry.Name() == "Microsoft.DesktopAppInstaller_8wekyb3d8bbwe" || 
					strings.HasPrefix(entry.Name(), "Microsoft.DesktopAppInstaller")) {
					wingetPath := filepath.Join(windowsAppsPath, entry.Name(), "winget.exe")
					if _, err := os.Stat(wingetPath); err == nil {
						return wingetPath, nil
					}
				}
			}
		}
	}

	// Try to find it in WindowsApps directory (user location)
	if localAppData := os.Getenv("LOCALAPPDATA"); localAppData != "" {
		windowsAppsPath := filepath.Join(localAppData, "Microsoft", "WindowsApps")
		if entries, err := os.ReadDir(windowsAppsPath); err == nil {
			for _, entry := range entries {
				if entry.Name() == "winget.exe" {
					return filepath.Join(windowsAppsPath, "winget.exe"), nil
				}
			}
		}
	}

	return "", exec.ErrNotFound
}

// getWingetCommand returns the winget executable path, or "winget" if found in PATH
func getWingetCommand() string {
	if runtime.GOOS != "windows" {
		return "winget"
	}

	// Try to find winget
	if path, err := findWingetPath(); err == nil {
		return path
	}

	// Fallback: Try common user profile paths (for services running as user)
	// Get all user profiles and check their AppData
	if programData := os.Getenv("ProgramData"); programData != "" {
		// Try the default user profile path pattern
		usersPath := filepath.Join(programData, "..", "Users")
		if entries, err := os.ReadDir(usersPath); err == nil {
			for _, entry := range entries {
				if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
					userWingetPath := filepath.Join(usersPath, entry.Name(), "AppData", "Local", "Microsoft", "WindowsApps", "winget.exe")
					if _, err := os.Stat(userWingetPath); err == nil {
						return userWingetPath
					}
				}
			}
		}
	}

	// Last resort: Try the well-known user path (works if service runs as specific user)
	userProfile := os.Getenv("USERPROFILE")
	if userProfile == "" {
		userProfile = os.Getenv("HOME")
	}
	if userProfile != "" {
		wingetPath := filepath.Join(userProfile, "AppData", "Local", "Microsoft", "WindowsApps", "winget.exe")
		if _, err := os.Stat(wingetPath); err == nil {
			return wingetPath
		}
	}

	// Final fallback to "winget" - might work if PATH is set correctly
	return "winget"
}

