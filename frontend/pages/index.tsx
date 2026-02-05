import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Component as EtherealShadow } from '@/components/ui/ethereal-shadow';
import StatsCards from '../components/StatsCards';
import VolumeChart from '../components/VolumeChart';
import TransactionTable from '../components/TransactionTable';
import { Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Transaction {
  id: number;
  transaction_id: string;
  user_id: number;
  amount: number;
  merchant: string;
  status: string;
  timestamp: string;
}

interface Stats {
  approvalRate: number;
  totalTransactions: number;
  approvedTransactions: number;
  declinedTransactions: number;
  averageApprovedAmount: number;
  totalVolume: number;
  transactionsLastMinute: number;
  volumePerMinute: Array<{
    minute: string;
    count: number;
    volume: number;
  }>;
  systemMetrics: {
    averageLatency: number;
    uptime: number;
    processedTransactions: number;
    transactionsPerSecond: string;
  };
}

// Fallback when backend/DB is unavailable (e.g. Render DB expired)
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, transaction_id: 'txn_mock_001', user_id: 1, amount: 49.99, merchant: 'Amazon', status: 'APPROVED', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 2, transaction_id: 'txn_mock_002', user_id: 2, amount: 12.50, merchant: 'Starbucks', status: 'APPROVED', timestamp: new Date(Date.now() - 240000).toISOString() },
  { id: 3, transaction_id: 'txn_mock_003', user_id: 3, amount: 199.00, merchant: 'Netflix', status: 'DECLINED', timestamp: new Date(Date.now() - 360000).toISOString() },
  { id: 4, transaction_id: 'txn_mock_004', user_id: 1, amount: 34.20, merchant: 'Uber', status: 'APPROVED', timestamp: new Date(Date.now() - 480000).toISOString() },
  { id: 5, transaction_id: 'txn_mock_005', user_id: 4, amount: 89.99, merchant: 'Apple Store', status: 'APPROVED', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 6, transaction_id: 'txn_mock_006', user_id: 2, amount: 5.99, merchant: 'Spotify', status: 'APPROVED', timestamp: new Date(Date.now() - 720000).toISOString() },
  { id: 7, transaction_id: 'txn_mock_007', user_id: 5, amount: 156.00, merchant: 'Target', status: 'APPROVED', timestamp: new Date(Date.now() - 840000).toISOString() },
  { id: 8, transaction_id: 'txn_mock_008', user_id: 3, amount: 22.40, merchant: 'McDonald\'s', status: 'DECLINED', timestamp: new Date(Date.now() - 960000).toISOString() },
];

function getMockVolumePerMinute(): Array<{ minute: string; count: number; volume: number }> {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const t = new Date(now - (11 - i) * 5 * 60 * 1000);
    out.push({
      minute: t.toISOString(),
      count: 3 + Math.floor(Math.random() * 8),
      volume: 80 + Math.floor(Math.random() * 400),
    });
  }
  return out;
}

const MOCK_STATS: Stats = {
  approvalRate: 87.5,
  totalTransactions: 1247,
  approvedTransactions: 1091,
  declinedTransactions: 156,
  averageApprovedAmount: 67.42,
  totalVolume: 73582.18,
  transactionsLastMinute: 12,
  volumePerMinute: getMockVolumePerMinute(),
  systemMetrics: {
    averageLatency: 142,
    uptime: 99.99,
    processedTransactions: 1247,
    transactionsPerSecond: '0.35',
  },
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const apiBaseUrl = `${backendUrl}/api`;

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      // Fix: Handle both http and https for WebSocket URL
      let wsUrl = backendUrl;
      if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      } else if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      }
      wsRef.current = new WebSocket(`${wsUrl}/stream`);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'transaction') {
            // Add new transaction to the beginning of the list
            setTransactions(prev => [message.data, ...prev.slice(0, 49)]);
            // Refresh stats when new transaction arrives
            fetch(`${apiBaseUrl}/stats`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.data) {
                  setStats(data.data);
                }
              })
              .catch(err => console.error('Error refreshing stats:', err));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [transactionsRes, statsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/transactions`),
        fetch(`${apiBaseUrl}/stats`)
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data || []);
      } else {
        setTransactions(MOCK_TRANSACTIONS);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || null);
      } else {
        setStats({ ...MOCK_STATS, volumePerMinute: getMockVolumePerMinute() });
      }
      if (!transactionsRes.ok || !statsRes.ok) {
        setLoadError('Showing sample data. Backend or database unavailable (e.g. Render DB expired).');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTransactions(MOCK_TRANSACTIONS);
      setStats({ ...MOCK_STATS, volumePerMinute: getMockVolumePerMinute() });
      setLoadError('Showing sample data. Cannot reach backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    connectWebSocket();

    // Refresh stats every 10 seconds
    const statsInterval = setInterval(() => {
      fetch(`${apiBaseUrl}/stats`)
        .then(res => res.json())
        .then(data => setStats(data.data))
        .catch(console.error);
    }, 10000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(statsInterval);
    };
  }, []);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'disconnected':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <>
      <Head>
        <title>Real-Time Payment Dashboard</title>
        <meta name="description" content="Real-time payment processing system dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed inset-0 -z-10">
        <EtherealShadow
          color="rgba(99, 102, 241, 0.8)"
          animation={{ scale: 60, speed: 25 }}
          noise={{ opacity: 0.5, scale: 1.2 }}
          sizing="fill"
        />
        <div className="absolute inset-0 bg-black/70 pointer-events-none z-[1]" aria-hidden />
      </div>
      <div className="relative z-10 min-h-screen overflow-y-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Real-Time Payment Dashboard
                  </h1>
                  <p className="text-sm text-white/90 mt-1 font-medium">Live transaction monitoring and analytics</p>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-lg border backdrop-blur-sm flex items-center gap-2 ${getConnectionStatusColor()}`}
                  >
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-4 h-4 icon-glow" />
                    ) : (
                      <WifiOff className="w-4 h-4 icon-glow" />
                    )}
                    <span className="text-xs font-medium">
                      {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loadError && (
              <div className="mb-6 p-4 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm">
                {loadError}
              </div>
            )}
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <VolumeChart data={stats?.volumePerMinute || null} />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 card-glow"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                <div className="text-sm text-white space-y-2">
                  <p><strong className="text-white font-bold">Total Transactions:</strong> <span className="font-semibold">{stats?.totalTransactions ?? 0}</span></p>
                  <p><strong className="text-white font-bold">Approved:</strong> <span className="font-semibold text-green-400">{stats?.approvedTransactions ?? 0}</span></p>
                  <p><strong className="text-white font-bold">Declined:</strong> <span className="font-semibold text-red-400">{stats?.declinedTransactions ?? 0}</span></p>
                  <p><strong className="text-white font-bold">Total Volume:</strong> <span className="font-semibold text-blue-400">${(stats?.totalVolume ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                </div>
              </motion.div>
            </div>

            {/* Transaction Table */}
            <TransactionTable transactions={transactions} isLoading={isLoading} />
          </main>

          {/* Footer */}
          <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center text-sm text-white/90 font-medium">
                <p>Real-Time Payment Processing System - Built with Next.js, Node.js, and PostgreSQL</p>
              </div>
            </div>
          </footer>
        </div>
    </>
  );
}

