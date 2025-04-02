// Device types
export interface MikrotikDevice {
  id: number;
  name: string;
  ipAddress: string;
  username: string;
  password: string;
  port: number;
  model?: string;
  version?: string;
  lastConnected?: string;
}

// System Information
export interface SystemInfo {
  uptime: string;
  version: string;
  model: string;
  serialNumber: string;
  cpuLoad: number;
  cpuCores: number;
  cpuFrequency: string;
  temperature: number;
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  cachedMemory: number;
  memoryUsedPercent: number;
  architecture: string;
  boardName: string;
  firmwareType: string;
  factorySoftware: string;
  processCount: number;
  lastReboot?: string;
}

// Traffic information
export interface InterfaceInfo {
  name: string;
  type: string;
  comment?: string;
  running: boolean;
  disabled: boolean;
  macAddress: string;
}

export interface InterfaceTraffic {
  rxBitsPerSecond: number;
  txBitsPerSecond: number;
  rxPacketsPerSecond: number;
  txPacketsPerSecond: number;
  rxDrops: number;
  txDrops: number;
  rxErrors: number;
  txErrors: number;
  timestamp: string;
}

export interface TrafficSummary {
  download: number;
  upload: number;
  total: number;
  timestamp: string;
}

// WiFi information
export interface WiFiClient {
  id: string;
  interface: string;
  macAddress: string;
  ipAddress?: string;
  name?: string;
  signalStrength: number;
  snr: number;
  txRate: string;
  rxRate: string;
  band?: string;
  uptime: string;
  deviceType?: string;
}

// Storage information
export interface StorageDevice {
  name: string;
  type: string;
  total: number;
  used: number;
  free: number;
  usedPercent: number;
}

export interface FileInfo {
  name: string;
  size: number;
  creationDate: string;
}

// Alert types
export interface Alert {
  id: number;
  deviceId: number;
  type: string;
  severity: string;
  message: string;
  description?: string;
  timestamp: string;
  read: boolean;
  data?: any;
}
