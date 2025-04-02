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

// Định nghĩa kiểu dữ liệu cho VPN Connection
interface VPNConnection {
  id: string;
  name: string;
  type: 'pptp' | 'l2tp' | 'sstp' | 'ovpn' | 'ipsec';
  user?: string;
  remoteAddress?: string;
  localAddress?: string;
  uptime?: string;
  bytesIn: number;
  bytesOut: number;
  encryptionAlgorithm?: string;
  status: string;
  lastCallerId?: string;
  activeClients?: number;
  mtu?: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho VPN Peer
interface VPNPeer {
  id: string;
  name: string;
  remoteAddress: string;
  localAddress: string;
  user?: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  status: string;
  lastHandshake?: string;
}

// Định nghĩa kiểu dữ liệu cho VPN Server
interface VPNServer {
  id: string;
  name: string;
  type: 'pptp' | 'l2tp' | 'sstp' | 'ovpn' | 'ipsec';
  interface?: string;
  port?: number;
  enabled: boolean;
  authProtocol?: string;
  encryptionProtocol?: string;
  activeClients: number;
  maxClients?: number;
  certificateName?: string;
}

// Định nghĩa kiểu dữ liệu cho IPSec Phase
interface IPSecPhase {
  id: string;
  ph: '1' | '2';
  state: string;
  role: 'initiator' | 'responder';
  side: 'local' | 'remote';
  remoteAddress: string;
  localAddress: string;
  proposal: string;
  lifetime: string;
  uptime: string;
  lastHandshake: string;
}

// Hàm để định dạng bytes thành dạng dễ đọc
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Hàm tạo badge cho loại VPN
function getVPNTypeBadge(type: string) {
  switch (type.toLowerCase()) {
    case 'pptp':
      return <Badge className="bg-blue-500">PPTP</Badge>;
    case 'l2tp':
      return <Badge className="bg-green-500">L2TP</Badge>;
    case 'sstp':
      return <Badge className="bg-purple-500">SSTP</Badge>;
    case 'ovpn':
      return <Badge className="bg-orange-500">OpenVPN</Badge>;
    case 'ipsec':
      return <Badge className="bg-indigo-500">IPSec</Badge>;
    default:
      return <Badge className="bg-gray-500">{type}</Badge>;
  }
}

// Hàm tạo badge cho trạng thái
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'connected':
    case 'established':
    case 'online':
      return <Badge className="bg-green-500">{status}</Badge>;
    case 'connecting':
    case 'waiting':
      return <Badge className="bg-blue-500">{status}</Badge>;
    case 'disconnected':
    case 'timeout':
      return <Badge className="bg-red-500">{status}</Badge>;
    default:
      return <Badge className="bg-gray-500">{status}</Badge>;
  }
}

