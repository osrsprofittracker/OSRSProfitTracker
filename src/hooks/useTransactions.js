import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const RECENT_TRANSACTION_WINDOW_DAYS = 90;
const RECENT_TRANSACTION_ROW_CAP = 10000;
const FULL_TRANSACTION_ROW_CAP = 50000;
const TRANSACTION_BATCH_SIZE = 1000;
const DAY_MS = 86400_000;

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullHistoryLoading, setFullHistoryLoading] = useState(false);
  const [historyScope, setHistoryScope] = useState({
    full: false,
    since: null,
    rowCap: RECENT_TRANSACTION_ROW_CAP,
    capped: false
  });

  // Paginated state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ type: 'all', mode: 'all', stockName: '', category: '', dateFrom: '', dateTo: '', gpMin: '', gpMax: '', priceMin: '', priceMax: '', profitMin: '', profitMax: '', qtyMin: '', qtyMax: '', marginMin: '', marginMax: '', dayOfWeek: '', hourOfDay: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', dir: 'desc' });
  const [pagedTransactions, setPagedTransactions] = useState([]);
  const [pagedLoading, setPagedLoading] = useState(false);
  const [historySource, setHistorySource] = useState('transactions');
  const [historyProfitTypes, setHistoryProfitTypes] = useState(['dump', 'referral', 'bonds']);
  const pagedRequestId = useRef(0);

  const fetchTransactions = useCallback(async (options = {}) => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { full = false } = options;
    const rowCap = full ? FULL_TRANSACTION_ROW_CAP : RECENT_TRANSACTION_ROW_CAP;
    const since = full
      ? null
      : new Date(Date.now() - RECENT_TRANSACTION_WINDOW_DAYS * DAY_MS).toISOString();
    const allData = [];
    let from = 0;
    let hasMore = true;

    setLoading(true);
    if (full) setFullHistoryLoading(true);

    while (hasMore) {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (since) {
        query = query.gte('date', since);
      }

      const remaining = rowCap - allData.length;
      const batchSize = Math.min(TRANSACTION_BATCH_SIZE, remaining);
      const { data, error } = await query.range(from, from + batchSize - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
        setLoading(false);
        setFullHistoryLoading(false);
        return;
      }

      allData.push(...(data || []));
      hasMore = (data || []).length === batchSize && allData.length < rowCap;
      from += batchSize;
    }

    setTransactions(allData.map(formatRow));
    setHistoryScope({
      full,
      since,
      rowCap,
      capped: allData.length >= rowCap
    });
    setLoading(false);
    setFullHistoryLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [userId, fetchTransactions]);

  const loadFullHistory = useCallback(() => fetchTransactions({ full: true }), [fetchTransactions]);

  // Paginated fetch - used by HistoryPage
  const fetchPage = useCallback(async (
    targetPage,
    size,
    activeFilters,
    activeSort = sortConfig,
    activeSource = historySource,
    activeProfitTypes = historyProfitTypes
  ) => {
    if (!userId) return;
    const requestId = pagedRequestId.current + 1;
    pagedRequestId.current = requestId;
    setPagedLoading(true);

    const from = (targetPage - 1) * size;
    const to = from + size - 1;
    const hasLocalTimeFilters = (activeFilters.dayOfWeek ?? '') !== '' || (activeFilters.hourOfDay ?? '') !== '';

    if (activeSource === 'profits') {
      const visibleProfitTypes = activeProfitTypes.filter(Boolean);

      if (visibleProfitTypes.length === 0) {
        setPagedTransactions([]);
        setTotalCount(0);
        setPagedLoading(false);
        return;
      }

      let query = supabase
        .from('profit_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .in('profit_type', visibleProfitTypes);

      const sortKey = activeSort.key || 'date';
      const ascending = activeSort.dir === 'asc';

      query = query.order(profitHistoryColumn(sortKey), { ascending, nullsFirst: ascending });

      if (visibleProfitTypes.includes(activeFilters.type)) {
        query = query.eq('profit_type', activeFilters.type);
      }
      if (activeFilters.dateFrom) query = query.gte('created_at', activeFilters.dateFrom);
      if (activeFilters.dateTo) query = query.lte('created_at', activeFilters.dateTo + 'T23:59:59');
      if (activeFilters.gpMin) query = query.gte('amount', Number(activeFilters.gpMin));
      if (activeFilters.gpMax) query = query.lte('amount', Number(activeFilters.gpMax));
      if (activeFilters.profitMin) query = query.gte('amount', Number(activeFilters.profitMin));
      if (activeFilters.profitMax) query = query.lte('amount', Number(activeFilters.profitMax));

      if (!hasLocalTimeFilters) {
        query = query.range(from, to);
      }

      if (hasLocalTimeFilters) {
        const matchedRows = [];
        let matchedCount = 0;
        let scanFrom = 0;
        let candidateCount = null;
        let scanComplete = false;
        const batchSize = 1000;

        while (!scanComplete) {
          const scanTo = scanFrom + batchSize - 1;
          const { data, error, count } = await query.range(scanFrom, scanTo);

          if (requestId !== pagedRequestId.current) return;

          if (error) {
            console.error('Error fetching paged profit history:', error.message, error.details, error.hint);
            setPagedLoading(false);
            return;
          }

          if (candidateCount == null) candidateCount = count || 0;

          for (const row of (data || []).map(formatProfitRow)) {
            if (!matchesLocalTimeFilters(row, activeFilters)) continue;

            if (matchedCount >= from && matchedRows.length < size) {
              matchedRows.push(row);
            }
            matchedCount += 1;
          }

          scanFrom += batchSize;
          scanComplete = (data || []).length < batchSize || scanFrom >= candidateCount;
        }

        setPagedTransactions(matchedRows);
        setTotalCount(matchedCount);
        setPagedLoading(false);
        return;
      }

      const { data, error, count } = await query;

      if (requestId !== pagedRequestId.current) return;

      if (error) {
        console.error('Error fetching paged profit history:', error.message, error.details, error.hint);
      } else {
        setPagedTransactions((data || []).map(formatProfitRow));
        setTotalCount(count || 0);
      }
      setPagedLoading(false);
      return;
    }

    let query = supabase
      .from('transactions_view')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

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
      query = query.eq('category', activeFilters.category);
    }
    if (activeFilters.mode && activeFilters.mode !== 'all') {
      query = query.eq('is_investment', activeFilters.mode === 'investment');
    }

    if (!hasLocalTimeFilters) {
      query = query.range(from, to);
    }

    if (hasLocalTimeFilters) {
      const matchedRows = [];
      let matchedCount = 0;
      let scanFrom = 0;
      let candidateCount = null;
      let scanComplete = false;
      const batchSize = 1000;

      while (!scanComplete) {
        const scanTo = scanFrom + batchSize - 1;
        const { data, error, count } = await query.range(scanFrom, scanTo);

        if (requestId !== pagedRequestId.current) return;

        if (error) {
          console.error('Error fetching paged transactions:', error.message, error.details, error.hint);
          setPagedLoading(false);
          return;
        }

        if (candidateCount == null) candidateCount = count || 0;

        for (const row of (data || []).map(formatRow)) {
          if (!matchesLocalTimeFilters(row, activeFilters)) continue;

          if (matchedCount >= from && matchedRows.length < size) {
            matchedRows.push(row);
          }
          matchedCount += 1;
        }

        scanFrom += batchSize;
        scanComplete = (data || []).length < batchSize || scanFrom >= candidateCount;
      }

      setPagedTransactions(matchedRows);
      setTotalCount(matchedCount);
      setPagedLoading(false);
      return;
    }

    const { data, error, count } = await query;

    if (requestId !== pagedRequestId.current) return;

    if (error) {
      console.error('Error fetching paged transactions:', error.message, error.details, error.hint);
    } else {
      setPagedTransactions((data || []).map(formatRow));
      setTotalCount(count || 0);
    }
    setPagedLoading(false);
  }, [userId, historySource, historyProfitTypes, sortConfig]);

  const goToPage = useCallback((targetPage) => {
    setPage(targetPage);
    fetchPage(targetPage, pageSize, filters, sortConfig, historySource, historyProfitTypes);
  }, [fetchPage, pageSize, filters, sortConfig, historySource, historyProfitTypes]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPage(1);
    fetchPage(1, size, filters, sortConfig, historySource, historyProfitTypes);
  }, [fetchPage, filters, sortConfig, historySource, historyProfitTypes]);

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
    fetchPage(1, pageSize, newFilters, sortConfig, historySource, historyProfitTypes);
  }, [fetchPage, pageSize, sortConfig, historySource, historyProfitTypes]);

  const initPaged = useCallback(() => fetchPage(1, pageSize, filters, sortConfig, historySource, historyProfitTypes), [fetchPage, pageSize, filters, sortConfig, historySource, historyProfitTypes]);

  const applySort = useCallback((newSort) => {
    setSortConfig(newSort);
    setPage(1);
    fetchPage(1, pageSize, filters, newSort, historySource, historyProfitTypes);
  }, [fetchPage, pageSize, filters, historySource, historyProfitTypes]);

  const resetPaged = useCallback(() => {
    const defaultSort = { key: 'date', dir: 'desc' };
    const defaultFilters = { type: 'all', mode: 'all', stockName: '', category: '', dateFrom: '', dateTo: '', gpMin: '', gpMax: '', priceMin: '', priceMax: '', profitMin: '', profitMax: '', qtyMin: '', qtyMax: '', marginMin: '', marginMax: '', dayOfWeek: '', hourOfDay: '' };
    setSortConfig(defaultSort);
    setFilters(defaultFilters);
    setPage(1);
    fetchPage(1, pageSize, defaultFilters, defaultSort, historySource, historyProfitTypes);
  }, [fetchPage, pageSize, historySource, historyProfitTypes]);

  const changeHistorySource = useCallback((source) => {
    const defaultSort = { key: 'date', dir: 'desc' };
    const sourceFilters = {
      type: 'all',
      mode: 'all',
      stockName: '',
      category: '',
      priceMin: '',
      priceMax: '',
      qtyMin: '',
      qtyMax: '',
      marginMin: '',
      marginMax: ''
    };
    const nextFilters = { ...filters, ...sourceFilters };
    setHistorySource(source);
    setSortConfig(defaultSort);
    setFilters(nextFilters);
    setPage(1);
    fetchPage(1, pageSize, nextFilters, defaultSort, source, historyProfitTypes);
  }, [fetchPage, pageSize, filters, historyProfitTypes]);

  const changeHistoryProfitTypes = useCallback((types) => {
    const nextTypes = types.length > 0 ? types : [];
    const nextFilters = nextTypes.includes(filters.type)
      ? filters
      : { ...filters, type: 'all' };

    setHistoryProfitTypes(nextTypes);

    if (historySource === 'profits') {
      if (nextFilters !== filters) setFilters(nextFilters);
      setPage(1);
      fetchPage(1, pageSize, nextFilters, sortConfig, historySource, nextTypes);
    }
  }, [fetchPage, filters, historySource, pageSize, sortConfig]);

  const addTransaction = useCallback(async (transaction) => {
    const dbTransaction = {
      user_id: userId,
      market: transaction.market || 'ge',
      non_ge_stock_id: transaction.nonGeStockId || null,
      stock_id: transaction.stockId || null,
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
      console.error('Error adding transaction:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    } else {
      const formatted = formatRow(data[0]);
      setTransactions(prev => [formatted, ...prev]);
      return formatted;
    }
  }, [userId]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const undoTransaction = useCallback(async (transaction) => {
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
      } else if (transaction.type === 'remove') {
        const avgPrice = transaction.price || 0;
        const costToRestore = avgPrice * transaction.shares;
        stockUpdate = {
          shares: stockData.shares + transaction.shares,
          total_cost: stockData.total_cost + costToRestore,
        };
      }

      const { error: stockUpdateError } = await supabase
        .from('stocks')
        .update(stockUpdate)
        .eq('id', transaction.stockId);
      if (stockUpdateError) throw stockUpdateError;

      // 4. Refresh local state
      await fetchTransactions();
      await fetchPage(1, pageSize, filters, sortConfig, historySource, historyProfitTypes);

      return { success: true };
    } catch (err) {
      console.error('Error undoing transaction:', err);
      return { success: false, error: err.message };
    }
  }, [userId, fetchTransactions, fetchPage, pageSize, filters, sortConfig, historySource, historyProfitTypes]);

  return {
    // Original API - unchanged
    transactions, loading, addTransaction, refetch: fetchTransactions,
    loadFullHistory, fullHistoryLoading, historyScope,
    // Paginated API - for HistoryPage
    pagedTransactions, pagedLoading, totalCount, totalPages,
    page, pageSize, filters, historySource, changeHistorySource,
    historyProfitTypes, changeHistoryProfitTypes,
    goToPage, changePageSize, applyFilters, initPaged,
    sortConfig, applySort, resetPaged, undoTransaction
  };
}

