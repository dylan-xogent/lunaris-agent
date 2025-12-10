// ============================================
// Device Types
// ============================================

export type DeviceStatus = "online" | "offline";

export interface Software {
  id: string;
  name: string;
  version: string;
  publisher: string;
  installedAt: string;
}

export interface Device {
  id: string;
  hostname: string;
  os: string;
  osVersion: string;
  ipAddress: string | null;
  macAddress: string;
  agentVersion: string;
  status: DeviceStatus;
  lastSeenAt: string | null;
  enrolledAt: string;
  pendingUpdates: number;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  diskUsage?: number | null;
  updates?: Update[];
  installedSoftware?: Software[];
  groups?: GroupInfo[];
  tags?: TagInfo[];
}

// ============================================
// Update Types
// ============================================

export type UpdateSeverity = "critical" | "important" | "optional";
export type UpdateSource = "winget" | "windows_update" | "manual";

export interface Update {
  id: string;
  deviceId: string;
  deviceHostname?: string;
  packageIdentifier?: string;
  packageName: string;
  currentVersion?: string | null;
  installedVersion?: string | null;
  availableVersion: string;
  source?: UpdateSource;
  severity: UpdateSeverity;
  size?: string | null;
  description?: string | null;
  publishedAt?: string | null;
}

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices?: number;
  devicesWithUpdates: number;
  totalPendingUpdates: number;
  criticalUpdates: number;
  onlinePercentage: number;
}

// ============================================
// Settings Types
// ============================================

export interface NotificationSettings {
  emailAlerts: boolean;
  inAppAlerts: boolean;
  criticalOnly: boolean;
}

export interface Settings {
  theme: "dark" | "light" | "system";
  notifications: NotificationSettings;
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
// Filter Types
// ============================================

export interface UpdatesFilter {
  severity?: UpdateSeverity | "all";
  deviceId?: string;
  search?: string;
}

export interface DevicesFilter {
  status?: DeviceStatus | "all";
  search?: string;
  groupId?: string;
  tagId?: string;
}

// ============================================
// Group and Tag Types
// ============================================

export interface GroupInfo {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
}

export interface Group extends GroupInfo {
  deviceCount: number;
  createdAt: string;
  devices?: DeviceInfo[];
}

export interface TagInfo {
  id: string;
  name: string;
  color?: string | null;
}

export interface Tag extends TagInfo {
  deviceCount: number;
  createdAt: string;
  devices?: DeviceInfo[];
}

export interface DeviceInfo {
  id: string;
  hostname: string;
  os: string;
  status: DeviceStatus;
  lastSeenAt: string | null;
  addedAt?: string;
}

// ============================================
// Bulk Operation Types
// ============================================

export interface BulkAddToGroupRequest {
  deviceIds: string[];
  groupId: string;
}

export interface BulkAddTagsRequest {
  deviceIds: string[];
  tagIds: string[];
}

export interface BulkInstallUpdatesRequest {
  deviceIds: string[];
  packageIdentifiers: string[];
}

// ============================================
// Activity Events
// ============================================

export type ActivityEventType =
  | "device_enrolled"
  | "device_online"
  | "device_offline"
  | "device_updated"
  | "update_installed"
  | "update_failed"
  | "group_created"
  | "group_updated"
  | "tag_created"
  | "command_executed"
  | "bulk_operation";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  deviceId?: string;
  deviceName?: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface EventsResponse {
  events: ActivityEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface EventsFilter {
  limit?: number;
  offset?: number;
  type?: string;
  deviceId?: string;
}

// ============================================
// Device Metrics
// ============================================

export interface DeviceMetricPoint {
  timestamp: string;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
}

export interface DeviceMetricsResponse {
  deviceId: string;
  hostname: string;
  range: string;
  startTime: string;
  endTime: string;
  dataPoints: number;
  metrics: DeviceMetricPoint[];
}
