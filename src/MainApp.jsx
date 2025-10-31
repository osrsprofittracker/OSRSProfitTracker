import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useStocks } from './hooks/useStocks';
import { useCategories } from './hooks/useCategories';
import { useTransactions } from './hooks/useTransactions';
import { useStockNotes } from './hooks/useStockNotes.js';
import { useSettings } from './hooks/useSettings';
import { useProfits } from './hooks/useProfits';
import EditCategoryModal from './components/modals/EditCategoryModal';
import TimeCalculatorModal from './components/modals/TimeCalculatorModal';
import Header from './components/Header';
import PortfolioSummary from './components/PortfolioSummary';
import ChartButtons from './components/ChartButtons';
import CategorySection from './components/CategorySection';
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
import {
  STORAGE_KEY,
  DUMP_PROFIT_KEY,
  CATEGORIES_KEY,
  DEFAULT_STOCKS,
  DEFAULT_CATEGORIES,
  DEFAULT_VISIBLE_COLUMNS
} from './utils/constants';

export default function MainApp({ session }) {  // Add session prop
  const userId = session.user.id;
  const userEmail = session.user.email;
  // Custom hooks for Supabase
  const { stocks, loading: stocksLoading, addStock: addStockToDB, updateStock, deleteStock } = useStocks(userId);
  const { categories, loading: categoriesLoading, addCategory: addCategoryToDB, deleteCategory: deleteCategoryFromDB } = useCategories(userId);
  const { transactions, loading: transactionsLoading, addTransaction } = useTransactions(userId);
  const { notes: stockNotes, loading: notesLoading, saveNote, deleteNote } = useStockNotes(userId);
  const { settings, loading: settingsLoading, updateSettings } = useSettings(userId);
  const { profits, loading: profitsLoading, updateProfit } = useProfits(userId);

  // Destructure profits
  const { dumpProfit, referralProfit, bondsProfit } = profits;

  // Destructure settings
  const { theme, numberFormat, visibleColumns, visibleProfits } = settings;

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

  const handleEditCategory = async (newName) => {
    if (newName === selectedCategory) {
      setShowEditCategoryModal(false);
      return;
    }

    // Update category name in database
    const { error: updateError } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('user_id', userId)
      .eq('name', selectedCategory);

    if (updateError) {
      console.error('Error updating category:', updateError);
      alert('Failed to update category');
      return;
    }

    // Update all stocks with this category
    const stocksToUpdate = stocks.filter(s => s.category === selectedCategory);
    await Promise.all(
      stocksToUpdate.map(s => updateStock(s.id, { category: newName }))
    );

    // Update categories list
    setCategories(categories.map(c => c === selectedCategory ? newName : c));

    setShowEditCategoryModal(false);
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

    highlightRow(selectedStock.id);
    setShowSellModal(false);
  };

  const handleAdjust = async (data) => {
    const { name, needed, category, limit4h } = data;
    await updateStock(selectedStock.id, { name, needed, category, limit4h });
    highlightRow(selectedStock.id);
    setShowAdjustModal(false);
  };

  const handleDelete = async () => {
    await deleteStock(selectedStock.id);
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
    setNewStockCategory('');
    setShowNewStockModal(false);
  };

  const handleAddCategory = async (name) => {
    if (!name.trim()) return;
    if (!categories.includes(name)) {
      await addCategoryToDB(name);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async () => {
    // Update stocks to Uncategorized
    const stocksToUpdate = stocks.filter(s => s.category === selectedCategory);
    await Promise.all(
      stocksToUpdate.map(s => updateStock(s.id, { category: 'Uncategorized' }))
    );

    await deleteCategoryFromDB(selectedCategory);
    setShowDeleteCategoryModal(false);
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
    e.dataTransfer.setData('categoryName', category);
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();
    const draggedCategory = e.dataTransfer.getData('categoryName');
    if (draggedCategory && draggedCategory !== targetCategory) {
      const allCategories = [...categories];
      if (!allCategories.includes('Uncategorized')) {
        allCategories.push('Uncategorized');
      }

      const draggedIndex = allCategories.indexOf(draggedCategory);
      const targetIndex = allCategories.indexOf(targetCategory);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newCategories = categories.filter(c => c !== 'Uncategorized');
        const draggedCatIndex = newCategories.indexOf(draggedCategory);
        const targetCatIndex = newCategories.indexOf(targetCategory);

        if (draggedCatIndex !== -1 && targetCatIndex !== -1) {
          newCategories.splice(draggedCatIndex, 1);
          newCategories.splice(targetCatIndex, 0, draggedCategory);
          setCategories(newCategories);
        }
      }
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

  const handleStockDrop = (e, targetStockId, targetCategory) => {
    e.preventDefault();
    const draggedStockId = parseInt(e.dataTransfer.getData('stockId'));
    const sourceCategory = e.dataTransfer.getData('sourceCategory');

    if (draggedStockId !== targetStockId && sourceCategory === targetCategory) {
      // Reorder within same category
      const categoryStocks = stocks.filter(stock => stock.category === targetCategory);
      const draggedIndex = categoryStocks.findIndex(stock => stock.id === draggedStockId);
      const targetIndex = categoryStocks.findIndex(stock => stock.id === targetStockId);

      const reordered = [...categoryStocks];
      const [draggedStock] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, draggedStock);

      const otherStocks = stocks.filter(stock => stock.category !== targetCategory);
      setStocks([...otherStocks, ...reordered]);
    } else if (draggedStockId !== targetStockId && sourceCategory !== targetCategory) {
      // Move to different category
      setStocks(stocks.map(stock =>
        stock.id === draggedStockId ? { ...stock, category: targetCategory } : stock
      ));
    }
  };

  // Group stocks by category
  const groupedStocks = categories.reduce((acc, cat) => {
    acc[cat] = stocks.filter(s => s.category === cat);
    return acc;
  }, {});

  const uncategorized = stocks.filter(s => !s.category || !categories.includes(s.category));
  if (uncategorized.length > 0) {
    groupedStocks['Uncategorized'] = uncategorized;
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
            }}>{userEmail}</span>
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
            onDragStart={handleCategoryDragStart}
            onDragOver={handleCategoryDragOver}
            onDrop={handleCategoryDrop}
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
            onVisibleProfitsChange={(newProfits) => updateSettings({ visibleProfits: newProfits })}  // Add this
            onCancel={() => setShowSettingsModal(false)}
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
      </div>
    </div>
  );
}