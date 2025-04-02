import { RouterOSAPI } from 'routeros-api';
import { Device } from '@shared/schema';

// Check environment to decide whether to use mock data or real device
// Kiểm tra biến môi trường USE_MOCK_DATA để quyết định có sử dụng dữ liệu mô phỏng không
// Cho phép kết nối đến thiết bị thực tế
const USE_MOCK_DATA = false;

// Cache connections to prevent creating multiple connections to the same device
const connectionCache: Map<number, RouterOSAPI> = new Map();

// Create a connection to a MikroTik device
// Custom Mock API class that simulates RouterOSAPI
class MockRouterOSAPI extends RouterOSAPI {
  deviceId: number;
  deviceName: string;
  
  constructor(deviceId: number, deviceName: string) {
    super({ host: '', user: '', password: '' });
    this.deviceId = deviceId;
    this.deviceName = deviceName;
  }
  
  // Override connect method to simulate successful connection
  async connect() {
    console.log(`[MOCK] Connected to device ${this.deviceId} (${this.deviceName})`);
    return true;
  }
  
  // Override close method
  async close() {
    console.log(`[MOCK] Closed connection to device ${this.deviceId} (${this.deviceName})`);
    return true;
  }
  
  // Override write method to return mock data based on command
  async write(command: string, params: any[] = []) {
    console.log(`[MOCK] Executing command: ${command}`);
    
    // Return different mock data based on the command
    if (command === '/system/resource/print') {
      return [
        {
          uptime: '259200',  // 3 days
          version: '7.10.2',
          'free-memory': (256 * 1024 * 1024).toString(), // 256MB
          'total-memory': (512 * 1024 * 1024).toString(), // 512MB
          cpu: '3',
          'cpu-count': '2',
          'cpu-frequency': '800',
          'cpu-load': '15',
          'free-hdd-space': (100 * 1024 * 1024).toString(), // 100MB
          'total-hdd-space': (128 * 1024 * 1024).toString(), // 128MB
          architecture: 'arm',
          'board-name': 'hAP ac²',
          platform: 'MikroTik',
          'factory-software': 'RouterOS',
          'firmware-type': 'stable'
        }
      ];
    } else if (command === '/system/identity/print') {
      return [{ name: this.deviceName }];
    } else if (command === '/interface/print') {
      return [
        { name: 'ether1', type: 'ether', 'mac-address': '00:0C:29:45:67:01', running: 'true', disabled: 'false' },
        { name: 'ether2', type: 'ether', 'mac-address': '00:0C:29:45:67:02', running: 'true', disabled: 'false' },
        { name: 'wlan1', type: 'wlan', 'mac-address': '00:0C:29:45:67:03', running: 'true', disabled: 'false' },
      ];
    } else if (command.includes('/interface/monitor-traffic')) {
      // Simulate traffic data with random values
      return [
        {
          'rx-bits-per-second': Math.floor(Math.random() * 10000000).toString(),
          'tx-bits-per-second': Math.floor(Math.random() * 5000000).toString(),
          'rx-packets-per-second': Math.floor(Math.random() * 1000).toString(),
          'tx-packets-per-second': Math.floor(Math.random() * 500).toString(),
        }
      ];
    } else if (command === '/interface/wireless/registration-table/print') {
      return [
        { 
          '.id': '*1', 
          interface: 'wlan1', 
          'mac-address': 'DC:FB:48:79:12:34', 
          'signal-strength': '-65',
          'signal-to-noise': '40',
          'tx-rate': '87Mbps',
          'rx-rate': '130Mbps',
          uptime: '6h32m10s'
        },
        { 
          '.id': '*2', 
          interface: 'wlan1', 
          'mac-address': '00:11:22:33:44:55', 
          'signal-strength': '-72',
          'signal-to-noise': '32',
          'tx-rate': '54Mbps',
          'rx-rate': '65Mbps',
          uptime: '2h17m42s'
        }
      ];
    } else if (command === '/log/print') {
      // Generate mock logs with different severity levels
      return [
        { 
          '.id': '*1',
          'time': (new Date(Date.now() - 3600000)).toLocaleString(), // 1 hour ago
          'topics': 'system,info',
          'message': 'system started'
        },
        { 
          '.id': '*2',
          'time': (new Date(Date.now() - 3400000)).toLocaleString(),
          'topics': 'wireless,info',
          'message': 'wireless client DC:FB:48:79:12:34 connected to wlan1'
        },
        { 
          '.id': '*3',
          'time': (new Date(Date.now() - 2800000)).toLocaleString(),
          'topics': 'wireless,info',
          'message': 'wireless client 00:11:22:33:44:55 connected to wlan1'
        },
        { 
          '.id': '*4',
          'time': (new Date(Date.now() - 1800000)).toLocaleString(),
          'topics': 'system,warning',
          'message': 'CPU temperature is high: 72°C'
        },
        { 
          '.id': '*5',
          'time': (new Date(Date.now() - 900000)).toLocaleString(), 
          'topics': 'firewall,warning',
          'message': 'Blocked suspicious connection attempt from 203.0.113.42:38012'
        },
        { 
          '.id': '*6',
          'time': (new Date(Date.now() - 600000)).toLocaleString(),
          'topics': 'dhcp,info',
          'message': 'DHCP lease 192.168.1.105 assigned to DC:FB:48:79:12:34'
        },
        { 
          '.id': '*7',
          'time': (new Date(Date.now() - 300000)).toLocaleString(),
          'topics': 'system,error',
          'message': 'Interface ether2 link down'
        },
        { 
          '.id': '*8',
          'time': (new Date(Date.now() - 180000)).toLocaleString(),
          'topics': 'system,info',
          'message': 'Interface ether2 link up'
        },
        { 
          '.id': '*9',
          'time': (new Date(Date.now() - 60000)).toLocaleString(),
          'topics': 'firewall,critical',
          'message': 'Possible DoS attack detected from 198.51.100.24'
        },
        { 
          '.id': '*10',
          'time': (new Date()).toLocaleString(),
          'topics': 'system,debug',
          'message': 'Health monitor checking system resources'
        }
      ];
    }
    
    // Default response for any other command
    return [];
  }
}

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

  // Check if we should use mock data
  // Sử dụng dữ liệu giả lập chỉ khi USE_MOCK_DATA = true
  if (USE_MOCK_DATA) {
    console.log(`[MOCK] Creating mock connection for device ${device.id} (${device.name})`);
    const mockConn = new MockRouterOSAPI(device.id, device.name);
    connectionCache.set(device.id, mockConn as unknown as RouterOSAPI);
    return mockConn as unknown as RouterOSAPI;
  }

  // Create new connection to real device
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
    console.error(`Failed to connect to MikroTik device: ${(error as Error).message}`);
    
    // Không tự động chuyển sang chế độ dữ liệu giả lập ngay cả khi kết nối thất bại
    // Điều này đảm bảo rằng chúng ta luôn biết khi có vấn đề kết nối thực sự
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
    console.log(`Executing MikroTik command: ${command} with params:`, params);
    const result = await conn.write(command, params);
    console.log(`Command ${command} result:`, JSON.stringify(result).substring(0, 200) + (JSON.stringify(result).length > 200 ? '...' : ''));
    return result;
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
