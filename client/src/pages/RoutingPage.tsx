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

// Định nghĩa kiểu dữ liệu cho Route
interface Route {
  id: string;
  destination: string;
  gateway: string;
  distance: number;
  scope: string;
  interface: string;
  routingMark?: string;
  targetScope?: string;
  active: boolean;
  static: boolean;
  bgp: boolean;
  ospf: boolean;
}

// Định nghĩa kiểu dữ liệu cho BGP Peer
interface BGPPeer {
  id: string;
  name: string;
  remoteAddress: string;
  remoteAs: string;
  localAs: string;
  listenAddress: string;
  nexthopChoice: string;
  multihop: boolean;
  routeReflect: boolean;
  state: string;
  updatesReceived: number;
  updatesSent: number;
  advertizedRoutes: number;
  receivedRoutes: number;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho OSPF Interface
interface OSPFInterface {
  id: string;
  interface: string;
  network: string;
  area: string;
  priority: number;
  cost: number;
  authentication: string;
  passive: boolean;
  state: string;
  neighborCount: number;
  designatedRouter: string;
  backupDesignatedRouter: string;
  disabled: boolean;
}

// Định nghĩa kiểu dữ liệu cho OSPF Neighbor
interface OSPFNeighbor {
  id: string;
  interface: string;
  routerId: string;
  address: string;
  priority: number;
  adjacency: string;
  state: string;
  deadTime: string;
  lastExchange: string;
}

export default function RoutingPage() {
  const [deviceId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("routes");

  // Fetch dữ liệu Routes
  const routesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'routing', 'routes'],
    queryFn: getQueryFn<Route[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch dữ liệu BGP Peers
  const bgpPeersQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'routing', 'bgp', 'peers'],
    queryFn: getQueryFn<BGPPeer[]>({ on401: 'throw' }),
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });

  // Fetch dữ liệu OSPF Interfaces
  const ospfInterfacesQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'routing', 'ospf', 'interfaces'],
    queryFn: getQueryFn<OSPFInterface[]>({ on401: 'throw' }),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch dữ liệu OSPF Neighbors
  const ospfNeighborsQuery = useQuery({
    queryKey: ['/api/devices', deviceId, 'routing', 'ospf', 'neighbors'],
    queryFn: getQueryFn<OSPFNeighbor[]>({ on401: 'throw' }),
    staleTime: 15000,
    refetchInterval: 30000,
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

  // Get route type badge
  function getRouteTypeBadge(route: Route) {
    if (route.bgp) {
      return <Badge className="bg-purple-500">BGP</Badge>;
    } else if (route.ospf) {
      return <Badge className="bg-blue-500">OSPF</Badge>;
    } else if (route.static) {
      return <Badge className="bg-green-500">Static</Badge>;
    } else {
      return <Badge className="bg-gray-500">Dynamic</Badge>;
    }
  }

  // Get BGP/OSPF state badge
  function getStateBadge(state: string) {
    switch (state.toLowerCase()) {
      case 'established':
      case 'full':
        return <Badge className="bg-green-500">{state}</Badge>;
      case 'connect':
      case 'exchange':
      case 'loading':
        return <Badge className="bg-blue-500">{state}</Badge>;
      case 'active':
      case 'twoway':
        return <Badge className="bg-yellow-500">{state}</Badge>;
      case 'idle':
      case 'down':
        return <Badge className="bg-red-500">{state}</Badge>;
      default:
        return <Badge className="bg-gray-500">{state}</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Định tuyến (Routing)</h1>
        
        <Tabs defaultValue="routes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="routes">Bảng định tuyến</TabsTrigger>
            <TabsTrigger value="bgp-peers">BGP Peers</TabsTrigger>
            <TabsTrigger value="ospf-interfaces">OSPF Interfaces</TabsTrigger>
            <TabsTrigger value="ospf-neighbors">OSPF Neighbors</TabsTrigger>
          </TabsList>
          
          {/* ROUTES TAB */}
          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Bảng định tuyến</CardTitle>
                <CardDescription>
                  Danh sách các tuyến định tuyến trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routesQuery.isLoading ? (
                  <LoadingFallback />
                ) : routesQuery.isError ? (
                  <ErrorDisplay message={(routesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Đích đến</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>Interface</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Scope</TableHead>
                          <TableHead>Routing Mark</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routesQuery.data?.map((route) => (
                          <TableRow key={route.id}>
                            <TableCell>{route.destination}</TableCell>
                            <TableCell>{route.gateway || '-'}</TableCell>
                            <TableCell>{route.interface}</TableCell>
                            <TableCell>{route.distance}</TableCell>
                            <TableCell>{route.scope}</TableCell>
                            <TableCell>{route.routingMark || '-'}</TableCell>
                            <TableCell>{getRouteTypeBadge(route)}</TableCell>
                            <TableCell>
                              {route.active ? (
                                <Badge variant="outline" className="text-green-500">Hoạt động</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Không hoạt động</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(routesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có tuyến định tuyến nào
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
          
          {/* BGP PEERS TAB */}
          <TabsContent value="bgp-peers">
            <Card>
              <CardHeader>
                <CardTitle>BGP Peers</CardTitle>
                <CardDescription>
                  Danh sách các kết nối BGP với các thiết bị khác
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bgpPeersQuery.isLoading ? (
                  <LoadingFallback />
                ) : bgpPeersQuery.isError ? (
                  <ErrorDisplay message={(bgpPeersQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên</TableHead>
                          <TableHead>Remote Address</TableHead>
                          <TableHead>Remote AS</TableHead>
                          <TableHead>Local AS</TableHead>
                          <TableHead>Cập nhật nhận</TableHead>
                          <TableHead>Cập nhật gửi</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Hoạt động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bgpPeersQuery.data?.map((peer) => (
                          <TableRow key={peer.id}>
                            <TableCell>{peer.name}</TableCell>
                            <TableCell>{peer.remoteAddress}</TableCell>
                            <TableCell>{peer.remoteAs}</TableCell>
                            <TableCell>{peer.localAs}</TableCell>
                            <TableCell>{peer.updatesReceived}</TableCell>
                            <TableCell>{peer.updatesSent}</TableCell>
                            <TableCell>{getStateBadge(peer.state)}</TableCell>
                            <TableCell>
                              {peer.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(bgpPeersQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có BGP peer nào được cấu hình
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
          
          {/* OSPF INTERFACES TAB */}
          <TabsContent value="ospf-interfaces">
            <Card>
              <CardHeader>
                <CardTitle>OSPF Interfaces</CardTitle>
                <CardDescription>
                  Cấu hình OSPF trên các interface của thiết bị
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ospfInterfacesQuery.isLoading ? (
                  <LoadingFallback />
                ) : ospfInterfacesQuery.isError ? (
                  <ErrorDisplay message={(ospfInterfacesQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Interface</TableHead>
                          <TableHead>Network</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Designated Router</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Hoạt động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ospfInterfacesQuery.data?.map((iface) => (
                          <TableRow key={iface.id}>
                            <TableCell>{iface.interface}</TableCell>
                            <TableCell>{iface.network}</TableCell>
                            <TableCell>{iface.area}</TableCell>
                            <TableCell>{iface.priority}</TableCell>
                            <TableCell>{iface.cost}</TableCell>
                            <TableCell>{iface.designatedRouter || '-'}</TableCell>
                            <TableCell>{getStateBadge(iface.state)}</TableCell>
                            <TableCell>
                              {iface.disabled ? (
                                <Badge variant="outline" className="text-gray-400">Tắt</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500">Bật</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {(ospfInterfacesQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có interface OSPF nào được cấu hình
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
          
          {/* OSPF NEIGHBORS TAB */}
          <TabsContent value="ospf-neighbors">
            <Card>
              <CardHeader>
                <CardTitle>OSPF Neighbors</CardTitle>
                <CardDescription>
                  Danh sách các láng giềng OSPF (neighbors)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ospfNeighborsQuery.isLoading ? (
                  <LoadingFallback />
                ) : ospfNeighborsQuery.isError ? (
                  <ErrorDisplay message={(ospfNeighborsQuery.error as Error).message} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Interface</TableHead>
                          <TableHead>Router ID</TableHead>
                          <TableHead>Địa chỉ IP</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Adjacency</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Dead Time</TableHead>
                          <TableHead>Last Exchange</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ospfNeighborsQuery.data?.map((neighbor) => (
                          <TableRow key={neighbor.id}>
                            <TableCell>{neighbor.interface}</TableCell>
                            <TableCell>{neighbor.routerId}</TableCell>
                            <TableCell>{neighbor.address}</TableCell>
                            <TableCell>{neighbor.priority}</TableCell>
                            <TableCell>{neighbor.adjacency}</TableCell>
                            <TableCell>{getStateBadge(neighbor.state)}</TableCell>
                            <TableCell>{neighbor.deadTime}</TableCell>
                            <TableCell>{neighbor.lastExchange}</TableCell>
                          </TableRow>
                        ))}
                        {(ospfNeighborsQuery.data?.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                              Không có neighbor OSPF nào
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