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
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <SharedWebSocketProvider>
      <Router />
      <Toaster />
    </SharedWebSocketProvider>
  );
}

export default App;
