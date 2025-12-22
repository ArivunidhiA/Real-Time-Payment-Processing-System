import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface VolumeChartProps {
  data: Array<{
    minute: string;
    volume: number;
    count: number;
  }> | null;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl card-glow"
      >
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 icon-glow" style={{ color: '#ffffff' }} />
          <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>Transaction Volume (Last Hour)</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p style={{ color: '#ffffff' }}>No data available</p>
        </div>
      </motion.div>
    );
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    time: new Date(item.minute).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    volume: parseFloat(item.volume.toString()),
    count: parseInt(item.count.toString())
  })).reverse(); // Reverse to show chronological order

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md rounded-lg shadow-xl p-3 border border-white/20">
          <p className="text-sm font-semibold text-white mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium text-white" style={{ color: entry.color || '#fff' }}>
              {entry.name === 'volume' ? 'Volume' : 'Count'}:{' '}
              {entry.name === 'volume' 
                ? `$${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl card-glow"
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 icon-glow" style={{ color: '#ffffff' }} />
        <h3 className="text-lg font-bold" style={{ color: '#ffffff' }}>Transaction Volume (Last Hour)</h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="#ffffff"
              fill="#ffffff"
              tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 600 }}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#ffffff"
              fill="#ffffff"
              tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 600 }}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#ffffff', fontWeight: 600 }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#60a5fa" 
              strokeWidth={3}
              fill="url(#colorVolume)"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#a78bfa" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default VolumeChart;

