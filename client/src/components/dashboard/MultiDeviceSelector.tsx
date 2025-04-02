import { useContext, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { DeviceContext } from "@/hooks/useMikrotikData";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function MultiDeviceSelector() {
  const { devices, selectedDevices, toggleDeviceSelection, selectMultipleDevices } = useContext(DeviceContext);

  // Auto-select the first device if none is selected
  useEffect(() => {
    if (devices.length > 0 && selectedDevices.length === 0) {
      selectMultipleDevices([devices[0]]);
    }
  }, [devices, selectedDevices, selectMultipleDevices]);

  // Check if there are valid devices
  const hasValidDevices = devices.length > 0;

  // If no devices are available, show a placeholder
  if (!hasValidDevices) {
    return (
      <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm">
        Không có thiết bị nào
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-sm font-medium"
          >
            Thiết bị đã chọn ({selectedDevices.length})
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2">
          <div className="space-y-2">
            <div className="text-sm font-medium pb-1 border-b">Chọn thiết bị</div>
            {devices.map(device => (
              <div key={device.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`device-${device.id}`}
                  checked={selectedDevices.some(d => d.id === device.id)}
                  onCheckedChange={() => toggleDeviceSelection(device)}
                />
                <label 
                  htmlFor={`device-${device.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {device.name} ({device.ipAddress})
                </label>
              </div>
            ))}
            <div className="pt-2 flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => selectMultipleDevices(devices)}
              >
                Chọn tất cả
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => selectMultipleDevices([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedDevices.length > 0 && (
        <div className="flex space-x-1">
          {selectedDevices.slice(0, 3).map(device => (
            <Badge key={device.id} variant="outline" className="px-2 py-0.5 text-xs">
              {device.name}
            </Badge>
          ))}
          {selectedDevices.length > 3 && (
            <Badge variant="outline" className="px-2 py-0.5 text-xs">
              +{selectedDevices.length - 3}
            </Badge>
          )}
        </div>
      )}
      
      {selectedDevices.length > 1 && (
        <Link href="/multi-dashboard">
          <Button variant="secondary" size="sm" className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            So sánh
          </Button>
        </Link>
      )}
    </div>
  );
}