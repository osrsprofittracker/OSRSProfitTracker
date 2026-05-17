import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAvgBuyPrice, calculateCostBasis, calculateSellProfit } from '../utils/calculations';
import { nonGEItemDisplayName } from '../utils/nonGeCatalog';

function clampZero(value) {
  return Math.max(0, Number(value) || 0);
}

export function useNonGETradeHandlers({
  selectedStock,
  updateStock,
  refetchStocks,
  addTransaction,
  addProfitEntry,
  closeModal,
  highlightRow,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addNonGETransaction = useCallback(async (stock, type, shares, price, total) => {
    return addTransaction({
      market: 'non_ge',
      nonGeStockId: stock.id,
      stockId: null,
      stockName: nonGEItemDisplayName(stock),
      type,
      shares,
      price,
      total,
      date: new Date().toISOString(),
    });
  }, [addTransaction]);

  const finishMutation = useCallback(async (modalName, stockId) => {
    await refetchStocks();
    highlightRow(stockId);
    closeModal(modalName);
  }, [closeModal, highlightRow, refetchStocks]);

  const handleNonGEBuy = useCallback(async ({ shares, price }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const total = shares * price;
      await updateStock(selectedStock.id, {
        shares: clampZero(selectedStock.shares) + shares,
        totalCost: clampZero(selectedStock.totalCost) + total,
      });

      await addNonGETransaction(selectedStock, 'buy', shares, price, total);
      await finishMutation('nonGEBuy', selectedStock.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [addNonGETransaction, finishMutation, isSubmitting, selectedStock, updateStock]);

  const handleNonGESell = useCallback(async ({ shares, price }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const total = shares * price;
      const costBasisOfSharesSold = calculateCostBasis(selectedStock, shares);
      const profit = calculateSellProfit(selectedStock, shares, price);

      await updateStock(selectedStock.id, {
        shares: clampZero(selectedStock.shares) - shares,
        totalCost: clampZero(selectedStock.totalCost) - costBasisOfSharesSold,
        sharesSold: clampZero(selectedStock.sharesSold) + shares,
        totalCostSold: clampZero(selectedStock.totalCostSold) + total,
        totalCostBasisSold: clampZero(selectedStock.totalCostBasisSold) + costBasisOfSharesSold,
      });

      const transaction = await addNonGETransaction(selectedStock, 'sell', shares, price, total);
      const profitEntry = await addProfitEntry('stock', profit, null, transaction?.id ?? null, {
        market: 'non_ge',
        nonGeStockId: selectedStock.id,
      });

      if (transaction && profitEntry) {
        await supabase
          .from('transactions')
          .update({ profit_history_id: profitEntry.id })
          .eq('id', transaction.id);
      }

      await finishMutation('nonGESell', selectedStock.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [addNonGETransaction, addProfitEntry, finishMutation, isSubmitting, selectedStock, updateStock]);

  const handleNonGERemove = useCallback(async ({ shares }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const avgBuy = calculateAvgBuyPrice(selectedStock);
      const costToRemove = calculateCostBasis(selectedStock, shares);

      await updateStock(selectedStock.id, {
        shares: clampZero(selectedStock.shares) - shares,
        totalCost: clampZero(selectedStock.totalCost) - costToRemove,
      });

      await addNonGETransaction(selectedStock, 'remove', shares, avgBuy, costToRemove);
      await finishMutation('nonGERemove', selectedStock.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [addNonGETransaction, finishMutation, isSubmitting, selectedStock, updateStock]);

  const handleNonGEAdjust = useCallback(async (data) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateStock(selectedStock.id, {
        catalogItemKey: data.catalogItemKey,
        customItemId: data.customItemId,
        nameSnapshot: data.nameSnapshot,
        categoryId: data.categoryId,
        targetBuyPrice: data.targetBuyPrice,
        targetSellPrice: data.targetSellPrice,
      });

      await finishMutation('nonGEAdjust', selectedStock.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [finishMutation, isSubmitting, selectedStock, updateStock]);

  const handleNonGESaveNotes = useCallback(async (noteText) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateStock(selectedStock.id, { notes: noteText });
      await finishMutation('nonGENotes', selectedStock.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [finishMutation, isSubmitting, selectedStock, updateStock]);

  return {
    nonGETradeSubmitting: isSubmitting,
    handleNonGEBuy,
    handleNonGESell,
    handleNonGERemove,
    handleNonGEAdjust,
    handleNonGESaveNotes,
  };
}
