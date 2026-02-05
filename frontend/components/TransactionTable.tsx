import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const ROWS_VISIBLE_COLLAPSED = 5;

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
  const [expanded, setExpanded] = useState(false);
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const getStatusBadge = (status: string) => {
    const base = 'flex items-center gap-2 font-bold font-inter';
    switch (status) {
      case 'APPROVED':
        return (
          <span className={`${base} text-forest`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>APPROVED</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className={`${base}`} style={{ color: '#ef4444' }}>
            <XCircle className="w-3.5 h-3.5" />
            <span>DECLINED</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className={`${base} text-moss`}>
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </span>
        );
      default:
        return (
          <span className={`${base} text-moss`}>
            <FileText className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-cream rounded-card p-4 sm:p-6 shadow-2xl"
        style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}
      >
        <h3 className="label-editorial text-forest mb-4">RECENT TRANSACTIONS</h3>
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-forest/20">
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">ID</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">USER</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">AMOUNT</th>
                <th className="px-4 sm:px-6 text-left label-editorial text-forest">MERCHANT</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">STATUS</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">TIME</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-forest/10 animate-pulse">
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-24" /></td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-8" /></td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-16" /></td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-20" /></td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-20" /></td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4"><div className="h-4 bg-olive/50 rounded w-20" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }

  const visibleRows = (transactions || []).slice(0, expanded ? transactions.length : ROWS_VISIBLE_COLLAPSED);
  const hasMore = (transactions?.length ?? 0) > ROWS_VISIBLE_COLLAPSED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-cream rounded-card p-4 sm:p-6 shadow-2xl"
      style={{ boxShadow: '0 25px 50px -12px rgba(1, 71, 46, 0.2)' }}
    >
      <h3 className="label-editorial text-forest mb-4 sm:mb-6">RECENT TRANSACTIONS</h3>
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <div className={!expanded && visibleRows.length ? 'max-h-[280px] overflow-hidden' : ''}>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-forest/20">
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">ID</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">USER</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">AMOUNT</th>
                <th className="px-4 sm:px-6 text-left label-editorial text-forest">MERCHANT</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">STATUS</th>
                <th className="px-4 sm:px-6 py-3 text-left label-editorial text-forest">TIME</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.length > 0 ? (
                visibleRows.map((tx, index) => (
                  <motion.tr
                    key={`${tx.transaction_id ?? tx.id}-${tx.timestamp}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.15), ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-forest/10 hover:bg-olive/30 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-inter text-forest font-medium">{tx.transaction_id?.substring(0, 12)}...</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-inter text-forest">User {tx.user_id}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-inter text-forest font-bold">{formatAmount(tx.amount)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-inter text-forest">{tx.merchant}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-inter text-moss">{formatTimestamp(tx.timestamp)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-10 sm:py-12 text-center text-moss font-inter text-sm sm:text-base">
                    No transactions in the database yet. Data appears here as the system processes transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="label-editorial text-forest text-[10px] flex items-center gap-2 py-2 px-4 rounded-full bg-olive/50 hover:bg-olive transition-colors duration-200"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                View all transactions ({transactions.length})
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionTable;
