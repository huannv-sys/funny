import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Router, Server, Activity, Cpu, HardDrive, Wifi, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { DeviceContext } from "@/hooks/useMikrotikData";
import { useContext } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Định nghĩa kiểu dữ liệu cho dashboard
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

export default function HomePage() {
  const { devices, refreshDevices, loading } = useContext(DeviceContext);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    ipAddress: "",
    username: "admin",
    password: "",
    port: "8728",
    type: "routeros"
  });

  // Fetch dashboard summaries
  const dashboardsQuery = useQuery({
    queryKey: ['/api/dashboards'],
    queryFn: getQueryFn<DashboardSummary[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: [],
  });

  // Xử lý thêm thiết bị mới
  const handleAddDevice = async () => {
    try {
      const response = await apiRequest(
        'POST',  // Method
        '/api/devices',  // URL
        formValues  // Data
      );
      
      const newDevice = await response.json();
      
      // Reset form và đóng dialog
      setFormValues({
        name: "",
        ipAddress: "",
        username: "admin",
        password: "",
        port: "8728",
        type: "routeros"
      });
      setAddDeviceOpen(false);
      
      // Refresh lại danh sách thiết bị
      await refreshDevices();
      queryClient.invalidateQueries({ queryKey: ['/api/dashboards'] });
      
    } catch (error) {
      console.error("Lỗi khi thêm thiết bị:", error);
    }
  };

  // Cập nhật giá trị form
  const handleFormChange = (field: string, value: string) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };

  // Tạo Dashboard Card
  const DashboardCard = ({ dashboard }: { dashboard: DashboardSummary }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{dashboard.deviceName}</CardTitle>
          <Badge className={dashboard.alertsCount > 0 ? "bg-red-500" : "bg-green-500"}>
            {dashboard.alertsCount > 0 ? `${dashboard.alertsCount} cảnh báo` : "Hoạt động tốt"}
          </Badge>
        </div>
        <CardDescription>ID: {dashboard.deviceId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center"><Cpu className="h-4 w-4 mr-1" /> CPU</span>
            <span>{dashboard.cpuUsage}%</span>
          </div>
          <Progress value={dashboard.cpuUsage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center"><Server className="h-4 w-4 mr-1" /> Bộ nhớ</span>
            <span>{dashboard.memoryUsage}%</span>
          </div>
          <Progress value={dashboard.memoryUsage} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center"><HardDrive className="h-4 w-4 mr-1" /> Ổ đĩa</span>
            <span>{dashboard.diskUsage}%</span>
          </div>
          <Progress value={dashboard.diskUsage} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500 dark:text-gray-400">Uptime</span>
            <span className="font-medium">{dashboard.uptime}</span>
          </div>
          
          <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500 dark:text-gray-400">Kết nối</span>
            <span className="font-medium">{dashboard.activeConnections}</span>
          </div>
          
          <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500 dark:text-gray-400">Giao diện</span>
            <span className="font-medium">
              <span className="text-green-500">{dashboard.interfacesUp} ↑</span> / 
              <span className="text-red-500">{dashboard.interfacesDown} ↓</span>
            </span>
          </div>
          
          <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="text-gray-500 dark:text-gray-400">Cảnh báo</span>
            <span className={`font-medium ${dashboard.alertsCount > 0 ? "text-red-500" : "text-green-500"}`}>
              {dashboard.alertsCount > 0 ? dashboard.alertsCount : "Không có"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" asChild>
          <Link to={`/dashboard/${dashboard.deviceId}`}>Chi tiết</Link>
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/logs/${dashboard.deviceId}`}>Xem logs</Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/alerts/${dashboard.deviceId}`}>Cảnh báo</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  // Render trang chính
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bảng điều khiển MikroTik</h1>
          
          <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
            <DialogTrigger asChild>
              <Button className="flex gap-2">
                <PlusCircle className="h-5 w-5" />
                Thêm thiết bị
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Thêm thiết bị MikroTik mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin thiết bị để kết nối và giám sát.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Tên
                  </Label>
                  <Input
                    id="name"
                    value={formValues.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="col-span-3"
                    placeholder="VD: MikroTik Office"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ipAddress" className="text-right">
                    Địa chỉ IP
                  </Label>
                  <Input
                    id="ipAddress"
                    value={formValues.ipAddress}
                    onChange={(e) => handleFormChange("ipAddress", e.target.value)}
                    className="col-span-3"
                    placeholder="VD: 192.168.1.1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Tài khoản
                  </Label>
                  <Input
                    id="username"
                    value={formValues.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    className="col-span-3"
                    placeholder="VD: admin"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Mật khẩu
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formValues.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="port" className="text-right">
                    Cổng API
                  </Label>
                  <Input
                    id="port"
                    value={formValues.port}
                    onChange={(e) => handleFormChange("port", e.target.value)}
                    className="col-span-3"
                    placeholder="VD: 8728"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Loại thiết bị
                  </Label>
                  <Select 
                    value={formValues.type}
                    onValueChange={(value) => handleFormChange("type", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Chọn loại thiết bị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routeros">RouterOS</SelectItem>
                      <SelectItem value="swos">SwitchOS</SelectItem>
                      <SelectItem value="chr">Cloud Hosted Router</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice}>Thêm thiết bị</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="devices">Danh sách thiết bị</TabsTrigger>
            <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
          </TabsList>
          
          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard">
            {dashboardsQuery.isLoading || loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-8 w-8" />
                <p className="ml-2">Đang tải dữ liệu...</p>
              </div>
            ) : dashboardsQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Không thể tải dữ liệu dashboard</AlertTitle>
                <AlertDescription>
                  {(dashboardsQuery.error as Error).message}
                </AlertDescription>
              </Alert>
            ) : dashboardsQuery.data && dashboardsQuery.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardsQuery.data.map((dashboard) => (
                  <DashboardCard key={dashboard.deviceId} dashboard={dashboard} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Server className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                <h3 className="text-xl font-medium mb-2">Không có thiết bị</h3>
                <p className="text-gray-500 mb-6">
                  Hãy thêm thiết bị MikroTik đầu tiên của bạn để bắt đầu giám sát.
                </p>
                <Button onClick={() => setAddDeviceOpen(true)}>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Thêm thiết bị
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* DEVICES TAB */}
          <TabsContent value="devices">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="h-8 w-8" />
                <p className="ml-2">Đang tải danh sách thiết bị...</p>
              </div>
            ) : devices && devices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <Card key={device.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{device.name}</CardTitle>
                        <Badge className={device.lastConnected ? "bg-green-500" : "bg-red-500"}>
                          {device.lastConnected ? "Kết nối" : "Mất kết nối"}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Router className="h-4 w-4 mr-1" />
                          {device.ipAddress}:{device.port}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Loại thiết bị</span>
                          <span className="font-medium capitalize">{device.model || "RouterOS"}</span>
                        </div>
                        <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Phiên bản</span>
                          <span className="font-medium">{device.version || "-"}</span>
                        </div>
                        <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                          <span className="font-medium">
                            {device.lastConnected ? (
                              <span className="text-green-500">Đang hoạt động</span>
                            ) : (
                              <span className="text-red-500">Không hoạt động</span>
                            )}
                          </span>
                        </div>
                        <div className="text-sm flex flex-col p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Lần kết nối cuối</span>
                          <span className="font-medium">{device.lastConnected ? new Date(device.lastConnected).toLocaleString() : "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/${device.id}`}>Chi tiết</Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Chỉnh sửa
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500">
                          Xóa
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Router className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                <h3 className="text-xl font-medium mb-2">Không có thiết bị</h3>
                <p className="text-gray-500 mb-6">
                  Hãy thêm thiết bị MikroTik đầu tiên của bạn để bắt đầu giám sát.
                </p>
                <Button onClick={() => setAddDeviceOpen(true)}>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Thêm thiết bị
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* ALERTS TAB */}
          <TabsContent value="alerts">
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-medium mb-2">Đang xây dựng</h3>
              <p className="text-gray-500 mb-6">
                Chức năng này đang được phát triển và sẽ sớm được ra mắt.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}