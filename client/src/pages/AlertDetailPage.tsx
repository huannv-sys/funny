import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@shared/schema";

import AppLayout from "@/layouts/AppLayout";

export default function AlertDetailPage() {
  const params = useParams();
  const alertId = params.id ? parseInt(params.id) : 0;
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        // Lấy thông tin thiết bị trước
        const deviceRes = await fetch(`/api/devices`);
        const devices = await deviceRes.json();
        
        // Lấy danh sách cảnh báo cho từng thiết bị
        let foundAlertData = null;
        for (const device of devices) {
          const alertsRes = await fetch(`/api/devices/${device.id}/alerts`);
          const alerts = await alertsRes.json();
          
          // Tìm cảnh báo có ID phù hợp
          const foundAlert = alerts.find((a: Alert) => a.id === alertId);
          if (foundAlert) {
            foundAlertData = foundAlert;
            break;
          }
        }
        
        if (foundAlertData) {
          setAlert(foundAlertData);
        } else {
          setError("Không tìm thấy thông tin cảnh báo");
        }
        
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError("Có lỗi xảy ra khi tải thông tin cảnh báo");
        console.error(err);
      }
    };

    if (alertId) {
      fetchAlert();
    }
  }, [alertId]);

  const markAsRead = async () => {
    if (!alert) return;
    
    try {
      setMarkingAsRead(true);
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        const updatedAlert = await res.json();
        setAlert(updatedAlert);
        toast({
          title: "Thành công",
          description: "Đã đánh dấu cảnh báo là đã đọc",
        });
      } else {
        throw new Error("Không thể cập nhật trạng thái cảnh báo");
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật trạng thái cảnh báo",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Nghiêm trọng</Badge>;
      case "error":
        return <Badge variant="destructive">Lỗi</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Cảnh báo</Badge>;
      case "info":
        return <Badge variant="secondary">Thông tin</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết cảnh báo</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-500">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md">
            {error}
          </div>
        ) : alert ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{alert.message}</CardTitle>
                  <CardDescription className="mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
                <div>
                  {getSeverityBadge(alert.severity)}
                  {alert.read && (
                    <Badge variant="outline" className="ml-2">
                      Đã đọc
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ID Cảnh báo
                    </h3>
                    <p className="mt-1 text-sm">{alert.id}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ID Thiết bị
                    </h3>
                    <p className="mt-1 text-sm">{alert.deviceId}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Loại
                    </h3>
                    <p className="mt-1 text-sm">{alert.type}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mức độ
                    </h3>
                    <p className="mt-1 text-sm">{alert.severity}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mt-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Nội dung chi tiết
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {alert.message}
                  </p>
                </div>

                {/* Hiển thị dữ liệu bổ sung là tùy chọn và sẽ được thêm sau */}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t">
              <Button variant="outline" asChild>
                <Link to={`/dashboard/${alert.deviceId}`}>
                  Xem thiết bị
                </Link>
              </Button>
              {!alert.read && (
                <Button 
                  onClick={markAsRead} 
                  disabled={markingAsRead}
                >
                  {markingAsRead ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Đánh dấu đã đọc
                </Button>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center">
            <p className="text-gray-500">Không tìm thấy cảnh báo</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}