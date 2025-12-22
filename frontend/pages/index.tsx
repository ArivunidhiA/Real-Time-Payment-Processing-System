import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { EtherealShadow } from '@/components/ui/ethereal-shadow';
import { Button } from '@/components/ui/neon-button';
import StatsCards from '../components/StatsCards';
import VolumeChart from '../components/VolumeChart';
import TransactionTable from '../components/TransactionTable';
import { Play, Square, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const apiBaseUrl = `${backendUrl}/api`;

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      const wsUrl = backendUrl.replace('http', 'ws');
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
      
      // Fetch transactions and stats in parallel
      const [transactionsRes, statsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/transactions`),
        fetch(`${apiBaseUrl}/stats`)
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a single transaction
  const generateTransaction = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/transactions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Transaction generated:', data);
        // Refresh stats and transactions after generating
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        console.error('Failed to generate transaction:', data);
        alert(`Error: ${data.error || 'Failed to generate transaction'}`);
      }
    } catch (error) {
      console.error('Error generating transaction:', error);
      alert('Error generating transaction. Please check console for details.');
    }
  };

  // Start/stop producer
  const toggleProducer = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch(`${apiBaseUrl}/transactions/producer/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action === 'start' ? JSON.stringify({ interval: 2000 }) : undefined,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`Producer ${action}ed successfully:`, data.message);
        // Refresh stats to show updated status
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        console.error(`Failed to ${action} producer:`, data);
        alert(`Error: ${data.error || `Failed to ${action} producer`}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing producer:`, error);
      alert(`Error ${action}ing producer. Please check console for details.`);
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

      <div className="fixed inset-0 bg-black -z-20" />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <EtherealShadow
          color="rgba(99, 102, 241, 0.4)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 0.6, scale: 1.2 }}
          sizing="fill"
        />
      </div>
      <div className="relative z-10 min-h-screen overflow-y-auto bg-transparent">
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
                  <Button
                    onClick={generateTransaction}
                    className="flex items-center gap-2 text-blue-400"
                  >
                    <RefreshCw className="w-4 h-4 icon-glow-blue" />
                    Generate Transaction
                  </Button>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <h3 className="text-lg font-semibold text-white mb-4">System Controls</h3>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => toggleProducer('start')}
                      className="flex-1 text-green-400 border-green-500/30 bg-green-500/5 hover:bg-green-500/0 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 icon-glow-green" />
                      Start Producer
                    </Button>
                    <Button
                      onClick={() => toggleProducer('stop')}
                      className="flex-1 text-red-400 border-red-500/30 bg-red-500/5 hover:bg-red-500/0 flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 icon-glow" />
                      Stop Producer
                    </Button>
                  </div>
                  <div className="text-sm text-white space-y-2 pt-4 border-t border-white/20">
                    <p><strong className="text-white font-bold">Total Transactions:</strong> <span className="font-semibold">{stats?.totalTransactions || 0}</span></p>
                    <p><strong className="text-white font-bold">Approved:</strong> <span className="font-semibold text-green-400">{stats?.approvedTransactions || 0}</span></p>
                    <p><strong className="text-white font-bold">Declined:</strong> <span className="font-semibold text-red-400">{stats?.declinedTransactions || 0}</span></p>
                    <p><strong className="text-white font-bold">Total Volume:</strong> <span className="font-semibold text-blue-400">${(stats?.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  </div>
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

