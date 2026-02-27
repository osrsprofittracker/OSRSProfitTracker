import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginated state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ type: 'all', mode: 'all', stockName: '', category: '', dateFrom: '', dateTo: '', gpMin: '', gpMax: '', priceMin: '', priceMax: '', profitMin: '', profitMax: '', qtyMin: '', qtyMax: '', marginMin: '', marginMax: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', dir: 'desc' });
  const [pagedTransactions, setPagedTransactions] = useState([]);
  const [pagedLoading, setPagedLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } else {
      setTransactions((data || []).map(formatRow));
    }
    setLoading(false);
  };

  // Paginated fetch - used by HistoryPage
  const fetchPage = useCallback(async (targetPage, size, activeFilters, activeSort = sortConfig) => {
    if (!userId) return;
    setPagedLoading(true);

    const from = (targetPage - 1) * size;
    const to = from + size - 1;

    let query = supabase
      .from('transactions_view')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(from, to);

    // Apply sort
    const sortKey = activeSort.key || 'date';
    const ascending = activeSort.dir === 'asc';

    query = query.order(dbColumn(sortKey), { ascending, nullsFirst: ascending });

    // Apply filters
    if (activeFilters.type !== 'all') query = query.eq('type', activeFilters.type);
    if (activeFilters.stockName) query = query.ilike('stock_name', `%${activeFilters.stockName}%`);
    if (activeFilters.dateFrom) query = query.gte('date', activeFilters.dateFrom);
    if (activeFilters.dateTo) query = query.lte('date', activeFilters.dateTo + 'T23:59:59');
    if (activeFilters.gpMin) query = query.gte('total', Number(activeFilters.gpMin));
    if (activeFilters.gpMax) query = query.lte('total', Number(activeFilters.gpMax));
    if (activeFilters.priceMin) query = query.gte('price', Number(activeFilters.priceMin));
    if (activeFilters.priceMax) query = query.lte('price', Number(activeFilters.priceMax));
    if (activeFilters.profitMin) query = query.gte('profit', Number(activeFilters.profitMin));
    if (activeFilters.profitMax) query = query.lte('profit', Number(activeFilters.profitMax));
    if (activeFilters.qtyMin) query = query.gte('shares', Number(activeFilters.qtyMin));
    if (activeFilters.qtyMax) query = query.lte('shares', Number(activeFilters.qtyMax));
    if (activeFilters.marginMin) query = query.gte('margin', Number(activeFilters.marginMin));
    if (activeFilters.marginMax) query = query.lte('margin', Number(activeFilters.marginMax));
    if (activeFilters.category) {
      const { data: categoryStocks } = await supabase
        .from('stocks')
        .select('id')
        .eq('user_id', userId)
        .eq('category', activeFilters.category);
      const stockIds = (categoryStocks || []).map(s => s.id);
      if (stockIds.length > 0) {
        query = query.in('stock_id', stockIds);
      } else {
        setPagedTransactions([]);
        setTotalCount(0);
        setPagedLoading(false);
        return;
      }
    }
    if (activeFilters.mode && activeFilters.mode !== 'all') {
      const isInvestment = activeFilters.mode === 'investment';
      const { data: modeStocks } = await supabase
        .from('stocks')
        .select('id')
        .eq('user_id', userId)
        .eq('is_investment', isInvestment);
      const modeStockIds = (modeStocks || []).map(s => s.id);
      if (modeStockIds.length > 0) {
        query = query.in('stock_id', modeStockIds);
      } else {
        setPagedTransactions([]);
        setTotalCount(0);
        setPagedLoading(false);
        return;
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching paged transactions:', error.message, error.details, error.hint);
    } else {
      setPagedTransactions((data || []).map(formatRow));
      setTotalCount(count || 0);
    }
    setPagedLoading(false);
  }, [userId]);

  const goToPage = (targetPage) => {
    setPage(targetPage);
    fetchPage(targetPage, pageSize, filters);
  };

  const changePageSize = (size) => {
    setPageSize(size);
    setPage(1);
    fetchPage(1, size, filters);
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    fetchPage(1, pageSize, newFilters);
  };

  const initPaged = () => fetchPage(1, pageSize, filters);

  const applySort = (newSort) => {
    setSortConfig(newSort);
    setPage(1);
    fetchPage(1, pageSize, filters, newSort);
  };

  const resetPaged = () => {
    const defaultSort = { key: 'date', dir: 'desc' };
    const defaultFilters = { type: 'all', stockName: '', category: '', dateFrom: '', dateTo: '', gpMin: '', gpMax: '', priceMin: '', priceMax: '', profitMin: '', profitMax: '', qtyMin: '', qtyMax: '', marginMin: '', marginMax: '' };
    setSortConfig(defaultSort);
    setFilters(defaultFilters);
    setPage(1);
    fetchPage(1, pageSize, defaultFilters, defaultSort);
  };

  const addTransaction = async (transaction) => {
    const dbTransaction = {
      user_id: userId,
      stock_id: transaction.stockId,
      stock_name: transaction.stockName,
      type: transaction.type,
      shares: transaction.shares,
      price: transaction.price,
      total: transaction.total,
      date: transaction.date
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([dbTransaction])
      .select();

    if (error) {
      console.error('Error adding transaction:', error);
      return null;
    } else {
      const formatted = formatRow(data[0]);
      setTransactions(prev => [formatted, ...prev]);
      return formatted;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const undoTransaction = async (transaction) => {
    if (transaction.type === 'buy') {
      const { data: laterSells } = await supabase
        .from('transactions')
        .select('id')
        .eq('stock_id', transaction.stockId)
        .eq('type', 'sell')
        .gt('date', transaction.date)
        .limit(1);

      if (laterSells && laterSells.length > 0) {
        return { success: false, warning: 'sells_after_buy' };
      }
    }

    try {
      // 1. Delete profit history if it's a sell
      if (transaction.type === 'sell') {
        const { error: phError } = await supabase
          .from('profit_history')
          .delete()
          .eq('transaction_id', transaction.id);
        if (phError) throw phError;
      }

      // 2. Delete the transaction
      const { error: tError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);
      if (tError) throw tError;

      // 3. Revert the stock
      const { data: stockData, error: stockFetchError } = await supabase
        .from('stocks')
        .select('*')
        .eq('id', transaction.stockId)
        .single();

      if (stockFetchError || !stockData) {
        return { success: false, warning: 'stock_not_found' };
      }

      let stockUpdate = {};

      if (transaction.type === 'buy') {
        const avgBuy = stockData.shares > 0 ? stockData.total_cost / stockData.shares : 0;
        const costBasisToRemove = avgBuy * transaction.shares;
        stockUpdate = {
          shares: stockData.shares - transaction.shares,
          total_cost: stockData.total_cost - costBasisToRemove,
        };
      } else if (transaction.type === 'sell') {
        const avgBuyAtSell = stockData.shares_sold > 0
          ? stockData.total_cost_basis_sold / stockData.shares_sold
          : 0;
        const costBasisToRestore = avgBuyAtSell * transaction.shares;
        stockUpdate = {
          shares: stockData.shares + transaction.shares,
          total_cost: stockData.total_cost + costBasisToRestore,
          shares_sold: stockData.shares_sold - transaction.shares,
          total_cost_sold: stockData.total_cost_sold - transaction.total,
          total_cost_basis_sold: stockData.total_cost_basis_sold - costBasisToRestore,
        };
      }

      const { error: stockUpdateError } = await supabase
        .from('stocks')
        .update(stockUpdate)
        .eq('id', transaction.stockId);
      if (stockUpdateError) throw stockUpdateError;

      // 4. Refresh local state
      await fetchTransactions();
      await fetchPage(1, pageSize, filters);

      return { success: true };
    } catch (err) {
      console.error('Error undoing transaction:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    // Original API - unchanged
    transactions, loading, addTransaction, refetch: fetchTransactions,
    // Paginated API - for HistoryPage
    pagedTransactions, pagedLoading, totalCount, totalPages,
    page, pageSize, filters,
    goToPage, changePageSize, applyFilters, initPaged,
    sortConfig, applySort, resetPaged, undoTransaction
  };
}

function formatRow(t) {
  return {
    id: Number(t.id),
    stockId: t.stock_id,
    stockName: t.stock_name,
    type: t.type,
    shares: t.shares,
    price: t.price,
    total: t.total,
    date: t.date,
    category: t.category || '—',
    profitHistoryId: t.profit_history_id ?? null,
    profit: t.profit ?? null,
    margin: t.margin ?? null
  };
}

function dbColumn(key) {
  const map = {
    stockName: 'stock_name',
    shares: 'shares',
    price: 'price',
    total: 'total',
    date: 'date',
    type: 'type',
    category: 'category',
    profit: 'profit',
    margin: 'margin'
  };
  return map[key] || 'date';
}