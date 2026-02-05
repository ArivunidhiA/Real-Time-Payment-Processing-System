import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
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

// Fallback when backend/DB is unavailable — rich, live-looking mock data
const MOCK_MERCHANTS = ['Amazon', 'Starbucks', 'Netflix', 'Uber', 'Apple Store', 'Spotify', 'Target', 'Walmart', 'Costco', 'Best Buy', 'Home Depot', 'McDonald\'s', 'Chipotle', 'DoorDash', 'Lyft', 'Shell', 'Exxon', 'Whole Foods', 'Trader Joe\'s', 'Adobe', 'Microsoft', 'Google Cloud', 'AWS', 'Zoom', 'Slack'];
const MOCK_STATUSES = ['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'DECLINED', 'PENDING'] as const;

function generateMockTransactions(): Transaction[] {
  const list: Transaction[] = [];
  const now = Date.now();
  for (let i = 0; i < 45; i++) {
    const secAgo = 2 + Math.floor(Math.random() * 178);
    const amount = Math.round((5 + Math.random() * 495) * 100) / 100;
    list.push({
      id: i + 1,
      transaction_id: `txn_mock_${String(i + 1).padStart(4, '0')}`,
      user_id: 1 + (i % 12),
      amount,
      merchant: MOCK_MERCHANTS[i % MOCK_MERCHANTS.length],
      status: MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)],
      timestamp: new Date(now - secAgo * 1000).toISOString(),
    });
  }
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const MOCK_TRANSACTIONS = generateMockTransactions();

function getMockVolumePerMinute(): Array<{ minute: string; count: number; volume: number }> {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const t = new Date(now - (11 - i) * 5 * 60 * 1000);
    out.push({
      minute: t.toISOString(),
      count: 12 + Math.floor(Math.random() * 28),
      volume: 420 + Math.floor(Math.random() * 1800),
    });
  }
  return out;
}

function createOneMockTransaction(mockId: number): Transaction {
  const amount = Math.round((5 + Math.random() * 495) * 100) / 100;
  const status = MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)];
  return {
    id: mockId,
    transaction_id: `txn_mock_${String(mockId).padStart(6, '0')}`,
    user_id: 1 + Math.floor(Math.random() * 12),
    amount,
    merchant: MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)],
    status,
    timestamp: new Date().toISOString(),
  };
}

function addTransactionToVolumePerMinute(
  volumePerMinute: Array<{ minute: string; count: number; volume: number }>,
  amount: number
): Array<{ minute: string; count: number; volume: number }> {
  const now = new Date();
  const bucketStart = new Date(now);
  bucketStart.setMinutes(Math.floor(now.getMinutes() / 5) * 5, 0, 0);
  const bucketIso = bucketStart.toISOString();
  const out = volumePerMinute.map((row) => {
    const rowStart = new Date(row.minute);
    rowStart.setMinutes(Math.floor(rowStart.getMinutes() / 5) * 5, 0, 0);
    if (rowStart.getTime() === bucketStart.getTime()) {
      return { ...row, count: row.count + 1, volume: row.volume + amount };
    }
    return row;
  });
  const hasBucket = out.some((row) => {
    const rowStart = new Date(row.minute);
    rowStart.setMinutes(Math.floor(rowStart.getMinutes() / 5) * 5, 0, 0);
    return rowStart.getTime() === bucketStart.getTime();
  });
  if (!hasBucket) {
    out.push({ minute: bucketIso, count: 1, volume: amount });
    out.sort((a, b) => new Date(a.minute).getTime() - new Date(b.minute).getTime());
  }
  return out;
}

