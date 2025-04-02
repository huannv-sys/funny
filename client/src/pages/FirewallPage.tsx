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

// Định nghĩa kiểu dữ liệu cho Firewall Rule
interface FirewallRule {
  id: string;
  chain: string;
  action: string;
  protocol: string;
  srcAddress?: string;
  srcPort?: string;
  dstAddress?: string;
  dstPort?: string;
  comment?: string;
  packets: number;
  bytes: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho NAT Rule
interface NatRule {
  id: string;
  chain: string;
  action: string;
  protocol?: string;
  srcAddress?: string;
  srcPort?: string;
  dstAddress?: string;
  dstPort?: string;
  toAddresses?: string;
  toPorts?: string;
  comment?: string;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho Connection
interface Connection {
  id: string;
  protocol: string;
  srcAddress: string;
  srcPort: string;
  dstAddress: string;
  dstPort: string;
  state: string;
  timeout: string;
  bytesIn: number;
  bytesOut: number;
}

// Hàm để định dạng bytes thành dạng dễ đọc
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Hàm tạo badge cho action
function getActionBadge(action: string) {
  switch (action.toLowerCase()) {
    case 'accept':
      return <Badge className="bg-green-500">Chấp nhận</Badge>;
    case 'drop':
      return <Badge className="bg-red-500">Từ chối</Badge>;
    case 'reject':
      return <Badge className="bg-orange-500">Từ chối</Badge>;
    case 'log':
      return <Badge className="bg-blue-500">Ghi log</Badge>;
    case 'masquerade':
      return <Badge className="bg-purple-500">Masquerade</Badge>;
    case 'dst-nat':
      return <Badge className="bg-indigo-500">Destination NAT</Badge>;
    case 'src-nat':
      return <Badge className="bg-pink-500">Source NAT</Badge>;
    default:
      return <Badge className="bg-gray-500">{action}</Badge>;
  }
}

// Hàm tạo màu cho trạng thái kết nối
function getConnectionStateBadge(state: string) {
  switch (state.toLowerCase()) {
    case 'established':
      return <Badge className="bg-green-500">Established</Badge>;
    case 'time-wait':
      return <Badge className="bg-yellow-500">Time-wait</Badge>;
    case 'fin-wait':
      return <Badge className="bg-orange-500">Fin-wait</Badge>;
    case 'close-wait':
      return <Badge className="bg-red-500">Close-wait</Badge>;
    case 'syn-sent':
      return <Badge className="bg-blue-500">Syn-sent</Badge>;
    default:
      return <Badge className="bg-gray-500">{state}</Badge>;
  }
}

export default function FirewallPage() {
  const [deviceId] = useState<number>(1); // Giả sử hiện tại chúng ta đang sử dụng thiết bị có ID là 1
  const [activeTab, setActiveTab] = useState("filter");

  // Fetch dữ liệu firewall rules
  const firewallQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'filter'],
    queryFn: getQueryFn<FirewallRule[]>({ on401: 'throw' }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Fetch dữ liệu NAT rules
  const natQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'nat'],
    queryFn: getQueryFn<NatRule[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch dữ liệu connections
  const connectionsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'connections'],
    queryFn: getQueryFn<Connection[]>({ on401: 'throw' }),
    staleTime: 10000, // 10 seconds
    refetchInterval: 20000, // 20 seconds
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý Firewall & NAT</h1>
        
        <Tabs defaultValue="filter" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filter">Firewall Rules</TabsTrigger>
            <TabsTrigger value="nat">NAT Rules</TabsTrigger>
            <TabsTrigger value="connections">Kết nối đang hoạt động</TabsTrigger>
          </TabsList>
          
          {/* FIREWALL RULES TAB */}
          <TabsContent value="filter">
            <Card>
              <CardHeader>
                <CardTitle>Firewall Rules</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc tường lửa và thống kê lưu lượng
                </CardDescription>
              </CardHeader>
              <CardContent>
                {firewallQuery.isLoading ? (
                  <LoadingFallback />
                ) : firewallQuery.isError ? (
                  <ErrorDisplay message={(firewallQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chain</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Packets</TableHead>
                          <TableHead>Traffic</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {firewallQuery.data?.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.chain}</TableCell>
                            <TableCell>{getActionBadge(rule.action)}</TableCell>
                            <TableCell>{rule.protocol || 'all'}</TableCell>
                            <TableCell>
                              {rule.srcAddress || 'any'}
                              {rule.srcPort ? ':' + rule.srcPort : ''}
                            </TableCell>
                            <TableCell>
                              {rule.dstAddress || 'any'}
                              {rule.dstPort ? ':' + rule.dstPort : ''}
                            </TableCell>
                            <TableCell>{rule.packets.toLocaleString()}</TableCell>
                            <TableCell>{formatBytes(rule.bytes)}</TableCell>
                            <TableCell>
                              {rule.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(firewallQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có quy tắc tường lửa nào
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
          
          {/* NAT RULES TAB */}
          <TabsContent value="nat">
            <Card>
              <CardHeader>
                <CardTitle>NAT Rules</CardTitle>
                <CardDescription>
                  Cấu hình Port Forwarding và Network Address Translation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {natQuery.isLoading ? (
                  <LoadingFallback />
                ) : natQuery.isError ? (
                  <ErrorDisplay message={(natQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chain</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>To Addresses</TableHead>
                          <TableHead>To Ports</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {natQuery.data?.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.chain}</TableCell>
                            <TableCell>{getActionBadge(rule.action)}</TableCell>
                            <TableCell>{rule.protocol || 'all'}</TableCell>
                            <TableCell>
                              {rule.srcAddress || 'any'}
                              {rule.srcPort ? ':' + rule.srcPort : ''}
                            </TableCell>
                            <TableCell>
                              {rule.dstAddress || 'any'}
                              {rule.dstPort ? ':' + rule.dstPort : ''}
                            </TableCell>
                            <TableCell>{rule.toAddresses || '-'}</TableCell>
                            <TableCell>{rule.toPorts || '-'}</TableCell>
                            <TableCell>
                              {rule.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(natQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có quy tắc NAT nào
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
          
          {/* CONNECTIONS TAB */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Connections Tracking</CardTitle>
                <CardDescription>
                  Danh sách các kết nối mạng đang hoạt động
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectionsQuery.isLoading ? (
                  <LoadingFallback />
                ) : connectionsQuery.isError ? (
                  <ErrorDisplay message={(connectionsQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocol</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Timeout</TableHead>
                          <TableHead>Traffic In</TableHead>
                          <TableHead>Traffic Out</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connectionsQuery.data?.map((conn) => (
                          <TableRow key={conn.id}>
                            <TableCell>{conn.protocol.toUpperCase()}</TableCell>
                            <TableCell>
                              {conn.srcAddress}:{conn.srcPort}
                            </TableCell>
                            <TableCell>
                              {conn.dstAddress}:{conn.dstPort}
                            </TableCell>
                            <TableCell>{getConnectionStateBadge(conn.state)}</TableCell>
                            <TableCell>{conn.timeout}</TableCell>
                            <TableCell>{formatBytes(conn.bytesIn)}</TableCell>
                            <TableCell>{formatBytes(conn.bytesOut)}</TableCell>
                          </TableRow>
                        ))}
                        {(connectionsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có kết nối nào đang hoạt động
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