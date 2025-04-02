import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { Device, Alert, insertDeviceSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";
import { createConnection, closeConnection } from "./mikrotik/connection";
import { getInterfaces, monitorAllInterfaceTraffic, monitorInterfaceTraffic, calculateTrafficSummary } from "./mikrotik/traffic";
import { getWiFiClients } from "./mikrotik/wifi";
import { getDetailedSystemInfo } from "./mikrotik/system";
import { getLogs, getFilteredLogs } from "./mikrotik/logs";

// In-memory storage for connected clients
const clients: Map<string, WebSocket> = new Map();
// In-memory storage for device monitoring intervals
const monitoringIntervals: Map<number, NodeJS.Timeout> = new Map();

// Custom storage interface extension (could be moved to storage.ts)
interface IMikrotikStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: any): Promise<Device>;
  updateDevice(id: number, data: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  getAlerts(deviceId?: number): Promise<Alert[]>;
  createAlert(alert: any): Promise<Alert>;
  updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined>;
  markAllAlertsAsRead(deviceId: number): Promise<void>;
}

// Extend the storage interface
class MikrotikStorage implements IMikrotikStorage {
  private devices: Map<number, Device>;
  private alerts: Map<number, Alert>;
  private currentDeviceId: number;
  private currentAlertId: number;

  constructor() {
    this.devices = new Map();
    this.alerts = new Map();
    this.currentDeviceId = 1;
    this.currentAlertId = 1;

    // Add some demo devices
    this.createDevice({
      name: "MikroTik Router 1",
      ipAddress: "192.168.88.1",
      username: "admin",
      password: "password", // In a real app, this should be encrypted
      port: 8728,
      model: "hAP ac²",
      version: "RouterOS v7.10.2",
    });
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(device: any): Promise<Device> {
    const id = this.currentDeviceId++;
    const newDevice: Device = {
      id,
      ...device,
      lastConnected: new Date().toISOString(),
    };
    this.devices.set(id, newDevice);
    return newDevice;
  }

  async updateDevice(id: number, data: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;

    const updatedDevice = { ...device, ...data };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }

  async getAlerts(deviceId?: number): Promise<Alert[]> {
    const allAlerts = Array.from(this.alerts.values());
    if (deviceId !== undefined) {
      return allAlerts.filter(alert => alert.deviceId === deviceId);
    }
    return allAlerts;
  }

  async createAlert(alert: any): Promise<Alert> {
    const id = this.currentAlertId++;
    const newAlert: Alert = {
      id,
      ...alert,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;

    const updatedAlert = { ...alert, ...data };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async markAllAlertsAsRead(deviceId: number): Promise<void> {
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.deviceId === deviceId) {
        this.alerts.set(id, { ...alert, read: true });
      }
    }
  }
}

// Create our MikroTik storage instance
const mikrotikStorage = new MikrotikStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  console.log("WebSocket server created on path: /ws");

  wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(2, 10);
    clients.set(clientId, ws);
    console.log(`WebSocket client connected: ${clientId}, IP: ${req.socket.remoteAddress}`);