const MOCK_STATS: Stats = {
  approvalRate: 88.2,
  totalTransactions: 2847,
  approvedTransactions: 2511,
  declinedTransactions: 289,
  averageApprovedAmount: 72.18,
  totalVolume: 181246.52,
  transactionsLastMinute: 23,
  volumePerMinute: getMockVolumePerMinute(),
  systemMetrics: {
    averageLatency: 138,
    uptime: 99.99,
    processedTransactions: 2847,
    transactionsPerSecond: '1.2',
  },
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isMockMode, setIsMockMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mockIdRef = useRef(10000);

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
      const [transactionsRes, statsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/transactions`),
        fetch(`${apiBaseUrl}/stats`)
      ]);

      const transactionsOk = transactionsRes.ok;
      const statsOk = statsRes.ok;

      if (transactionsOk) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data || []);
      } else {
        setTransactions(MOCK_TRANSACTIONS);
      }
      if (statsOk) {
        const statsData = await statsRes.json();
        setStats(statsData.data || null);
      } else {
        setStats({ ...MOCK_STATS, volumePerMinute: getMockVolumePerMinute() });
      }
      setIsMockMode(!transactionsOk || !statsOk);
    } catch (error) {
      console.error('Error fetching data:', error);
      setTransactions(MOCK_TRANSACTIONS);
      setStats({ ...MOCK_STATS, volumePerMinute: getMockVolumePerMinute() });
      setIsMockMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    connectWebSocket();
  }, []);

  // When API is available: refresh stats every 10s. When mock: don't poll API.
  useEffect(() => {
    if (isMockMode) return;
    const statsInterval = setInterval(() => {
      fetch(`${apiBaseUrl}/stats`)
        .then(res => res.json())
        .then(data => data.success && data.data && setStats(data.data))
        .catch(console.error);
    }, 10000);
    return () => clearInterval(statsInterval);
  }, [isMockMode]);

  // Mock live mode: add a new transaction and update stats/chart periodically (same UX as production)
  useEffect(() => {
    if (!isMockMode) return;
    const MOCK_LIVE_INTERVAL_MS = 4000;
    const interval = setInterval(() => {
      mockIdRef.current += 1;
      const newTx = createOneMockTransaction(mockIdRef.current);
      setTransactions((prev) => [newTx, ...prev.slice(0, 49)]);
      setStats((prev) => {
        if (!prev) return prev;
        const approved = newTx.status === 'APPROVED' ? prev.approvedTransactions + 1 : prev.approvedTransactions;
        const declined = newTx.status === 'DECLINED' ? prev.declinedTransactions + 1 : prev.declinedTransactions;
        const newVolumePerMinute = addTransactionToVolumePerMinute(prev.volumePerMinute || [], newTx.amount);
        return {
          ...prev,
          totalTransactions: prev.totalTransactions + 1,
          approvedTransactions: approved,
          declinedTransactions: declined,
          totalVolume: prev.totalVolume + newTx.amount,
          transactionsLastMinute: (prev.transactionsLastMinute || 0) + 1,
          volumePerMinute: newVolumePerMinute,
          approvalRate: prev.totalTransactions + 1 > 0 ? (approved / (prev.totalTransactions + 1)) * 100 : prev.approvalRate,
          systemMetrics: {
            ...prev.systemMetrics,
            processedTransactions: prev.totalTransactions + 1,
          },
        };
      });
    }, MOCK_LIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isMockMode]);

  return (
    <>
      <Head>
        <title>Real-Time Payment Dashboard</title>
        <meta name="description" content="Real-time payment processing system dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="noise-overlay" aria-hidden />
      <div className="relative z-10 min-h-screen overflow-y-auto">
          {/* Navbar: fixed, pill with blur */}
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 py-4 sm:py-6"
          >
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
              <div className="rounded-full bg-white/10 backdrop-blur-[20px] px-4 sm:px-6 py-2 sm:py-2.5 flex items-center shrink-0 min-w-0">
                <span className="label-editorial text-forest text-[11px] truncate">— REAL-TIME PAYMENT</span>
              </div>
              <nav className="rounded-full bg-white/10 backdrop-blur-[20px] px-4 sm:px-6 py-2 sm:py-2.5 flex items-center shrink-0">
                <span className="label-editorial text-forest text-[10px]">DASHBOARD</span>
              </nav>
              <div
                className={`rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 shrink-0 min-h-[44px] min-w-[44px] justify-center transition-shadow duration-300 ${
                  connectionStatus === 'connected' ? 'bg-forest text-cream' : 'bg-white text-forest'
                }`}
                style={{
                  boxShadow:
                    connectionStatus === 'connected'
                      ? '0 0 48px rgba(1, 71, 46, 0.55), 0 0 24px rgba(1, 71, 46, 0.4), 0 25px 50px -12px rgba(1, 71, 46, 0.25)'
                      : '0 25px 50px -12px rgba(1, 71, 46, 0.2)',
                }}
              >
                {connectionStatus === 'connected' ? <Wifi className="w-4 h-4 text-cream" aria-hidden /> : <WifiOff className="w-4 h-4 text-forest" aria-hidden />}
                <span className={`label-editorial text-[10px] ${connectionStatus === 'connected' ? 'text-cream' : 'text-forest'}`}>{connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
          </motion.header>

          {/* Hero: compact Sage block — no horizontal scroll, content brought up */}
          <section className="bg-sage flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-24 sm:pt-28 pb-8 sm:pb-10 rounded-b-[3rem] sm:rounded-b-[5rem] overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-display-editorial text-forest"
            >
              PAYMENT DASHBOARD
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 sm:mt-4 font-inter text-forest/80 text-base sm:text-lg max-w-2xl font-normal"
            >
              Live transaction monitoring and analytics
            </motion.p>
          </section>

          {/* Main: Olive, 5rem rounded top — tighter top padding to bring table up */}
          <main className="bg-olive rounded-t-[3rem] sm:rounded-t-[5rem] pt-8 sm:pt-10 pb-16 sm:pb-24 -mt-2 relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <StatsCards stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 mt-10 sm:mt-14 mb-12 sm:mb-20">
                <VolumeChart data={stats?.volumePerMinute || null} />
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="card-editorial bg-cream p-6 sm:p-10 text-center flex flex-col justify-start items-center min-h-[280px] sm:min-h-[320px]"
                >
                  <h3 className="label-editorial summary-heading text-forest font-bold mb-4 mt-0 w-full">SUMMARY</h3>
                  <div className="font-inter text-forest space-y-2 text-lg flex-1 flex flex-col justify-center">
                    <p><span className="text-moss">Total Transactions:</span> <span className="font-bold">{stats?.totalTransactions ?? 0}</span></p>
                    <p><span className="text-moss">Approved:</span> <span className="font-bold">{stats?.approvedTransactions ?? 0}</span></p>
                    <p><span className="text-moss">Declined:</span> <span className="font-bold">{stats?.declinedTransactions ?? 0}</span></p>
                    <p><span className="text-moss">Total Volume:</span> <span className="font-bold">${(stats?.totalVolume ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 sm:mt-6">
                <TransactionTable transactions={transactions} isLoading={isLoading} />
              </div>
            </div>
          </main>

          {/* Footer: Forest, Sage text */}
          <footer className="bg-forest text-sage py-12 sm:py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-wrap items-baseline gap-x-12 sm:gap-x-16 gap-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="label-editorial text-sage text-[11px]">GITHUB:</span>
                <a
                  href="https://github.com/ArivunidhiA/Real-Time-Payment-Processing-System"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-editorial text-sage text-[11px] hover:text-sage/80 transition-colors underline underline-offset-2"
                >
                  Real-Time-Payment-Processing-System
                </a>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="label-editorial text-sage text-[11px]">STACK:</span>
                <span className="label-editorial text-sage text-[11px]">Next.js · Node · PostgreSQL</span>
              </div>
            </div>
            <div className="max-w-7xl mx-auto mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-sage/30">
              <p className="text-sage/70 text-xs label-editorial">
                © Real-Time Payment Processing System
              </p>
            </div>
          </footer>
        </div>
    </>
  );
}

