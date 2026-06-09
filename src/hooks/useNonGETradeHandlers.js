import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateAvgBuyPrice, calculateCostBasis, calculateSellProfit } from '../utils/calculations';
import { nonGEItemDisplayName } from '../utils/nonGeCatalog';

function clampZero(value) {
  return Math.max(0, Number(value) || 0);
}

function assertTransaction(transaction) {
  if (!transaction) {
    throw new Error('Could not record Non-GE transaction. Stock totals were not changed.');
  }
}

async function assertStockUpdate(success, transaction) {
  if (success) return;

  if (transaction?.id) {
    await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id);
  }

  throw new Error('Could not update Non-GE stock totals. Transaction was rolled back.');
}

export function useNonGETradeHandlers({
  selectedStock,
  updateStock,
  refetchStocks,
  addTransaction,
  undoTransaction,
  addProfitEntry,
  closeModal,
  highlightRow,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkSummaryData, setBulkSummaryData] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoResult, setUndoResult] = useState(null);

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

  const processNonGEBuyItem = useCallback(async (item) => {
    const { stock, shares, price } = item;
    const total = shares * price;
    const transaction = await addNonGETransaction(stock, 'buy', shares, price, total);
    assertTransaction(transaction);

    const updated = await updateStock(stock.id, {
      shares: clampZero(stock.shares) + shares,
      totalCost: clampZero(stock.totalCost) + total,
    });
    await assertStockUpdate(updated, transaction);

    return {
      stockName: nonGEItemDisplayName(stock),
      shares,
      price,
      total,
      transaction,
    };
  }, [addNonGETransaction, updateStock]);

  const processNonGESellItem = useCallback(async (item) => {
    const { stock, shares, price } = item;
    const total = shares * price;
    const costBasisOfSharesSold = calculateCostBasis(stock, shares);
    const profit = calculateSellProfit(stock, shares, price);
    const transaction = await addNonGETransaction(stock, 'sell', shares, price, total);
    assertTransaction(transaction);

    const updated = await updateStock(stock.id, {
      shares: clampZero(stock.shares) - shares,
      totalCost: clampZero(stock.totalCost) - costBasisOfSharesSold,
      sharesSold: clampZero(stock.sharesSold) + shares,
      totalCostSold: clampZero(stock.totalCostSold) + total,
      totalCostBasisSold: clampZero(stock.totalCostBasisSold) + costBasisOfSharesSold,
    });
    await assertStockUpdate(updated, transaction);

    const profitEntry = await addProfitEntry('stock', profit, null, transaction?.id ?? null, {
      market: 'non_ge',
      nonGeStockId: stock.id,
    });

    if (transaction && profitEntry) {
      await supabase
        .from('transactions')
        .update({ profit_history_id: profitEntry.id })
        .eq('id', transaction.id);
    }

    return {
      stockName: nonGEItemDisplayName(stock),
      shares,
      price,
      total,
      transaction,
      profitEntry,
      profit,
    };
  }, [addNonGETransaction, addProfitEntry, updateStock]);

  const handleNonGEBulkOperation = useCallback(async (type, items, modalName) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const completedItems = [];
      const processItem = type === 'buy' ? processNonGEBuyItem : processNonGESellItem;

      for (const item of items) {
        const completed = await processItem(item);
        completedItems.push(completed);
        highlightRow(item.stock.id);
      }

      await refetchStocks();
      closeModal(modalName);

      if (items.length > 1) {
        setUndoResult(null);
        setBulkSummaryData({ type, items: completedItems });
      }
    } catch (error) {
      console.error(`Error running bulk Non-GE ${type}:`, error);
      alert(error.message || `Could not complete bulk Non-GE ${type}.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [closeModal, highlightRow, isSubmitting, processNonGEBuyItem, processNonGESellItem, refetchStocks]);

  const handleNonGEBuy = useCallback(async ({ shares, price }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await processNonGEBuyItem({ stock: selectedStock, shares, price });
      await finishMutation('nonGEBuy', selectedStock.id);
    } catch (error) {
      console.error('Error buying Non-GE stock:', error);
      alert(error.message || 'Could not buy Non-GE stock.');
    } finally {
      setIsSubmitting(false);
    }
  }, [finishMutation, isSubmitting, processNonGEBuyItem, selectedStock]);

  const handleNonGESell = useCallback(async ({ shares, price }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await processNonGESellItem({ stock: selectedStock, shares, price });
      await finishMutation('nonGESell', selectedStock.id);
    } catch (error) {
      console.error('Error selling Non-GE stock:', error);
      alert(error.message || 'Could not sell Non-GE stock.');
    } finally {
      setIsSubmitting(false);
    }
  }, [finishMutation, isSubmitting, processNonGESellItem, selectedStock]);

  const handleNonGEBulkBuy = useCallback(async (items) => {
    await handleNonGEBulkOperation('buy', items, 'nonGEBulkBuy');
  }, [handleNonGEBulkOperation]);

  const handleNonGEBulkSell = useCallback(async (items) => {
    await handleNonGEBulkOperation('sell', items, 'nonGEBulkSell');
  }, [handleNonGEBulkOperation]);

  const handleNonGEBulkUndo = useCallback(async () => {
    if (!bulkSummaryData || isUndoing) return;
    setIsUndoing(true);

    const items = [...bulkSummaryData.items].reverse();
    let undoneCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const item of items) {
      if (!item.transaction) {
        failedCount++;
        errors.push(`${item.stockName}: no transaction reference`);
        continue;
      }

      const result = await undoTransaction(item.transaction);
      if (result.success) {
        undoneCount++;
      } else {
        failedCount++;
        errors.push(`${item.stockName}: ${result.warning || result.error || 'unknown error'}`);
      }
    }

    await refetchStocks();
    setUndoResult({ success: failedCount === 0, undoneCount, failedCount, errors });
    setIsUndoing(false);
  }, [bulkSummaryData, isUndoing, refetchStocks, undoTransaction]);

  const handleNonGEBulkSummaryDone = useCallback(() => {
    setBulkSummaryData(null);
    setUndoResult(null);
  }, []);

  const handleNonGERemove = useCallback(async ({ shares }) => {
    if (!selectedStock || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const avgBuy = calculateAvgBuyPrice(selectedStock);
      const costToRemove = calculateCostBasis(selectedStock, shares);
      const transaction = await addNonGETransaction(selectedStock, 'remove', shares, avgBuy, costToRemove);
      assertTransaction(transaction);

      const updated = await updateStock(selectedStock.id, {
        shares: clampZero(selectedStock.shares) - shares,
        totalCost: clampZero(selectedStock.totalCost) - costToRemove,
      });
      await assertStockUpdate(updated, transaction);

      await finishMutation('nonGERemove', selectedStock.id);
    } catch (error) {
      console.error('Error removing Non-GE stock:', error);
      alert(error.message || 'Could not remove Non-GE stock.');
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
    nonGEBulkSummaryData: bulkSummaryData,
    nonGEBulkUndoing: isUndoing,
    nonGEBulkUndoResult: undoResult,
    handleNonGEBuy,
    handleNonGESell,
    handleNonGEBulkBuy,
    handleNonGEBulkSell,
    handleNonGEBulkUndo,
    handleNonGEBulkSummaryDone,
    handleNonGERemove,
    handleNonGEAdjust,
    handleNonGESaveNotes,
  };
}
