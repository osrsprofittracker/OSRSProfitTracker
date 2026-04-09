import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCostBasis, calculateSellProfit, calculateAvgBuyPrice } from '../utils/calculations';
import { useStocksContext } from '../contexts/StocksContext';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useCategoriesContext } from '../contexts/CategoriesContext';
import { useProfitsContext } from '../contexts/ProfitsContext';
import { useMilestonesContext } from '../contexts/MilestonesContext';
import { useProfitHistoryContext } from '../contexts/ProfitHistoryContext';
import { useModal } from '../contexts/ModalContext';

/**
 * @param {Object} opts
 * @param {string} opts.tradeMode
 * @param {Function} opts.highlightRow
 * @param {React.MutableRefObject<Set>} opts.firedTimerNotifs
 * @param {Function} opts.saveFiredTimers
 * @param {Function} opts.setCollapsedCategories
 * @param {Function} opts.calculateMilestoneProgress
 * @param {Function} opts.setMilestoneProgress
 */
export function useModalHandlers({
  tradeMode,
  highlightRow,
  firedTimerNotifs,
  saveFiredTimers,
  setCollapsedCategories,
  calculateMilestoneProgress,
  setMilestoneProgress,
}) {
  const {
    updateStock,
    deleteStock,
    addStock: addStockToDB,
    refetch,
    archiveStock,
    restoreStock,
    fetchArchivedStocks,
  } = useStocksContext();
  const { addTransaction, undoTransaction } = useTransactionsContext();
  const {
    categories,
    addCategory,
    deleteCategory: deleteCategoryMutation,
    updateCategory,
    fetchCategories,
  } = useCategoriesContext();
  const { updateProfit } = useProfitsContext();
  const { updateMilestone } = useMilestonesContext();
  const { addProfitEntry } = useProfitHistoryContext();
  const { closeModal, selectedStock, selectedCategory, setNewStockCategory } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkSummaryData, setBulkSummaryData] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoResult, setUndoResult] = useState(null);

  const [archivedStocks, setArchivedStocks] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [stockToArchive, setStockToArchive] = useState(null);

  const processBuyItem = useCallback(async (item) => {
    const { stock, shares, price, startTimer } = item;
    const total = shares * price;
    const newShares = stock.shares + shares;

    let timerEndTime;
    let newOnHold = stock.onHold;

    if (startTimer) {
      timerEndTime = Date.now() + (4 * 60 * 60 * 1000);
      newOnHold = false;
    } else {
      timerEndTime = stock.timerEndTime;
    }

    const timerJustEnded = stock.timerEndTime && stock.timerEndTime <= Date.now();
    if (timerJustEnded && newShares < stock.needed && stock.onHold) {
      newOnHold = true;
    } else if (newShares >= stock.needed) {
      newOnHold = false;
    }

    await updateStock(stock.id, {
      totalCost: stock.totalCost + total,
      shares: newShares,
      timerEndTime,
    });

    const transaction = await addTransaction({
      stockId: stock.id,
      stockName: stock.name,
      type: 'buy',
      shares,
      price,
      total,
      date: new Date().toISOString(),
    });

    if (startTimer) {
      firedTimerNotifs.current.delete(stock.id);
    }

    return { stockName: stock.name, shares, price, total, transaction };
  }, [updateStock, addTransaction, firedTimerNotifs]);

  const processSellItem = useCallback(async (item) => {
    const { stock, shares, price } = item;
    const total = shares * price;
    const costBasisOfSharesSold = calculateCostBasis(stock, shares);
    const profit = calculateSellProfit(stock, shares, price);

    await updateStock(stock.id, {
      shares: stock.shares - shares,
      totalCost: stock.totalCost - costBasisOfSharesSold,
      sharesSold: stock.sharesSold + shares,
      totalCostSold: stock.totalCostSold + total,
      totalCostBasisSold: (stock.totalCostBasisSold || 0) + costBasisOfSharesSold
    });

    const transaction = await addTransaction({
      stockId: stock.id,
      stockName: stock.name,
      type: 'sell',
      shares,
      price,
      total,
      date: new Date().toISOString(),
    });

    const profitEntry = await addProfitEntry('stock', profit, stock.id, transaction?.id ?? null);

    if (transaction && profitEntry) {
      await supabase
        .from('transactions')
        .update({ profit_history_id: profitEntry.id })
        .eq('id', transaction.id);
    }

    return { stockName: stock.name, shares, price, total, transaction, profitEntry, profit };
  }, [updateStock, addTransaction, addProfitEntry]);

  const handleBulkOperation = useCallback(async (type, items, modalType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const completedItems = [];
      const processItem = type === 'buy' ? processBuyItem : processSellItem;

      for (const item of items) {
        const completed = await processItem(item);
        completedItems.push(completed);
        highlightRow(item.stock.id);
      }

      if (type === 'buy') {
        saveFiredTimers();
      }

      await refetch();
      closeModal(modalType);
      if (items.length > 1) {
        setBulkSummaryData({ type, items: completedItems });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, processBuyItem, processSellItem, highlightRow, saveFiredTimers, refetch, closeModal]);

  const handleBuy = useCallback(async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { shares, price, startTimer } = data;
    const total = shares * price;

    const newShares = selectedStock.shares + shares;
    let timerEndTime;
    let newOnHold = selectedStock.onHold;

    if (startTimer) {
      timerEndTime = Date.now() + (4 * 60 * 60 * 1000);
      newOnHold = false;
    } else {
      timerEndTime = selectedStock.timerEndTime;
    }

    const timerJustEnded = selectedStock.timerEndTime && selectedStock.timerEndTime <= Date.now();
    if (timerJustEnded && newShares < selectedStock.needed && selectedStock.onHold) {
      newOnHold = true;
    } else if (newShares >= selectedStock.needed) {
      newOnHold = false;
    }

    try {
      await updateStock(selectedStock.id, {
        totalCost: selectedStock.totalCost + total,
        shares: newShares,
        timerEndTime
      });

      await addTransaction({
        stockId: selectedStock.id,
        stockName: selectedStock.name,
        type: 'buy',
        shares,
        price,
        total,
        date: new Date().toISOString()
      });
      await refetch();
      if (startTimer) {
        firedTimerNotifs.current.delete(selectedStock.id);
        saveFiredTimers();
      }
      highlightRow(selectedStock.id);
      closeModal('buy');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedStock, updateStock, addTransaction, refetch, firedTimerNotifs, saveFiredTimers, highlightRow, closeModal]);

  const handleSell = useCallback(async (data) => {
    const { shares, price } = data;
    await handleBulkOperation('sell', [{ stock: selectedStock, shares, price }], 'sell');
  }, [handleBulkOperation, selectedStock]);

  const handleBulkBuy = useCallback(async (items) => {
    await handleBulkOperation('buy', items, 'bulkBuy');
  }, [handleBulkOperation]);

  const handleBulkSell = useCallback(async (items) => {
    await handleBulkOperation('sell', items, 'bulkSell');
  }, [handleBulkOperation]);

  const handleBulkUndo = useCallback(async () => {
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

    await refetch();
    setUndoResult({ success: failedCount === 0, undoneCount, failedCount, errors });
    setIsUndoing(false);
  }, [bulkSummaryData, isUndoing, undoTransaction, refetch]);

  const handleBulkSummaryDone = useCallback(() => {
    setBulkSummaryData(null);
    setUndoResult(null);
  }, []);

  const handleRemoveStock = useCallback(async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { shares } = data;

    const avgBuy = calculateAvgBuyPrice(selectedStock);
    const costToRemove = calculateCostBasis(selectedStock, shares);

    try {
      await updateStock(selectedStock.id, {
        shares: selectedStock.shares - shares,
        totalCost: selectedStock.totalCost - costToRemove,
      });

      await addTransaction({
        stockId: selectedStock.id,
        stockName: selectedStock.name,
        type: 'remove',
        shares,
        price: avgBuy,
        total: costToRemove,
        date: new Date().toISOString(),
      });

      await refetch();
      highlightRow(selectedStock.id);
      closeModal('remove');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedStock, updateStock, addTransaction, refetch, highlightRow, closeModal]);

  const handleAdjust = useCallback(async (data) => {
    const { name, needed, category, limit4h, onHold, isInvestment, itemId, investmentStartDate } = data;
    await updateStock(selectedStock.id, { name, needed, category, limit4h, onHold, isInvestment, itemId, investmentStartDate });
    await refetch();
    highlightRow(selectedStock.id);
    closeModal('adjust');
  }, [selectedStock, updateStock, refetch, highlightRow, closeModal]);

  const handleDelete = useCallback(async () => {
    await deleteStock(selectedStock.id);
    await refetch();
    closeModal('delete');
  }, [selectedStock, deleteStock, refetch, closeModal]);

  const handleAddStock = useCallback(async (data) => {
    const { name, category, limit4h, needed, isInvestment, itemId, investmentStartDate } = data;
    await addStockToDB({
      name,
      totalCost: 0,
      shares: 0,
      sharesSold: 0,
      totalCostSold: 0,
      totalCostBasisSold: 0,
      limit4h,
      needed,
      timerEndTime: null,
      category: category || 'Uncategorized',
      isInvestment: isInvestment || false,
      itemId: itemId || null,
      investmentStartDate: investmentStartDate || null,
    });
    await refetch();
    setNewStockCategory('');
    closeModal('newStock');
  }, [addStockToDB, refetch, setNewStockCategory, closeModal]);

  const handleAddCategory = useCallback(async (name, isInvestment = false) => {
    if (!name.trim()) return;
    if (!categories.some(c => c.name === name && c.isInvestment === isInvestment)) {
      await addCategory(name, isInvestment);
      await fetchCategories();
    }
    closeModal('category');
  }, [categories, addCategory, fetchCategories, closeModal]);

  const handleDeleteCategory = useCallback(async () => {
    try {
      const categoryName = selectedCategory;
      console.log('Attempting to delete category:', categoryName);

      if (!categoryName) {
        console.error('No category name provided');
        alert('Invalid category');
        return;
      }

      if (categoryName === 'Uncategorized') {
        console.error('Attempted to delete Uncategorized');
        alert('Cannot delete Uncategorized category');
        return;
      }

      const result = await deleteCategoryMutation(categoryName, tradeMode === 'investment');

      if (result.success) {
        await refetch();
        await fetchCategories();

        setCollapsedCategories(prev => {
          const newState = { ...prev };
          delete newState[categoryName];
          return newState;
        });

        closeModal('deleteCategory');
        alert('Category deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category: ${error.message}`);
    }
  }, [selectedCategory, deleteCategoryMutation, tradeMode, refetch, fetchCategories, setCollapsedCategories, closeModal]);

  const handleEditCategory = useCallback(async (oldCategory, newCategory) => {
    try {
      const isInvestment = categories.find(c => c.name === oldCategory && c.isInvestment === (tradeMode === 'investment'))?.isInvestment || false;
      await updateCategory(oldCategory, newCategory, isInvestment);

      await fetchCategories();
      await refetch();

      setCollapsedCategories(prev => {
        const newState = { ...prev };
        newState[newCategory] = prev[oldCategory];
        delete newState[oldCategory];
        return newState;
      });

      closeModal('editCategory');
      alert('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      alert(`Failed to update category: ${error.message}`);
    }
  }, [categories, tradeMode, updateCategory, fetchCategories, refetch, setCollapsedCategories, closeModal]);

  const handleAddDumpProfit = useCallback(async (amount) => {
    const success = await updateProfit('dumpProfit', amount);
    if (success) {
      await addProfitEntry('dump', amount);
    }
    closeModal('dumpProfit');
  }, [updateProfit, addProfitEntry, closeModal]);

  const handleAddReferralProfit = useCallback(async (amount) => {
    const success = await updateProfit('referralProfit', amount);
    if (success) {
      await addProfitEntry('referral', amount);
    }
    closeModal('referralProfit');
  }, [updateProfit, addProfitEntry, closeModal]);

  const handleAddBondsProfit = useCallback(async (amount) => {
    const success = await updateProfit('bondsProfit', amount);
    if (success) {
      await addProfitEntry('bonds', amount);
    }
    closeModal('bondsProfit');
  }, [updateProfit, addProfitEntry, closeModal]);

  const handleUpdateMilestone = useCallback(async (period, goal, enabled) => {
    const success = await updateMilestone(period, goal, enabled);
    if (success) {
      setMilestoneProgress(calculateMilestoneProgress());
    }
  }, [updateMilestone, setMilestoneProgress, calculateMilestoneProgress]);

  const handleOpenArchive = useCallback(async () => {
    setArchivedLoading(true);
    const data = await fetchArchivedStocks();
    setArchivedStocks(data);
    setArchivedLoading(false);
    closeModal('archiveConfirm');
  }, [fetchArchivedStocks, closeModal]);

  const handleArchive = useCallback((stock) => {
    setStockToArchive(stock);
  }, []);

  const handleConfirmArchive = useCallback(async () => {
    await archiveStock(stockToArchive.id);
    await refetch();
    setStockToArchive(null);
    closeModal('archiveConfirm');
  }, [stockToArchive, archiveStock, refetch, closeModal]);

  const handleRestore = useCallback(async (stock) => {
    await restoreStock(stock.id);
    const data = await fetchArchivedStocks();
    setArchivedStocks(data);
    await refetch();
  }, [restoreStock, fetchArchivedStocks, refetch]);

  const refreshArchivedStocks = useCallback(async () => {
    const data = await fetchArchivedStocks();
    setArchivedStocks(data);
  }, [fetchArchivedStocks]);

  return {
    isSubmitting,
    bulkSummaryData,
    isUndoing,
    undoResult,
    handleBuy,
    handleSell,
    handleBulkBuy,
    handleBulkSell,
    handleBulkOperation,
    handleBulkUndo,
    handleBulkSummaryDone,
    handleRemoveStock,
    handleAdjust,
    handleDelete,
    handleAddStock,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleAddDumpProfit,
    handleAddReferralProfit,
    handleAddBondsProfit,
    handleUpdateMilestone,
    archivedStocks,
    archivedLoading,
    stockToArchive,
    handleOpenArchive,
    handleArchive,
    handleConfirmArchive,
    handleRestore,
    refreshArchivedStocks,
  };
}
