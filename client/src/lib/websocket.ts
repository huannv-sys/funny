import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Define the basic WebSocket state
export type WebSocketState = {
  socket: WebSocket | null;
  connected: boolean;
  error: Error | null;
};

// Create the WebSocket instance
export function createWebSocket() {
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Creating WebSocket connection to:", wsUrl);
    return new WebSocket(wsUrl);
  } catch (error) {
    console.error("Error creating WebSocket:", error);
    throw error;
  }
}

// Hook for using WebSocket connections
export function useWebSocket<T>(
  isEnabled = true,
  onMessage?: (data: T) => void
): [WebSocketState, (data: any) => void] {
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    connected: false,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isEnabled) {
      if (state.socket) {
        state.socket.close();
        setState({
          socket: null,
          connected: false,
          error: null,
        });
      }
      return;
    }

    // Create WebSocket connection
    const socket = createWebSocket();

    // Set up event handlers
    socket.onopen = () => {
      setState({
        socket,
        connected: true,
        error: null,
      });
    };

    socket.onclose = () => {
      setState((prevState) => ({
        ...prevState,
        connected: false,
      }));
    };

    socket.onerror = (error) => {
      const errorObj = new Error("WebSocket connection error");
      setState((prevState) => ({
        ...prevState,
        error: errorObj,
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
        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Cleanup on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [isEnabled, onMessage, toast]);

  // Function to send data to the server
  const sendMessage = (data: any) => {
    if (state.socket && state.connected) {
      state.socket.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message: WebSocket is not connected");
    }
  };

  return [state, sendMessage];
}

// Handle reconnection logic
export function useWebSocketWithReconnect<T>(
  isEnabled = true,
  onMessage?: (data: T) => void,
  reconnectInterval = 5000
): [WebSocketState, (data: any) => void] {
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    connected: false,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isEnabled) {
      if (state.socket) {
        state.socket.close();
        setState({
          socket: null,
          connected: false,
          error: null,
        });
      }
      return;
    }

    let reconnectTimer: NodeJS.Timeout;
    let socket: WebSocket;

    const connect = () => {
      // Create WebSocket connection
      socket = createWebSocket();

      // Set up event handlers
      socket.onopen = () => {
        setState({
          socket,
          connected: true,
          error: null,
        });
      };

      socket.onclose = () => {
        setState((prevState) => ({
          ...prevState,
          connected: false,
        }));
        
        // Schedule reconnection
        reconnectTimer = setTimeout(() => {
          connect();
        }, reconnectInterval);
      };

      socket.onerror = (error) => {
        const errorObj = new Error("WebSocket connection error");
        setState((prevState) => ({
          ...prevState,
          error: errorObj,
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
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearTimeout(reconnectTimer);
    };
  }, [isEnabled, onMessage, reconnectInterval, toast]);

  // Function to send data to the server
  const sendMessage = (data: any) => {
    if (state.socket && state.connected) {
      state.socket.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message: WebSocket is not connected");
    }
  };

  return [state, sendMessage];
}
