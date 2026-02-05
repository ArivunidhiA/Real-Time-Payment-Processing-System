import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface VolumeChartProps {
  data: Array<{ minute: string; volume: number; count: number }> | null;
}

const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-cream rounded-card p-5 sm:p-6 shadow-2xl"
        style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-forest shrink-0" aria-hidden />
          <h3 className="label-editorial text-forest">TRANSACTION VOLUME (LAST HOUR)</h3>
        </div>
        <div className="h-48 sm:h-64 flex items-center justify-center text-moss font-inter text-sm sm:text-base">No data available</div>
      </motion.div>
    );
  }

  const chartData = data
    .map((item) => ({
      time: new Date(item.minute).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      volume: parseFloat(item.volume.toString()),
      count: parseInt(item.count.toString()),
    }))
    .reverse();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cream border border-forest/20 rounded-card p-3 shadow-xl">
          <p className="label-editorial text-forest text-[10px] mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="font-inter text-forest text-sm font-bold">
              {entry.name === 'volume' ? 'Volume' : 'Count'}:{' '}
              {entry.name === 'volume'
                ? `$${entry.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-cream rounded-card p-6 shadow-2xl"
      style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-forest shrink-0" aria-hidden />
        <h3 className="label-editorial text-forest">TRANSACTION VOLUME (LAST HOUR)</h3>
      </div>
      <div className="h-56 sm:h-72 md:h-80 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="editorialVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#01472e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#01472e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 26, 26, 0.25)" strokeWidth={1.5} />
            <XAxis
              dataKey="time"
              stroke="rgba(26, 26, 26, 0.25)"
              tick={{ fill: '#001a10', fontSize: 11, fontFamily: 'Inter', fontWeight: 700 }}
              tickLine={{ stroke: 'rgba(26, 26, 26, 0.25)', strokeWidth: 1 }}
              axisLine={{ stroke: 'rgba(26, 26, 26, 0.25)', strokeWidth: 1 }}
            />
            <YAxis
              stroke="rgba(26, 26, 26, 0.25)"
              tick={{ fill: '#001a10', fontSize: 11, fontWeight: 700 }}
              tickLine={{ stroke: 'rgba(26, 26, 26, 0.25)', strokeWidth: 1 }}
              axisLine={{ stroke: 'rgba(26, 26, 26, 0.25)', strokeWidth: 1 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#01472e', fontSize: 11 }} iconType="circle" />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#01472e"
              strokeWidth={2}
              fill="url(#editorialVolume)"
              dot={{ fill: '#fefae0', stroke: '#01472e', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 4, stroke: '#01472e', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default VolumeChart;
