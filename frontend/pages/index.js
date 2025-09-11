import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import StatsCards from '../components/StatsCards';
import VolumeChart from '../components/VolumeChart';
import TransactionTable from '../components/TransactionTable';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
        fetch(`${backendUrl}/transactions`),
        fetch(`${backendUrl}/stats`)
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
      const response = await fetch(`${backendUrl}/transactions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh stats after generating a transaction
        setTimeout(fetchData, 1000);
      }
    } catch (error) {
      console.error('Error generating transaction:', error);
    }
  };

  // Start/stop producer
  const toggleProducer = async (action) => {
    try {
      const response = await fetch(`${backendUrl}/transactions/producer/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log(`Producer ${action}ed successfully`);
      }
    } catch (error) {
      console.error(`Error ${action}ing producer:`, error);
    }
  };

  useEffect(() => {
    fetchData();
    connectWebSocket();

    // Refresh stats every 10 seconds
    const statsInterval = setInterval(() => {
      fetch(`${backendUrl}/stats`)
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
        return 'text-success-600 bg-success-100';
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Real-Time Payment Dashboard</h1>
                <p className="text-sm text-gray-600">Live transaction monitoring and analytics</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
                  {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Offline'}
                </div>
                <button
                  onClick={generateTransaction}
                  className="btn-primary"
                >
                  Generate Transaction
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <VolumeChart data={stats?.volumePerMinute} />
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">System Controls</h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => toggleProducer('start')}
                    className="btn-primary flex-1"
                  >
                    Start Producer
                  </button>
                  <button
                    onClick={() => toggleProducer('stop')}
                    className="btn-secondary flex-1"
                  >
                    Stop Producer
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Total Transactions:</strong> {stats?.totalTransactions || 0}</p>
                  <p><strong>Approved:</strong> {stats?.approvedTransactions || 0}</p>
                  <p><strong>Declined:</strong> {stats?.declinedTransactions || 0}</p>
                  <p><strong>Total Volume:</strong> ${stats?.totalVolume?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <TransactionTable transactions={transactions} isLoading={isLoading} />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p>Real-Time Payment Processing System - Built with Next.js, Node.js, Kafka, and PostgreSQL</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
