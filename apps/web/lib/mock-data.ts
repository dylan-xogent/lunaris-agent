import type {
  Device,
  Software,
  Update,
  DashboardStats,
  DeviceStatus,
  UpdateSeverity,
} from "./types";

// Helper functions
const randomId = () => Math.random().toString(36).substring(2, 11);

const randomFromArray = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomIp = () =>
  `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`;

const randomMac = () =>
  Array.from({ length: 6 }, () =>
    randomInt(0, 255).toString(16).padStart(2, "0")
  ).join(":");

const randomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date.toISOString();
};

const recentDate = (minutesAgo: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - randomInt(0, minutesAgo));
  return date.toISOString();
};

// Mock Data Generators
const hostnames = [
  "WORKSTATION-A1",
  "DEV-PC-01",
  "LAPTOP-SALES-05",
  "SERVER-PROD-01",
  "DESKTOP-HR-03",
  "LAPTOP-DEV-02",
  "WORKSTATION-B2",
  "PC-FINANCE-01",
  "SERVER-DB-01",
  "LAPTOP-EXEC-01",
  "DESKTOP-SUPPORT-02",
  "WORKSTATION-C3",
  "DEV-PC-02",
  "LAPTOP-SALES-08",
  "SERVER-BACKUP-01",
  "DESKTOP-MARKETING-04",
  "LAPTOP-DEV-05",
  "WORKSTATION-D4",
];

const osVersions = [
  { os: "Windows", versions: ["10 Pro 22H2", "11 Pro 23H2", "11 Enterprise", "Server 2022"] },
  { os: "macOS", versions: ["Sonoma 14.2", "Ventura 13.6", "Monterey 12.7"] },
  { os: "Ubuntu", versions: ["22.04 LTS", "24.04 LTS", "20.04 LTS"] },
];

const agentVersions = ["1.5.2", "1.5.1", "1.4.8", "1.5.0", "1.4.9"];

const softwareCatalog: Array<{ name: string; publisher: string; versions: string[] }> = [
  { name: "Microsoft 365", publisher: "Microsoft", versions: ["16.0.17126", "16.0.17029", "16.0.16827"] },
  { name: "Google Chrome", publisher: "Google LLC", versions: ["120.0.6099", "119.0.6045", "118.0.5993"] },
  { name: "Visual Studio Code", publisher: "Microsoft", versions: ["1.85.1", "1.85.0", "1.84.2"] },
  { name: "Slack", publisher: "Slack Technologies", versions: ["4.35.126", "4.34.119", "4.33.90"] },
  { name: "Zoom", publisher: "Zoom Video", versions: ["5.17.0", "5.16.10", "5.16.6"] },
  { name: "Adobe Acrobat", publisher: "Adobe Systems", versions: ["23.008.20533", "23.006.20380", "23.003.20269"] },
  { name: "7-Zip", publisher: "Igor Pavlov", versions: ["23.01", "22.01", "21.07"] },
  { name: "Node.js", publisher: "OpenJS Foundation", versions: ["20.10.0", "18.19.0", "16.20.2"] },
  { name: "Python", publisher: "Python Software", versions: ["3.12.1", "3.11.7", "3.10.13"] },
  { name: "Git", publisher: "Git Project", versions: ["2.43.0", "2.42.0", "2.41.0"] },
  { name: "Docker Desktop", publisher: "Docker Inc", versions: ["4.26.1", "4.25.2", "4.24.2"] },
  { name: "Firefox", publisher: "Mozilla", versions: ["121.0", "120.0.1", "119.0.1"] },
  { name: "VLC Media Player", publisher: "VideoLAN", versions: ["3.0.20", "3.0.18", "3.0.17"] },
  { name: "Notepad++", publisher: "Don Ho", versions: ["8.6.2", "8.6", "8.5.8"] },
  { name: "WinRAR", publisher: "win.rar GmbH", versions: ["6.24", "6.23", "6.22"] },
];

