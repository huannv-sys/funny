import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  MikrotikDevice, 
  SystemInfo, 
  InterfaceInfo, 
  InterfaceTraffic, 
  TrafficSummary, 
  WiFiClient,
  StorageDevice,
  FileInfo,
  Alert
} from '@/types/mikrotik';
import { useWebSocketWithReconnect } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import useLiveUpdates from './useLiveUpdates';
import { useSharedWebSocket } from './useSharedWebSocket';

// Define context types
type DeviceContextType = {
  devices: MikrotikDevice[];
  selectedDevice: MikrotikDevice | null;
  selectDevice: (device: MikrotikDevice) => void;
  refreshDevices: () => Promise<void>;
  loading: boolean;
};

type MikrotikDataContextType = {
  isConnected: boolean;
  lastUpdated: Date | null;
  refreshAllData: () => void;
};

type TrafficContextType = {
  interfaces: InterfaceInfo[];
  interfaceTraffic: Record<string, InterfaceTraffic>;
  trafficSummary: TrafficSummary | null;
  getInterfaceTraffic: (interfaceName: string) => void;
  getInterfaces: () => Promise<void>;
};

type WiFiContextType = {
  wifiClients: WiFiClient[];
  interfaces: InterfaceInfo[];
  getWifiClients: () => Promise<void>;
};

type SystemContextType = {
  systemInfo: SystemInfo | null;
  storageInfo: StorageDevice[];
  fileList: FileInfo[];
  getSystemInfo: () => Promise<void>;
  getStorageInfo: () => Promise<void>;
};

type AlertsContextType = {
  alerts: Alert[];
  markAlertAsRead: (id: number) => Promise<void>;
  markAllAlertsAsRead: () => Promise<void>;
  getAlerts: () => Promise<void>;
};

// Create contexts
export const MikrotikDataContext = createContext<MikrotikDataContextType>({
  isConnected: false,
  lastUpdated: null,
  refreshAllData: () => {},
});

export const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  selectedDevice: null,
  selectDevice: () => {},
  refreshDevices: async () => {},
  loading: false,
});

export const TrafficContext = createContext<TrafficContextType>({
  interfaces: [],
  interfaceTraffic: {},
  trafficSummary: null,
  getInterfaceTraffic: () => {},
  getInterfaces: async () => {},
});

export const WiFiContext = createContext<WiFiContextType>({
  wifiClients: [],
  interfaces: [],
  getWifiClients: async () => {},
});

export const SystemContext = createContext<SystemContextType>({
  systemInfo: null,
  storageInfo: [],
  fileList: [],
  getSystemInfo: async () => {},
  getStorageInfo: async () => {},
});

export const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  markAlertAsRead: async () => {},
  markAllAlertsAsRead: async () => {},
  getAlerts: async () => {},
});

