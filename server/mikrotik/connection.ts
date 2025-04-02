import { RouterOSAPI } from 'routeros-api';
import { Device } from '@shared/schema';

// For development purposes, we'll use mock data since no real MikroTik device is available
const USE_MOCK_DATA = true;

// Cache connections to prevent creating multiple connections to the same device
const connectionCache: Map<number, RouterOSAPI> = new Map();

// Create a connection to a MikroTik device
export async function createConnection(device: Device): Promise<RouterOSAPI> {
  // Check if connection already exists in cache
  const cachedConnection = connectionCache.get(device.id);
  if (cachedConnection) {
    try {
      // Check if connection is still alive
      await cachedConnection.write('/system/identity/print');
      return cachedConnection;
    } catch (error) {
      // Connection is dead, remove from cache
      connectionCache.delete(device.id);
      console.log(`Connection to device ${device.id} (${device.name}) is dead, creating new connection`);
    }
  }

  // Create new connection
  const conn = new RouterOSAPI({
    host: device.ipAddress,
    user: device.username,
    password: device.password,
    port: device.port || 8728,
    timeout: 5000,
  });

  try {
    // Connect to the device
    await conn.connect();
    
    // Store connection in cache
    connectionCache.set(device.id, conn);
    
    console.log(`Connected to device ${device.id} (${device.name})`);
    return conn;
  } catch (error) {
    throw new Error(`Failed to connect to MikroTik device: ${(error as Error).message}`);
  }
}

// Close a connection
export async function closeConnection(deviceId: number): Promise<void> {
  const conn = connectionCache.get(deviceId);
  if (conn) {
    try {
      await conn.close();
      connectionCache.delete(deviceId);
      console.log(`Closed connection to device ${deviceId}`);
    } catch (error) {
      console.error(`Error closing connection to device ${deviceId}:`, error);
    }
  }
}

// Close all connections
export async function closeAllConnections(): Promise<void> {
  for (const [deviceId, conn] of connectionCache.entries()) {
    try {
      await conn.close();
      console.log(`Closed connection to device ${deviceId}`);
    } catch (error) {
      console.error(`Error closing connection to device ${deviceId}:`, error);
    }
  }
  connectionCache.clear();
}

// Execute a command and handle potential errors
export async function executeCommand(conn: RouterOSAPI, command: string, params: any[] = []): Promise<any> {
  try {
    return await conn.write(command, params);
  } catch (error) {
    console.error(`Error executing command '${command}':`, error);
    throw new Error(`Failed to execute RouterOS command: ${(error as Error).message}`);
  }
}

// Parse MikroTik uptime string into a human-readable format
export function parseUptime(uptimeString: string): string {
  // MikroTik uptime is in seconds
  const uptime = parseInt(uptimeString);
  if (isNaN(uptime)) return uptimeString;
  
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  result += `${minutes}m`;
  
  return result;
}

// Get the reboot date based on uptime
export function getRebootDate(uptimeSeconds: number): string {
  const rebootDate = new Date(Date.now() - uptimeSeconds * 1000);
  return rebootDate.toLocaleDateString();
}

// Parse MikroTik bandwidth value (comes in bps)
export function parseBandwidth(bpsString: string): number {
  const bps = parseInt(bpsString);
  return isNaN(bps) ? 0 : bps;
}
