import React from 'react';
import { TrendingUp, Zap, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: {
    approvalRate?: number;
    systemMetrics?: {
      averageLatency?: number;
      uptime?: number;
    };
    transactionsLastMinute?: number;
    totalVolume?: number;
  } | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 animate-pulse card-glow">
            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-white/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Approval Rate',
      value: `${stats.approvalRate?.toFixed(2) || 0}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Avg Latency',
      value: `${stats.systemMetrics?.averageLatency || 0}ms`,
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Uptime',
      value: `${stats.systemMetrics?.uptime || 0}%`,
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Total Volume',
      value: `$${(stats.totalVolume || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`bg-white/10 backdrop-blur-lg rounded-xl border ${card.borderColor} p-6 shadow-xl hover:shadow-2xl transition-all duration-300 ${
              card.color.includes('green') ? 'card-glow-green' :
              card.color.includes('blue') ? 'card-glow-blue' :
              card.color.includes('purple') ? 'card-glow-purple' :
              card.color.includes('emerald') ? 'card-glow-emerald' : 'card-glow'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white mb-2" style={{ color: '#ffffff !important' }}>{card.title}</p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className={`w-14 h-14 ${card.bgColor} rounded-xl flex items-center justify-center border ${card.borderColor}`}>
                <Icon className={`w-7 h-7 ${card.color} ${
                  card.color.includes('green') ? 'icon-glow-green' :
                  card.color.includes('blue') ? 'icon-glow-blue' :
                  card.color.includes('purple') ? 'icon-glow-purple' :
                  card.color.includes('emerald') ? 'icon-glow-emerald' : 'icon-glow'
                }`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;