    // Send a welcome message
    try {
      ws.send(JSON.stringify({ type: 'connection', message: 'Connected to MikroTik Monitoring WebSocket' }));
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from ${clientId}:`, data);
        
        // Handle subscription/unsubscription requests
        if (data.type === 'subscribe') {
          // Handle subscription request (logs, traffic, etc.)
          if (data.target === 'logs' && data.deviceId) {
            // Handle logs subscription
            fetchLogsForClient(data.deviceId, ws);
          }
        } else if (data.type === 'unsubscribe') {
          // Handle unsubscription request
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });

    ws.on('close', (code, reason) => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}, code: ${code}, reason: ${reason}`);
    });
  });

  // Broadcast a message to all connected clients
  function broadcast(data: any): void {
    const message = JSON.stringify(data);
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Start monitoring a device
  async function startMonitoringDevice(device: Device): Promise<void> {
    // Stop existing monitoring if any
    stopMonitoringDevice(device.id);

    // Start a new monitoring interval
    const interval = setInterval(async () => {
      try {
        const conn = await createConnection(device);

        // Monitor traffic
        const interfaceTraffic = await monitorAllInterfaceTraffic(conn);
        const trafficSummary = calculateTrafficSummary(interfaceTraffic);

        // Get system info (less frequently to reduce load)
        const systemData = await getDetailedSystemInfo(conn);

        // Broadcast updates to all clients
        broadcast({ type: 'interfaceTraffic', data: interfaceTraffic });
        broadcast({ type: 'trafficSummary', data: trafficSummary });
        broadcast({ type: 'systemInfo', data: systemData.systemInfo });
        broadcast({ type: 'storageInfo', data: systemData.storageInfo });

        // Check for alerts
        checkForAlerts(device.id, interfaceTraffic, systemData.systemInfo);

      } catch (error) {
        console.error(`Error monitoring device ${device.id}:`, error);
        // Create an alert for connection failure
        const alert = await mikrotikStorage.createAlert({
          deviceId: device.id,
          type: 'connection',
          severity: 'critical',
          message: 'Connection Lost',
          description: `Failed to connect to device: ${(error as Error).message}`,
        });
        broadcast({ type: 'newAlert', data: alert });
      }
    }, 5000); // Monitor every 5 seconds

    monitoringIntervals.set(device.id, interval);
    console.log(`Started monitoring device ${device.id} (${device.name})`);
  }

  // Stop monitoring a device
  function stopMonitoringDevice(deviceId: number): void {
    const interval = monitoringIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      monitoringIntervals.delete(deviceId);
      closeConnection(deviceId);
      console.log(`Stopped monitoring device ${deviceId}`);
    }
  }

  // Check for alert conditions
  async function checkForAlerts(
    deviceId: number, 
    interfaceTraffic: Record<string, any>,
    systemInfo: any
  ): Promise<void> {
    // CPU temperature alert
    if (systemInfo.temperature > 65) {
      const alert = await mikrotikStorage.createAlert({
        deviceId,
        type: 'temperature',
        severity: 'warning',
        message: 'CPU Temperature Warning',
        description: `CPU temperature has exceeded the warning threshold (${systemInfo.temperature}°C). Please check ventilation.`,
        data: { temperature: systemInfo.temperature },
      });
      broadcast({ type: 'newAlert', data: alert });
    }

    // Memory usage alert
    if (systemInfo.memoryUsedPercent > 85) {
      const alert = await mikrotikStorage.createAlert({
        deviceId,
        type: 'memory',
        severity: 'warning',
        message: 'High Memory Usage',
        description: `Memory usage is high (${systemInfo.memoryUsedPercent}%). Consider restarting the device if performance is affected.`,
        data: { memoryUsed: systemInfo.memoryUsedPercent },
      });
      broadcast({ type: 'newAlert', data: alert });
    }

    // High bandwidth usage alert (simplified example)
    let highTrafficDetected = false;
    for (const [ifaceName, traffic] of Object.entries(interfaceTraffic)) {
      const rxMbps = (traffic.rxBitsPerSecond || 0) / 1000000;
      const txMbps = (traffic.txBitsPerSecond || 0) / 1000000;
      
      if (rxMbps > 90 || txMbps > 90) { // 90 Mbps threshold example
        highTrafficDetected = true;
        const alert = await mikrotikStorage.createAlert({
          deviceId,
          type: 'traffic',
          severity: 'info',
          message: 'High Bandwidth Usage',
          description: `Interface ${ifaceName} is experiencing high traffic (RX: ${rxMbps.toFixed(2)} Mbps, TX: ${txMbps.toFixed(2)} Mbps).`,
          data: { interface: ifaceName, rxMbps, txMbps },
        });
        broadcast({ type: 'newAlert', data: alert });
      }
    }
  }

  // API endpoints
  // Status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', connectedClients: clients.size });
  });

  // Device endpoints
  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await mikrotikStorage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  app.get('/api/devices/:id', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch device' });
    }
  });

  app.post('/api/devices', async (req, res) => {
    try {
      const result = insertDeviceSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid device data', details: result.error });
      }
      
      const device = await mikrotikStorage.createDevice(result.data);
      
      // Start monitoring the device
      startMonitoringDevice(device);
      
      res.status(201).json(device);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create device' });
    }
  });

  app.put('/api/devices/:id', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const result = z.object({
        name: z.string().optional(),
        ipAddress: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        port: z.number().optional(),
        model: z.string().optional(),
        version: z.string().optional(),
      }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid device data', details: result.error });
      }
      
      const updatedDevice = await mikrotikStorage.updateDevice(deviceId, result.data);
      
      if (!updatedDevice) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      // Restart monitoring with updated device info
      startMonitoringDevice(updatedDevice);
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update device' });
    }
  });

  app.delete('/api/devices/:id', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      
      // Stop monitoring the device
      stopMonitoringDevice(deviceId);
      
      const success = await mikrotikStorage.deleteDevice(deviceId);
      
      if (!success) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete device' });
    }
  });

  // Device Interfaces
  app.get('/api/devices/:id/interfaces', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const interfaces = await getInterfaces(conn);
      
      // Filter by type if requested
      const typeFilter = req.query.type as string;
      if (typeFilter) {
        return res.json(interfaces.filter(iface => iface.type === typeFilter));
      }
      
      res.json(interfaces);
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      res.status(500).json({ error: 'Failed to fetch interfaces' });
    }
  });

  // Device Traffic
  app.get('/api/devices/:id/traffic', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const interfaces = await monitorAllInterfaceTraffic(conn);
      const summary = calculateTrafficSummary(interfaces);
      
      res.json({ interfaces, summary });
    } catch (error) {
      console.error('Error fetching traffic:', error);
      res.status(500).json({ error: 'Failed to fetch traffic data' });
    }
  });

  app.get('/api/devices/:id/traffic/:interface', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const interfaceName = req.params.interface;
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const traffic = await monitorInterfaceTraffic(conn, interfaceName);
      
      res.json(traffic);
    } catch (error) {
      console.error('Error fetching interface traffic:', error);
      res.status(500).json({ error: 'Failed to fetch interface traffic' });
    }
  });

  // WiFi Clients
  app.get('/api/devices/:id/wifi/clients', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const clients = await getWiFiClients(conn);
      
      res.json(clients);
    } catch (error) {
      console.error('Error fetching WiFi clients:', error);
      res.status(500).json({ error: 'Failed to fetch WiFi clients' });
    }
  });

  // System Information
  app.get('/api/devices/:id/system', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const systemData = await getDetailedSystemInfo(conn);
      
      res.json(systemData.systemInfo);
    } catch (error) {
      console.error('Error fetching system info:', error);
      res.status(500).json({ error: 'Failed to fetch system information' });
    }
  });

  app.get('/api/devices/:id/system/storage', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const systemData = await getDetailedSystemInfo(conn);
      
      res.json(systemData.storageInfo);
    } catch (error) {
      console.error('Error fetching storage info:', error);
      res.status(500).json({ error: 'Failed to fetch storage information' });
    }
  });

  app.get('/api/devices/:id/system/files', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const conn = await createConnection(device);
      const systemData = await getDetailedSystemInfo(conn);
      
      res.json(systemData.fileList);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch file list' });
    }
  });
  
  // Device Logs
  app.get('/api/devices/:id/logs', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const topics = req.query.topics as string | undefined;
      
      const conn = await createConnection(device);
      
      let logs;
      if (topics) {
        logs = await getFilteredLogs(conn, topics, limit);
      } else {
        logs = await getLogs(conn, limit);
      }
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });
  
  // Helper function to fetch logs for a specific client via WebSocket
  async function fetchLogsForClient(deviceId: number, ws: WebSocket): Promise<void> {
    try {
      if (ws.readyState !== WebSocket.OPEN) {
        return;
      }
      
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Device not found',
          target: 'logs'
        }));
        return;
      }
      
      const conn = await createConnection(device);
      const logs = await getLogs(conn, 100);
      
      ws.send(JSON.stringify({ 
        type: 'logs', 
        deviceId,
        data: logs 
      }));
    } catch (error) {
      console.error(`Error fetching logs for WebSocket client:`, error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to fetch logs',
          target: 'logs'
        }));
      }
    }
  }

  // Alerts
  app.get('/api/devices/:id/alerts', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const alerts = await mikrotikStorage.getAlerts(deviceId);
      
      // Sort by timestamp (newest first)
      alerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/devices/:id/alerts', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const result = insertAlertSchema.safeParse({
        ...req.body,
        deviceId,
      });
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid alert data', details: result.error });
      }
      
      const alert = await mikrotikStorage.createAlert(result.data);
      
      // Broadcast the new alert to all clients
      broadcast({ type: 'newAlert', data: alert });
      
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.patch('/api/alerts/:id', async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const result = z.object({
        read: z.boolean().optional(),
      }).safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid alert data', details: result.error });
      }
      
      const updatedAlert = await mikrotikStorage.updateAlert(alertId, result.data);
      
      if (!updatedAlert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  app.post('/api/devices/:id/alerts/mark-all-read', async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const device = await mikrotikStorage.getDevice(deviceId);
      
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      await mikrotikStorage.markAllAlertsAsRead(deviceId);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark alerts as read' });
    }
  });

  // Auth endpoints (simplified for this implementation)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'password') {
      res.json({ success: true, user: { id: 1, username: 'admin' } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  // Start monitoring existing devices
  const startAllDeviceMonitoring = async () => {
    const devices = await mikrotikStorage.getDevices();
    for (const device of devices) {
      startMonitoringDevice(device);
    }
  };

  // Start monitoring on server start
  startAllDeviceMonitoring();

  // Clean up on server shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server, stopping all monitoring...');
    for (const [deviceId, interval] of monitoringIntervals.entries()) {
      clearInterval(interval);
      closeConnection(deviceId);
    }
    process.exit(0);
  });

  return httpServer;
}
