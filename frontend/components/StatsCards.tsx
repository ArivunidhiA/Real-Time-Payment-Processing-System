import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: {
    approvalRate?: number;
    systemMetrics?: { averageLatency?: number; uptime?: number };
    transactionsLastMinute?: number;
    totalVolume?: number;
  } | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-cream rounded-card p-5 sm:p-6 animate-pulse shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}>
            <div className="h-4 bg-olive rounded w-3/4 mb-2" />
            <div className="h-8 bg-olive rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: 'Approval Rate', value: `${Number(stats.approvalRate ?? 0).toFixed(3)}%` },
    { title: 'Avg Latency', value: `${stats.systemMetrics?.averageLatency || 0}ms` },
    { title: 'Uptime', value: `${stats.systemMetrics?.uptime || 0}%` },
    { title: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="bg-cream rounded-card p-6 sm:p-8 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(1,71,46,0.25)] transition-shadow duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}
        >
          <p className="label-editorial text-moss mb-2">{card.title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-forest tracking-tight font-inter">
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
