import { RouterOSAPI } from 'routeros-api';
import { executeCommand, parseUptime, getRebootDate } from './connection';
import { SystemInfo, StorageDevice, FileInfo } from '@/types/mikrotik';

// Get system resource information
export async function getSystemResources(conn: RouterOSAPI): Promise<SystemInfo> {
  try {
    const resources = await executeCommand(conn, '/system/resource/print');
    
    if (!resources || resources.length === 0) {
      throw new Error('No system resource data available');
    }
    
    const resource = resources[0];
    const uptime = parseInt(resource.uptime);
    
    // Fetch CPU temp if available (different command on RouterOS 7+)
    let cpuTemperature = 0;
    try {
      const healthData = await executeCommand(conn, '/system/health/print');
      if (healthData && healthData.length > 0 && healthData[0].temperature) {
        cpuTemperature = parseInt(healthData[0].temperature);
      }
    } catch (error) {
      console.warn('Could not fetch CPU temperature:', error);
      // Default to a placeholder value if not available
      cpuTemperature = 45;
    }
    
    // Calculate memory metrics
    const totalMemory = parseInt(resource['total-memory']);
    const freeMemory = parseInt(resource['free-memory']);
    const usedMemory = totalMemory - freeMemory;
    const memoryUsedPercent = Math.round((usedMemory / totalMemory) * 100);
    
    return {
      uptime: parseUptime(resource.uptime),
      version: resource.version,
      model: resource['board-name'] || 'Unknown',
      serialNumber: resource['serial-number'] || 'Unknown',
      cpuLoad: parseInt(resource['cpu-load']),
      cpuCores: parseInt(resource['cpu-count']),
      cpuFrequency: `${parseInt(resource['cpu-frequency']) / 1000000} GHz`,
      temperature: cpuTemperature,
      totalMemory: totalMemory,
      usedMemory: usedMemory,
      freeMemory: freeMemory,
      cachedMemory: parseInt(resource['free-hdd-space'] || '0'),
      memoryUsedPercent: memoryUsedPercent,
      architecture: resource.architecture || 'Unknown',
      boardName: resource['board-name'] || 'Unknown',
      firmwareType: resource['firmware-type'] || 'Unknown',
      factorySoftware: resource['factory-software'] || 'Unknown',
      processCount: 0, // Will be updated from getProcessCount
      lastReboot: getRebootDate(uptime),
    };
  } catch (error) {
    console.error('Error getting system resources:', error);
    throw error;
  }
}

// Get process count
export async function getProcessCount(conn: RouterOSAPI): Promise<number> {
  try {
    const processes = await executeCommand(conn, '/system/resource/cpu/print');
    return processes ? processes.length : 0;
  } catch (error) {
    console.error('Error getting process count:', error);
    return 0;
  }
}

// Get storage information
export async function getStorageDevices(conn: RouterOSAPI): Promise<StorageDevice[]> {
  try {
    // In RouterOS 7+
    try {
      const storage = await executeCommand(conn, '/system/resource/usb/print');
      
      if (storage && storage.length > 0) {
        return storage.map((device: any) => ({
          name: device.name || 'USB Storage',
          type: 'usb',
          total: parseInt(device.size || '0'),
          used: parseInt(device.size || '0') - parseInt(device['free-space'] || '0'),
          free: parseInt(device['free-space'] || '0'),
          usedPercent: Math.round(
            ((parseInt(device.size || '0') - parseInt(device['free-space'] || '0')) / 
             parseInt(device.size || '1')) * 100
          )
        }));
      }
    } catch (error) {
      console.warn('USB storage information not available:', error);
    }
    
    // Fetch disk information which should be available on all RouterOS versions
    const resources = await executeCommand(conn, '/system/resource/print');
    
    if (resources && resources.length > 0) {
      const resource = resources[0];
      
      const total = parseInt(resource['total-hdd-space'] || '0');
      const free = parseInt(resource['free-hdd-space'] || '0');
      const used = total - free;
      const usedPercent = Math.round((used / total) * 100);
      
      return [{
        name: 'Flash Storage',
        type: 'flash',
        total: total,
        used: used,
        free: free,
        usedPercent: usedPercent
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting storage devices:', error);
    throw error;
  }
}

// Get file list
export async function getFileList(conn: RouterOSAPI): Promise<FileInfo[]> {
  try {
    const files = await executeCommand(conn, '/file/print');
    
    return files.map((file: any) => ({
      name: file.name || 'Unknown file',
      size: parseInt(file.size || '0'),
      creationDate: file['creation-time'] || 'Unknown'
    }));
  } catch (error) {
    console.error('Error getting file list:', error);
    throw error;
  }
}

// Get detailed system information, combining all data sources
export async function getDetailedSystemInfo(conn: RouterOSAPI): Promise<
  {systemInfo: SystemInfo, storageInfo: StorageDevice[], fileList: FileInfo[]}
> {
  try {
    // Get basic system resources
    const systemInfo = await getSystemResources(conn);
    
    // Enhance with process count
    systemInfo.processCount = await getProcessCount(conn);
    
    // Get storage information
    const storageInfo = await getStorageDevices(conn);
    
    // Get file list (limited to top 10 by size)
    let fileList = await getFileList(conn);
    fileList = fileList
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    return {
      systemInfo,
      storageInfo,
      fileList
    };
  } catch (error) {
    console.error('Error getting detailed system info:', error);
    throw error;
  }
}

// Get system identity
export async function getSystemIdentity(conn: RouterOSAPI): Promise<string> {
  try {
    const identity = await executeCommand(conn, '/system/identity/print');
    
    if (identity && identity.length > 0) {
      return identity[0].name || 'Unknown';
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error getting system identity:', error);
    return 'Unknown';
  }
}
