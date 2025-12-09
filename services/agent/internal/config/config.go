package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

const (
	DefaultAPIURL        = "http://localhost:3001/api"
	DefaultHeartbeatSec  = 30
	DefaultUpdateScanMin = 5
	ConfigDir            = "C:\\ProgramData\\LunarisAgent"
	ConfigFile           = "config.json"
)

// Config holds the agent configuration
type Config struct {
	// API endpoint URL
	APIURL string `json:"api_url"`

	// Device ID assigned by the backend
	DeviceID string `json:"device_id,omitempty"`

	// Heartbeat interval in seconds
	HeartbeatIntervalSec int `json:"heartbeat_interval_sec"`

	// Update scan interval in minutes
	UpdateScanIntervalMin int `json:"update_scan_interval_min"`

	// Enrollment secret (optional)
	EnrollmentSecret string `json:"enrollment_secret,omitempty"`
}

// DefaultConfig returns a config with default values
func DefaultConfig() *Config {
	return &Config{
		APIURL:                DefaultAPIURL,
		HeartbeatIntervalSec:  DefaultHeartbeatSec,
		UpdateScanIntervalMin: DefaultUpdateScanMin,
	}
}

// ConfigPath returns the full path to the config file
func ConfigPath() string {
	return filepath.Join(ConfigDir, ConfigFile)
}

// Load reads config from disk, returns default if not found
func Load() (*Config, error) {
	configPath := ConfigPath()

	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			// Return default config if file doesn't exist
			return DefaultConfig(), nil
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	// Apply defaults for missing values
	if cfg.APIURL == "" {
		cfg.APIURL = DefaultAPIURL
	}
	if cfg.HeartbeatIntervalSec == 0 {
		cfg.HeartbeatIntervalSec = DefaultHeartbeatSec
	}
	if cfg.UpdateScanIntervalMin == 0 {
		cfg.UpdateScanIntervalMin = DefaultUpdateScanMin
	}

	return &cfg, nil
}

// Save writes config to disk
func (c *Config) Save() error {
	// Ensure config directory exists
	if err := os.MkdirAll(ConfigDir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(ConfigPath(), data, 0644)
}

