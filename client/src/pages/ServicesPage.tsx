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

// Định nghĩa kiểu dữ liệu cho IP Service
interface IPService {
  id: string;
  name: string;
  port: number;
  addresses: string;
  certificate?: string;
  tlsVersion?: string;
  invalidLoginCount: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho SNMP
interface SNMPSettings {
  enabled: boolean;
  contact?: string;
  location?: string;
  engineID?: string;
  trapCommunity: string;
  trapVersion: string;
  trapGenerics: string[];
  trapTargets: string[];
  communities: SNMPCommunity[];
}

// Định nghĩa kiểu dữ liệu cho SNMP Community
interface SNMPCommunity {
  id: string;
  name: string;
  addresses: string;
  readAccess: boolean;
  writeAccess: boolean;
  trapTarget?: string;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho User
interface User {
  id: string;
  name: string;
  group: string;
  address?: string;
  lastLoggedIn?: string;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho Active Session
interface ActiveSession {
  id: string;
  user: string;
  address: string;
  service: string;
  whenLogged: string;
  radius?: boolean;
  viaTunnel?: boolean;
}

export default function ServicesPage() {
  const [deviceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("ip-services");

  // Fetch dữ liệu IP Services
  const ipServicesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'services', 'ip'],
    queryFn: getQueryFn<IPService[]>({ on401: 'throw' }),
    staleTime: 60000,
    refetchInterval: 120000,
    placeholderData: [],
  });

