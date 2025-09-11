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
    {
      title: 'Approval Rate',
      value: `${stats.approvalRate}%`,
      icon: '📊',
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Avg Latency',
      value: `${stats.systemMetrics?.averageLatency || 0}ms`,
      icon: '⚡',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Uptime',
      value: `${stats.systemMetrics?.uptime || 0}%`,
      icon: '🟢',
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Volume (Last Min)',
      value: `$${stats.transactionsLastMinute || 0}`,
      icon: '💰',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
