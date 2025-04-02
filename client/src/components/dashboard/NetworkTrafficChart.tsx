import React, { useContext, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TrafficContext } from '@/hooks/useMikrotikData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { InterfaceTraffic } from '@/types/mikrotik';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface NetworkTrafficChartProps {
  interfaceName: string;
  height?: number;
}

// Format bytes to appropriate unit
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

const NetworkTrafficChart: React.FC<NetworkTrafficChartProps> = ({ 
  interfaceName,
  height = 300
}) => {
  const { interfaceTraffic, getInterfaceTraffic } = useContext(TrafficContext);
  const [trafficData, setTrafficData] = useState<InterfaceTraffic[]>([]);
  
  // Poll for interface traffic data
  useEffect(() => {
    if (!interfaceName) return;
    
    // Initial fetch
    getInterfaceTraffic(interfaceName);
    
    // Setup polling
    const interval = setInterval(() => {
      getInterfaceTraffic(interfaceName);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [interfaceName, getInterfaceTraffic]);
  
  // Update traffic data when interfaceTraffic changes
  useEffect(() => {
    if (interfaceName && interfaceTraffic[interfaceName]) {
      setTrafficData(prev => {
        // Keep only the last 30 data points
        const newData = [...prev, interfaceTraffic[interfaceName]];
        return newData.slice(-30);
      });
    }
  }, [interfaceName, interfaceTraffic]);
  
  // Format data for chart
  const chartData = {
    labels: trafficData.map((_, index) => `${30 - index} sec`).reverse(),
    datasets: [
      {
        label: 'Download',
        data: trafficData.map(d => d?.rxBitsPerSecond || 0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Upload',
        data: trafficData.map(d => d?.txBitsPerSecond || 0),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }
    ]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: string | number) {
            return formatBytes(Number(tickValue));
          }
        }
      },
      x: {
        ticks: {
          maxTicksLimit: 6,
          maxRotation: 0
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatBytes(context.parsed.y);
            return label;
          }
        }
      }
    },
  };
  
  // Get the latest values for display
  const latestRx = trafficData.length > 0 ? trafficData[trafficData.length - 1]?.rxBitsPerSecond : 0;
  const latestTx = trafficData.length > 0 ? trafficData[trafficData.length - 1]?.txBitsPerSecond : 0;
  
  return (
    <div>
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm">Download: <strong>{formatBytes(latestRx)}</strong></span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm">Upload: <strong>{formatBytes(latestTx)}</strong></span>
        </div>
      </div>
      
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="text-xs text-center mt-2 text-gray-500">
        Interface: {interfaceName}
      </div>
    </div>
  );
};

export default NetworkTrafficChart;