/**
 * API Client for Lunaris Agent Console
 *
 * Connects to the NestJS backend API for all device and update operations.
 */

import type {
  Device,
  Update,
  DashboardStats,
  ApiResponse,
  UpdatesFilter,
  DevicesFilter,
  Settings,
  Group,
  Tag,
  BulkAddToGroupRequest,
  BulkAddTagsRequest,
  BulkInstallUpdatesRequest,
  EventsResponse,
  EventsFilter,
  DeviceMetricsResponse,
} from "./types";

// Configuration
// Using Vite proxy - all /api calls are proxied to http://localhost:3001/api
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// Device Operations
// ============================================

/**
 * Get all devices with optional filtering
 */
export async function getDevices(filter?: DevicesFilter): Promise<Device[]> {
  const params = new URLSearchParams();
  
  if (filter?.status && filter.status !== "all") {
    params.append("status", filter.status);
  }
  if (filter?.search) {
    params.append("search", filter.search);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/devices?${queryString}` : "/devices";
  
  return apiRequest<Device[]>(endpoint);
}

/**
 * Get a single device by ID
 */
export async function getDevice(id: string): Promise<Device | null> {
  try {
    return await apiRequest<Device>(`/devices/${id}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get active commands for a device
 */
export async function getDeviceCommands(deviceId: string): Promise<Array<{
  id: string;
  type: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  packageIdentifiers: string[];
  result?: string | null;
  createdAt: string;
  executedAt?: string | null;
  completedAt?: string | null;
}>> {
  return apiRequest(`/devices/${deviceId}/commands`);
}

/**
 * Get updates for a specific device
 */
export async function getDeviceUpdates(deviceId: string): Promise<Update[]> {
  return apiRequest<Update[]>(`/devices/${deviceId}/updates`);
}

/**
 * Trigger update installation on a device
 */
export async function installUpdates(
  deviceId: string,
  packageIdentifiers: string[]
): Promise<{
  success: boolean;
  commandId: string;
  deviceId: string;
  packagesQueued: number;
  message: string;
}> {
  return apiRequest(`/devices/${deviceId}/install-updates`, {
    method: "POST",
    body: JSON.stringify({ deviceId, packageIdentifiers }),
  });
}

/**
 * Trigger a forced sync (update scan) on a device
 */
export async function syncDevice(deviceId: string): Promise<{
  success: boolean;
  commandId: string;
  deviceId: string;
  message: string;
}> {
  return apiRequest(`/devices/${deviceId}/sync`, {
    method: "POST",
  });
}

// ============================================
// Updates Operations
// ============================================

/**
 * Get all updates with optional filtering
 */
export async function getUpdates(filter?: UpdatesFilter): Promise<Update[]> {
  const params = new URLSearchParams();
  
  if (filter?.severity && filter.severity !== "all") {
    params.append("severity", filter.severity);
  }
  if (filter?.deviceId) {
    params.append("deviceId", filter.deviceId);
  }
  if (filter?.search) {
    params.append("search", filter.search);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/updates?${queryString}` : "/updates";
  
  return apiRequest<Update[]>(endpoint);
}

// ============================================
// Dashboard Operations
// ============================================

/**
 * Get dashboard statistics
 */
export async function getStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/stats");
}

// ============================================
// Activity Events Operations
// ============================================

/**
 * Get activity events with optional filtering
 */
export async function getEvents(filter?: EventsFilter): Promise<EventsResponse> {
  const params = new URLSearchParams();

  if (filter?.limit) {
    params.append("limit", filter.limit.toString());
  }
  if (filter?.offset) {
    params.append("offset", filter.offset.toString());
  }
  if (filter?.type && filter.type !== "all") {
    params.append("type", filter.type);
  }
  if (filter?.deviceId) {
    params.append("deviceId", filter.deviceId);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/events?${queryString}` : "/events";

  return apiRequest<EventsResponse>(endpoint);
}

/**
 * Get recent events (last 24 hours)
 */
export async function getRecentEvents(limit: number = 20): Promise<EventsResponse> {
  return apiRequest<EventsResponse>(`/events/recent?limit=${limit}`);
}

// ============================================
// Device Metrics Operations
// ============================================

/**
 * Get historical metrics for a device
 */
export async function getDeviceMetrics(
  deviceId: string,
  range: string = "24h"
): Promise<DeviceMetricsResponse> {
  return apiRequest<DeviceMetricsResponse>(`/devices/${deviceId}/metrics?range=${range}`);
}

// ============================================
// Settings Operations (Local Storage)
// ============================================

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  notifications: {
    emailAlerts: true,
    inAppAlerts: true,
    criticalOnly: false,
  },
};

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("lunaris-settings");
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save user settings
 */
export async function saveSettings(
  settings: Settings
): Promise<ApiResponse<Settings>> {
  if (typeof window !== "undefined") {
    localStorage.setItem("lunaris-settings", JSON.stringify(settings));
  }

  return {
    success: true,
    data: settings,
    message: "Settings saved successfully",
  };
}

// ============================================
// Group Operations
// ============================================

/**
 * Get all groups
 */
export async function getGroups(): Promise<Group[]> {
  return apiRequest<Group[]>("/groups");
}

/**
 * Get a single group by ID with devices
 */
export async function getGroup(id: string): Promise<Group> {
  return apiRequest<Group>(`/groups/${id}`);
}

/**
 * Create a new group
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Group> {
  return apiRequest<Group>("/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a group
 */
export async function updateGroup(
  id: string,
  data: { name?: string; description?: string; color?: string }
): Promise<Group> {
  return apiRequest<Group>(`/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/groups/${id}`, {
    method: "DELETE",
  });
}

/**
 * Add devices to a group
 */
export async function addDevicesToGroup(
  groupId: string,
  deviceIds: string[]
): Promise<{ success: boolean; devicesAdded: number; message: string }> {
  return apiRequest(`/groups/${groupId}/devices`, {
    method: "POST",
    body: JSON.stringify({ deviceIds }),
  });
}

/**
 * Remove device from a group
 */
export async function removeDeviceFromGroup(
  groupId: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/groups/${groupId}/devices/${deviceId}`, {
    method: "DELETE",
  });
}

// ============================================
// Tag Operations
// ============================================

/**
 * Get all tags
 */
export async function getTags(): Promise<Tag[]> {
  return apiRequest<Tag[]>("/tags");
}

/**
 * Get a single tag by ID with devices
 */
export async function getTag(id: string): Promise<Tag> {
  return apiRequest<Tag>(`/tags/${id}`);
}

/**
 * Create a new tag
 */
export async function createTag(data: {
  name: string;
  color?: string;
}): Promise<Tag> {
  return apiRequest<Tag>("/tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  data: { name?: string; color?: string }
): Promise<Tag> {
  return apiRequest<Tag>(`/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/tags/${id}`, {
    method: "DELETE",
  });
}

/**
 * Add devices to a tag
 */
export async function addDevicesToTag(
  tagId: string,
  deviceIds: string[]
): Promise<{ success: boolean; devicesAdded: number; message: string }> {
  return apiRequest(`/tags/${tagId}/devices`, {
    method: "POST",
    body: JSON.stringify({ deviceIds }),
  });
}

/**
 * Remove tag from a device
 */
export async function removeTagFromDevice(
  tagId: string,
  deviceId: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/tags/${tagId}/devices/${deviceId}`, {
    method: "DELETE",
  });
}

// ============================================
// Bulk Operations
// ============================================

/**
 * Bulk add devices to a group
 */
export async function bulkAddToGroup(data: BulkAddToGroupRequest): Promise<{
  success: boolean;
  groupId: string;
  groupName: string;
  devicesAdded: number;
  message: string;
}> {
  return apiRequest("/devices/bulk/add-to-group", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Bulk add tags to devices
 */
export async function bulkAddTags(data: BulkAddTagsRequest): Promise<{
  success: boolean;
  devicesAffected: number;
  tagsApplied: number;
  totalAssignments: number;
  message: string;
}> {
  return apiRequest("/devices/bulk/add-tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Bulk install updates on multiple devices
 */
export async function bulkInstallUpdates(data: BulkInstallUpdatesRequest): Promise<{
  success: boolean;
  devicesQueued: number;
  packagesPerDevice: number;
  results: Array<{ deviceId: string; hostname: string; commandId: string }>;
  message: string;
}> {
  return apiRequest("/devices/bulk/install-updates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// Export API client object for convenience
// ============================================

export const api = {
  devices: {
    getAll: getDevices,
    getById: getDevice,
    getUpdates: getDeviceUpdates,
    installUpdates,
    sync: syncDevice,
    getMetrics: getDeviceMetrics,
  },
  updates: {
    getAll: getUpdates,
  },
  dashboard: {
    getStats,
  },
  events: {
    getAll: getEvents,
    getRecent: getRecentEvents,
  },
  settings: {
    get: getSettings,
    save: saveSettings,
  },
  groups: {
    getAll: getGroups,
    getById: getGroup,
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,
    addDevices: addDevicesToGroup,
    removeDevice: removeDeviceFromGroup,
  },
  tags: {
    getAll: getTags,
    getById: getTag,
    create: createTag,
    update: updateTag,
    delete: deleteTag,
    addDevices: addDevicesToTag,
    removeDevice: removeTagFromDevice,
  },
  bulk: {
    addToGroup: bulkAddToGroup,
    addTags: bulkAddTags,
    installUpdates: bulkInstallUpdates,
  },
};

export default api;
