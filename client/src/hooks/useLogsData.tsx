import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { LogEntry } from '@/types/mikrotik';
import { apiRequest } from '@/lib/queryClient';
import { DeviceContext } from './useMikrotikData';
import { useSharedWebSocket } from './useSharedWebSocket';

type LogsContextType = {
  logs: LogEntry[];
  loading: boolean;
  error: Error | null;
  getLogs: (topics?: string, limit?: number) => Promise<void>;
  filterLogs: (topics?: string, limit?: number) => Promise<void>;
};

const LogsContext = createContext<LogsContextType>({
  logs: [],
  loading: false,
  error: null,
  getLogs: async () => {},
  filterLogs: async () => {},
});

export function LogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { selectedDevice } = useContext(DeviceContext);
  const { wsState, sendMessage } = useSharedWebSocket();

  const getLogs = useCallback(async (topics?: string, limit: number = 100) => {
    if (!selectedDevice) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/devices/${selectedDevice.id}/logs`;
      const params = new URLSearchParams();
      
      if (topics) {
        params.append('topics', topics);
      }
      
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest(
        'GET',
        url,
        undefined
      );
      
      const data = await response.json();
      if (data) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch logs'));
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  const filterLogs = useCallback(async (topics?: string, limit: number = 100) => {
    return getLogs(topics, limit);
  }, [getLogs]);

  // Listen for WebSocket logs updates
  useEffect(() => {
    if (wsState.connected && selectedDevice) {
      // Use the WebSocket connection directly
      const wsSocket = wsState.socket;
      
      if (wsSocket) {
        const messageHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'logs' && data.deviceId === selectedDevice.id) {
              console.log('Received logs update via WebSocket', data);
              setLogs(data.data);
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        // Add event listener to WebSocket
        wsSocket.addEventListener('message', messageHandler);

        // Request logs data
        sendMessage({
          type: 'subscribe',
          target: 'logs',
          deviceId: selectedDevice.id
        });

        // Cleanup
        return () => {
          if (wsSocket) {
            wsSocket.removeEventListener('message', messageHandler);
          }
          
          // Unsubscribe from logs updates
          sendMessage({
            type: 'unsubscribe',
            target: 'logs',
            deviceId: selectedDevice.id
          });
        };
      }
    }
  }, [wsState.connected, selectedDevice, sendMessage]);

  // Load logs initially when device is selected
  useEffect(() => {
    if (selectedDevice) {
      getLogs();
    }
  }, [selectedDevice, getLogs]);

  return (
    <LogsContext.Provider value={{ logs, loading, error, getLogs, filterLogs }}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogsContext() {
  return useContext(LogsContext);
}