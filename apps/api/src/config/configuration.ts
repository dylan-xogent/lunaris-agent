export interface AppConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;

  // Database Configuration
  databaseUrl: string;
  databasePoolMin: number;
  databasePoolMax: number;
  databaseConnectionTimeout: number;

  // CORS Configuration
  corsOrigin: string;

  // Agent Configuration
  agentHeartbeatInterval: number; // seconds
  agentOfflineThreshold: number; // seconds
  agentHeartbeatRetryAttempts: number;
  agentHeartbeatRetryDelay: number; // milliseconds

  // WebSocket Configuration
  wsReconnectDelay: number; // milliseconds
  wsReconnectMaxDelay: number; // milliseconds
  wsReconnectBackoffMultiplier: number;

  // Health Check Configuration
  healthCheckMemoryThresholdWarning: number; // percentage
  healthCheckMemoryThresholdCritical: number; // percentage
}

export default (): AppConfig => ({
  // Server Configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',
  databasePoolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  databaseConnectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),

  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Agent Configuration
  agentHeartbeatInterval: parseInt(process.env.AGENT_HEARTBEAT_INTERVAL || '30', 10),
  agentOfflineThreshold: parseInt(process.env.AGENT_OFFLINE_THRESHOLD || '90', 10),
  agentHeartbeatRetryAttempts: parseInt(process.env.AGENT_HEARTBEAT_RETRY_ATTEMPTS || '3', 10),
  agentHeartbeatRetryDelay: parseInt(process.env.AGENT_HEARTBEAT_RETRY_DELAY || '5000', 10),

  // WebSocket Configuration
  wsReconnectDelay: parseInt(process.env.WS_RECONNECT_DELAY || '1000', 10),
  wsReconnectMaxDelay: parseInt(process.env.WS_RECONNECT_MAX_DELAY || '30000', 10),
  wsReconnectBackoffMultiplier: parseFloat(process.env.WS_RECONNECT_BACKOFF_MULTIPLIER || '1.5'),

  // Health Check Configuration
  healthCheckMemoryThresholdWarning: parseInt(process.env.HEALTH_CHECK_MEMORY_THRESHOLD_WARNING || '75', 10),
  healthCheckMemoryThresholdCritical: parseInt(process.env.HEALTH_CHECK_MEMORY_THRESHOLD_CRITICAL || '90', 10),
});
