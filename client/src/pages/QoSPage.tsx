import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho Simple Queue
interface SimpleQueue {
  id: string;
  name: string;
  target: string;
  maxLimit: string;
  totalMaxLimit?: string;
  burstLimit?: string;
  burstTime?: string;
  burstThreshold?: string;
  priority: number;
  queueType: string;
  parent?: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  droppedIn: number;
  droppedOut: number;
  dynamicCount?: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho Queue Tree
interface QueueTree {
  id: string;
  name: string;
  parent: string;
  packet-mark?: string;
  limit: string;
  maxLimit: string;
  burstLimit?: string;
  burstTime?: string;
  burstThreshold?: string;
  priority: number;
  queueType: string;
  flowBits: number;
  flowPackets: number;
  bytes: number;
  packets: number;
  dropped: number;
  rate: number;
  packetRate: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho Queue Type
interface QueueType {
  id: string;
  name: string;
  kind: string;
  pcqRate: number;
  pcqClassifier: string;
  pcqTotalLimit: number;
  pcqBurstTime?: string;
  pcqBurstThreshold?: string;
  default: boolean;
}

// Định nghĩa kiểu dữ liệu cho Mangle Rule (packet marking)
interface MangleRule {
  id: string;
  chain: string;
  action: string;
  packetMark?: string;
  newPacketMark?: string;
  passthrough: boolean;
  srcAddress?: string;
  dstAddress?: string;
  protocol?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  bytes: number;
  packets: number;
  disabled: boolean;
}

// Hàm để định dạng bytes thành dạng dễ đọc
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// Hàm để định dạng bps thành dạng dễ đọc
function formatBitsPerSecond(bps: number) {
  if (bps === 0) return '0 bps';
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  const i = Math.floor(Math.log(bps) / Math.log(1000));
  return (bps / Math.pow(1000, i)).toFixed(2) + ' ' + sizes[i];
}

// Hàm chuyển đổi từ chuỗi limit (ví dụ: 10M/1M) sang bytes
function parseLimitToBytes(limit: string): { download: number; upload: number } {
  const parts = limit.split('/');
  const download = parseSpeedString(parts[0] || '0');
  const upload = parseSpeedString(parts[1] || parts[0] || '0');
  return { download, upload };
}

// Hàm chuyển đổi từ chuỗi tốc độ (10M, 1k, v.v) sang bytes
function parseSpeedString(speed: string): number {
  const value = parseFloat(speed.replace(/[^0-9.]/g, ''));
  const unit = speed.replace(/[0-9.]/g, '').toLowerCase();
  
  switch (unit) {
    case 'k':
      return value * 1024;
    case 'm':
      return value * 1024 * 1024;
    case 'g':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

export default function QoSPage() {
  const [deviceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("simple-queues");

  // Fetch dữ liệu Simple Queues
  const simpleQueuesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'queues', 'simple'],
    queryFn: getQueryFn<SimpleQueue[]>({ on401: 'throw' }),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // Fetch dữ liệu Queue Trees
  const queueTreesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'queues', 'tree'],
    queryFn: getQueryFn<QueueTree[]>({ on401: 'throw' }),
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // Fetch dữ liệu Queue Types
  const queueTypesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'queues', 'types'],
    queryFn: getQueryFn<QueueType[]>({ on401: 'throw' }),
    staleTime: 60000,
    refetchInterval: 120000,
  });

