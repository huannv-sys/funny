import { useEffect, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCards from "@/components/dashboard/StatusCards";
import TrafficSection from "@/components/dashboard/TrafficSection";
import WiFiSection from "@/components/dashboard/WiFiSection";
import SystemResourcesSection from "@/components/dashboard/SystemResourcesSection";
import AlertSection from "@/components/dashboard/AlertSection";
import { 
  DeviceProvider, 
  MikrotikDataProvider, 
  TrafficProvider, 
  WiFiProvider, 
  SystemProvider, 
  AlertsProvider 
} from "@/hooks/useMikrotikData";
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
                <AppLayout>
                  <DashboardHeader isLiveEnabled={isLiveEnabled} setIsLiveEnabled={setIsLiveEnabled} />
                  <StatusCards />
                  
                  <TrafficSection />
                  <WiFiSection />
                  <SystemResourcesSection />
                  <AlertSection />
                </AppLayout>
              </AlertsProvider>
            </SystemProvider>
          </WiFiProvider>
        </TrafficProvider>
      </DeviceProvider>
    </MikrotikDataProvider>
  );
}
