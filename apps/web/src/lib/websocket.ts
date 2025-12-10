import { io, Socket } from 'socket.io-client';

export type WebSocketEvent =
  | 'device_status_change'
  | 'device_updates_changed'
  | 'device_registered'
  | 'device_removed'
  | 'update_installation_started'
  | 'install_updates';

export interface WebSocketMessage<T = any> {
  type: WebSocketEvent;
  payload: T;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectDelay?: number;
  reconnectMaxDelay?: number;
  reconnectBackoffMultiplier?: number;
  reconnectMaxAttempts?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

/**
 * WebSocket service with automatic reconnection and exponential backoff
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private config: Required<WebSocketConfig>;
  private eventHandlers: Map<WebSocketEvent, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect: boolean = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectDelay: config.reconnectDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      reconnectBackoffMultiplier: config.reconnectBackoffMultiplier ?? 1.5,
      reconnectMaxAttempts: config.reconnectMaxAttempts ?? Infinity,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.isManualDisconnect = false;

    console.log(`[WebSocket] Connecting to ${this.config.url}...`);

    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection manually
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to a WebSocket event
   */
  on(event: WebSocketEvent, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe from a WebSocket event
   */
  off(event: WebSocketEvent, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit a message to the server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Disconnected: ${reason}`);

      // Auto-reconnect if not a manual disconnect
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);

      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    });

    // Register application-specific event handlers
    const events: WebSocketEvent[] = [
      'device_status_change',
      'device_updates_changed',
      'device_registered',
      'device_removed',
      'update_installation_started',
      'install_updates',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (message: WebSocketMessage) => {
        this.handleMessage(event, message);
      });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: WebSocketEvent, message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isManualDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      return; // Reconnection already scheduled
    }

    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts - 1),
      this.config.reconnectMaxDelay
    );

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.reconnectMaxAttempts === Infinity ? '∞' : this.config.reconnectMaxAttempts})...`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log(`[WebSocket] Attempting reconnection (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }
}

// Singleton instance
let websocketInstance: WebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export function getWebSocketService(config?: WebSocketConfig): WebSocketService {
  if (!websocketInstance && config) {
    websocketInstance = new WebSocketService(config);
  }

  if (!websocketInstance) {
    throw new Error('WebSocket service not initialized. Call with config first.');
  }

  return websocketInstance;
}

/**
 * Initialize WebSocket service with configuration
 */
export function initWebSocket(config: WebSocketConfig): WebSocketService {
  websocketInstance = new WebSocketService(config);
  return websocketInstance;
}
