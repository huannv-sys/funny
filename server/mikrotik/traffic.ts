import { RouterOSAPI } from 'routeros-api';
import { executeCommand, parseBandwidth } from './connection';
import { InterfaceInfo, InterfaceTraffic, TrafficSummary } from '@/types/mikrotik';

// Get a list of all network interfaces
export async function getInterfaces(conn: RouterOSAPI): Promise<InterfaceInfo[]> {
  try {
    const interfaces = await executeCommand(conn, '/interface/print');
    
    return interfaces.map((iface: any) => ({
      name: iface.name,
      type: iface.type || 'unknown',
      comment: iface.comment || '',
      running: iface.running === 'true',
      disabled: iface.disabled === 'true',
      macAddress: iface['mac-address'] || '',
    }));
  } catch (error) {
    console.error('Error getting interfaces:', error);
    throw error;
  }
}

// Monitor traffic for a specific interface
export async function monitorInterfaceTraffic(conn: RouterOSAPI, interfaceName: string): Promise<InterfaceTraffic> {
  try {
    const traffic = await executeCommand(conn, '/interface/monitor-traffic', [
      '=interface=' + interfaceName,
      '=once='
    ]);
    
    if (!traffic || traffic.length === 0) {
      throw new Error(`No traffic data for interface ${interfaceName}`);
    }
    
    const trafficData = traffic[0];
    
    return {
      rxBitsPerSecond: parseBandwidth(trafficData['rx-bits-per-second']),
      txBitsPerSecond: parseBandwidth(trafficData['tx-bits-per-second']),
      rxPacketsPerSecond: parseInt(trafficData['rx-packets-per-second'] || '0'),
      txPacketsPerSecond: parseInt(trafficData['tx-packets-per-second'] || '0'),
      rxDrops: parseInt(trafficData['rx-drops'] || '0'),
      txDrops: parseInt(trafficData['tx-drops'] || '0'),
      rxErrors: parseInt(trafficData['rx-errors'] || '0'),
      txErrors: parseInt(trafficData['tx-errors'] || '0'),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error monitoring traffic for interface ${interfaceName}:`, error);
    throw error;
  }
}

// Monitor traffic for all interfaces
export async function monitorAllInterfaceTraffic(
  conn: RouterOSAPI
): Promise<Record<string, InterfaceTraffic>> {
  try {
    // Get list of interfaces
    const interfaces = await getInterfaces(conn);
    
    // Create a record to store traffic data
    const trafficData: Record<string, InterfaceTraffic> = {};
    
    // Get traffic for each interface
    for (const iface of interfaces) {
      if (iface.running) {
        try {
          const traffic = await monitorInterfaceTraffic(conn, iface.name);
          trafficData[iface.name] = traffic;
        } catch (error) {
          console.warn(`Skipping traffic data for interface ${iface.name}:`, error);
        }
      }
    }
    
    return trafficData;
  } catch (error) {
    console.error('Error monitoring all interface traffic:', error);
    throw error;
  }
}

// Calculate traffic summary from interface traffic data
export function calculateTrafficSummary(
  interfaceTraffic: Record<string, InterfaceTraffic>
): TrafficSummary {
  let totalDownload = 0;
  let totalUpload = 0;
  
  // Sum up traffic for all interfaces
  Object.values(interfaceTraffic).forEach(traffic => {
    totalDownload += traffic.rxBitsPerSecond;
    totalUpload += traffic.txBitsPerSecond;
  });
  
  return {
    download: totalDownload,
    upload: totalUpload,
    total: totalDownload + totalUpload,
    timestamp: new Date().toISOString(),
  };
}

// Get interface statistics
export async function getInterfaceStatistics(conn: RouterOSAPI, interfaceName: string): Promise<any> {
  try {
    const stats = await executeCommand(conn, '/interface/print', [
      '=stats=',
      `?name=${interfaceName}`
    ]);
    
    if (!stats || stats.length === 0) {
      throw new Error(`No statistics found for interface ${interfaceName}`);
    }
    
    return stats[0];
  } catch (error) {
    console.error(`Error getting statistics for interface ${interfaceName}:`, error);
    throw error;
  }
}

// Get total bytes transferred for an interface
export async function getInterfaceTotalTransfer(
  conn: RouterOSAPI, 
  interfaceName: string
): Promise<{ rxBytes: number, txBytes: number }> {
  try {
    const stats = await getInterfaceStatistics(conn, interfaceName);
    
    return {
      rxBytes: parseInt(stats['rx-byte'] || '0'),
      txBytes: parseInt(stats['tx-byte'] || '0'),
    };
  } catch (error) {
    console.error(`Error getting total transfer for interface ${interfaceName}:`, error);
    throw error;
  }
}
