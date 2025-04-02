import { users, devices, alerts, type User, type InsertUser, type Device, type InsertDevice, type Alert, type InsertAlert } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

// Connection string from environment variable
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString);
const db = drizzle(client);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export interface IMikrotikStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, data: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  getAlerts(deviceId?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined>;
  markAllAlertsAsRead(deviceId: number): Promise<void>;
}

export class DbStorage implements IStorage, IMikrotikStorage {
  constructor() {
    // Add a default admin user if not exists
    this.ensureDefaultUser().catch(err => console.error('Error creating default user:', err));
  }

  private async ensureDefaultUser() {
    const existingAdmin = await this.getUserByUsername('admin');
    if (!existingAdmin) {
      await this.createUser({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
    }).returning();
    
    return result[0];
  }

  // Device methods
  async getDevices(): Promise<Device[]> {
    return await db.select().from(devices);
  }

  async getDevice(id: number): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.id, id));
    return result[0];
  }

  async createDevice(device: InsertDevice): Promise<Device> {
    const result = await db.insert(devices).values({
      name: device.name,
      ipAddress: device.ipAddress,
      username: device.username,
      password: device.password,
      port: device.port || 8728,
      model: device.model || null,
      version: device.version || null,
      lastConnected: new Date(),
    }).returning();
    
    return result[0];
  }

  async updateDevice(id: number, data: Partial<Device>): Promise<Device | undefined> {
    const result = await db.update(devices)
      .set({
        ...data,
        lastConnected: data.lastConnected ? new Date(data.lastConnected) : new Date(),
      })
      .where(eq(devices.id, id))
      .returning();
    
    return result[0];
  }

  async deleteDevice(id: number): Promise<boolean> {
    const result = await db.delete(devices).where(eq(devices.id, id)).returning();
    return result.length > 0;
  }

  // Alert methods
  async getAlerts(deviceId?: number): Promise<Alert[]> {
    if (deviceId !== undefined) {
      return await db.select().from(alerts).where(eq(alerts.deviceId, deviceId));
    }
    return await db.select().from(alerts);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values({
      deviceId: alert.deviceId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      data: alert.data || null,
      timestamp: new Date(),
      read: false,
    }).returning();
    
    return result[0];
  }

  async updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined> {
    const result = await db.update(alerts)
      .set(data)
      .where(eq(alerts.id, id))
      .returning();
    
    return result[0];
  }

  async markAllAlertsAsRead(deviceId: number): Promise<void> {
    await db.update(alerts)
      .set({ read: true })
      .where(eq(alerts.deviceId, deviceId));
  }
}

export const storage = new DbStorage();
