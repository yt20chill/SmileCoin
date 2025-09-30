'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function TransactionHistory({ 
  transactions, 
  onLoadMore, 
  hasMore = false, 
  isLoading = false 
}: TransactionHistoryProps) {
  const t = useTranslations('rating');
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10;

  // Initialize visible transactions
  useEffect(() => {
    setVisibleTransactions(transactions.slice(0, itemsPerPage));
    setPage(1);
  }, [transactions]);

  // Load more transactions
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const newTransactions = transactions.slice(startIndex, endIndex);
    setVisibleTransactions(prev => [...prev, ...newTransactions]);
    setPage(nextPage);
    
    if (onLoadMore && endIndex >= transactions.length) {
      onLoadMore();
    }
    
    setIsLoadingMore(false);
  }, [page, transactions, hasMore, isLoadingMore, onLoadMore]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore]);

  const getTransactionIcon = (type: Transaction['type'], status: Transaction['status']) => {
    if (status === 'pending') return Clock;
    if (status === 'failed') return XCircle;
    
    switch (type) {
      case 'earn':
        return ArrowDownLeft;
      case 'spend':
        return ArrowUpRight;
      case 'expire':
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const getTransactionColor = (type: Transaction['type'], status: Transaction['status']) => {
    if (status === 'failed') return 'text-red-500 bg-red-50';
    if (status === 'pending') return 'text-yellow-500 bg-yellow-50';
    
    switch (type) {
      case 'earn':
        return 'text-green-500 bg-green-50';
      case 'spend':
        return 'text-blue-500 bg-blue-50';
      case 'expire':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getAmountDisplay = (transaction: Transaction) => {
    const sign = transaction.type === 'earn' ? '+' : '-';
    return `${sign}${transaction.amount}`;
  };

  if (isLoading && visibleTransactions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visibleTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
        <p className="text-gray-500">Your transaction history will appear here once you start earning and spending Smile Coins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh transactions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2" data-testid="transaction-list">
        <AnimatePresence>
          {visibleTransactions.map((transaction, index) => {
            const Icon = getTransactionIcon(transaction.type, transaction.status);
            const colorClasses = getTransactionColor(transaction.type, transaction.status);
            
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    {transaction.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {transaction.status === 'failed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getAmountDisplay(transaction)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {transaction.status === 'completed' ? 'Completed' : transaction.status}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {(hasMore || visibleTransactions.length < transactions.length) && (
        <div className="flex justify-center pt-4">
          <motion.button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
               {t('loading')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t('showMore')}
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading more transactions...</span>
          </div>
        </div>
      )}
    </div>
  );
}