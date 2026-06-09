import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMoveToNonGE({
  userId,
  stockNotes,
  addNonGEStock,
  deleteStockRowOnly,
  refetchGEStocks,
  refetchNonGEStocks,
  refetchStockNotes,
  refetchTransactions,
  refetchProfitHistory,
  refetchPriceAlerts,
}) {
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [moveError, setMoveError] = useState('');

  const fetchMoveSummary = useCallback(async (stockId) => {
    if (!userId || !stockId) {
      return { transactionCount: 0 };
    }

    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('stock_id', stockId);

    if (error) {
      console.error('Error fetching move summary:', error);
      return { transactionCount: 0 };
    }

    return { transactionCount: count || 0 };
  }, [userId]);

  const moveToNonGE = useCallback(async (stock, destination) => {
    if (!stock || !destination || moveSubmitting) {
      return { success: false, error: 'Move request is incomplete.' };
    }

    setMoveSubmitting(true);
    setMoveError('');

    let createdStock = null;

    try {
      const noteText = stockNotes[stock.id] || '';

      createdStock = await addNonGEStock({
        catalogItemKey: destination.catalogItemKey,
        customItemId: destination.customItemId,
        nameSnapshot: destination.nameSnapshot,
        categoryId: destination.categoryId,
        shares: stock.shares || 0,
        totalCost: stock.totalCost || 0,
        sharesSold: stock.sharesSold || 0,
        totalCostSold: stock.totalCostSold || 0,
        totalCostBasisSold: stock.totalCostBasisSold || 0,
        targetBuyPrice: destination.targetBuyPrice ?? null,
        targetSellPrice: destination.targetSellPrice ?? null,
        notes: noteText,
        archived: false,
      });

      if (!createdStock?.id) {
        throw new Error('Could not create the Non-GE stock row.');
      }

      const transactionUpdate = {
        market: 'non_ge',
        non_ge_stock_id: createdStock.id,
        stock_id: null,
        stock_name: destination.nameSnapshot,
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .update(transactionUpdate)
        .eq('user_id', userId)
        .eq('stock_id', stock.id);

      if (transactionError) throw transactionError;

      const { error: profitHistoryError } = await supabase
        .from('profit_history')
        .update({
          market: 'non_ge',
          non_ge_stock_id: createdStock.id,
          stock_id: null,
        })
        .eq('user_id', userId)
        .eq('stock_id', stock.id);

      if (profitHistoryError) throw profitHistoryError;

      const { data: movedTransactions, error: movedTransactionsError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('market', 'non_ge')
        .eq('non_ge_stock_id', createdStock.id);

      if (movedTransactionsError) throw movedTransactionsError;

      const movedTransactionIds = (movedTransactions || []).map(transaction => transaction.id);
      if (movedTransactionIds.length > 0) {
        const { error: linkedProfitHistoryError } = await supabase
          .from('profit_history')
          .update({
            market: 'non_ge',
            non_ge_stock_id: createdStock.id,
            stock_id: null,
          })
          .eq('user_id', userId)
          .in('transaction_id', movedTransactionIds);

        if (linkedProfitHistoryError) throw linkedProfitHistoryError;
      }

      if (stock.itemId) {
        const { error: priceAlertError } = await supabase
          .from('price_alerts')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', stock.itemId);

        if (priceAlertError) throw priceAlertError;

        const { error: graphPreferenceError } = await supabase
          .from('graph_preferences')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', stock.itemId);

        if (graphPreferenceError) throw graphPreferenceError;

        try {
          const storageKey = `graphsFavoritesOrder_${userId}`;
          const storedOrder = JSON.parse(localStorage.getItem(storageKey) || '[]');
          localStorage.setItem(
            storageKey,
            JSON.stringify(storedOrder.filter(itemId => itemId !== stock.itemId))
          );
        } catch {
          // Ignore malformed localStorage; database cleanup is authoritative.
        }
      }

      const { error: stockNoteError } = await supabase
        .from('stock_notes')
        .delete()
        .eq('user_id', userId)
        .eq('stock_id', stock.id);

      if (stockNoteError) throw stockNoteError;

      const deleted = await deleteStockRowOnly(stock.id);
      if (!deleted) {
        throw new Error('Could not delete the original GE stock row.');
      }

      await Promise.all([
        refetchGEStocks?.(),
        refetchNonGEStocks?.(),
        refetchStockNotes?.(),
        refetchTransactions?.(),
        refetchProfitHistory?.(),
        refetchPriceAlerts?.(),
      ]);

      return { success: true, stock: createdStock };
    } catch (error) {
      console.error('Error moving GE stock to Non-GE:', error);
      const message = error?.message || 'Could not move this item to Non-GE.';
      setMoveError(message);
      return { success: false, error: message, createdStock };
    } finally {
      setMoveSubmitting(false);
    }
  }, [
    userId,
    stockNotes,
    addNonGEStock,
    deleteStockRowOnly,
    refetchGEStocks,
    refetchNonGEStocks,
    refetchStockNotes,
    refetchTransactions,
    refetchProfitHistory,
    refetchPriceAlerts,
    moveSubmitting,
  ]);

  return {
    moveSubmitting,
    moveError,
    setMoveError,
    fetchMoveSummary,
    moveToNonGE,
  };
}
