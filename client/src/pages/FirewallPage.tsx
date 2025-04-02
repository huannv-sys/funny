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
  protocol?: string;
  srcAddress?: string;
  srcPort?: string;
  dstAddress?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  comment?: string;
  connectionState?: string;
  bytes: number;
  packets: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho NAT Rule
interface NATRule {
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
  bytes: number;
  packets: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho Connection
interface Connection {
  id: string;
  protocol: 'tcp' | 'udp' | 'icmp';
  srcAddress: string;
  srcPort: number;
  dstAddress: string;
  dstPort: number;
  state: string;
  timeout: number;
  bytesIn: number;
  bytesOut: number;
  tcpStateTracking?: string;
  natted?: boolean;
  marked?: boolean;
}

// Hàm để định dạng bytes thành dạng dễ đọc
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

export default function FirewallPage() {
  const [deviceId] = useState<number>(1);

  // Fetch dữ liệu Filter Rules
  const filterRulesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'filter'],
    queryFn: getQueryFn<FirewallRule[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: [],
  });

  // Fetch dữ liệu NAT Rules
  const natRulesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'nat'],
    queryFn: getQueryFn<NATRule[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: [],
  });

  // Fetch dữ liệu Connections
  const connectionsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'connections'],
    queryFn: getQueryFn<Connection[]>({ on401: 'throw' }),
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

  // Tạo badge cho chain
  function getChainBadge(chain: string) {
    if (!chain) return <Badge className="bg-gray-500">Unknown</Badge>;
    
    switch(chain.toLowerCase()) {
      case 'input':
        return <Badge className="bg-blue-500">Input</Badge>;
      case 'output':
        return <Badge className="bg-green-500">Output</Badge>;
      case 'forward':
        return <Badge className="bg-purple-500">Forward</Badge>;
      case 'srcnat':
        return <Badge className="bg-orange-500">Source NAT</Badge>;
      case 'dstnat':
        return <Badge className="bg-pink-500">Destination NAT</Badge>;
      default:
        return <Badge className="bg-gray-500">{chain}</Badge>;
    }
  }

  // Tạo badge cho action
  function getActionBadge(action: string) {
    if (!action) return <Badge className="bg-gray-500">Unknown</Badge>;
    
    switch(action.toLowerCase()) {
      case 'accept':
        return <Badge className="bg-green-500">Accept</Badge>;
      case 'drop':
        return <Badge className="bg-red-500">Drop</Badge>;
      case 'reject':
        return <Badge className="bg-orange-500">Reject</Badge>;
      case 'masquerade':
        return <Badge className="bg-blue-500">Masquerade</Badge>;
      case 'dst-nat':
      case 'dstnat':
        return <Badge className="bg-purple-500">Dst-NAT</Badge>;
      case 'src-nat':
      case 'srcnat':
        return <Badge className="bg-yellow-500">Src-NAT</Badge>;
      case 'log':
        return <Badge className="bg-gray-500">Log</Badge>;
      default:
        return <Badge className="bg-gray-500">{action}</Badge>;
    }
  }

  // Tạo badge cho protocol
  function getProtocolBadge(protocol?: string) {
    if (!protocol) return '-';
    
    switch(protocol.toLowerCase()) {
      case 'tcp':
        return <Badge className="bg-blue-500">TCP</Badge>;
      case 'udp':
        return <Badge className="bg-green-500">UDP</Badge>;
      case 'icmp':
        return <Badge className="bg-yellow-500">ICMP</Badge>;
      default:
        return <Badge className="bg-gray-500">{protocol}</Badge>;
    }
  }

  // Tạo badge cho connection state
  function getStateBadge(state: string) {
    if (!state) return <Badge className="bg-gray-500">Unknown</Badge>;
    
    switch(state.toLowerCase()) {
      case 'established':
        return <Badge className="bg-green-500">Established</Badge>;
      case 'time-wait':
        return <Badge className="bg-blue-500">Time-Wait</Badge>;
      case 'fin-wait':
        return <Badge className="bg-orange-500">Fin-Wait</Badge>;
      case 'close-wait':
        return <Badge className="bg-yellow-500">Close-Wait</Badge>;
      case 'closed':
        return <Badge className="bg-red-500">Closed</Badge>;
      default:
        return <Badge className="bg-gray-500">{state}</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý Firewall & NAT</h1>
        
        <Tabs defaultValue="filter-rules" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="filter-rules">Filter Rules</TabsTrigger>
            <TabsTrigger value="nat-rules">NAT Rules</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          
          {/* FILTER RULES TAB */}
          <TabsContent value="filter-rules">
            <Card>
              <CardHeader>
                <CardTitle>Filter Rules</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc lọc gói tin trong tường lửa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterRulesQuery.isLoading ? (
                  <LoadingFallback />
                ) : filterRulesQuery.isError ? (
                  <ErrorDisplay message={(filterRulesQuery.error as Error).message} />
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
                          <TableHead>Interface</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Packets/Bytes</TableHead>
                          <TableHead>Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterRulesQuery.data?.map((rule) => (
                          <TableRow key={rule.id} className={rule.disabled ? "opacity-50" : ""}>
                            <TableCell>{getChainBadge(rule.chain)}</TableCell>
                            <TableCell>{getActionBadge(rule.action)}</TableCell>
                            <TableCell>{getProtocolBadge(rule.protocol)}</TableCell>
                            <TableCell>
                              {rule.srcAddress || 'any'}
                              {rule.srcPort ? ':' + rule.srcPort : ''}
                            </TableCell>
                            <TableCell>
                              {rule.dstAddress || 'any'}
                              {rule.dstPort ? ':' + rule.dstPort : ''}
                            </TableCell>
                            <TableCell>
                              {rule.inInterface ? 'in: ' + rule.inInterface : ''}
                              {rule.inInterface && rule.outInterface ? ', ' : ''}
                              {rule.outInterface ? 'out: ' + rule.outInterface : ''}
                              {!rule.inInterface && !rule.outInterface ? 'any' : ''}
                            </TableCell>
                            <TableCell>{rule.connectionState || '-'}</TableCell>
                            <TableCell>
                              {(rule.packets !== undefined ? rule.packets.toLocaleString() : "0")} / {(rule.bytes !== undefined ? formatBytes(rule.bytes) : "0 B")}
                            </TableCell>
                            <TableCell>{rule.comment || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {(filterRulesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                              Không có filter rule nào
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
          <TabsContent value="nat-rules">
            <Card>
              <CardHeader>
                <CardTitle>NAT Rules</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc Network Address Translation (NAT)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {natRulesQuery.isLoading ? (
                  <LoadingFallback />
                ) : natRulesQuery.isError ? (
                  <ErrorDisplay message={(natRulesQuery.error as Error).message} />
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
                          <TableHead>Packets/Bytes</TableHead>
                          <TableHead>Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {natRulesQuery.data?.map((rule) => (
                          <TableRow key={rule.id} className={rule.disabled ? "opacity-50" : ""}>
                            <TableCell>{getChainBadge(rule.chain)}</TableCell>
                            <TableCell>{getActionBadge(rule.action)}</TableCell>
                            <TableCell>{getProtocolBadge(rule.protocol)}</TableCell>
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
                              {(rule.packets !== undefined ? rule.packets.toLocaleString() : "0")} / {(rule.bytes !== undefined ? formatBytes(rule.bytes) : "0 B")}
                            </TableCell>
                            <TableCell>{rule.comment || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {(natRulesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                              Không có NAT rule nào
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
                <CardTitle>Active Connections</CardTitle>
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
                          <TableHead>Bytes (In/Out)</TableHead>
                          <TableHead>NAT</TableHead>
                          <TableHead>Mark</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {connectionsQuery.data?.map((conn) => (
                          <TableRow key={conn.id}>
                            <TableCell>{getProtocolBadge(conn.protocol)}</TableCell>
                            <TableCell>{conn.srcAddress}:{conn.srcPort}</TableCell>
                            <TableCell>{conn.dstAddress}:{conn.dstPort}</TableCell>
                            <TableCell>{getStateBadge(conn.state)}</TableCell>
                            <TableCell>{conn.timeout}s</TableCell>
                            <TableCell>
                              {(conn.bytesIn !== undefined ? formatBytes(conn.bytesIn) : "0 B")} / {(conn.bytesOut !== undefined ? formatBytes(conn.bytesOut) : "0 B")}
                            </TableCell>
                            <TableCell>
                              {conn.natted ? (
                                <Badge className="bg-green-500">Yes</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">No</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {conn.marked ? (
                                <Badge className="bg-blue-500">Yes</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">No</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(connectionsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
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