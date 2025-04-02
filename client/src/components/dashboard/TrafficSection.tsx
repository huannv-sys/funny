import { useContext, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TrafficContext } from "@/hooks/useMikrotikData";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function TrafficSection() {
  const { interfaces, interfaceTraffic, getInterfaceTraffic } = useContext(TrafficContext);
  const [selectedInterface, setSelectedInterface] = useState<string>("all");
  const [showDownload, setShowDownload] = useState(true);
  const [showUpload, setShowUpload] = useState(true);
  const [chartData, setChartData] = useState({
    labels: Array(10).fill("").map((_, i) => i.toString()),
    datasets: [
      {
        label: "Download",
        data: Array(10).fill(0),
        borderColor: "rgb(74, 222, 128)",
        backgroundColor: "rgba(74, 222, 128, 0.5)",
        tension: 0.3,
      },
      {
        label: "Upload",
        data: Array(10).fill(0),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      }
    ]
  });

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatBits(Number(value));
          }
        }
      }
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ': ';
            }
            label += formatBits(context.parsed.y);
            return label;
          }
        }
      }
    },
  };

  function formatBits(bits: number) {
    if (bits === 0) return "0 bps";
    const sizes = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
    const i = Math.floor(Math.log(bits) / Math.log(1000));
    return (bits / Math.pow(1000, i)).toFixed(2) + " " + sizes[i];
  }

  // Update chart data when interface traffic changes
  useEffect(() => {
    if (!interfaceTraffic) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setChartData(prevData => {
      const newLabels = [...prevData.labels.slice(1), timeLabel];
      
      let downloadData = [...prevData.datasets[0].data.slice(1)];
      let uploadData = [...prevData.datasets[1].data.slice(1)];
      
      // Add the new data point
      if (selectedInterface === "all") {
        // Sum up traffic across all interfaces
        const downloadSum = Object.values(interfaceTraffic).reduce(
          (sum, iface) => sum + (iface?.rxBitsPerSecond || 0), 0
        );
        const uploadSum = Object.values(interfaceTraffic).reduce(
          (sum, iface) => sum + (iface?.txBitsPerSecond || 0), 0
        );
        
        downloadData.push(downloadSum);
        uploadData.push(uploadSum);
      } else {
        // Get traffic for the selected interface
        const selectedTraffic = interfaceTraffic[selectedInterface];
        downloadData.push(selectedTraffic?.rxBitsPerSecond || 0);
        uploadData.push(selectedTraffic?.txBitsPerSecond || 0);
      }
      
      return {
        labels: newLabels,
        datasets: [
          {
            ...prevData.datasets[0],
            data: downloadData,
          },
          {
            ...prevData.datasets[1],
            data: uploadData,
          }
        ]
      };
    });
  }, [interfaceTraffic, selectedInterface]);

  // Filter visible datasets based on checkboxes
  useEffect(() => {
    setChartData(prevData => ({
      ...prevData,
      datasets: [
        {
          ...prevData.datasets[0],
          hidden: !showDownload,
        },
        {
          ...prevData.datasets[1],
          hidden: !showUpload,
        }
      ]
    }));
  }, [showDownload, showUpload]);

  // Handle interface change
  const handleInterfaceChange = (value: string) => {
    setSelectedInterface(value);
    getInterfaceTraffic(value); // Request new data for the selected interface
  };

  return (
    <div id="traffic" className="mt-8">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Network Traffic</h3>
      
      <Card className="bg-white dark:bg-dark-card shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white">Interface Traffic</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Real-time bandwidth usage per interface</p>
          </div>
          
          <div className="mt-3 md:mt-0 flex space-x-3">
            <Select 
              value={selectedInterface}
              onValueChange={handleInterfaceChange}
            >
              <SelectTrigger className="w-[180px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                <SelectValue placeholder="Select interface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interfaces</SelectItem>
                {interfaces.map(iface => (
                  <SelectItem key={iface.name} value={iface.name}>
                    {iface.name} ({iface.comment || iface.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-download" 
                  checked={showDownload} 
                  onCheckedChange={(checked) => setShowDownload(checked as boolean)} 
                />
                <Label htmlFor="show-download">Download</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-upload" 
                  checked={showUpload}
                  onCheckedChange={(checked) => setShowUpload(checked as boolean)} 
                />
                <Label htmlFor="show-upload">Upload</Label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart Container for Traffic */}
        <div className="chart-container h-60">
          <Line data={chartData} options={options} />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Traffic Stats */}
          {interfaces.slice(0, 4).map(iface => {
            const traffic = interfaceTraffic[iface.name];
            return (
              <div key={iface.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {iface.name} ({iface.comment || iface.type})
                </h5>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Download</div>
                    <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {formatBits(traffic?.rxBitsPerSecond || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Upload</div>
                    <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {formatBits(traffic?.txBitsPerSecond || 0)}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-block w-2 h-2 rounded-full ${iface.running ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
