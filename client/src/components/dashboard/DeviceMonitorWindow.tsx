import { useState, useEffect, useRef, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MikrotikDevice, SystemInfo, InterfaceInfo, WiFiClient } from "@/types/mikrotik";
import { X, Minus, Copy, Maximize2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MikrotikDataContext, SystemContext, TrafficContext, WiFiContext } from "@/hooks/useMikrotikData";
import GaugeChart from "./GaugeChart";
import NetworkTrafficChart from "./NetworkTrafficChart";
import { Spinner } from "../ui/spinner";

interface DeviceMonitorWindowProps {
  device: MikrotikDevice;
  onClose: () => void;
  minimized?: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onMinimizeToggle?: () => void;
}

export default function DeviceMonitorWindow({
  device,
  onClose,
  minimized = false,
  position = { x: 20, y: 20 },
  size = { width: 400, height: 600 },
  onPositionChange,
  onSizeChange,
  onMinimizeToggle
}: DeviceMonitorWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentSize, setCurrentSize] = useState(size);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("overview");

  const { isConnected, refreshAllData } = useContext(MikrotikDataContext);
  const { systemInfo, getSystemInfo } = useContext(SystemContext);
  const { interfaces, interfaceTraffic, getInterfaces, getInterfaceTraffic } = useContext(TrafficContext);
  const { wifiClients, getWifiClients } = useContext(WiFiContext);

  // Handle dragging
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (headerRef.current && headerRef.current.contains(e.target as Node)) {
        setIsDragging(true);
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const newPosition = { x: newX, y: newY };
        
        setCurrentPosition(newPosition);
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
      } else if (isResizing) {
        const newWidth = Math.max(300, e.clientX - currentPosition.x);
        const newHeight = Math.max(200, e.clientY - currentPosition.y);
        const newSize = { width: newWidth, height: newHeight };
        
        setCurrentSize(newSize);
        if (onSizeChange) {
          onSizeChange(newSize);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    // Handle resize start
    const handleResizeMouseDown = (e: MouseEvent) => {
      if (resizeHandleRef.current && resizeHandleRef.current.contains(e.target as Node)) {
        setIsResizing(true);
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousedown', handleResizeMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousedown', handleResizeMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, currentPosition, onPositionChange, onSizeChange]);

  // Fetch device data
  useEffect(() => {
    if (device && isConnected) {
      getSystemInfo();
      getInterfaces();
      getWifiClients();

      // Fetch interface traffic for first interface
      if (interfaces.length > 0) {
        getInterfaceTraffic(interfaces[0].name);
      }
    }
  }, [device, isConnected, getSystemInfo, getInterfaces, getWifiClients, getInterfaceTraffic, interfaces]);

  if (minimized) {
    return (
      <div
        ref={windowRef}
        className="fixed z-10 shadow-lg bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{
          left: `${currentPosition.x}px`,
          top: `${currentPosition.y}px`,
          width: '250px',
        }}
      >
        <div 
          ref={headerRef}
          className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900 cursor-move"
        >
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2">{device.id}</Badge>
            <span className="font-medium truncate">{device.name}</span>
          </div>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onMinimizeToggle}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed z-10 shadow-lg bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        width: `${currentSize.width}px`,
        height: `${currentSize.height}px`,
      }}
    >
      {/* Window Header */}
      <div 
        ref={headerRef}
        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900 cursor-move"
      >
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">{device.id}</Badge>
          <span className="font-medium truncate">{device.name}</span>
          <Badge variant="secondary" className="ml-2">{device.ipAddress}</Badge>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMinimizeToggle}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-auto p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="wifi">WiFi</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="h-full">
            {systemInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* CPU Usage */}
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">CPU Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 flex justify-center">
                      <GaugeChart 
                        value={systemInfo.cpuLoad} 
                        max={100} 
                        label="%" 
                        size={120}
                        thickness={10}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Memory Usage */}
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 flex justify-center">
                      <GaugeChart 
                        value={systemInfo.memoryUsedPercent} 
                        max={100} 
                        label="%" 
                        size={120}
                        thickness={10}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                {/* System Info Details */}
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">System Details</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Uptime:</div>
                      <div>{systemInfo.uptime}</div>
                      
                      <div className="text-muted-foreground">Model:</div>
                      <div>{systemInfo.model}</div>
                      
                      <div className="text-muted-foreground">Version:</div>
                      <div>{systemInfo.version}</div>
                      
                      <div className="text-muted-foreground">Memory:</div>
                      <div>{systemInfo.memoryUsed} / {systemInfo.totalMemory} MB</div>
                      
                      <div className="text-muted-foreground">Disk Usage:</div>
                      <div>{systemInfo.diskUsage}%</div>
                      
                      <div className="text-muted-foreground">CPU Cores:</div>
                      <div>{systemInfo.cpuCores}</div>
                      
                      <div className="text-muted-foreground">Temperature:</div>
                      <div>{systemInfo.temperature}°C</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Spinner className="h-10 w-10" />
              </div>
            )}
          </TabsContent>
          
          {/* Traffic Tab */}
          <TabsContent value="traffic" className="h-full">
            {interfaces.length > 0 ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">Network Traffic</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-3">
                    <NetworkTrafficChart 
                      interfaceName={interfaces[0].name}
                      height={200}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">Interfaces</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 p-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {interfaces.map((iface) => (
                        <div 
                          key={iface.name}
                          className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900"
                        >
                          <div>
                            <div className="font-medium">{iface.name}</div>
                            <div className="text-xs text-muted-foreground">{iface.type}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={iface.running ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {iface.running ? "UP" : "DOWN"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {systemInfo && (
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Connections</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 flex justify-center">
                      <div className="text-2xl font-bold">
                        {systemInfo.connections || 0}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Spinner className="h-10 w-10" />
              </div>
            )}
          </TabsContent>
          
          {/* WiFi Tab */}
          <TabsContent value="wifi" className="h-full">
            {wifiClients.length > 0 ? (
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">WiFi Clients ({wifiClients.length})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 p-3">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {wifiClients.map((client) => (
                      <div 
                        key={client.id}
                        className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900"
                      >
                        <div>
                          <div className="font-medium">{client.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.macAddress} • {client.ipAddress || 'No IP'}
                          </div>
                          <div className="text-xs">
                            {client.band} • Signal: {client.signalStrength} dBm
                          </div>
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {client.interface}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <div className="text-muted-foreground">No WiFi clients connected</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resize handle */}
      <div 
        ref={resizeHandleRef}
        className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M11 6h4v4h-4z'/%3E%3Cpath d='M6 11h4v4H6z'/%3E%3Cpath d='M1 1h4v4H1z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right bottom'
        }}
      />
    </div>
  );
}