export default function VPNPage() {
  const [deviceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("connections");

  // Fetch dữ liệu VPN Connections
  const connectionsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'vpn', 'connections'],
    queryFn: getQueryFn<VPNConnection[]>({ on401: 'throw' }),
    staleTime: staleTime: 15000,
    refetchInterval: 30000,
    placeholderData: [],
  });

  // Fetch dữ liệu VPN Peers
  const peersQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'vpn', 'peers'],
    queryFn: getQueryFn<VPNPeer[]>({ on401: 'throw' }),
    staleTime: staleTime: 15000,
    refetchInterval: 30000,
    placeholderData: [],
  });

  // Fetch dữ liệu VPN Servers
  const serversQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'vpn', 'servers'],
    queryFn: getQueryFn<VPNServer[]>({ on401: 'throw' }),
    staleTime: staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: [],
  });

  // Fetch dữ liệu IPSec Phases
  const ipsecQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'vpn', 'ipsec'],
    queryFn: getQueryFn<IPSecPhase[]>({ on401: 'throw' }),
    staleTime: staleTime: 15000,
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý VPN</h1>
        
        <Tabs defaultValue="connections" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connections">Kết nối VPN</TabsTrigger>
            <TabsTrigger value="peers">VPN Peers</TabsTrigger>
            <TabsTrigger value="servers">VPN Servers</TabsTrigger>
            <TabsTrigger value="ipsec">IPSec</TabsTrigger>
          </TabsList>
          
          {/* VPN CONNECTIONS TAB */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Kết nối VPN</CardTitle>
                <CardDescription>
                  Danh sách các kết nối VPN hiện tại
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
                          <TableHead>Tên</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Người dùng</TableHead>
                          <TableHead>Địa chỉ Remote</TableHead>
                          <TableHead>Địa chỉ Local</TableHead>
                          <TableHead>Uptime</TableHead>
                          <TableHead>Traffic In/Out</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connectionsQuery.data?.map((conn) => (
                          <TableRow key={conn.id}>
                            <TableCell>{conn.name}</TableCell>
                            <TableCell>{getVPNTypeBadge(conn.type)}</TableCell>
                            <TableCell>{conn.user || '-'}</TableCell>
                            <TableCell>{conn.remoteAddress || '-'}</TableCell>
                            <TableCell>{conn.localAddress || '-'}</TableCell>
                            <TableCell>{conn.uptime || '-'}</TableCell>
                            <TableCell>
                              {formatBytes(conn.bytesIn)} / {formatBytes(conn.bytesOut)}
                            </TableCell>
                            <TableCell>{getStatusBadge(conn.status)}</TableCell>
                          </TableRow>
                        ))}
                        {(connectionsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có kết nối VPN nào
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
          
          {/* VPN PEERS TAB */}
          <TabsContent value="peers">
            <Card>
              <CardHeader>
                <CardTitle>VPN Peers</CardTitle>
                <CardDescription>
                  Danh sách các thiết bị kết nối qua VPN
                </CardDescription>
              </CardHeader>
              <CardContent>
                {peersQuery.isLoading ? (
                  <LoadingFallback />
                ) : peersQuery.isError ? (
                  <ErrorDisplay message={(peersQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Địa chỉ Remote</TableHead>
                          <TableHead>Địa chỉ Local</TableHead>
                          <TableHead>Người dùng</TableHead>
                          <TableHead>Uptime</TableHead>
                          <TableHead>Traffic In/Out</TableHead>
                          <TableHead>Last Handshake</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {peersQuery.data?.map((peer) => (
                          <TableRow key={peer.id}>
                            <TableCell>{peer.name}</TableCell>
                            <TableCell>{peer.remoteAddress}</TableCell>
                            <TableCell>{peer.localAddress}</TableCell>
                            <TableCell>{peer.user || '-'}</TableCell>
                            <TableCell>{peer.uptime}</TableCell>
                            <TableCell>
                              {formatBytes(peer.bytesIn)} / {formatBytes(peer.bytesOut)}
                            </TableCell>
                            <TableCell>{peer.lastHandshake || '-'}</TableCell>
                            <TableCell>{getStatusBadge(peer.status)}</TableCell>
                          </TableRow>
                        ))}
                        {(peersQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có peer VPN nào
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
          
          {/* VPN SERVERS TAB */}
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle>VPN Servers</CardTitle>
                <CardDescription>
                  Cấu hình các server VPN trên thiết bị
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
                          <TableHead>Loại</TableHead>
                          <TableHead>Interface</TableHead>
                          <TableHead>Port</TableHead>
                          <TableHead>Auth Protocol</TableHead>
                          <TableHead>Encryption</TableHead>
                          <TableHead>Clients</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serversQuery.data?.map((server) => (
                          <TableRow key={server.id}>
                            <TableCell>{server.name}</TableCell>
                            <TableCell>{getVPNTypeBadge(server.type)}</TableCell>
                            <TableCell>{server.interface || '-'}</TableCell>
                            <TableCell>{server.port || '-'}</TableCell>
                            <TableCell>{server.authProtocol || '-'}</TableCell>
                            <TableCell>{server.encryptionProtocol || '-'}</TableCell>
                            <TableCell>
                              {server.activeClients}
                              {server.maxClients ? `/${server.maxClients}` : ''}
                            </TableCell>
                            <TableCell>
                              {server.enabled ? (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(serversQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có server VPN nào được cấu hình
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
          
          {/* IPSEC TAB */}
          <TabsContent value="ipsec">
            <Card>
              <CardHeader>
                <CardTitle>IPSec Phases</CardTitle>
                <CardDescription>
                  Chi tiết về các giai đoạn IPSec (Phase 1 và Phase 2)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ipsecQuery.isLoading ? (
                  <LoadingFallback />
                ) : ipsecQuery.isError ? (
                  <ErrorDisplay message={(ipsecQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phase</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Remote Address</TableHead>
                          <TableHead>Local Address</TableHead>
                          <TableHead>Proposal</TableHead>
                          <TableHead>Lifetime</TableHead>
                          <TableHead>Uptime</TableHead>
                          <TableHead>State</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ipsecQuery.data?.map((phase) => (
                          <TableRow key={phase.id}>
                            <TableCell>
                              <Badge className={phase.ph === '1' ? 'bg-blue-500' : 'bg-green-500'}>
                                Phase {phase.ph}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{phase.role}</TableCell>
                            <TableCell>{phase.remoteAddress}</TableCell>
                            <TableCell>{phase.localAddress}</TableCell>
                            <TableCell>{phase.proposal}</TableCell>
                            <TableCell>{phase.lifetime}</TableCell>
                            <TableCell>{phase.uptime}</TableCell>
                            <TableCell>{getStatusBadge(phase.state)}</TableCell>
                          </TableRow>
                        ))}
                        {(ipsecQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có kết nối IPSec nào
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