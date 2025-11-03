import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useStocks } from './hooks/useStocks';
import { useCategories } from './hooks/useCategories';
import { useTransactions } from './hooks/useTransactions';
import { useStockNotes } from './hooks/useStockNotes.js';
import { useSettings } from './hooks/useSettings';
import { useProfits } from './hooks/useProfits';
import AltTimerModal from './components/modals/AltTimerModal';
import EditCategoryModal from './components/modals/EditCategoryModal';
import TimeCalculatorModal from './components/modals/TimeCalculatorModal';
import Header from './components/Header';
import PortfolioSummary from './components/PortfolioSummary';
import ChartButtons from './components/ChartButtons';
import CategorySection from './components/CategorySection';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import ModalContainer from './components/modals/ModalContainer';
import BuyModal from './components/modals/BuyModal';
import SellModal from './components/modals/SellModal';
import AdjustModal from './components/modals/AdjustModal';
import DeleteModal from './components/modals/DeleteModal';
import NewStockModal from './components/modals/NewStockModal';
import CategoryModal from './components/modals/CategoryModal';
import DeleteCategoryModal from './components/modals/DeleteCategoryModal';
import ProfitModal from './components/modals/ProfitModal';
import HistoryModal from './components/modals/HistoryModal';
import NotesModal from './components/modals/NotesModal';
import ProfitChartModal from './components/modals/ProfitChartModal';
import CategoryChartModal from './components/modals/CategoryChartModal';
import SettingsModal from './components/modals/SettingsModal';
import * as Sentry from "@sentry/react";

import {
  STORAGE_KEY,
  DUMP_PROFIT_KEY,
  CATEGORIES_KEY,
  DEFAULT_STOCKS,
  DEFAULT_CATEGORIES,
  DEFAULT_VISIBLE_COLUMNS
} from './utils/constants';

