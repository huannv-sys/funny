import { useEffect, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCards from "@/components/dashboard/StatusCards";
import TrafficSection from "@/components/dashboard/TrafficSection";
import WiFiSection from "@/components/dashboard/WiFiSection";
import SystemResourcesSection from "@/components/dashboard/SystemResourcesSection";
import AlertSection from "@/components/dashboard/AlertSection";
import LogsSection from "@/components/dashboard/LogsSection";
import { 
  DeviceProvider, 
  MikrotikDataProvider, 
  TrafficProvider, 
  WiFiProvider, 
  SystemProvider, 
  AlertsProvider 
} from "@/hooks/useMikrotikData";
import { LogsProvider } from "@/hooks/useLogsData";
import useLiveUpdates from "@/hooks/useLiveUpdates";

export default function Dashboard() {
  const { isLiveEnabled, setIsLiveEnabled } = useLiveUpdates();
  
  return (
    <MikrotikDataProvider>
      <DeviceProvider>
        <TrafficProvider>
          <WiFiProvider>
            <SystemProvider>
              <AlertsProvider>
                <LogsProvider>
                  <AppLayout>
                    <DashboardHeader isLiveEnabled={isLiveEnabled} setIsLiveEnabled={setIsLiveEnabled} />
                    <StatusCards />
                    
                    <TrafficSection />
                    <WiFiSection />
                    <SystemResourcesSection />
                    <AlertSection />
                    <LogsSection />
                  </AppLayout>
                </LogsProvider>
              </AlertsProvider>
            </SystemProvider>
          </WiFiProvider>
        </TrafficProvider>
      </DeviceProvider>
    </MikrotikDataProvider>
  );
}
