import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Spinner } from "./components/ui/spinner";
import { SharedWebSocketProvider } from "./hooks/useSharedWebSocket";
import { Toaster } from "./components/ui/toaster";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

// Lazy-loaded components
const NotFound = lazy(() => import("./pages/not-found"));
const FirewallPage = lazy(() => import("./pages/FirewallPage"));
const DHCPPage = lazy(() => import("./pages/DHCPPage"));
const RoutingPage = lazy(() => import("./pages/RoutingPage"));
const VPNPage = lazy(() => import("./pages/VPNPage"));
const QoSPage = lazy(() => import("./pages/QoSPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AlertDetailPage = lazy(() => import("./pages/AlertDetailPage"));
const MultiDeviceDashboard = lazy(() => import("./pages/MultiDeviceDashboard"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const KioskDashboardPage = lazy(() => import("./pages/KioskDashboardPage"));

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="w-[300px]">
        <CardContent className="pt-6 flex items-center justify-center">
          <Spinner className="h-8 w-8" />
          <p className="ml-2">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard/:id" component={Dashboard} />
        <Route path="/multi-dashboard" component={MultiDeviceDashboard} />
        <Route path="/kiosk-dashboard" component={KioskDashboardPage} />
        
        {/* Trang Quản lý mạng */}
        <Route path="/firewall" component={FirewallPage} />
        <Route path="/dhcp" component={DHCPPage} />
        <Route path="/routing" component={RoutingPage} />
        <Route path="/vpn" component={VPNPage} />
        
        {/* Trang Quản lý hệ thống */}
        <Route path="/qos" component={QoSPage} />
        <Route path="/services" component={ServicesPage} />

        {/* Trang Cảnh báo */}
        <Route path="/alerts/:id" component={AlertDetailPage} />
        
        {/* Trang Logs */}
        <Route path="/logs/:id" component={LogsPage} />
        
        {/* Trang lỗi 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <div className="h-full">
      <SharedWebSocketProvider>
        <Router />
        <Toaster />
      </SharedWebSocketProvider>
    </div>
  );
}

export default App;
