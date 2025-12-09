//go:build !windows

package service

import (
	"errors"

	"github.com/lunaris/agent/internal/config"
)

const ServiceName = "LunarisAgentService"

// RunService is not supported on non-Windows platforms
func RunService(cfg *config.Config, isDebug bool) error {
	return errors.New("Windows service mode not supported on this platform")
}

// IsWindowsService always returns false on non-Windows
func IsWindowsService() bool {
	return false
}

// InstallService is not supported on non-Windows platforms
func InstallService(exePath string) error {
	return errors.New("service installation not supported on this platform")
}

// UninstallService is not supported on non-Windows platforms
func UninstallService() error {
	return errors.New("service uninstallation not supported on this platform")
}

// StartService is not supported on non-Windows platforms
func StartService() error {
	return errors.New("service control not supported on this platform")
}

// StopService is not supported on non-Windows platforms
func StopService() error {
	return errors.New("service control not supported on this platform")
}

// GetExecutablePath returns the current executable path
func GetExecutablePath() (string, error) {
	return "", errors.New("not implemented on this platform")
}

