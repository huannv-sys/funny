import { useContext } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertsContext } from "@/hooks/useMikrotikData";
import { InfoIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AlertSection() {
  const { alerts, markAllAlertsAsRead } = useContext(AlertsContext);
  const { toast } = useToast();

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircleIcon className="text-danger text-xl" />;
      case "warning":
        return <AlertTriangleIcon className="text-warning text-xl" />;
      case "info":
        return <InfoIcon className="text-primary text-xl" />;
      default:
        return <InfoIcon className="text-primary text-xl" />;
    }
  };

  const getAlertBgClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900 dark:bg-opacity-20";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900 dark:bg-opacity-20";
      case "info":
        return "bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20";
      default:
        return "";
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return "Unknown time";
    
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAlertsAsRead();
      toast({
        title: "Success",
        description: "All alerts marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark alerts as read",
        variant: "destructive",
      });
    }
  };

  const handleDismissAlert = async (alertId: number) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        toast({
          title: "Thành công",
          description: "Đã đánh dấu cảnh báo là đã đọc",
        });
      } else {
        throw new Error("Không thể cập nhật trạng thái cảnh báo");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật trạng thái cảnh báo",
        variant: "destructive",
      });
    }
  };

  // Use Link component instead of direct navigation
  const handleViewDetails = (alertId: number) => {
    // No longer used as we're using Link component now
  };

  return (
    <div id="alerts" className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Cảnh báo hệ thống</h3>
        <Button 
          variant="destructive"
          onClick={handleMarkAllAsRead}
          disabled={alerts.length === 0 || alerts.every(alert => alert.read)}
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
      
      <Card className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <li 
                    key={alert.id} 
                    className={`py-4 px-4 rounded-md mb-2 ${alert.read ? '' : getAlertBgClass(alert.severity)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(alert.timestamp)}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {alert.description || "Không có thông tin chi tiết bổ sung."}
                        </div>
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/alerts/${alert.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
                          {!alert.read && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="ml-2"
                              onClick={() => handleDismissAlert(alert.id)}
                            >
                              Bỏ qua
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-8 text-center">
                  <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Không có cảnh báo nào vào lúc này</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
