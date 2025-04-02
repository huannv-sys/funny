import { useContext } from "react";
import { Card } from "@/components/ui/card";
import { SystemContext } from "@/hooks/useMikrotikData";
import { Progress } from "@/components/ui/progress";

export default function SystemResourcesSection() {
  const { systemInfo, storageInfo, fileList } = useContext(SystemContext);

  // Format bytes to human-readable format
  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  return (
    <div id="system" className="mt-8">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">System Resources</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Usage Card */}
        <Card className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">CPU Usage</h4>
            
            <div className="flex items-center justify-center">
              {/* CPU Usage Gauge Chart */}
              <div className="relative h-48 w-48">
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - (systemInfo?.cpuLoad || 0) / 100)}
                      strokeLinecap="round"
                      className="text-primary dark:text-blue-500"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="45"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      className="text-3xl font-bold fill-gray-900 dark:fill-white"
                    >
                      {systemInfo?.cpuLoad || 0}%
                    </text>
                    <text
                      x="50"
                      y="65"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      className="text-sm fill-gray-500 dark:fill-gray-400"
                    >
                      CPU Load
                    </text>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <table className="min-w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">CPU Cores</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">{systemInfo?.cpuCores || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Current Frequency</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">{systemInfo?.cpuFrequency || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Temperature</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">{systemInfo?.temperature ? `${systemInfo.temperature}°C` : "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Process Count</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">{systemInfo?.processCount || "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
        
        {/* Memory Usage Card */}
        <Card className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Memory Usage</h4>
            
            <div className="flex items-center justify-center">
              {/* Memory Usage Gauge Chart */}
              <div className="relative h-48 w-48">
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - (systemInfo?.memoryUsedPercent || 0) / 100)}
                      strokeLinecap="round"
                      className="text-secondary dark:text-green-500"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="45"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      className="text-3xl font-bold fill-gray-900 dark:fill-white"
                    >
                      {systemInfo?.memoryUsedPercent || 0}%
                    </text>
                    <text
                      x="50"
                      y="65"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      className="text-sm fill-gray-500 dark:fill-gray-400"
                    >
                      Memory Used
                    </text>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <table className="min-w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Total Memory</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">
                      {systemInfo?.totalMemory ? formatBytes(systemInfo.totalMemory) : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Used Memory</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">
                      {systemInfo?.usedMemory ? formatBytes(systemInfo.usedMemory) : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Free Memory</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">
                      {systemInfo?.freeMemory ? formatBytes(systemInfo.freeMemory) : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Cached</td>
                    <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">
                      {systemInfo?.cachedMemory ? formatBytes(systemInfo.cachedMemory) : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
        
        {/* System Information Card */}
        <Card className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">System Information</h4>
            
            <table className="min-w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Model</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.model || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">RouterOS Version</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.version || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Serial Number</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right font-mono">{systemInfo?.serialNumber || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Architecture</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.architecture || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Board Name</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.boardName || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Firmware Type</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.firmwareType || "N/A"}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-gray-500 dark:text-gray-400">Factory Software</td>
                  <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{systemInfo?.factorySoftware || "N/A"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Storage Usage Card */}
        <Card className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Storage Usage</h4>
            
            <div className="space-y-4">
              {storageInfo.map((device, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(device.total)}</span>
                  </div>
                  <div className="mt-2 relative">
                    <Progress value={device.usedPercent} className="h-2" />
                    <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatBytes(device.used)} used ({device.usedPercent}%)</span>
                      <span>{formatBytes(device.free)} free</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Files</h5>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="pb-2 text-left">File</th>
                      <th className="pb-2 text-right">Size</th>
                      <th className="pb-2 text-right">Creation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {fileList.length > 0 ? (
                      fileList.map((file, index) => (
                        <tr key={index}>
                          <td className="py-2 text-sm text-gray-900 dark:text-white">{file.name}</td>
                          <td className="py-2 text-sm text-gray-900 dark:text-white text-right">{formatBytes(file.size)}</td>
                          <td className="py-2 text-sm text-gray-500 dark:text-gray-400 text-right">{file.creationDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-2 text-sm text-gray-500 dark:text-gray-400 text-center">No files found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
