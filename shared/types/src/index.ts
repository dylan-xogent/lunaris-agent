// ============================================
// Device Types
// ============================================

export type DeviceStatus = "online" | "offline";

export interface Device {
  id: string;
  hostname: string;
  os: string;
  osVersion: string;
  ipAddress: string;
  macAddress: string;
  agentVersion: string;
  status: DeviceStatus;
  lastSeenAt: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceWithUpdates extends Device {
  pendingUpdates: number;
  updates?: DeviceUpdate[];
}

// ============================================
// Update Types
// ============================================

export type UpdateSeverity = "critical" | "important" | "optional";
export type UpdateSource = "winget" | "windows_update" | "manual";

export interface DeviceUpdate {
  id: string;
  deviceId: string;
  packageIdentifier: string;
  packageName: string;
  installedVersion: string | null;
  availableVersion: string;
  source: UpdateSource;
  severity: UpdateSeverity;
  size?: string;
  description?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceUpdateWithDevice extends DeviceUpdate {
  device: Pick<Device, "id" | "hostname">;
}

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  devicesWithUpdates: number;
  totalPendingUpdates: number;
  criticalUpdates: number;
  onlinePercentage: number;
}

// ============================================
// Agent API Types
// ============================================

export interface AgentRegisterRequest {
  hostname: string;
  os: string;
  osVersion: string;
  macAddress: string;
  agentVersion: string;
}

export interface AgentRegisterResponse {
  deviceId: string;
  message: string;
}

export interface AgentHeartbeatRequest {
  deviceId: string;
  ipAddress?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
}

export interface AgentHeartbeatResponse {
  status: "ok";
  serverTime: string;
}

export interface AgentUpdateReportRequest {
  deviceId: string;
  updates: AgentUpdateItem[];
}

export interface AgentUpdateItem {
  packageIdentifier: string;
  packageName: string;
  installedVersion: string | null;
  availableVersion: string;
  source: UpdateSource;
}

export interface AgentUpdateReportResponse {
  received: number;
  message: string;
}

// ============================================
// WebSocket Event Types
// ============================================

export type WebSocketEventType =
  | "device_status_change"
  | "device_updates_changed"
  | "device_registered"
  | "device_removed";

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

export interface DeviceStatusChangePayload {
  deviceId: string;
  status: DeviceStatus;
  lastSeenAt: string;
}

export interface DeviceUpdatesChangedPayload {
  deviceId: string;
  pendingUpdates: number;
  criticalUpdates: number;
}

export interface DeviceRegisteredPayload {
  device: Device;
}

export interface DeviceRemovedPayload {
  deviceId: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Filter Types
// ============================================

export interface DevicesFilter {
  status?: DeviceStatus | "all";
  search?: string;
}

export interface UpdatesFilter {
  severity?: UpdateSeverity | "all";
  deviceId?: string;
  search?: string;
}

// ============================================
// Settings Types
// ============================================

export interface NotificationSettings {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  criticalOnly: boolean;
}

export interface UserSettings {
  theme: "dark" | "light" | "system";
  notifications: NotificationSettings;
}

