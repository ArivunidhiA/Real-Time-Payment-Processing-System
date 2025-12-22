import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

interface Transaction {
  id: number;
  transaction_id: string;
  user_id: number;
  amount: number;
  merchant: string;
  status: string;
  timestamp: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, isLoading }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2";
    
    switch (status) {
      case 'APPROVED':
        return (
          <span className={`${baseClasses} bg-green-600 text-black`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            <span className="text-black font-bold">APPROVED</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className={`${baseClasses} bg-red-600 text-black`}>
            <XCircle className="w-3.5 h-3.5 text-black" />
            <span className="text-black font-bold">DECLINED</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className={`${baseClasses} bg-yellow-600 text-black`}>
            <Clock className="w-3.5 h-3.5 text-black" />
            <span className="text-black font-bold">PENDING</span>
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-600 text-black`}>
            <FileText className="w-3.5 h-3.5 text-black" />
            <span className="text-black font-bold">{status}</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/20 p-6 card-glow"
      >
        <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-transparent">
            <thead className="bg-transparent">
              <tr className="border-b border-white/20">
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/10 rounded w-8"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/10 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/10 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-white/10 rounded-full w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/10 rounded w-20"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/20 p-6 card-glow"
    >
      <h3 className="text-lg font-bold mb-6" style={{ color: '#ffffff' }}>Recent Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-transparent">
          <thead className="bg-transparent">
            <tr className="border-b border-white/20">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>Merchant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#ffffff' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium" style={{ color: '#ffffff' }}>
                    {transaction.transaction_id?.substring(0, 12)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#ffffff' }}>
                    User {transaction.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: '#ffffff' }}>
                    {formatAmount(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#ffffff' }}>
                    {transaction.merchant}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#ffffff' }}>
                    {formatTimestamp(transaction.timestamp)}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-white/50">
                  No transactions available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TransactionTable;