const updatePackages = [
  { name: "Windows Security Update", severity: "critical" as UpdateSeverity, description: "Critical security patches for Windows OS" },
  { name: "Microsoft Edge", severity: "important" as UpdateSeverity, description: "Browser security and feature update" },
  { name: "Visual C++ Runtime", severity: "optional" as UpdateSeverity, description: "Runtime library update" },
  { name: "Intel Graphics Driver", severity: "optional" as UpdateSeverity, description: "Display driver performance improvements" },
  { name: ".NET Framework", severity: "important" as UpdateSeverity, description: "Framework security and stability updates" },
  { name: "Windows Defender Definitions", severity: "critical" as UpdateSeverity, description: "Antivirus definition updates" },
  { name: "Adobe Flash Player", severity: "critical" as UpdateSeverity, description: "Critical security vulnerability fix" },
  { name: "Java Runtime", severity: "important" as UpdateSeverity, description: "Security and performance improvements" },
  { name: "NVIDIA Driver", severity: "optional" as UpdateSeverity, description: "GPU driver update with bug fixes" },
  { name: "Office Security Update", severity: "critical" as UpdateSeverity, description: "Security patches for Microsoft Office" },
  { name: "PowerShell", severity: "optional" as UpdateSeverity, description: "PowerShell 7.x feature update" },
  { name: "Windows Feature Update", severity: "important" as UpdateSeverity, description: "Windows feature and quality update" },
];

// Generate Software List
const generateSoftware = (count: number): Software[] => {
  const shuffled = [...softwareCatalog].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((sw) => ({
    id: randomId(),
    name: sw.name,
    version: randomFromArray(sw.versions),
    publisher: sw.publisher,
    installedAt: randomDate(180),
  }));
};

// Generate Devices
export const generateDevices = (count: number = 18): Device[] => {
  return hostnames.slice(0, count).map((hostname, index) => {
    const osInfo = randomFromArray(osVersions);
    const status: DeviceStatus = Math.random() > 0.2 ? "online" : "offline";
    const pendingUpdates = Math.random() > 0.4 ? randomInt(0, 8) : 0;

    return {
      id: `dev-${String(index + 1).padStart(3, "0")}`,
      hostname,
      os: osInfo.os,
      osVersion: randomFromArray(osInfo.versions),
      ipAddress: randomIp(),
      macAddress: randomMac(),
      agentVersion: randomFromArray(agentVersions),
      status,
      lastSeen: status === "online" ? recentDate(5) : randomDate(7),
      enrolledAt: randomDate(365),
      pendingUpdates,
      installedSoftware: generateSoftware(randomInt(6, 12)),
      cpuUsage: status === "online" ? randomInt(5, 85) : undefined,
      memoryUsage: status === "online" ? randomInt(30, 90) : undefined,
      diskUsage: randomInt(20, 85),
    };
  });
};

// Generate Updates based on devices
export const generateUpdates = (devices: Device[]): Update[] => {
  const updates: Update[] = [];

  devices.forEach((device) => {
    if (device.pendingUpdates > 0) {
      const shuffledPackages = [...updatePackages].sort(() => Math.random() - 0.5);
      const deviceUpdates = shuffledPackages.slice(0, device.pendingUpdates);

      deviceUpdates.forEach((pkg) => {
        updates.push({
          id: randomId(),
          deviceId: device.id,
          deviceHostname: device.hostname,
          packageName: pkg.name,
          currentVersion: `${randomInt(1, 10)}.${randomInt(0, 9)}.${randomInt(100, 999)}`,
          availableVersion: `${randomInt(10, 15)}.${randomInt(0, 9)}.${randomInt(100, 999)}`,
          severity: pkg.severity,
          size: `${randomInt(10, 500)} MB`,
          publishedAt: randomDate(30),
          description: pkg.description,
        });
      });
    }
  });

  return updates;
};

// Calculate Dashboard Stats
export const calculateStats = (devices: Device[], updates: Update[]): DashboardStats => {
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const devicesWithUpdates = devices.filter((d) => d.pendingUpdates > 0).length;
  const totalPendingUpdates = updates.length;
  const criticalUpdates = updates.filter((u) => u.severity === "critical").length;

  return {
    totalDevices,
    onlineDevices,
    devicesWithUpdates,
    totalPendingUpdates,
    criticalUpdates,
    onlinePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
  };
};

// Initialize mock data
let mockDevices: Device[] | null = null;
let mockUpdates: Update[] | null = null;

export const getMockDevices = (): Device[] => {
  if (!mockDevices) {
    mockDevices = generateDevices(18);
  }
  return mockDevices;
};

export const getMockUpdates = (): Update[] => {
  if (!mockUpdates) {
    mockUpdates = generateUpdates(getMockDevices());
  }
  return mockUpdates;
};

export const getMockStats = (): DashboardStats => {
  return calculateStats(getMockDevices(), getMockUpdates());
};

// Reset mock data (useful for testing)
export const resetMockData = () => {
  mockDevices = null;
  mockUpdates = null;
};

