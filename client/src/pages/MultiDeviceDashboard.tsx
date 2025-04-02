import { useContext, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { DeviceContext, SystemContext, TrafficContext, AlertsContext } from '@/hooks/useMikrotikData';
import { Link } from 'wouter';
import AppLayout from '@/layouts/AppLayout';
import { CheckCircle, XCircle, AlertCircle, ChevronRight, RefreshCcw } from 'lucide-react';

interface DashboardSummary {
  deviceId: number;
  deviceName: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  interfacesUp: number;
  interfacesDown: number;
  activeConnections: number;
  alertsCount: number;
}

export default function MultiDeviceDashboard() {
  const { devices, selectedDevices, toggleDeviceSelection } = useContext(DeviceContext);
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  
  const { alerts } = useContext(AlertsContext);
  const { systemInfo } = useContext(SystemContext);
  const { interfaces } = useContext(TrafficContext);
  
  // Hàm để tải dữ liệu cho từng thiết bị
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDeviceData = async (deviceId: number) => {
    try {
      const systemResponse = await fetch(`/api/devices/${deviceId}/system`);
      const systemData = await systemResponse.json();
      
      const interfacesResponse = await fetch(`/api/devices/${deviceId}/interfaces`);
      const interfacesData = await interfacesResponse.json();
      
      const alertsResponse = await fetch(`/api/devices/${deviceId}/alerts`);
      const alertsData = await alertsResponse.json();
      
      const device = devices.find(d => d.id === deviceId);
      if (!device) return null;
      
      const interfacesUp = interfacesData.filter((iface: any) => iface.running).length;
      const interfacesDown = interfacesData.length - interfacesUp;
      const unreadAlerts = alertsData.filter((alert: any) => !alert.read).length;
      
      return {
        deviceId,
        deviceName: device.name,
        cpuUsage: systemData.cpuLoad || 0,
        memoryUsage: systemData.memoryUsed ? (systemData.memoryUsed / systemData.totalMemory) * 100 : 0,
        diskUsage: systemData.diskUsage || 0,
        uptime: systemData.uptime || "N/A",
        interfacesUp,
        interfacesDown,
        activeConnections: systemData.connections || 0,
        alertsCount: unreadAlerts
      };
    } catch (error) {
      console.error(`Error fetching data for device ${deviceId}:`, error);
      
      // Trả về dữ liệu mặc định nếu không thể lấy được từ API
      const device = devices.find(d => d.id === deviceId);
      if (!device) return null;
      
      return {
        deviceId,
        deviceName: device.name,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: "N/A",
        interfacesUp: 0,
        interfacesDown: 0,
        activeConnections: 0,
        alertsCount: 0
      };
    }
  };
  
  const loadDeviceData = async () => {
    if (devices.length > 0) {
      const summariesPromises = devices.map(device => fetchDeviceData(device.id));
      const summariesResults = await Promise.all(summariesPromises);
      const validSummaries = summariesResults.filter(Boolean) as DashboardSummary[];
      setDashboards(validSummaries);
    }
  };
  
  useEffect(() => {
    loadDeviceData();
    
    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(loadDeviceData, 30000);
    return () => clearInterval(interval);
  }, [devices, fetchDeviceData]);
  
  // Hiển thị mini-dashboard cho từng thiết bị
  const MiniDashboardCard = ({ dashboard }: { dashboard: DashboardSummary }) => (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {dashboard.deviceName}
        </CardTitle>
        <Checkbox 
          checked={selectedDevices.some(d => d.id === dashboard.deviceId)} 
          onCheckedChange={() => {
            const device = devices.find(d => d.id === dashboard.deviceId);
            if (device) toggleDeviceSelection(device);
          }}
        />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">CPU</span>
            <span className="text-xs font-medium">{dashboard.cpuUsage}%</span>
          </div>
          <Progress value={dashboard.cpuUsage} className="h-1" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">RAM</span>
            <span className="text-xs font-medium">{dashboard.memoryUsage}%</span>
          </div>
          <Progress value={dashboard.memoryUsage} className="h-1" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Disk</span>
            <span className="text-xs font-medium">{dashboard.diskUsage}%</span>
          </div>
          <Progress value={dashboard.diskUsage} className="h-1" />
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="text-xs font-medium">{dashboard.uptime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Kết nối</span>
              <span className="text-xs font-medium">{dashboard.activeConnections}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs">{dashboard.interfacesUp}</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs">{dashboard.interfacesDown}</span>
            </div>
            {dashboard.alertsCount > 0 && (
              <div className="flex items-center">
                <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
                <span className="text-xs">{dashboard.alertsCount}</span>
              </div>
            )}
          </div>
          
          <div className="mt-1">
            <Link to={`/dashboard/${dashboard.deviceId}`}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Chi tiết <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Giám sát đa thiết bị</h1>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500">
                {selectedDevices.length} thiết bị được theo dõi
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadDeviceData}
              >
                <RefreshCcw className="h-4 w-4 mr-1" /> Làm mới
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dashboards.map((dashboard) => (
              <MiniDashboardCard key={dashboard.deviceId} dashboard={dashboard} />
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div>
              <Button variant="default" size="sm" className="mr-2">
                So sánh thiết bị đã chọn
              </Button>
              <Button variant="outline" size="sm">
                In báo cáo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}