function formatRow(t) {
  return {
    id: Number(t.id),
    activityKind: 'transaction',
    market: t.market || 'ge',
    stockId: t.stock_id,
    nonGeStockId: t.non_ge_stock_id ?? null,
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

function formatProfitRow(row) {
  const amount = Number(row.amount || 0);

  return {
    id: Number(row.id),
    activityKind: 'profit',
    market: row.market || 'ge',
    stockId: row.stock_id ?? null,
    nonGeStockId: row.non_ge_stock_id ?? null,
    stockName: profitTypeLabel(row.profit_type),
    type: row.profit_type,
    shares: null,
    price: null,
    total: amount,
    date: row.created_at,
    category: 'Extra Profit',
    profitHistoryId: null,
    profit: amount,
    margin: null
  };
}

function profitTypeLabel(type) {
  const labels = {
    dump: 'Dump profit',
    referral: 'Referral profit',
    bonds: 'Bond profit'
  };
  return labels[type] || 'Extra profit';
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

function profitHistoryColumn(key) {
  const map = {
    stockName: 'profit_type',
    total: 'amount',
    date: 'created_at',
    type: 'profit_type',
    category: 'profit_type',
    profit: 'amount'
  };
  return map[key] || 'created_at';
}

function matchesLocalTimeFilters(row, filters) {
  const dayOfWeek = filters.dayOfWeek ?? '';
  const hourOfDay = filters.hourOfDay ?? '';

  if (dayOfWeek === '' && hourOfDay === '') return true;

  const date = new Date(row.date);
  if (Number.isNaN(date.getTime())) return false;

  if (dayOfWeek !== '' && date.getDay() !== Number(dayOfWeek)) {
    return false;
  }

  if (hourOfDay !== '' && date.getHours() !== Number(hourOfDay)) {
    return false;
  }

  return true;
}
