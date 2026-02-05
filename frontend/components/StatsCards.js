import React from 'react';

const StatsCards = ({ stats }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-cream rounded-card p-6 shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}>
          <p className="label-editorial text-moss mb-2">{card.title}</p>
          <p className="text-2xl font-bold text-forest tracking-tight font-inter">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
