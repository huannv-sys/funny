import { useContext } from "react";
import { Card } from "@/components/ui/card";
import { ClockIcon, ArrowsUpDownIcon, UsersIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";
import { SystemContext, TrafficContext, WiFiContext } from "@/hooks/useMikrotikData";

export default function StatusCards() {
  const { systemInfo } = useContext(SystemContext);
  const { trafficSummary } = useContext(TrafficContext);
  const { wifiClients } = useContext(WiFiContext);

  const formatUptime = (uptime: string | undefined) => {
    if (!uptime) return "N/A";
    return uptime;
  };

  const formatBytes = (bytes: number | undefined, decimals = 2) => {
    if (bytes === undefined) return "N/A";
    if (bytes === 0) return "0 B";
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Uptime Card */}
      <Card className="bg-white dark:bg-dark-card overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="text-secondary dark:text-green-400 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Uptime</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    <span className="font-mono">{formatUptime(systemInfo?.uptime)}</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-2">
          <div className="text-sm">
            <span className="font-medium text-gray-500 dark:text-gray-400">Last reboot: </span>
            <span className="font-medium text-gray-900 dark:text-white">{systemInfo?.lastReboot || "Unknown"}</span>
          </div>
        </div>
      </Card>

      {/* Total Traffic Card */}
      <Card className="bg-white dark:bg-dark-card overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowsUpDownIcon className="text-primary dark:text-blue-400 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Traffic Today</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    <span className="font-mono">{formatBytes(trafficSummary?.total)}</span>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-2">
          <div className="text-sm flex justify-between">
            <div>
              <span className="font-medium text-green-600 dark:text-green-400">
                <ArrowDownIcon className="h-4 w-4 inline" /> {formatBytes(trafficSummary?.download)}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                <ArrowUpIcon className="h-4 w-4 inline" /> {formatBytes(trafficSummary?.upload)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Clients Card */}
      <Card className="bg-white dark:bg-dark-card overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="text-accent dark:text-purple-400 h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Connected Clients</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    <span className="font-mono">{wifiClients.length}</span>
                    {wifiClients.length > 0 && (
                      <span className="text-xs text-green-500 ml-2">
                        <ArrowUpIcon className="h-3 w-3 inline" /> {3}
                      </span>
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-2">
          <div className="text-sm flex justify-between">
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Wired: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {wifiClients.length > 0 ? 12 : 0}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">WiFi: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {wifiClients.length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* System Health Card */}
      <Card className="bg-white dark:bg-dark-card overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-danger dark:text-red-400 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">System Health</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {systemInfo && systemInfo.temperature > 65 ? (
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Warning
                      </span>
                    ) : (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Good
                      </span>
                    )}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-2">
          <div className="text-sm">
            <span className="font-medium text-amber-600 dark:text-amber-400">CPU temperature: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {systemInfo ? `${systemInfo.temperature}°C` : "N/A"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