// Provider components
export function MikrotikDataProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const refreshAllData = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiRequest('GET', '/api/status', undefined);
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the API server",
          variant: "destructive",
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <MikrotikDataContext.Provider 
      value={{
        isConnected,
        lastUpdated,
        refreshAllData
      }}
    >
      {children}
    </MikrotikDataContext.Provider>
  );
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<MikrotikDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MikrotikDevice | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/devices', undefined);
      const data = await response.json();
      setDevices(data);
      
      if (!selectedDevice && data.length > 0) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, toast]);

  const selectDevice = useCallback((device: MikrotikDevice) => {
    setSelectedDevice(device);
    localStorage.setItem('selectedDeviceId', device.id.toString());
  }, []);

  useEffect(() => {
    refreshDevices();
    
    const savedDeviceId = localStorage.getItem('selectedDeviceId');
    if (savedDeviceId && devices.length > 0) {
      const device = devices.find(d => d.id.toString() === savedDeviceId);
      if (device) {
        setSelectedDevice(device);
      }
    }
  }, [refreshDevices]);

  return (
    <DeviceContext.Provider 
      value={{
        devices,
        selectedDevice,
        selectDevice,
        refreshDevices,
        loading
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function TrafficProvider({ children }: { children: ReactNode }) {
  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const [interfaceTraffic, setInterfaceTraffic] = useState<Record<string, InterfaceTraffic>>({});
  const [trafficSummary, setTrafficSummary] = useState<TrafficSummary | null>(null);
  const { isLiveEnabled } = useLiveUpdates();
  const { selectedDevice } = useContext(DeviceContext);
  const { toast } = useToast();
  const { wsState } = useSharedWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsState.socket || !isLiveEnabled || !selectedDevice) return;
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'interfaceTraffic') {
          setInterfaceTraffic(data.data);
        } else if (data.type === 'trafficSummary') {
          setTrafficSummary(data.data);
        }
      } catch (error) {
        console.error("Error handling traffic WebSocket message:", error);
      }
    };
    
    wsState.socket.addEventListener('message', messageHandler);
    
    return () => {
      if (wsState.socket) {
        wsState.socket.removeEventListener('message', messageHandler);
      }
    };
  }, [wsState.socket, isLiveEnabled, selectedDevice]);

  const getInterfaces = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await apiRequest('GET', `/api/devices/${selectedDevice.id}/interfaces`, undefined);
      const data = await response.json();
      setInterfaces(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch interfaces",
        variant: "destructive",
      });
    }
  }, [selectedDevice, toast]);

  const getInterfaceTraffic = useCallback(async (interfaceName: string) => {
    if (!selectedDevice) return;
    
    try {
      const response = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/traffic/${interfaceName}`, 
        undefined
      );
      const data = await response.json();
      setInterfaceTraffic(prev => ({
        ...prev,
        [interfaceName]: data
      }));
    } catch (error) {
      console.error("Failed to fetch interface traffic:", error);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      getInterfaces();
    }
  }, [selectedDevice, getInterfaces]);

  useEffect(() => {
    if (!selectedDevice || !isLiveEnabled) return;

    const loadTrafficData = async () => {
      try {
        const response = await apiRequest(
          'GET', 
          `/api/devices/${selectedDevice.id}/traffic`, 
          undefined
        );
        const data = await response.json();
        setInterfaceTraffic(data.interfaces || {});
        setTrafficSummary(data.summary || null);
      } catch (error) {
        console.error("Failed to fetch traffic data:", error);
      }
    };

    loadTrafficData();

    if (!wsState.connected) {
      const interval = setInterval(loadTrafficData, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedDevice, isLiveEnabled, wsState.connected]);

  return (
    <TrafficContext.Provider
      value={{
        interfaces,
        interfaceTraffic,
        trafficSummary,
        getInterfaceTraffic,
        getInterfaces
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
}

export function WiFiProvider({ children }: { children: ReactNode }) {
  const [wifiClients, setWifiClients] = useState<WiFiClient[]>([]);
  const [interfaces, setInterfaces] = useState<InterfaceInfo[]>([]);
  const { isLiveEnabled } = useLiveUpdates();
  const { selectedDevice } = useContext(DeviceContext);
  const { toast } = useToast();
  const { wsState } = useSharedWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsState.socket || !isLiveEnabled || !selectedDevice) return;
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'wifiClients') {
          setWifiClients(data.data);
        }
      } catch (error) {
        console.error("Error handling WiFi WebSocket message:", error);
      }
    };
    
    wsState.socket.addEventListener('message', messageHandler);
    
    return () => {
      if (wsState.socket) {
        wsState.socket.removeEventListener('message', messageHandler);
      }
    };
  }, [wsState.socket, isLiveEnabled, selectedDevice]);

  const getWifiClients = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const interfacesResponse = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/interfaces?type=wifi`, 
        undefined
      );
      const interfacesData = await interfacesResponse.json();
      setInterfaces(interfacesData);
      
      const response = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/wifi/clients`, 
        undefined
      );
      const data = await response.json();
      setWifiClients(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch WiFi clients",
        variant: "destructive",
      });
    }
  }, [selectedDevice, toast]);

  useEffect(() => {
    if (!selectedDevice) return;

    getWifiClients();

    if (isLiveEnabled && !wsState.connected) {
      const interval = setInterval(getWifiClients, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDevice, isLiveEnabled, wsState.connected, getWifiClients]);

  return (
    <WiFiContext.Provider
      value={{
        wifiClients,
        interfaces,
        getWifiClients
      }}
    >
      {children}
    </WiFiContext.Provider>
  );
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageDevice[]>([]);
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const { isLiveEnabled } = useLiveUpdates();
  const { selectedDevice } = useContext(DeviceContext);
  const { toast } = useToast();
  const { wsState } = useSharedWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsState.socket || !isLiveEnabled || !selectedDevice) return;
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'systemInfo') {
          setSystemInfo(data.data);
        } else if (data.type === 'storageInfo') {
          setStorageInfo(data.data);
        }
      } catch (error) {
        console.error("Error handling system WebSocket message:", error);
      }
    };
    
    wsState.socket.addEventListener('message', messageHandler);
    
    return () => {
      if (wsState.socket) {
        wsState.socket.removeEventListener('message', messageHandler);
      }
    };
  }, [wsState.socket, isLiveEnabled, selectedDevice]);

  const getSystemInfo = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/system`, 
        undefined
      );
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system information",
        variant: "destructive",
      });
    }
  }, [selectedDevice, toast]);

  const getStorageInfo = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const storageResponse = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/system/storage`, 
        undefined
      );
      const storageData = await storageResponse.json();
      setStorageInfo(storageData);
      
      const filesResponse = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/system/files`, 
        undefined
      );
      const filesData = await filesResponse.json();
      setFileList(filesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch storage information",
        variant: "destructive",
      });
    }
  }, [selectedDevice, toast]);

  useEffect(() => {
    if (!selectedDevice) return;

    getSystemInfo();
    getStorageInfo();

    if (isLiveEnabled && !wsState.connected) {
      const systemInterval = setInterval(getSystemInfo, 15000);
      const storageInterval = setInterval(getStorageInfo, 60000);
      return () => {
        clearInterval(systemInterval);
        clearInterval(storageInterval);
      };
    }
  }, [selectedDevice, isLiveEnabled, wsState.connected, getSystemInfo, getStorageInfo]);

  return (
    <SystemContext.Provider
      value={{
        systemInfo,
        storageInfo,
        fileList,
        getSystemInfo,
        getStorageInfo
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { isLiveEnabled } = useLiveUpdates();
  const { selectedDevice } = useContext(DeviceContext);
  const { toast } = useToast();
  const { wsState } = useSharedWebSocket();

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsState.socket || !isLiveEnabled || !selectedDevice) return;
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'newAlert') {
          setAlerts(prev => [data.data, ...prev]);
          
          toast({
            title: `New ${data.data.severity} Alert`,
            description: data.data.message,
            variant: data.data.severity === 'critical' ? 'destructive' : 'default',
          });
        }
      } catch (error) {
        console.error("Error handling alerts WebSocket message:", error);
      }
    };
    
    wsState.socket.addEventListener('message', messageHandler);
    
    return () => {
      if (wsState.socket) {
        wsState.socket.removeEventListener('message', messageHandler);
      }
    };
  }, [wsState.socket, isLiveEnabled, selectedDevice, toast]);

  const getAlerts = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      const response = await apiRequest(
        'GET', 
        `/api/devices/${selectedDevice.id}/alerts`, 
        undefined
      );
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive",
      });
    }
  }, [selectedDevice, toast]);

  const markAlertAsRead = useCallback(async (id: number) => {
    try {
      await apiRequest(
        'PATCH', 
        `/api/alerts/${id}`, 
        { read: true }
      );
      
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, read: true } : alert
      ));
    } catch (error) {
      throw error;
    }
  }, []);

  const markAllAlertsAsRead = useCallback(async () => {
    if (!selectedDevice) return;
    
    try {
      await apiRequest(
        'POST', 
        `/api/devices/${selectedDevice.id}/alerts/mark-all-read`, 
        {}
      );
      
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
    } catch (error) {
      throw error;
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedDevice) {
      getAlerts();
    }
  }, [selectedDevice, getAlerts]);

  useEffect(() => {
    if (!selectedDevice || !isLiveEnabled || wsState.connected) return;
    
    const interval = setInterval(getAlerts, 30000);
    return () => clearInterval(interval);
  }, [selectedDevice, isLiveEnabled, wsState.connected, getAlerts]);

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        markAlertAsRead,
        markAllAlertsAsRead,
        getAlerts
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}