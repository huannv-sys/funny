import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createWebSocket, WebSocketState } from '@/lib/websocket';
import { useToast } from './use-toast';

interface SharedWebSocketContextType {
  wsState: WebSocketState;
  sendMessage: (data: any) => void;
}

const SharedWebSocketContext = createContext<SharedWebSocketContextType>({
  wsState: { socket: null, connected: false, error: null },
  sendMessage: () => {},
});

export function SharedWebSocketProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    connected: false,
    error: null,
  });
  const { toast } = useToast();
  
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    let socket: WebSocket;
    
    const connect = () => {
      try {
        socket = createWebSocket();
        
        socket.onopen = () => {
          console.log("WebSocket connected successfully");
          setState({
            socket,
            connected: true,
            error: null,
          });
        };
        
        socket.onclose = () => {
          console.log("WebSocket connection closed");
          setState(prev => ({
            ...prev,
            connected: false,
          }));
          
          // Schedule reconnection
          reconnectTimer = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connect();
          }, 5000);
        };
        
        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setState(prev => ({
            ...prev,
            error: new Error("WebSocket connection error"),
          }));
          
          toast({
            title: "Connection Error",
            description: "Lost connection to the server. Trying to reconnect...",
            variant: "destructive",
          });
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data.type);
            
            // We don't process messages here, they're handled by individual subscribers
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setTimeout(connect, 5000);
      }
    };
    
    connect();
    
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, [toast]);
  
  const sendMessage = (data: any) => {
    if (state.socket && state.connected) {
      state.socket.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message: WebSocket is not connected");
    }
  };
  
  return (
    <SharedWebSocketContext.Provider value={{ wsState: state, sendMessage }}>
      {children}
    </SharedWebSocketContext.Provider>
  );
}

export function useSharedWebSocket() {
  return useContext(SharedWebSocketContext);
}