  // Fetch dữ liệu Mangle Rules
  const mangleRulesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'firewall', 'mangle'],
    queryFn: getQueryFn<MangleRule[]>({ on401: 'throw' }),
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

  // Tạo badge cho priority
  function getPriorityBadge(priority: number) {
    switch(priority) {
      case 1:
        return <Badge className="bg-red-500">1 (Cao nhất)</Badge>;
      case 2:
      case 3:
        return <Badge className="bg-orange-500">{priority}</Badge>;
      case 4:
      case 5:
        return <Badge className="bg-yellow-500">{priority}</Badge>;
      case 6:
      case 7:
        return <Badge className="bg-green-500">{priority}</Badge>;
      case 8:
        return <Badge className="bg-blue-500">8 (Thấp nhất)</Badge>;
      default:
        return <Badge className="bg-gray-500">{priority}</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Quản lý QoS & Queues</h1>
        
        <Tabs defaultValue="simple-queues" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simple-queues">Simple Queues</TabsTrigger>
            <TabsTrigger value="queue-trees">Queue Trees</TabsTrigger>
            <TabsTrigger value="queue-types">Queue Types</TabsTrigger>
            <TabsTrigger value="mangle-rules">Packet Marking</TabsTrigger>
          </TabsList>
          
          {/* SIMPLE QUEUES TAB */}
          <TabsContent value="simple-queues">
            <Card>
              <CardHeader>
                <CardTitle>Simple Queues</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc giới hạn băng thông trên các target (IP, Interface)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simpleQueuesQuery.isLoading ? (
                  <LoadingFallback />
                ) : simpleQueuesQuery.isError ? (
                  <ErrorDisplay message={(simpleQueuesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Max Limit (DL/UL)</TableHead>
                          <TableHead>Queue Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Traffic (In/Out)</TableHead>
                          <TableHead>Dropped</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simpleQueuesQuery.data?.map((queue) => (
                          <TableRow key={queue.id}>
                            <TableCell>{queue.name}</TableCell>
                            <TableCell>{queue.target}</TableCell>
                            <TableCell>{queue.maxLimit}</TableCell>
                            <TableCell>{queue.queueType}</TableCell>
                            <TableCell>{getPriorityBadge(queue.priority)}</TableCell>
                            <TableCell>
                              {formatBytes(queue.bytesIn)} / {formatBytes(queue.bytesOut)}
                            </TableCell>
                            <TableCell>
                              {queue.droppedIn + queue.droppedOut > 0 ? (
                                <Badge className="bg-red-500">{queue.droppedIn + queue.droppedOut}</Badge>
                              ) : (
                                <Badge className="bg-green-500">0</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {queue.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(simpleQueuesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có simple queue nào
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
          
          {/* QUEUE TREES TAB */}
          <TabsContent value="queue-trees">
            <Card>
              <CardHeader>
                <CardTitle>Queue Trees</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc phân cấp queues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queueTreesQuery.isLoading ? (
                  <LoadingFallback />
                ) : queueTreesQuery.isError ? (
                  <ErrorDisplay message={(queueTreesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Parent</TableHead>
                          <TableHead>Packet Mark</TableHead>
                          <TableHead>Max Limit</TableHead>
                          <TableHead>Queue Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Current Rate</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queueTreesQuery.data?.map((queue) => (
                          <TableRow key={queue.id}>
                            <TableCell>{queue.name}</TableCell>
                            <TableCell>{queue.parent}</TableCell>
                            <TableCell>{queue["packet-mark"] || '-'}</TableCell>
                            <TableCell>{queue.maxLimit}</TableCell>
                            <TableCell>{queue.queueType}</TableCell>
                            <TableCell>{getPriorityBadge(queue.priority)}</TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="text-xs">{formatBitsPerSecond(queue.rate)}</div>
                                <Progress 
                                  value={parseFloat(((queue.rate / parseSpeedString(queue.maxLimit)) * 100).toFixed(0))} 
                                  max={100}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              {queue.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(queueTreesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có queue tree nào
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
          
          {/* QUEUE TYPES TAB */}
          <TabsContent value="queue-types">
            <Card>
              <CardHeader>
                <CardTitle>Queue Types</CardTitle>
                <CardDescription>
                  Danh sách các loại hàng đợi được sử dụng trong queues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queueTypesQuery.isLoading ? (
                  <LoadingFallback />
                ) : queueTypesQuery.isError ? (
                  <ErrorDisplay message={(queueTypesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>PCQ Rate</TableHead>
                          <TableHead>PCQ Classifier</TableHead>
                          <TableHead>PCQ Total Limit</TableHead>
                          <TableHead>PCQ Burst Time</TableHead>
                          <TableHead>PCQ Burst Threshold</TableHead>
                          <TableHead>Default</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queueTypesQuery.data?.map((queueType) => (
                          <TableRow key={queueType.id}>
                            <TableCell>{queueType.name}</TableCell>
                            <TableCell>{queueType.kind}</TableCell>
                            <TableCell>{queueType.pcqRate ? formatBitsPerSecond(queueType.pcqRate) : '-'}</TableCell>
                            <TableCell>{queueType.pcqClassifier || '-'}</TableCell>
                            <TableCell>{queueType.pcqTotalLimit || '-'}</TableCell>
                            <TableCell>{queueType.pcqBurstTime || '-'}</TableCell>
                            <TableCell>{queueType.pcqBurstThreshold || '-'}</TableCell>
                            <TableCell>
                              {queueType.default ? (
                                <Badge className="bg-blue-500">Mặc định</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Không</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(queueTypesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có queue type nào
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
          
          {/* MANGLE RULES TAB */}
          <TabsContent value="mangle-rules">
            <Card>
              <CardHeader>
                <CardTitle>Packet Marking (Mangle Rules)</CardTitle>
                <CardDescription>
                  Danh sách các quy tắc đánh dấu gói tin được sử dụng trong QoS
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mangleRulesQuery.isLoading ? (
                  <LoadingFallback />
                ) : mangleRulesQuery.isError ? (
                  <ErrorDisplay message={(mangleRulesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chain</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Packet Mark</TableHead>
                          <TableHead>New Packet Mark</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Protocol/Port</TableHead>
                          <TableHead>Packets/Bytes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mangleRulesQuery.data?.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell>{rule.chain}</TableCell>
                            <TableCell>{rule.action}</TableCell>
                            <TableCell>{rule.packetMark || '-'}</TableCell>
                            <TableCell>{rule.newPacketMark || '-'}</TableCell>
                            <TableCell>
                              {rule.srcAddress || 'any'}
                              {rule.srcPort ? ':' + rule.srcPort : ''}
                            </TableCell>
                            <TableCell>
                              {rule.dstAddress || 'any'}
                              {rule.dstPort ? ':' + rule.dstPort : ''}
                            </TableCell>
                            <TableCell>{rule.protocol || 'all'}</TableCell>
                            <TableCell>
                              {rule.packets.toLocaleString()} / {formatBytes(rule.bytes)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(mangleRulesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có mangle rule nào
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