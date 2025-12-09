/**
 * WebSocket Client for Lunaris Agent Console
 *
 * Connects to the NestJS WebSocket gateway for real-time updates.
 * Uses Socket.IO for transport.
 */

import { io, Socket } from "socket.io-client";
import type {
  WebSocketEventType,
  DeviceStatusChangePayload,
  DeviceUpdatesChangedPayload,
  DeviceRegisteredPayload,
  DeviceRemovedPayload,
} from "./types";

// Configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001/ws/console";

type EventCallback<T = unknown> = (payload: T) => void;

interface EventListeners {
  device_status_change: EventCallback<DeviceStatusChangePayload>[];
  device_updates_changed: EventCallback<DeviceUpdatesChangedPayload>[];
  device_registered: EventCallback<DeviceRegisteredPayload>[];
  device_removed: EventCallback<DeviceRemovedPayload>[];
  connected: EventCallback<void>[];
  disconnected: EventCallback<void>[];
  error: EventCallback<Error>[];
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: EventListeners = {
    device_status_change: [],
    device_updates_changed: [],
    device_registered: [],
    device_removed: [],
    connected: [],
    disconnected: [],
    error: [],
  };
  private isConnected = false;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log("[WS] Already connected");
      return;
    }

    console.log(`[WS] Connecting to ${WS_URL}...`);

    try {
      this.socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[WS] Connected");
        this.isConnected = true;
        this.emit("connected", undefined);
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[WS] Disconnected: ${reason}`);
        this.isConnected = false;
        this.emit("disconnected", undefined);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[WS] Connection error:", error);
        this.emit("error", error);
      });

      // Listen for server events
      this.socket.on("device_status_change", (data) => {
        console.log("[WS] device_status_change:", data);
        this.emit("device_status_change", data.payload);
      });

      this.socket.on("device_updates_changed", (data) => {
        console.log("[WS] device_updates_changed:", data);
        this.emit("device_updates_changed", data.payload);
      });

      this.socket.on("device_registered", (data) => {
        console.log("[WS] device_registered:", data);
        this.emit("device_registered", data.payload);
      });

      this.socket.on("device_removed", (data) => {
        console.log("[WS] device_removed:", data);
        this.emit("device_removed", data.payload);
      });
    } catch (error) {
      console.error("[WS] Failed to connect:", error);
      this.emit("error", error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log("[WS] Disconnecting...");

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.emit("disconnected", undefined);
  }

  /**
   * Subscribe to WebSocket events
   */
  subscribe<K extends keyof EventListeners>(
    event: K,
    callback: EventListeners[K][number]
  ): () => void {
    // @ts-expect-error - TypeScript has trouble with this pattern
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners[event].indexOf(
        callback as EventListeners[K][number]
      );
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all subscribers
   */
  private emit<K extends keyof EventListeners>(
    event: K,
    payload: Parameters<EventListeners[K][number]>[0]
  ): void {
    this.listeners[event].forEach((callback) => {
      try {
        // @ts-expect-error - TypeScript has trouble with this pattern
        callback(payload);
      } catch (error) {
        console.error(`[WS] Error in ${event} callback:`, error);
      }
    });
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Export class for testing
export { WebSocketClient };
