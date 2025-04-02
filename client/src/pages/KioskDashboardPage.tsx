import { useState, useEffect, useContext, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceContext, MikrotikDataContext, TrafficContext, WiFiContext, SystemContext } from "@/hooks/useMikrotikData";
import DeviceMonitorWindow from "@/components/dashboard/DeviceMonitorWindow";
import MultiDeviceSelector from "@/components/dashboard/MultiDeviceSelector";
import AppLayout from "@/layouts/AppLayout";
import { MikrotikDevice } from "@/types/mikrotik";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, Maximize, Minimize2 } from "lucide-react";

interface MonitorWindow {
  id: string;
  deviceId: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
}

function KioskDashboardContent() {
  const { devices, selectedDevices } = useContext(DeviceContext);
  const [monitorWindows, setMonitorWindows] = useState<MonitorWindow[]>([]);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  // Generate a random position for a new window
  const getRandomPosition = useCallback(() => {
    const maxX = window.innerWidth - 400; // Window width
    const maxY = window.innerHeight - 300; // Window height
    return {
      x: Math.max(0, Math.floor(Math.random() * maxX)),
      y: Math.max(0, Math.floor(Math.random() * maxY)),
    };
  }, []);

  // Add a window for the specified device
  const addWindow = useCallback((device: MikrotikDevice) => {
    // Check if window already exists for this device
    setMonitorWindows(currentWindows => {
      const existingWindow = currentWindows.find(w => w.deviceId === device.id);
      if (existingWindow) {
        // If minimized, just un-minimize it
        if (existingWindow.minimized) {
          return currentWindows.map(w => 
            w.id === existingWindow.id ? { ...w, minimized: false } : w
          );
        }
        // Window exists and is not minimized, no change needed
        return currentWindows;
      }

      // Add new window
      const position = getRandomPosition();
      const newWindow: MonitorWindow = {
        id: `window-${device.id}-${Date.now()}`,
        deviceId: device.id,
        position,
        size: { width: 400, height: 600 },
        minimized: false,
      };
      
      return [...currentWindows, newWindow];
    });
  }, [getRandomPosition]);

  // Add windows for all selected devices
  const addAllSelectedWindows = useCallback(() => {
    console.log("Adding windows for selected devices:", selectedDevices);
    if (selectedDevices.length === 0) {
      console.log("No devices selected");
      return;
    }
    
    selectedDevices.forEach(device => {
      console.log("Adding window for device:", device.id, device.name);
      addWindow(device);
    });
  }, [selectedDevices, addWindow]);

  // Handle window position update
  const updateWindowPosition = useCallback((windowId: string, position: { x: number; y: number }) => {
    setMonitorWindows(windows => 
      windows.map(window => 
        window.id === windowId ? { ...window, position } : window
      )
    );
  }, []);

  // Handle window size update
  const updateWindowSize = useCallback((windowId: string, size: { width: number; height: number }) => {
    setMonitorWindows(windows => 
      windows.map(window => 
        window.id === windowId ? { ...window, size } : window
      )
    );
  }, []);

  // Toggle window minimized state
  const toggleMinimizeWindow = useCallback((windowId: string) => {
    setMonitorWindows(windows => 
      windows.map(window => 
        window.id === windowId ? { ...window, minimized: !window.minimized } : window
      )
    );
  }, []);

  // Close a window
  const closeWindow = useCallback((windowId: string) => {
    setMonitorWindows(windows => windows.filter(window => window.id !== windowId));
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreenMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreenMode(false);
      }
    }
  };

  // Add listener for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load windows from localStorage on mount
  useEffect(() => {
    const savedWindows = localStorage.getItem('kioskMonitorWindows');
    if (savedWindows) {
      try {
        setMonitorWindows(JSON.parse(savedWindows));
      } catch (e) {
        console.error('Failed to load saved monitor windows', e);
      }
    }
  }, []);

  // Save windows to localStorage when they change
  useEffect(() => {
    if (monitorWindows.length > 0) {
      localStorage.setItem('kioskMonitorWindows', JSON.stringify(monitorWindows));
    }
  }, [monitorWindows]);

  // Find the device object for each window
  const getDeviceForWindow = (deviceId: number) => {
    return devices.find(d => d.id === deviceId);
  };

  return (
    <div className="relative min-h-screen">
      {/* Header with controls */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kiosk Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitoring {selectedDevices.length} selected device(s) across {monitorWindows.length} window(s)
          </p>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={toggleFullscreen}
            className="flex items-center"
          >
            {fullscreenMode ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
            {fullscreenMode ? "Exit Fullscreen" : "Fullscreen"}
          </Button>
          <Button
            variant="default"
            onClick={addAllSelectedWindows}
            className="flex items-center"
          >
            Add Selected Devices
          </Button>
        </div>
      </div>

      {/* Device selector panel */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Select Devices to Monitor</h2>
        <MultiDeviceSelector />
      </div>

      {/* Information card */}
      {monitorWindows.length === 0 && (
        <Card className="max-w-lg mx-auto my-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Welcome to Kiosk Dashboard mode. This interface allows you to monitor multiple devices in separate draggable windows.
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Select one or more devices from the panel above</li>
              <li>Click the "Add Selected Devices" button to create monitoring windows</li>
              <li>Drag windows to position them as needed</li>
              <li>Toggle fullscreen mode for maximum viewing area</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Monitor windows container */}
      <div className="relative p-4 min-h-[600px]">
        {monitorWindows.map(window => {
          const device = getDeviceForWindow(window.deviceId);
          if (!device) return null;
          
          return (
            <DeviceMonitorWindow
              key={window.id}
              device={device}
              onClose={() => closeWindow(window.id)}
              position={window.position}
              size={window.size}
              minimized={window.minimized}
              onPositionChange={(pos) => updateWindowPosition(window.id, pos)}
              onSizeChange={(size) => updateWindowSize(window.id, size)}
              onMinimizeToggle={() => toggleMinimizeWindow(window.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function KioskDashboardPage() {
  return (
    <AppLayout showSidebar={false}>
      <KioskDashboardContent />
    </AppLayout>
  );
}