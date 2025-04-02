import React from 'react';

interface GaugeChartProps {
  value: number;
  max: number;
  label?: string;
  size?: number;
  thickness?: number;
  startAngle?: number;
  endAngle?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  label = '',
  size = 200,
  thickness = 20,
  startAngle = 135,
  endAngle = 405,
}) => {
  // Normalize value to percentage
  const percentage = Math.min(Math.max(value, 0), max) / max;
  
  // Calculate angles
  const angleRange = endAngle - startAngle;
  const valueAngle = startAngle + (angleRange * percentage);
  
  // Calculate coordinates for the arc
  const radius = (size - thickness) / 2;
  const center = size / 2;
  
  // Determine color based on percentage
  const getColor = (percent: number) => {
    if (percent < 0.6) return '#22c55e'; // Green
    if (percent < 0.75) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };
  
  const arc = (
    startAngleRad: number,
    endAngleRad: number,
    radius: number,
    largeArcFlag = 0
  ) => {
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };
  
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;
  const valueAngleRad = (valueAngle * Math.PI) / 180;
  
  // Background path
  const backgroundArc = arc(startAngleRad, endAngleRad, radius, 1);
  
  // Value path
  const valueArc = arc(startAngleRad, valueAngleRad, radius, percentage > 0.5 ? 1 : 0);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={thickness}
          className="dark:stroke-gray-800"
        />
        
        {/* Value track */}
        <path
          d={valueArc}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        
        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={thickness / 2}
          fill="white"
          className="dark:fill-gray-900"
        />
      </svg>
      
      {/* Value label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
      >
        <div className="text-3xl font-bold">
          {Math.round(value)}
          <span className="text-sm ml-1">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;