"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/hooks/use-auth-store';

export interface Transaction {
  id: string;
  userId: string;
  professionalId?: string;
  serviceId?: string;
  type: 'payment' | 'refund' | 'tip' | 'wayne_cash' | 'withdrawal' | 'deposit';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: 'BRL' | 'USD' | 'EUR';
  description: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'wayne_cash' | 'bank_transfer';
  metadata?: {
    cardLast4?: string;
    pixKey?: string;
    bankAccount?: string;
    serviceType?: string;
    professionalName?: string;
    rating?: number;
    wayneCashBonus?: number;
    originalTransactionId?: string; // for refunds
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface TransactionFilters {
  type?: Transaction['type'][];
  status?: Transaction['status'][];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: Transaction['paymentMethod'][];
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalAmount: number;
  totalCount: number;
  hasMoreTransactions: boolean;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  loadMoreTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  createTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  cancelTransaction: (id: string, reason?: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  exportTransactions: (format: 'csv' | 'pdf') => Promise<void>;
}

export function useTransactions(
  options?: {
    limit?: number;
    autoLoad?: boolean;
    userId?: string;
    initialFilters?: TransactionFilters;
  }
): UseTransactionsReturn {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>(options?.initialFilters || {});
  
  const limit = options?.limit || 20;
  const autoLoad = options?.autoLoad !== false;
  const userId = options?.userId || user?.id;

  // Build query parameters
  const buildQueryParams = useCallback((offset = 0, currentFilters = filters) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (userId) params.append('userId', userId);
    
    if (currentFilters.type?.length) {
      currentFilters.type.forEach(type => params.append('type', type));
    }
    
    if (currentFilters.status?.length) {
      currentFilters.status.forEach(status => params.append('status', status));
    }
    
    if (currentFilters.dateFrom) {
      params.append('dateFrom', currentFilters.dateFrom.toISOString());
    }
    
    if (currentFilters.dateTo) {
      params.append('dateTo', currentFilters.dateTo.toISOString());
    }
    
    if (currentFilters.amountMin !== undefined) {
      params.append('amountMin', currentFilters.amountMin.toString());
    }
    
    if (currentFilters.amountMax !== undefined) {
      params.append('amountMax', currentFilters.amountMax.toString());
    }
    
    if (currentFilters.paymentMethod?.length) {
      currentFilters.paymentMethod.forEach(method => params.append('paymentMethod', method));
    }
    
    return params;
  }, [filters, limit, userId]);

  // Load transactions
  const loadTransactions = useCallback(async (offset = 0, currentFilters = filters) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      if (offset === 0) setLoading(true);
      
      const params = buildQueryParams(offset, currentFilters);
      const response = await fetch(`/api/transactions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }
      
      const data = await response.json();
      const newTransactions = data.transactions.map((transaction: any) => ({
        ...transaction,
        createdAt: new Date(transaction.createdAt),
        updatedAt: new Date(transaction.updatedAt),
        completedAt: transaction.completedAt ? new Date(transaction.completedAt) : undefined,
      }));
      
      if (offset === 0) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      
      setTotalAmount(data.totalAmount || 0);
      setTotalCount(data.totalCount || 0);
      setHasMoreTransactions(newTransactions.length === limit);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Erro ao carregar transações',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, buildQueryParams, limit, toast, filters]);

  // Load more transactions (pagination)
  const loadMoreTransactions = useCallback(async () => {
    if (!hasMoreTransactions || loading) return;
    await loadTransactions(transactions.length);
  }, [hasMoreTransactions, loading, loadTransactions, transactions.length]);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    await loadTransactions(0);
  }, [loadTransactions]);

  // Create transaction
  const createTransaction = useCallback(async (
    data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }
      
      const newTransaction = await response.json();
      const formattedTransaction = {
        ...newTransaction,
        createdAt: new Date(newTransaction.createdAt),
        updatedAt: new Date(newTransaction.updatedAt),
        completedAt: newTransaction.completedAt ? new Date(newTransaction.completedAt) : undefined,
      };
      
      // Add to the beginning of the list
      setTransactions(prev => [formattedTransaction, ...prev]);
      setTotalCount(prev => prev + 1);
      
      toast({
        title: 'Transação criada',
        description: `Transação de ${data.type} criada com sucesso.`,
      });
      
      return formattedTransaction;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      toast({
        title: 'Erro ao criar transação',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [userId, toast]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }
      
      const updatedTransaction = await response.json();
      const formattedTransaction = {
        ...updatedTransaction,
        createdAt: new Date(updatedTransaction.createdAt),
        updatedAt: new Date(updatedTransaction.updatedAt),
        completedAt: updatedTransaction.completedAt ? new Date(updatedTransaction.completedAt) : undefined,
      };
      
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? formattedTransaction : transaction
        )
      );
      
      toast({
        title: 'Transação atualizada',
        description: 'Transação atualizada com sucesso.',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      toast({
        title: 'Erro ao atualizar transação',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Cancel transaction
  const cancelTransaction = useCallback(async (id: string, reason?: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel transaction');
      }
      
      const cancelledTransaction = await response.json();
      const formattedTransaction = {
        ...cancelledTransaction,
        createdAt: new Date(cancelledTransaction.createdAt),
        updatedAt: new Date(cancelledTransaction.updatedAt),
        completedAt: cancelledTransaction.completedAt ? new Date(cancelledTransaction.completedAt) : undefined,
      };
      
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? formattedTransaction : transaction
        )
      );
      
      toast({
        title: 'Transação cancelada',
        description: 'Transação cancelada com sucesso.',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel transaction';
      toast({
        title: 'Erro ao cancelar transação',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  // Get transaction by ID
  const getTransactionById = useCallback((id: string): Transaction | undefined => {
    return transactions.find(transaction => transaction.id === id);
  }, [transactions]);

  // Export transactions
  const exportTransactions = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      const params = buildQueryParams(0);
      params.append('export', format);
      
      const response = await fetch(`/api/transactions/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Exportação concluída',
        description: `Transações exportadas em formato ${format.toUpperCase()}.`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export transactions';
      toast({
        title: 'Erro na exportação',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [buildQueryParams, toast]);

  // Update filters and reload
  const updateFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    loadTransactions(0, newFilters);
  }, [loadTransactions]);

  // Initialize
  useEffect(() => {
    if (autoLoad && userId) {
      loadTransactions();
    }
  }, [autoLoad, userId, loadTransactions]);

  // Reload when filters change
  useEffect(() => {
    if (userId) {
      loadTransactions(0, filters);
    }
  }, [filters, userId, loadTransactions]);

  return {
    transactions,
    loading,
    error,
    totalAmount,
    totalCount,
    hasMoreTransactions,
    filters,
    setFilters: updateFilters,
    loadMoreTransactions,
    refreshTransactions,
    createTransaction,
    updateTransaction,
    cancelTransaction,
    getTransactionById,
    exportTransactions,
  };
}