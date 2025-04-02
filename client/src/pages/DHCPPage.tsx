import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho DHCP Server
interface DHCPServer {
  id: string;
  interface: string;
  name: string;
  addressPool: string;
  leaseTime: string;
  dnsServer: string;
  gateway: string;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho DHCP Lease
interface DHCPLease {
  id: string;
  address: string;
  macAddress: string;
  clientId?: string;
  hostName?: string;
  status: string;
  lastSeen: string;
  expires: string;
  server: string;
}

// Định nghĩa kiểu dữ liệu cho DHCP Client
interface DHCPClient {
  id: string;
  interface: string;
  status: string;
  address: string;
  gateway: string;
  dnsServer: string;
  expires: string;
  disabled: boolean;
}

export default function DHCPPage() {
  const [deviceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("servers");

  // Fetch dữ liệu DHCP Servers
  const serversQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'dhcp', 'servers'],
    queryFn: getQueryFn<DHCPServer[]>({ on401: 'throw' }),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  // Fetch dữ liệu DHCP Leases
  const leasesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'dhcp', 'leases'],
    queryFn: getQueryFn<DHCPLease[]>({ on401: 'throw' }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Fetch dữ liệu DHCP Clients
  const clientsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'dhcp', 'clients'],
    queryFn: getQueryFn<DHCPClient[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Tạo loading fallback component
  const LoadingFallback = () => (
    <div className="flex justify-center items-center py-8">
      <Spinner className="h-8 w-8" />
      <p className="ml-2">Đang tải dữ liệu...</p>
    </div>
  );

  // Tạo error component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Lỗi</AlertTitle>
      <AlertDescription>
        Không thể tải dữ liệu: {message}
      </AlertDescription>
    </Alert>
  );

  // Tạo badge cho status
  function getStatusBadge(status: string) {
    switch (status.toLowerCase()) {
      case 'bound':
        return <Badge className="bg-green-500">Đã gán</Badge>;
      case 'offered':
        return <Badge className="bg-yellow-500">Đang đề nghị</Badge>;
      case 'waiting':
        return <Badge className="bg-blue-500">Đang chờ</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500">Hết hạn</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý DHCP</h1>
        
        <Tabs defaultValue="servers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="servers">DHCP Server</TabsTrigger>
            <TabsTrigger value="leases">DHCP Leases</TabsTrigger>
            <TabsTrigger value="clients">DHCP Client</TabsTrigger>
          </TabsList>
          
          {/* DHCP SERVERS TAB */}
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>DHCP Servers</CardTitle>
                <CardDescription>
                  Cấu hình các DHCP server trên thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                {serversQuery.isLoading ? (
                  <LoadingFallback />
                ) : serversQuery.isError ? (
                  <ErrorDisplay message={(serversQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Interface</TableHead>
                          <TableHead>Address Pool</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>DNS Server</TableHead>
                          <TableHead>Lease Time</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serversQuery.data?.map((server) => (
                          <TableRow key={server.id}>
                            <TableCell>{server.name}</TableCell>
                            <TableCell>{server.interface}</TableCell>
                            <TableCell>{server.addressPool}</TableCell>
                            <TableCell>{server.gateway}</TableCell>
                            <TableCell>{server.dnsServer}</TableCell>
                            <TableCell>{server.leaseTime}</TableCell>
                            <TableCell>
                              {server.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(serversQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có DHCP server nào được cấu hình
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* DHCP LEASES TAB */}
          <TabsContent value="leases">
            <Card>
              <CardHeader>
                <CardTitle>DHCP Leases</CardTitle>
                <CardDescription>
                  Danh sách các thiết bị được cấp IP thông qua DHCP
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leasesQuery.isLoading ? (
                  <LoadingFallback />
                ) : leasesQuery.isError ? (
                  <ErrorDisplay message={(leasesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Địa chỉ IP</TableHead>
                          <TableHead>MAC Address</TableHead>
                          <TableHead>Hostname</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thời gian kết nối cuối</TableHead>
                          <TableHead>Thời gian hết hạn</TableHead>
                          <TableHead>DHCP Server</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leasesQuery.data?.map((lease) => (
                          <TableRow key={lease.id}>
                            <TableCell>{lease.address}</TableCell>
                            <TableCell>{lease.macAddress}</TableCell>
                            <TableCell>{lease.hostName || '-'}</TableCell>
                            <TableCell>{getStatusBadge(lease.status)}</TableCell>
                            <TableCell>{lease.lastSeen}</TableCell>
                            <TableCell>{lease.expires}</TableCell>
                            <TableCell>{lease.server}</TableCell>
                          </TableRow>
                        ))}
                        {(leasesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có IP nào được cấp phát
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* DHCP CLIENTS TAB */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>DHCP Clients</CardTitle>
                <CardDescription>
                  Cấu hình nhận IP động (DHCP client) trên thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientsQuery.isLoading ? (
                  <LoadingFallback />
                ) : clientsQuery.isError ? (
                  <ErrorDisplay message={(clientsQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Interface</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Địa chỉ IP</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>DNS Server</TableHead>
                          <TableHead>Hết hạn</TableHead>
                          <TableHead>Kích hoạt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsQuery.data?.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>{client.interface}</TableCell>
                            <TableCell>
                              <Badge className={client.status === 'bound' ? 'bg-green-500' : 'bg-gray-500'}>
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{client.address}</TableCell>
                            <TableCell>{client.gateway}</TableCell>
                            <TableCell>{client.dnsServer}</TableCell>
                            <TableCell>{client.expires}</TableCell>
                            <TableCell>
                              {client.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(clientsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có DHCP client nào được cấu hình
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}