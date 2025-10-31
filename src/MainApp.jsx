import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
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
  // State
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dumpProfit, setDumpProfit] = useState(0);
  const [referralProfit, setReferralProfit] = useState(0);
  const [bondsProfit, setBondsProfit] = useState(0);
  const [stockNotes, setStockNotes] = useState({});
  const [theme, setTheme] = useState('dark');
  const [numberFormat, setNumberFormat] = useState('compact');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [highlightedRows, setHighlightedRows] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [dataLoaded, setDataLoaded] = useState(false);

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

  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newStockCategory, setNewStockCategory] = useState('');

  const fileInputRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Save data when changed
  useEffect(() => {
    if (dataLoaded && stocks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
    }
  }, [stocks, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem(DUMP_PROFIT_KEY, dumpProfit.toString());
    }
  }, [dumpProfit, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('referralProfit', referralProfit.toString());
    }
  }, [referralProfit, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('bondsProfit', bondsProfit.toString());
    }
  }, [bondsProfit, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && categories.length > 0) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('stockNotes', JSON.stringify(stockNotes));
    }
  }, [stockNotes, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('numberFormat', numberFormat);
    }
  }, [numberFormat, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('visibleColumns', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, dataLoaded]);

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load all data from localStorage
  const loadAllData = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedCategories = localStorage.getItem(CATEGORIES_KEY);
    const savedDumpProfit = localStorage.getItem(DUMP_PROFIT_KEY);
    const savedReferralProfit = localStorage.getItem('referralProfit');
    const savedBondsProfit = localStorage.getItem('bondsProfit');
    const savedNotes = localStorage.getItem('stockNotes');
    const savedTheme = localStorage.getItem('theme');
    const savedNumberFormat = localStorage.getItem('numberFormat');
    const savedVisibleColumns = localStorage.getItem('visibleColumns');
    const savedTransactions = localStorage.getItem('transactions');

    if (savedData) {
      try {
        setStocks(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load stocks:', e);
        setStocks(DEFAULT_STOCKS);
      }
    } else {
      setStocks(DEFAULT_STOCKS);
    }

    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load categories:', e);
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    if (savedDumpProfit) {
      try {
        setDumpProfit(parseFloat(savedDumpProfit));
      } catch (e) {
        console.error('Failed to load dump profit:', e);
      }
    }

    if (savedReferralProfit) {
      try {
        setReferralProfit(parseFloat(savedReferralProfit));
      } catch (e) {
        console.error('Failed to load referral profit:', e);
      }
    }

    if (savedBondsProfit) {
      try {
        setBondsProfit(parseFloat(savedBondsProfit));
      } catch (e) {
        console.error('Failed to load bonds profit:', e);
      }
    }

    if (savedNotes) {
      try {
        setStockNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedNumberFormat) {
      setNumberFormat(savedNumberFormat);
    }

    if (savedVisibleColumns) {
      try {
        setVisibleColumns(JSON.parse(savedVisibleColumns));
      } catch (e) {
        console.error('Failed to load visible columns:', e);
      }
    }

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error('Failed to load transactions:', e);
      }
    }

    setDataLoaded(true);
  };

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

  const toggleCategory = (category) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category]
    });
  };

  // Stock operations
  const handleBuy = (data) => {
    const { shares, price, startTimer } = data;
    const total = shares * price;

    setStocks(stocks.map(s => {
      if (s.id === selectedStock.id) {
        const newShares = s.shares + shares;
        const timerEndTime = (startTimer || shares >= s.limit4h) 
          ? Date.now() + (4 * 60 * 60 * 1000) 
          : s.timerEndTime;
        return { 
          ...s, 
          totalCost: s.totalCost + total, 
          shares: newShares, 
          timerEndTime 
        };
      }
      return s;
    }));

    setTransactions([...transactions, {
      id: Date.now(),
      stockId: selectedStock.id,
      stockName: selectedStock.name,
      type: 'buy',
      shares,
      price,
      total,
      date: new Date().toISOString()
    }]);

    highlightRow(selectedStock.id);
    setShowBuyModal(false);
  };

  const handleSell = (data) => {
    const { shares, price } = data;
    const total = shares * price;

    setStocks(stocks.map(s => {
      if (s.id === selectedStock.id) {
        const avgBuy = s.shares > 0 ? s.totalCost / s.shares : 0;
        const costBasisOfSharesSold = avgBuy * shares;

        return {
          ...s,
          shares: s.shares - shares,
          totalCost: s.totalCost - costBasisOfSharesSold,
          sharesSold: s.sharesSold + shares,
          totalCostSold: s.totalCostSold + total,
          totalCostBasisSold: (s.totalCostBasisSold || 0) + costBasisOfSharesSold
        };
      }
      return s;
    }));

    setTransactions([...transactions, {
      id: Date.now(),
      stockId: selectedStock.id,
      stockName: selectedStock.name,
      type: 'sell',
      shares,
      price,
      total,
      date: new Date().toISOString()
    }]);

    highlightRow(selectedStock.id);
    setShowSellModal(false);
  };

  const handleAdjust = (data) => {
    const { needed, category } = data;
    setStocks(stocks.map(s =>
      s.id === selectedStock.id ? { ...s, needed, category } : s
    ));
    highlightRow(selectedStock.id);
    setShowAdjustModal(false);
  };

  const handleDelete = () => {
    setStocks(stocks.filter(s => s.id !== selectedStock.id));
    setShowDeleteModal(false);
  };

  const handleAddStock = (data) => {
    const { name, category, limit4h, needed } = data;
    setStocks([...stocks, {
      id: Date.now(),
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
    }]);
    setNewStockCategory('');
    setShowNewStockModal(false);
  };

  // Category operations
  const handleAddCategory = (name) => {
    if (!name.trim()) return;
    if (!categories.includes(name)) {
      setCategories([...categories, name]);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = () => {
    setStocks(stocks.map(s =>
      s.category === selectedCategory ? { ...s, category: 'Uncategorized' } : s
    ));
    setCategories(categories.filter(c => c !== selectedCategory));
    setShowDeleteCategoryModal(false);
  };

  // Profit operations
  const handleAddDumpProfit = (amount) => {
    setDumpProfit(dumpProfit + amount);
    setShowDumpProfitModal(false);
  };

  const handleAddReferralProfit = (amount) => {
    setReferralProfit(referralProfit + amount);
    setShowReferralProfitModal(false);
  };

  const handleAddBondsProfit = (amount) => {
    setBondsProfit(bondsProfit + amount);
    setShowBondsProfitModal(false);
  };

  // Notes operations
  const handleSaveNotes = (noteText) => {
    setStockNotes({ ...stockNotes, [selectedStock.id]: noteText });
    setShowNotesModal(false);
  };

  // Import/Export operations
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

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.stocks && Array.isArray(imported.stocks)) {
          setStocks(imported.stocks);
          if (imported.categories && Array.isArray(imported.categories)) {
            setCategories(imported.categories);
          }
          if (imported.dumpProfit !== undefined) {
            setDumpProfit(imported.dumpProfit);
          }
          if (imported.referralProfit !== undefined) {
            setReferralProfit(imported.referralProfit);
          }
          if (imported.bondsProfit !== undefined) {
            setBondsProfit(imported.bondsProfit);
          }
          if (imported.stockNotes) {
            setStockNotes(imported.stockNotes);
          }
          if (imported.transactions && Array.isArray(imported.transactions)) {
            setTransactions(imported.transactions);
          }
          alert('Data imported successfully!');
        } else if (Array.isArray(imported)) {
          setStocks(imported);
          alert('Data imported successfully! (Legacy format - only stocks imported)');
        } else {
          alert('Invalid file format');
        }
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
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

  const handleStockDragStart = (e, stockId, sourceCategory) => {
    e.dataTransfer.setData('stockId', stockId.toString());
    e.dataTransfer.setData('sourceCategory', sourceCategory);
  };

  const handleStockDragOver = (e) => {
    e.preventDefault();
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
          onImportClick={() => fileInputRef.current?.click()}
          onAddCategory={() => setShowCategoryModal(true)}
          onAddStock={() => {
            setNewStockCategory('');
            setShowNewStockModal(true);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onLogout={handleLogout}
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          onChange={importData} 
          hidden 
        />

        <PortfolioSummary
          stocks={stocks}
          dumpProfit={dumpProfit}
          referralProfit={referralProfit}
          bondsProfit={bondsProfit}
          onAddDumpProfit={() => setShowDumpProfitModal(true)}
          onAddReferralProfit={() => setShowReferralProfitModal(true)}
          onAddBondsProfit={() => setShowBondsProfitModal(true)}
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
            setTheme={setTheme}
            numberFormat={numberFormat}
            setNumberFormat={setNumberFormat}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            onCancel={() => setShowSettingsModal(false)}
          />
        </ModalContainer>
      </div>
    </div>
  );
}