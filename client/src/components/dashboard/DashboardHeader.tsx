import { ArrowPathIcon, CalendarIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DashboardHeaderProps {
  isLiveEnabled: boolean;
  setIsLiveEnabled: (value: boolean) => void;
}

export default function DashboardHeader({ isLiveEnabled, setIsLiveEnabled }: DashboardHeaderProps) {
  const refreshData = () => {
    // Trigger a manual refresh of all data
    window.location.reload();
  };

  return (
    <div className="pb-5 border-b border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Dashboard Overview</h3>
      <div className="mt-3 flex sm:mt-0 sm:ml-4">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">Live updates:</span>
          <div className="flex items-center space-x-2">
            <Switch 
              id="live-updates" 
              checked={isLiveEnabled} 
              onCheckedChange={setIsLiveEnabled}
            />
            <Label htmlFor="live-updates" className="sr-only">
              Live updates
            </Label>
          </div>
        </div>
        <div className="ml-4 relative flex">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
          >
            <CalendarIcon className="h-4 w-4" /> 
            Last 24 Hours
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
          <Button 
            className="ml-3 flex items-center" 
            onClick={refreshData}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