export default function MainApp({ session }) {
  const userId = session.user.id;
  const userEmail = session.user.email;
  // Custom hooks for Supabase
  const { stocks, loading: stocksLoading, addStock: addStockToDB, updateStock, deleteStock, refetch, reorderStocks } = useStocks(userId);
  const { categories, loading: categoriesLoading, addCategory, deleteCategory, updateCategory, fetchCategories, reorderCategories } = useCategories(userId);
  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions(userId);
  const { notes: stockNotes, loading: notesLoading, saveNote, deleteNote } = useStockNotes(userId);
  const { settings, loading: settingsLoading, updateSettings } = useSettings(userId);
  const { profits, loading: profitsLoading, updateProfit } = useProfits(userId);

  // Destructure profits
  const { dumpProfit, referralProfit, bondsProfit } = profits;

  // Destructure settings
  const { theme, numberFormat, visibleColumns, visibleProfits, altAccountTimer } = settings;

  // Local UI state
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [highlightedRows, setHighlightedRows] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dataLoaded = !stocksLoading && !categoriesLoading && !transactionsLoading && !notesLoading && !settingsLoading && !profitsLoading;

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAltTimerModal, setShowAltTimerModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showDumpProfitModal, setShowDumpProfitModal] = useState(false);
  const [showReferralProfitModal, setShowReferralProfitModal] = useState(false);
  const [showBondsProfitModal, setShowBondsProfitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showProfitChartModal, setShowProfitChartModal] = useState(false);
  const [showCategoryChartModal, setShowCategoryChartModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTimeCalculatorModal, setShowTimeCalculatorModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newStockCategory, setNewStockCategory] = useState('');

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ensureUncategorizedExists = async () => {
      // Only run after categories have finished loading
      if (!userId || categoriesLoading) {
        return;
      }

      console.log('Categories loaded. Checking Uncategorized. Categories:', categories);

      // Check if Uncategorized exists in local state
      if (categories.includes('Uncategorized')) {
        console.log('Uncategorized already in categories list');
        return;
      }

      try {
        // Double-check database
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('name', 'Uncategorized')
          .maybeSingle();

        if (error) {
          console.error('Error checking for Uncategorized:', error);
          return;
        }

        if (!data) {
          console.log('Creating Uncategorized category...');

          const { data: insertData, error: insertError } = await supabase
            .from('categories')
            .insert([{
              name: 'Uncategorized',
              user_id: userId,
              position: 0,
              created_at: new Date().toISOString()
            }])
            .select();

          if (insertError) {
            console.error('Error creating Uncategorized:', insertError);
          } else {
            console.log('Successfully created Uncategorized:', insertData);
            await fetchCategories();
          }
        }
      } catch (error) {
        console.error('Error in ensureUncategorizedExists:', error);
      }
    };

    ensureUncategorizedExists();
  }, [userId, categoriesLoading, categories]);

  // Helper functions
  const highlightRow = (stockId) => {
    setHighlightedRows({ ...highlightedRows, [stockId]: true });
    setTimeout(() => {
      setHighlightedRows({ ...highlightedRows, [stockId]: false });
    }, 1000);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEditCategory = async (oldCategory, newCategory) => {
    try {
      await updateCategory(oldCategory, newCategory);

      // Refetch everything from database
      await fetchCategories();
      await refetch();

      setCollapsedCategories(prev => {
        const newState = { ...prev };
        newState[newCategory] = prev[oldCategory];
        delete newState[oldCategory];
        return newState;
      });

      setShowEditCategoryModal(false);
      alert('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      alert(`Failed to update category: ${error.message}`);
    }
  };

  const toggleCategory = (category) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category]
    });
  };

  const handleBuy = async (data) => {
    const { shares, price, startTimer } = data;
    const total = shares * price;

    const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
    const newShares = selectedStock.shares + shares;
    const timerEndTime = (startTimer || shares >= selectedStock.limit4h)
      ? Date.now() + (4 * 60 * 60 * 1000)
      : selectedStock.timerEndTime;

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
    highlightRow(selectedStock.id);
    setShowBuyModal(false);
  };

  const handleSell = async (data) => {
    const { shares, price } = data;
    const total = shares * price;

    const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
    const costBasisOfSharesSold = avgBuy * shares;

    await updateStock(selectedStock.id, {
      shares: selectedStock.shares - shares,
      totalCost: selectedStock.totalCost - costBasisOfSharesSold,
      sharesSold: selectedStock.sharesSold + shares,
      totalCostSold: selectedStock.totalCostSold + total,
      totalCostBasisSold: (selectedStock.totalCostBasisSold || 0) + costBasisOfSharesSold
    });

    await addTransaction({
      stockId: selectedStock.id,
      stockName: selectedStock.name,
      type: 'sell',
      shares,
      price,
      total,
      date: new Date().toISOString()
    });
    await refetch();
    highlightRow(selectedStock.id);
    setShowSellModal(false);
  };

  const handleAdjust = async (data) => {
    const { name, needed, category, limit4h } = data;
    await updateStock(selectedStock.id, { name, needed, category, limit4h });
    await refetch();
    highlightRow(selectedStock.id);
    setShowAdjustModal(false);
  };

  const handleDelete = async () => {
    await deleteStock(selectedStock.id);
    await refetch();
    setShowDeleteModal(false);
  };

  const handleAddStock = async (data) => {
    const { name, category, limit4h, needed } = data;
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
    });
    await refetch();
    setNewStockCategory('');
    setShowNewStockModal(false);
  };

  const handleAddCategory = async (name) => {
    if (!name.trim()) return;
    if (!categories.includes(name)) {
      await addCategory(name);
      await fetchCategories();
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async () => {
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

      const result = await deleteCategory(categoryName);

      if (result.success) {
        // Refetch everything from database
        await refetch();
        await fetchCategories();

        // Update collapsed categories
        setCollapsedCategories(prev => {
          const newState = { ...prev };
          delete newState[categoryName];
          return newState;
        });

        setShowDeleteCategoryModal(false);
        alert('Category deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(`Failed to delete category: ${error.message}`);
    }
  };

  const handleAddDumpProfit = async (amount) => {
    await updateProfit('dumpProfit', amount);
    setShowDumpProfitModal(false);
  };

  const handleAddReferralProfit = async (amount) => {
    await updateProfit('referralProfit', amount);
    setShowReferralProfitModal(false);
  };

  const handleAddBondsProfit = async (amount) => {
    await updateProfit('bondsProfit', amount);
    setShowBondsProfitModal(false);
  };

  const handleSetAltTimer = async (days) => {
    const timerEndTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    await updateSettings({ altAccountTimer: timerEndTime });
    setShowAltTimerModal(false);
  };

  const handleResetAltTimer = async () => {
    await updateSettings({ altAccountTimer: null });
  };

  const handleSaveNotes = async (noteText) => {
    await saveNote(selectedStock.id, noteText);
    setShowNotesModal(false);
  };

  // xport operations
  const exportData = () => {
    const exportObj = {
      stocks,
      categories,
      dumpProfit,
      referralProfit,
      bondsProfit,
      stockNotes,
      transactions
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Drag and drop operations
  const handleCategoryDragStart = (e, category) => {

    e.dataTransfer.setData('categoryName', String(category));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategoryDrop = async (e, targetCategory) => {
    e.preventDefault();
    const draggedCategory = e.dataTransfer.getData('categoryName');

    if (!draggedCategory || draggedCategory === String(targetCategory)) return;

    try {
      // Get the target position
      const targetIndex = categories.indexOf(targetCategory);

      if (targetIndex === -1) {
        console.error('Target category not found');
        return;
      }

      await reorderCategories(draggedCategory, targetIndex);
      await fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Failed to reorder categories');
    }
  };

  const handleStockAction = (stock, action) => {
    setSelectedStock(stock);
    switch (action) {
      case 'buy':
        setShowBuyModal(true);
        break;
      case 'sell':
        setShowSellModal(true);
        break;
      case 'adjust':
        setShowAdjustModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
      case 'history':
        setShowHistoryModal(true);
        break;
      case 'notes':
        setShowNotesModal(true);
        break;
      case 'calculate':
        handleCalculateTime(stock);
        break;
    }
  };

  const handleStockDragStart = (e, stockId, sourceCategory) => {
    e.dataTransfer.setData('stockId', stockId.toString());
    e.dataTransfer.setData('sourceCategory', sourceCategory);
  };

  const handleStockDragOver = (e) => {
    e.preventDefault();
  };

  const handleStockDrop = async (e, targetStockId, targetCategory) => {
    e.preventDefault();
    const draggedStockId = parseInt(e.dataTransfer.getData('stockId'));
    const sourceCategory = e.dataTransfer.getData('sourceCategory');

    // If targetStockId is null/undefined, we're dropping on category header
    if (!targetStockId || draggedStockId === targetStockId) {
      // Dropping on category header - move to end of category
      if (!targetStockId && sourceCategory !== targetCategory) {
        try {
          const draggedStock = stocks.find(s => s.id === draggedStockId);
          if (draggedStock) {
            const targetCategoryStocks = stocks.filter(s => s.category === targetCategory);
            const newPosition = targetCategoryStocks.length;

            await updateStock(draggedStockId, {
              category: targetCategory,
              position: newPosition
            });

            await refetch();
            highlightRow(draggedStockId);
          }
        } catch (error) {
          console.error('Error moving stock to category:', error);
          alert('Failed to move stock');
        }
      }
      return;
    }

    try {
      if (sourceCategory !== targetCategory) {
        // Move to different category - need to set proper position
        const draggedStock = stocks.find(s => s.id === draggedStockId);
        const targetCategoryStocks = stocks.filter(s => s.category === targetCategory);
        const targetStockIndex = targetCategoryStocks.findIndex(s => s.id === targetStockId);

        if (draggedStock) {
          // Calculate new position: insert at target position
          const newPosition = targetStockIndex !== -1 ? targetStockIndex : targetCategoryStocks.length;

          // Update the stock's category and position
          await updateStock(draggedStockId, {
            category: targetCategory,
            position: newPosition
          });

          // Now reorder all stocks in the target category to fix positions
          const updatedTargetStocks = [
            ...targetCategoryStocks.slice(0, newPosition),
            draggedStock,
            ...targetCategoryStocks.slice(newPosition)
          ];

          // Update all positions in target category
          const updates = updatedTargetStocks.map((stock, index) => ({
            id: stock.id === draggedStockId ? draggedStockId : stock.id,
            user_id: userId,
            position: index,
            name: stock.id === draggedStockId ? draggedStock.name : stock.name,
            total_cost: stock.id === draggedStockId ? draggedStock.totalCost : stock.totalCost,
            shares: stock.id === draggedStockId ? draggedStock.shares : stock.shares,
            shares_sold: stock.id === draggedStockId ? draggedStock.sharesSold : stock.sharesSold,
            total_cost_sold: stock.id === draggedStockId ? draggedStock.totalCostSold : stock.totalCostSold,
            total_cost_basis_sold: stock.id === draggedStockId ? draggedStock.totalCostBasisSold : stock.totalCostBasisSold,
            limit4h: stock.id === draggedStockId ? draggedStock.limit4h : stock.limit4h,
            needed: stock.id === draggedStockId ? draggedStock.needed : stock.needed,
            timer_end_time: stock.id === draggedStockId ? draggedStock.timerEndTime : stock.timerEndTime,
            category: targetCategory
          }));

          await supabase
            .from('stocks')
            .upsert(updates, { onConflict: 'id' });

          await refetch();
          highlightRow(draggedStockId);
        }
      } else {
        // Reorder within same category
        await reorderStocks(draggedStockId, targetStockId, targetCategory);
        await refetch();
        highlightRow(draggedStockId);
      }
    } catch (error) {
      console.error('Error handling stock drop:', error);
      alert('Failed to move stock');
    }
  };

  const handleCalculateTime = async (stock) => {
    const stocksNeeded = stock.needed - stock.shares;
    if (stocksNeeded <= 0) {
      alert('Target already reached!');
      setShowTimeCalculatorModal(false);
      return;
    }

    const limit4h = stock.limit4h || 0;
    if (limit4h <= 0) {
      alert('Please set a 4-hour buy limit first!');
      setShowTimeCalculatorModal(false);
      return;
    }

    const periods4h = Math.ceil(stocksNeeded / limit4h);
    const totalHours = periods4h * 4;
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    setSelectedStock({
      ...stock,
      calculatedTime: {
        periods4h,
        totalHours,
        days,
        hours,
        stocksNeeded
      }
    });
    setShowTimeCalculatorModal(true);
  };

  // Group stocks by category
  const groupedStocks = categories.reduce((acc, cat) => {
    acc[cat] = stocks.filter(s => s.category === cat);
    return acc;
  }, {});

  // If Uncategorized is not in categories list, add any orphaned stocks
  if (!categories.includes('Uncategorized')) {
    const orphanedStocks = stocks.filter(s =>
      s.category === 'Uncategorized' || !s.category || !categories.includes(s.category)
    );
    if (orphanedStocks.length > 0) {
      groupedStocks['Uncategorized'] = orphanedStocks;
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(243, 244, 246)',
      color: theme === 'dark' ? 'white' : 'rgb(17, 24, 39)',
      padding: '2rem',
      transition: 'background 0.3s, color 0.3s'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Show user email in top right */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{
            color: 'rgb(156, 163, 175)',
            fontSize: '0.875rem'
          }}>
            Logged in as <span style={{
              color: 'rgb(96, 165, 250)',
              fontWeight: '600'
            }}>{session?.user?.user_metadata?.username || userEmail}</span>
          </span>
        </div>
        <Header
          onExport={exportData}
          onAddCategory={() => setShowCategoryModal(true)}
          onAddStock={() => {
            setNewStockCategory('');
            setShowNewStockModal(true);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onLogout={handleLogout}
        />
        <PortfolioSummary
          stocks={stocks}
          dumpProfit={dumpProfit}
          referralProfit={referralProfit}
          bondsProfit={bondsProfit}
          visibleProfits={visibleProfits}
          onAddDumpProfit={() => setShowDumpProfitModal(true)}
          onAddReferralProfit={() => setShowReferralProfitModal(true)}
          onAddBondsProfit={() => setShowBondsProfitModal(true)}
          numberFormat={numberFormat}
        />

        <ChartButtons
          onShowProfitChart={() => setShowProfitChartModal(true)}
          onShowCategoryChart={() => setShowCategoryChartModal(true)}
          altAccountTimer={altAccountTimer}
          onSetAltTimer={() => setShowAltTimerModal(true)}
          onResetAltTimer={handleResetAltTimer}
          currentTime={currentTime}
        />

        {Object.entries(groupedStocks).map(([category, categoryStocks]) => (
          <CategorySection
            key={category}
            category={category}
            stocks={categoryStocks}
            categories={categories}
            isCollapsed={collapsedCategories[category]}
            onToggleCollapse={toggleCategory}
            onAddStock={(cat) => {
              setNewStockCategory(cat);
              setShowNewStockModal(true);
            }}
            onDeleteCategory={(cat) => {
              setSelectedCategory(cat);
              setShowDeleteCategoryModal(true);
            }}
            onEditCategory={(cat) => {
              setSelectedCategory(cat);
              setShowEditCategoryModal(true);
            }}
            onBuy={(stock) => {
              setSelectedStock(stock);
              setShowBuyModal(true);
            }}
            onSell={(stock) => {
              setSelectedStock(stock);
              setShowSellModal(true);
            }}
            onAdjust={(stock) => {
              setSelectedStock(stock);
              setShowAdjustModal(true);
            }}
            onDelete={(stock) => {
              setSelectedStock(stock);
              setShowDeleteModal(true);
            }}
            onHistory={(stock) => {
              setSelectedStock(stock);
              setShowHistoryModal(true);
            }}
            onNotes={(stock) => {
              setSelectedStock(stock);
              setShowNotesModal(true);
            }}
            onCalculate={handleCalculateTime}
            onDragStart={handleStockDragStart}
            onDragOver={handleStockDragOver}
            onDrop={handleStockDrop}
            highlightedRows={highlightedRows}
            sortConfig={sortConfig}
            onSort={handleSort}
            visibleColumns={visibleColumns}
            stockNotes={stockNotes}
            currentTime={currentTime}
            numberFormat={numberFormat}
          />
        ))}

        {/* Modals */}
        <ModalContainer isOpen={showBuyModal}>
          <BuyModal
            stock={selectedStock}
            onConfirm={handleBuy}
            onCancel={() => setShowBuyModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showSellModal}>
          <SellModal
            stock={selectedStock}
            onConfirm={handleSell}
            onCancel={() => setShowSellModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showAdjustModal}>
          <AdjustModal
            stock={selectedStock}
            categories={categories}
            onConfirm={handleAdjust}
            onCancel={() => setShowAdjustModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showDeleteModal}>
          <DeleteModal
            stock={selectedStock}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showNewStockModal}>
          <NewStockModal
            categories={categories}
            defaultCategory={newStockCategory}
            onConfirm={handleAddStock}
            onCancel={() => setShowNewStockModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showCategoryModal}>
          <CategoryModal
            onConfirm={handleAddCategory}
            onCancel={() => setShowCategoryModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showDeleteCategoryModal}>
          <DeleteCategoryModal
            category={selectedCategory}
            onConfirm={handleDeleteCategory}
            onCancel={() => setShowDeleteCategoryModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showDumpProfitModal}>
          <ProfitModal
            type="dump"
            onConfirm={handleAddDumpProfit}
            onCancel={() => setShowDumpProfitModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showReferralProfitModal}>
          <ProfitModal
            type="referral"
            onConfirm={handleAddReferralProfit}
            onCancel={() => setShowReferralProfitModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showBondsProfitModal}>
          <ProfitModal
            type="bonds"
            onConfirm={handleAddBondsProfit}
            onCancel={() => setShowBondsProfitModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showHistoryModal}>
          <HistoryModal
            stock={selectedStock}
            transactions={transactions}
            onCancel={() => setShowHistoryModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showNotesModal}>
          <NotesModal
            stock={selectedStock}
            notes={stockNotes[selectedStock?.id]}
            onConfirm={handleSaveNotes}
            onCancel={() => setShowNotesModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showProfitChartModal}>
          <ProfitChartModal
            stocks={stocks}
            dumpProfit={dumpProfit}
            referralProfit={referralProfit}
            bondsProfit={bondsProfit}
            onCancel={() => setShowProfitChartModal(false)}
            numberFormat={numberFormat}
          />
        </ModalContainer>

        <ModalContainer isOpen={showCategoryChartModal}>
          <CategoryChartModal
            groupedStocks={groupedStocks}
            onCancel={() => setShowCategoryChartModal(false)}
            numberFormat={numberFormat}
          />
        </ModalContainer>

        <ModalContainer isOpen={showSettingsModal}>
          <SettingsModal
            theme={theme}
            onThemeChange={(newTheme) => updateSettings({ theme: newTheme })}
            numberFormat={numberFormat}
            onNumberFormatChange={(newFormat) => updateSettings({ numberFormat: newFormat })}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={(newColumns) => updateSettings({ visibleColumns: newColumns })}
            visibleProfits={visibleProfits}
            onVisibleProfitsChange={(newProfits) => updateSettings({ visibleProfits: newProfits })}
            onCancel={() => setShowSettingsModal(false)}
            onChangePassword={() => {
              setShowSettingsModal(false);
              setShowChangePasswordModal(true);
            }}
          />
        </ModalContainer>

        <ModalContainer isOpen={showEditCategoryModal}>
          <EditCategoryModal
            category={selectedCategory}
            categories={categories}
            onConfirm={handleEditCategory}
            onCancel={() => setShowEditCategoryModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showTimeCalculatorModal}>
          <TimeCalculatorModal
            stock={selectedStock}
            onClose={() => setShowTimeCalculatorModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showAltTimerModal}>
          <AltTimerModal
            onConfirm={handleSetAltTimer}
            onCancel={() => setShowAltTimerModal(false)}
          />
        </ModalContainer>

        <ModalContainer isOpen={showChangePasswordModal}>
          <ChangePasswordModal
            onCancel={() => setShowChangePasswordModal(false)}
          />
        </ModalContainer>
      </div>
    </div>
  );
}