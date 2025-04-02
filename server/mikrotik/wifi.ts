import { RouterOSAPI } from 'routeros-api';
import { executeCommand, parseUptime } from './connection';
import { WiFiClient } from '@/types/mikrotik';

// Get all connected WiFi clients
export async function getWiFiClients(conn: RouterOSAPI): Promise<WiFiClient[]> {
  try {
    // Get registration table (connected clients)
    const registrationTable = await executeCommand(conn, '/interface/wireless/registration-table/print');
    
    // Process each client
    return registrationTable.map((client: any) => {
      // Try to determine device type from mac address vendor
      const deviceType = determineDeviceType(client['mac-address'], client['comment']);
      
      return {
        id: client['.id'] || `client-${client['mac-address']}`,
        interface: client.interface || '',
        macAddress: client['mac-address'] || '',
        ipAddress: client['last-ip'] || undefined,
        name: client.comment || deviceType || undefined,
        signalStrength: parseInt(client['signal-strength'] || '-100'),
        snr: calculateSNR(client['signal-strength'], client['signal-to-noise']),
        txRate: formatBitRate(client['tx-rate'] || '0'),
        rxRate: formatBitRate(client['rx-rate'] || '0'),
        band: determineBand(client.interface, client['tx-rate']),
        uptime: parseUptime(client.uptime || '0'),
        deviceType: deviceType
      };
    });
  } catch (error) {
    console.error('Error getting WiFi clients:', error);
    throw error;
  }
}

// Get detailed information about a specific WiFi client
export async function getWiFiClientDetails(conn: RouterOSAPI, clientId: string): Promise<any> {
  try {
    const details = await executeCommand(conn, '/interface/wireless/registration-table/print', [
      `?.id=${clientId}`
    ]);
    
    if (!details || details.length === 0) {
      throw new Error(`No client found with ID ${clientId}`);
    }
    
    return details[0];
  } catch (error) {
    console.error(`Error getting details for WiFi client ${clientId}:`, error);
    throw error;
  }
}

// Get all WiFi interfaces
export async function getWiFiInterfaces(conn: RouterOSAPI): Promise<any[]> {
  try {
    const interfaces = await executeCommand(conn, '/interface/wireless/print');
    return interfaces;
  } catch (error) {
    console.error('Error getting WiFi interfaces:', error);
    throw error;
  }
}

// Format bit rate (comes in bps)
function formatBitRate(bpsString: string): string {
  const bps = parseInt(bpsString);
  if (isNaN(bps)) return '0 Mbps';
  
  if (bps >= 1000000000) {
    return `${(bps / 1000000000).toFixed(1)} Gbps`;
  } else if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(0)} Mbps`;
  } else if (bps >= 1000) {
    return `${(bps / 1000).toFixed(1)} Kbps`;
  } else {
    return `${bps} bps`;
  }
}

// Calculate Signal-to-Noise Ratio if not provided directly
function calculateSNR(signalStrength: string, signalToNoise?: string): number {
  if (signalToNoise) {
    return parseInt(signalToNoise);
  }
  
  // If SNR is not provided, estimate it based on signal strength
  // This is a rough estimation - actual calculation would depend on noise floor
  const signal = parseInt(signalStrength || '-100');
  const noiseFloor = -95; // Typical noise floor in dBm
  return Math.max(0, signal - noiseFloor);
}

// Determine if client is connected to 2.4GHz or 5GHz band
function determineBand(interfaceName: string, txRate: string): string {
  // Try to determine from interface name first
  if (interfaceName.includes('5GHz') || interfaceName.includes('5G') || interfaceName.includes('5')) {
    return '5GHz';
  } else if (interfaceName.includes('2.4GHz') || interfaceName.includes('2.4G') || interfaceName.includes('2G')) {
    return '2.4GHz';
  }
  
  // If not determinable from interface name, check tx rate
  // 5GHz connections generally have higher tx rates
  const rate = parseInt(txRate || '0');
  if (rate > 150000000) { // 150 Mbps is a reasonable threshold
    return '5GHz';
  } else {
    return '2.4GHz';
  }
}

// Try to determine device type from MAC address or comment
function determineDeviceType(macAddress: string, comment?: string): string | undefined {
  if (!macAddress) return undefined;
  
  // Check comment first as it might contain user-defined device info
  if (comment) {
    const lowerComment = comment.toLowerCase();
    if (lowerComment.includes('phone') || lowerComment.includes('iphone') || lowerComment.includes('android')) {
      return 'phone';
    } else if (lowerComment.includes('laptop') || lowerComment.includes('macbook')) {
      return 'laptop';
    } else if (lowerComment.includes('tablet') || lowerComment.includes('ipad')) {
      return 'tablet';
    } else if (lowerComment.includes('tv') || lowerComment.includes('television')) {
      return 'tv';
    }
  }
  
  // If no device type from comment, check first 6 characters of MAC (OUI)
  // This is a simplified approach - in a production environment you would use
  // a complete MAC address vendor database
  const oui = macAddress.substring(0, 8).toUpperCase();
  
  // Just a few examples
  const vendorMap: Record<string, string> = {
    '00:0C:E7': 'tablet', // iPad
    'AC:CF:85': 'phone',  // iPhone
    '34:02:86': 'phone',  // Samsung phone
    'F4:8C:50': 'laptop', // MacBook
    '00:25:90': 'tv',     // Samsung TV
    '94:E6:F7': 'tv',     // TV
    '78:E8:81': 'phone',  // Smartphone
  };
  
  return vendorMap[oui] || undefined;
}

// Map signal strength to quality percentage
export function signalToQualityPercentage(signalStrength: number): number {
  // Signal strength is in dBm, typically between -30 (excellent) and -90 (poor)
  if (signalStrength >= -50) return 100;
  if (signalStrength <= -90) return 0;
  
  // Linear mapping from [-90, -50] to [0, 100]
  return Math.round(((signalStrength + 90) / 40) * 100);
}
