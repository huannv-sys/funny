import { useContext } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeviceContext } from "@/hooks/useMikrotikData";

export default function DeviceSelector() {
  const { devices, selectedDevice, selectDevice } = useContext(DeviceContext);

  const handleDeviceChange = (value: string) => {
    const selectedId = parseInt(value, 10);
    const device = devices.find(d => d.id === selectedId);
    if (device) {
      selectDevice(device);
    }
  };

  return (
    <Select
      value={selectedDevice ? selectedDevice.id.toString() : ""}
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
