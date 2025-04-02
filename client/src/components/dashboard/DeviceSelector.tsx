import { useContext, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeviceContext } from "@/hooks/useMikrotikData";

export default function DeviceSelector() {
  const { devices, selectedDevice, selectDevice } = useContext(DeviceContext);

  const handleDeviceChange = (value: string) => {
    const selectedId = parseInt(value, 10);
    const device = devices.find(d => d.id === selectedId);
    if (device) {
      console.log("Manually selecting device:", device.id, device.name);
      selectDevice(device);
      
      // Sau khi thay đổi thiết bị, đảm bảo refetch dữ liệu
      setTimeout(() => {
        console.log("Device selection changed, refreshing data...");
      }, 100);
    }
  };

  // Auto-select the first device if none is selected
  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      console.log("Auto-selecting first device:", devices[0].id, devices[0].name);
      selectDevice(devices[0]);
    }
  }, [devices, selectedDevice, selectDevice]);

  // Make sure we have a valid selection
  const hasValidDevices = devices.length > 0;
  const currentValue = selectedDevice?.id.toString() || ""; // Empty string if no selection to force re-selection

  // In ra trạng thái bộ chọn thiết bị để debug
  console.log("DeviceSelector render:", { 
    hasValidDevices, 
    deviceCount: devices.length, 
    selectedDeviceId: selectedDevice?.id,
    currentValue 
  });

  // If no devices are available, show a placeholder
  if (!hasValidDevices) {
    return (
      <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm">
        No devices available
      </div>
    );
  }

  return (
    <Select
      value={currentValue}
      onValueChange={handleDeviceChange}
    >
      <SelectTrigger className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md text-sm">
        <SelectValue 
          placeholder="Select a device"
        >
          {selectedDevice ? `${selectedDevice.name} (${selectedDevice.ipAddress})` : "Select a device"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {devices.map(device => (
          <SelectItem key={device.id} value={device.id.toString()}>
            {device.name} ({device.ipAddress})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
