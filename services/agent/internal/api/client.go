package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client handles communication with the Lunaris API
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new API client
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RegisterRequest is the payload for device registration
type RegisterRequest struct {
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	OSVersion    string `json:"osVersion"`
	MACAddress   string `json:"macAddress"`
	AgentVersion string `json:"agentVersion"`
}

// RegisterResponse is the response from device registration
type RegisterResponse struct {
	DeviceID string `json:"deviceId"`
	Message  string `json:"message"`
}

// Register registers the device with the backend
func (c *Client) Register(req *RegisterRequest) (*RegisterResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := c.post("/agent/register", body)
	if err != nil {
		return nil, fmt.Errorf("register request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("register failed: %s - %s", resp.Status, string(bodyBytes))
	}

	var result RegisterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &result, nil
}

// HeartbeatRequest is the payload for heartbeat
type HeartbeatRequest struct {
	DeviceID    string   `json:"deviceId"`
	IPAddress   string   `json:"ipAddress,omitempty"`
	CPUUsage    *float64 `json:"cpuUsage,omitempty"`
	MemoryUsage *float64 `json:"memoryUsage,omitempty"`
	DiskUsage   *float64 `json:"diskUsage,omitempty"`
}

// HeartbeatResponse is the response from heartbeat
type HeartbeatResponse struct {
	Status     string `json:"status"`
	ServerTime string `json:"serverTime"`
}

// Heartbeat sends a heartbeat to the backend
func (c *Client) Heartbeat(req *HeartbeatRequest) (*HeartbeatResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := c.post("/agent/heartbeat", body)
	if err != nil {
		return nil, fmt.Errorf("heartbeat request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("heartbeat failed: %s - %s", resp.Status, string(bodyBytes))
	}

	var result HeartbeatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &result, nil
}

// UpdateItem represents a single available update
type UpdateItem struct {
	PackageIdentifier string  `json:"packageIdentifier"`
	PackageName       string  `json:"packageName"`
	InstalledVersion  *string `json:"installedVersion,omitempty"`
	AvailableVersion  string  `json:"availableVersion"`
	Source            string  `json:"source"`
}

// UpdateReportRequest is the payload for update reporting
type UpdateReportRequest struct {
	DeviceID string       `json:"deviceId"`
	Updates  []UpdateItem `json:"updates"`
}

// UpdateReportResponse is the response from update reporting
type UpdateReportResponse struct {
	Received int    `json:"received"`
	Message  string `json:"message"`
}

// ReportUpdates sends available updates to the backend
func (c *Client) ReportUpdates(req *UpdateReportRequest) (*UpdateReportResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := c.post("/agent/update-report", body)
	if err != nil {
		return nil, fmt.Errorf("update-report request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("update-report failed: %s - %s", resp.Status, string(bodyBytes))
	}

	var result UpdateReportResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &result, nil
}

// post makes a POST request to the API
func (c *Client) post(endpoint string, body []byte) (*http.Response, error) {
	url := c.baseURL + endpoint
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	return c.httpClient.Do(req)
}