  // Fetch dữ liệu SNMP
  const snmpQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'services', 'snmp'],
    queryFn: getQueryFn<SNMPSettings>({ on401: 'throw' }),
    staleTime: 60000,
    refetchInterval: 120000,
    placeholderData: {} as SNMPSettings,
  });

  // Fetch dữ liệu Users
  const usersQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'users'],
    queryFn: getQueryFn<User[]>({ on401: 'throw' }),
    staleTime: 60000,
    refetchInterval: 120000,
    placeholderData: [],
  });

  // Fetch dữ liệu Active Sessions
  const sessionsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'users', 'sessions'],
    queryFn: getQueryFn<ActiveSession[]>({ on401: 'throw' }),
    staleTime: 15000,
    refetchInterval: 30000,
    placeholderData: [],
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

  // Tạo badge cho group
  function getGroupBadge(group: string) {
    switch(group.toLowerCase()) {
      case 'admin':
      case 'full':
        return <Badge className="bg-red-500">Admin</Badge>;
      case 'write':
        return <Badge className="bg-orange-500">Write</Badge>;
      case 'read':
        return <Badge className="bg-green-500">Read</Badge>;
      default:
        return <Badge className="bg-gray-500">{group}</Badge>;
    }
  }

  // Tạo badge cho service
  function getServiceBadge(service: string) {
    if (!service) return <Badge className="bg-gray-500">Unknown</Badge>;
    switch(service.toLowerCase()) {
      case 'winbox':
        return <Badge className="bg-blue-500">Winbox</Badge>;
      case 'webfig':
      case 'www':
      case 'www-ssl':
        return <Badge className="bg-green-500">{service}</Badge>;
      case 'ssh':
        return <Badge className="bg-orange-500">SSH</Badge>;
      case 'telnet':
        return <Badge className="bg-red-500">Telnet</Badge>;
      case 'api':
      case 'api-ssl':
        return <Badge className="bg-purple-500">{service}</Badge>;
      case 'ftp':
        return <Badge className="bg-yellow-500">FTP</Badge>;
      default:
        return <Badge className="bg-gray-500">{service}</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Dịch vụ và Người dùng</h1>
        
        <Tabs defaultValue="ip-services" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ip-services">IP Services</TabsTrigger>
            <TabsTrigger value="snmp">SNMP</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="sessions">Phiên hoạt động</TabsTrigger>
          </TabsList>
          
          {/* IP SERVICES TAB */}
          <TabsContent value="ip-services">
            <Card>
              <CardHeader>
                <CardTitle>IP Services</CardTitle>
                <CardDescription>
                  Danh sách các dịch vụ mạng đang chạy trên thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ipServicesQuery.isLoading ? (
                  <LoadingFallback />
                ) : ipServicesQuery.isError ? (
                  <ErrorDisplay message={(ipServicesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Cổng</TableHead>
                          <TableHead>Địa chỉ cho phép</TableHead>
                          <TableHead>Chứng chỉ</TableHead>
                          <TableHead>Phiên bản TLS</TableHead>
                          <TableHead>Đăng nhập sai</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ipServicesQuery.data?.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{getServiceBadge(service.name)}</TableCell>
                            <TableCell>{service.port}</TableCell>
                            <TableCell>{service.addresses}</TableCell>
                            <TableCell>{service.certificate || '-'}</TableCell>
                            <TableCell>{service.tlsVersion || '-'}</TableCell>
                            <TableCell>
                              {service.invalidLoginCount > 0 ? (
                                <Badge className="bg-red-500">{service.invalidLoginCount}</Badge>
                              ) : (
                                <Badge className="bg-green-500">0</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {service.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(ipServicesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có dịch vụ IP nào
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
          
          {/* SNMP TAB */}
          <TabsContent value="snmp">
            <Card>
              <CardHeader>
                <CardTitle>SNMP Settings</CardTitle>
                <CardDescription>
                  Cấu hình SNMP (Simple Network Management Protocol)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {snmpQuery.isLoading ? (
                  <LoadingFallback />
                ) : snmpQuery.isError ? (
                  <ErrorDisplay message={(snmpQuery.error as Error).message} />
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">Thông tin SNMP</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trạng thái</p>
                          <p className="mt-1">
                            {snmpQuery.data?.enabled ? (
                              <Badge className="bg-green-500">Đang hoạt động</Badge>
                            ) : (
                              <Badge className="bg-red-500">Tắt</Badge>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engine ID</p>
                          <p className="mt-1 font-mono text-sm">{snmpQuery.data?.engineID || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Liên hệ</p>
                          <p className="mt-1">{snmpQuery.data?.contact || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vị trí</p>
                          <p className="mt-1">{snmpQuery.data?.location || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trap Community</p>
                          <p className="mt-1 font-mono text-sm">{snmpQuery.data?.trapCommunity || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trap Version</p>
                          <p className="mt-1">{snmpQuery.data?.trapVersion || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">Trap Targets</h3>
                      {snmpQuery.data?.trapTargets && snmpQuery.data.trapTargets.length > 0 ? (
                        <ul className="space-y-2">
                          {snmpQuery.data.trapTargets.map((target, idx) => (
                            <li key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center">
                              <span className="font-mono text-sm">{target}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">Không có trap target nào được cấu hình</p>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">SNMP Communities</h3>
                      {snmpQuery.data?.communities && snmpQuery.data.communities.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tên</TableHead>
                              <TableHead>Địa chỉ</TableHead>
                              <TableHead>Quyền truy cập</TableHead>
                              <TableHead>Trap Target</TableHead>
                              <TableHead>Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {snmpQuery.data.communities.map((community) => (
                              <TableRow key={community.id}>
                                <TableCell>{community.name}</TableCell>
                                <TableCell>{community.addresses}</TableCell>
                                <TableCell>
                                  {community.readAccess && community.writeAccess ? (
                                    <Badge className="bg-orange-500">Read-Write</Badge>
                                  ) : community.readAccess ? (
                                    <Badge className="bg-green-500">Read-Only</Badge>
                                  ) : community.writeAccess ? (
                                    <Badge className="bg-blue-500">Write-Only</Badge>
                                  ) : (
                                    <Badge className="bg-gray-500">No Access</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{community.trapTarget || '-'}</TableCell>
                                <TableCell>
                                  {community.disabled ? (
                                    <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-green-500">Bật</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-gray-500">Không có SNMP community nào được cấu hình</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* USERS TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Người dùng</CardTitle>
                <CardDescription>
                  Danh sách các tài khoản người dùng trên thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? (
                  <LoadingFallback />
                ) : usersQuery.isError ? (
                  <ErrorDisplay message={(usersQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Nhóm</TableHead>
                          <TableHead>Địa chỉ giới hạn</TableHead>
                          <TableHead>Đăng nhập gần đây</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersQuery.data?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{getGroupBadge(user.group)}</TableCell>
                            <TableCell>{user.address || '-'}</TableCell>
                            <TableCell>{user.lastLoggedIn || '-'}</TableCell>
                            <TableCell>
                              {user.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(usersQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                              Không có người dùng nào
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
          
          {/* SESSIONS TAB */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Phiên hoạt động</CardTitle>
                <CardDescription>
                  Danh sách các phiên người dùng đang hoạt động
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionsQuery.isLoading ? (
                  <LoadingFallback />
                ) : sessionsQuery.isError ? (
                  <ErrorDisplay message={(sessionsQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Người dùng</TableHead>
                          <TableHead>Địa chỉ</TableHead>
                          <TableHead>Dịch vụ</TableHead>
                          <TableHead>Thời gian đăng nhập</TableHead>
                          <TableHead>Via Tunnel</TableHead>
                          <TableHead>RADIUS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionsQuery.data?.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.user}</TableCell>
                            <TableCell>{session.address}</TableCell>
                            <TableCell>{getServiceBadge(session.service)}</TableCell>
                            <TableCell>{session.whenLogged}</TableCell>
                            <TableCell>
                              {session.viaTunnel ? (
                                <Badge className="bg-blue-500">Có</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Không</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.radius ? (
                                <Badge className="bg-purple-500">Có</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Không</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(sessionsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                              Không có phiên hoạt động nào
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