package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	socketio "github.com/zhouhui8915/go-socket.io-client"
)

// InstallCommand represents an install command from the server
type InstallCommand struct {
	CommandID          string   `json:"commandId"`
	DeviceID           string   `json:"deviceId"`
	PackageIdentifiers []string `json:"packageIdentifiers"`
}

// EventPayload wraps the event data from server
type EventPayload struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp string          `json:"timestamp"`
}

// InstallHandler is called when an install command is received
type InstallHandler func(cmd *InstallCommand) error

// Client manages WebSocket connection to the server
type Client struct {
	serverURL      string
	deviceID       string
	socket         *socketio.Client
	installHandler InstallHandler
	logger         *log.Logger
	connected      bool
}

// NewClient creates a new WebSocket client
func NewClient(serverURL, deviceID string, logger *log.Logger) *Client {
	return &Client{
		serverURL: serverURL,
		deviceID:  deviceID,
		logger:    logger,
	}
}

// SetInstallHandler sets the handler for install commands
func (c *Client) SetInstallHandler(handler InstallHandler) {
	c.installHandler = handler
}

// Connect establishes WebSocket connection
func (c *Client) Connect() error {
	opts := &socketio.Options{
		Transport: "websocket",
		Query:     make(map[string]string),
	}

	client, err := socketio.NewClient(c.serverURL, opts)
	if err != nil {
		return fmt.Errorf("failed to create socket.io client: %w", err)
	}

	c.socket = client

	// Connection handlers
	client.On("connection", func() {
		c.logger.Println("[WebSocket] Connected to server")
		c.connected = true
	})

	client.On("connect", func() {
		c.logger.Println("[WebSocket] Connection established")
		c.connected = true

		// Join device-specific room to receive commands
		c.logger.Printf("[WebSocket] Joining device room: %s", c.deviceID)
		client.Emit("join_device", c.deviceID)
	})

	client.On("disconnection", func() {
		c.logger.Println("[WebSocket] Disconnected from server")
		c.connected = false
	})

	client.On("disconnect", func() {
		c.logger.Println("[WebSocket] Connection closed")
		c.connected = false
	})

	client.On("error", func(err error) {
		c.logger.Printf("[WebSocket] Error: %v", err)
	})

	// Listen for install_updates command
	client.On("install_updates", func(msg string) {
		c.logger.Printf("[WebSocket] Received install_updates event: %s", msg)

		var payload EventPayload
		if err := json.Unmarshal([]byte(msg), &payload); err != nil {
			c.logger.Printf("[WebSocket] Failed to parse event payload: %v", err)
			return
		}

		var cmd InstallCommand
		if err := json.Unmarshal(payload.Payload, &cmd); err != nil {
			c.logger.Printf("[WebSocket] Failed to parse install command: %v", err)
			return
		}

		// Verify this command is for our device
		if cmd.DeviceID != c.deviceID {
			c.logger.Printf("[WebSocket] Ignoring command for different device: %s", cmd.DeviceID)
			return
		}

		c.logger.Printf("[WebSocket] Processing install command %s for %d package(s)",
			cmd.CommandID, len(cmd.PackageIdentifiers))

		// Execute install handler
		if c.installHandler != nil {
			if err := c.installHandler(&cmd); err != nil {
				c.logger.Printf("[WebSocket] Install handler failed: %v", err)
			}
		} else {
			c.logger.Println("[WebSocket] No install handler set")
		}
	})

	// Wait for connection (NewClient already initiates connection)
	for i := 0; i < 10; i++ {
		if c.connected {
			c.logger.Printf("[WebSocket] Successfully connected to %s", c.serverURL)
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}

	return fmt.Errorf("connection timeout")
}

// Disconnect closes the WebSocket connection
func (c *Client) Disconnect() error {
	if c.socket != nil {
		// Socket.IO client doesn't have Close method, connection will be closed on cleanup
		c.connected = false
		c.logger.Println("[WebSocket] Disconnected")
	}
	return nil
}

// IsConnected returns true if connected
func (c *Client) IsConnected() bool {
	return c.connected
}

// Reconnect attempts to reconnect if disconnected
func (c *Client) Reconnect() error {
	if c.connected {
		return nil
	}

	c.logger.Println("[WebSocket] Attempting reconnection...")
	return c.Connect()
}
