import React, { useState, useEffect, useRef } from 'react';
import { Plus, ShoppingCart, DollarSign, Download, Upload, Edit3, Trash2, GripVertical, FolderPlus } from 'lucide-react';

const STORAGE_KEY = 'stockTrackerData';
const DUMP_PROFIT_KEY = 'dumpProfit';
const CATEGORIES_KEY = 'stockCategories';

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState({});
  const [bondsProfit, setBondsProfit] = useState(0);
  const [showBondsProfitModal, setShowBondsProfitModal] = useState(false);
  const [bondsProfitInput, setBondsProfitInput] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCategoryChartModal, setShowCategoryChartModal] = useState(false);
  const [categoryChartMode, setCategoryChartMode] = useState('totalCost'); // 'totalCost', 'shares', 'profit', 'soldCost', 'soldShares'
  const [showProfitChartModal, setShowProfitChartModal] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('all'); // 'all', 'buys', 'sales'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [modalShares, setModalShares] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [newNeededValue, setNewNeededValue] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [newStockLimit, setNewStockLimit] = useState('');
  const [newStockNeeded, setNewStockNeeded] = useState('');
  const [startTimerOnBuy, setStartTimerOnBuy] = useState(true);
  const [categories, setCategories] = useState([]);
  const [stockNotes, setStockNotes] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [theme, setTheme] = useState('dark');
  const [numberFormat, setNumberFormat] = useState('compact'); // 'compact' or 'full'
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    avgBuy: true,
    avgSell: true,
    profit: true,
    timer: true,
    notes: true,
    limit4h: true
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dumpProfit, setDumpProfit] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showDumpProfitModal, setShowDumpProfitModal] = useState(false);
  const [dumpProfitInput, setDumpProfitInput] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStockForHistory, setSelectedStockForHistory] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedStockForNotes, setSelectedStockForNotes] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [referralProfit, setReferralProfit] = useState(0);
  const [showReferralProfitModal, setShowReferralProfitModal] = useState(false);
  const [referralProfitInput, setReferralProfitInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const fileInputRef = useRef(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newStockCategory, setNewStockCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedCategories = localStorage.getItem(CATEGORIES_KEY);

    const savedDumpProfit = localStorage.getItem(DUMP_PROFIT_KEY);
    if (savedDumpProfit) {
      try {
        const parsed = parseFloat(savedDumpProfit);
        if (!isNaN(parsed)) {
          setDumpProfit(parsed);
        }
      } catch (e) {
        console.error('Failed to load dump profit:', e);
      }
    }

    const savedReferralProfit = localStorage.getItem('referralProfit');
    if (savedReferralProfit) {
      try {
        const parsed = parseFloat(savedReferralProfit);
        if (!isNaN(parsed)) {
          setReferralProfit(parsed);
        }
      } catch (e) {
        console.error('Failed to load referral profit:', e);
      }
    }

    const savedBondsProfit = localStorage.getItem('bondsProfit');
    if (savedBondsProfit) {
      try {
        const parsed = parseFloat(savedBondsProfit);
        if (!isNaN(parsed)) {
          setBondsProfit(parsed);
        }
      } catch (e) {
        console.error('Failed to load bonds profit:', e);
      }
    }

    const savedNotes = localStorage.getItem('stockNotes');
    if (savedNotes) {
      try {
        setStockNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedNumberFormat = localStorage.getItem('numberFormat');
    if (savedNumberFormat) {
      setNumberFormat(savedNumberFormat);
    }

    const savedVisibleColumns = localStorage.getItem('visibleColumns');
    if (savedVisibleColumns) {
      try {
        setVisibleColumns(JSON.parse(savedVisibleColumns));
      } catch (e) {
        console.error('Failed to load visible columns:', e);
      }
    }

    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error('Failed to load transactions:', e);
      }
    }

    if (savedData) {
      try {
        setStocks(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    } else {
      setStocks([
        {
          id: 1,
          name: 'M',
          totalCost: 36000000,
          shares: 360000,
          sharesSold: 240000,
          totalCostSold: 460000,
          totalCostBasisSold: 0,  // ADD THIS
          limit4h: 12000,
          needed: 100000,
          timerEndTime: null,
          category: 'Tech',
        },
        {
          id: 2,
          name: 'AAPL',
          totalCost: 0,
          shares: 0,
          sharesSold: 0,
          totalCostSold: 0,
          totalCostBasisSold: 0,  // ADD THIS
          limit4h: 5000,
          needed: 50000,
          timerEndTime: null,
          category: 'Tech',
        },
        {
          id: 3,
          name: 'TSLA',
          totalCost: 0,
          shares: 0,
          sharesSold: 0,
          totalCostSold: 0,
          totalCostBasisSold: 0,  // ADD THIS
          limit4h: 8000,
          needed: 75000,
          timerEndTime: null,
          category: 'Auto',
        },
      ]);
    }

    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    } else {
      setCategories(['Tech', 'Auto', 'Finance']);
    }

    setDataLoaded(true);
  }, []);

  // Save data
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
      localStorage.setItem('bondsProfit', bondsProfit.toString());
    }
  }, [bondsProfit, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem(DUMP_PROFIT_KEY, dumpProfit.toString());
    }
  }, [dumpProfit, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && categories.length > 0) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }, [categories, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('referralProfit', referralProfit.toString());
    }
  }, [referralProfit, dataLoaded]);

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

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '-';

    if (numberFormat === 'full') {
      return num.toLocaleString();
    }

    // Compact format
    // Below 100k → show full number
    if (num < 100_000) {
      return num.toLocaleString();
    }

    // Between 100k and 10M → show in thousands (K)
    if (num < 10_000_000) {
      return (num / 1_000).toFixed(0) + ' K';
    }

    // 10M and above → show in millions (M)
    return (num / 1_000_000).toFixed(1) + ' M';
  };

  const formatTimer = (endTime) => {
    if (!endTime) return '--:--:--';
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Ready';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const sortStocks = (stocks, key) => {
    if (!key) return stocks;

    return [...stocks].sort((a, b) => {
      let aVal, bVal;

      switch (key) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'shares':
          aVal = a.shares;
          bVal = b.shares;
          break;
        case 'totalCost':
          aVal = a.totalCost;
          bVal = b.totalCost;
          break;
        case 'avgBuy':
          aVal = a.shares > 0 ? a.totalCost / a.shares : 0;
          bVal = b.shares > 0 ? b.totalCost / b.shares : 0;
          break;
        case 'sharesSold':
          aVal = a.sharesSold;
          bVal = b.sharesSold;
          break;
        case 'totalCostSold':
          aVal = a.totalCostSold;
          bVal = b.totalCostSold;
          break;
        case 'avgSell':
          aVal = a.sharesSold > 0 ? a.totalCostSold / a.sharesSold : 0;
          bVal = b.sharesSold > 0 ? b.totalCostSold / b.sharesSold : 0;
          break;
        case 'profit':
          aVal = a.totalCostSold - (a.totalCostBasisSold || 0);
          bVal = b.totalCostSold - (b.totalCostBasisSold || 0);
          break;
        case 'needed':
          aVal = a.needed;
          bVal = b.needed;
          break;
        case 'limit4h':
          aVal = a.limit4h;
          bVal = b.limit4h;
          break;
        case 'timer':
          aVal = a.timerEndTime || 0;
          bVal = b.timerEndTime || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleCategory = (category) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [category]: !collapsedCategories[category]
    });
  };

  const highlightRow = (stockId) => {
    setHighlightedRows({ ...highlightedRows, [stockId]: true });
    setTimeout(() => {
      setHighlightedRows({ ...highlightedRows, [stockId]: false });
    }, 1000);
  };

  const [buyMultiplier, setBuyMultiplier] = useState(1);

  const openBuyModal = (stock) => {
    setSelectedStock(stock);
    const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
    setBuyMultiplier(1);
    setModalShares((stock.limit4h * 1).toString());
    setModalPrice((Math.round(avgBuy * 100) / 100).toFixed(0));
    setShowBuyModal(true);
  };

  const openSellModal = (stock) => {
    setSelectedStock(stock);
    const avgSell = stock.sharesSold > 0 ? stock.totalCostSold / stock.sharesSold : 0;
    setModalShares('');
    setModalPrice((Math.round(avgSell * 100) / 100).toFixed(0));
    setShowSellModal(true);
  };

  const openAdjustModal = (stock) => {
    setSelectedStock(stock);
    setNewNeededValue(stock.needed.toString());
    setNewCategoryValue(stock.category || 'Uncategorized');
    setShowAdjustModal(true);
  };

  const openDeleteModal = (stock) => {
    setSelectedStock(stock);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    setStocks(stocks.filter(s => s.id !== selectedStock.id));
    setShowDeleteModal(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (!categories.includes(newCategoryName)) {
      setCategories([...categories, newCategoryName]);
    }
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  const openDeleteCategoryModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  };

  const openNotesModal = (stock) => {
    setSelectedStockForNotes(stock);
    setNotesInput(stockNotes[stock.id] || '');
    setShowNotesModal(true);
  };

  const handleSaveNoteFromModal = () => {
    if (selectedStockForNotes) {
      setStockNotes({ ...stockNotes, [selectedStockForNotes.id]: notesInput });
      setShowNotesModal(false);
    }
  };

  const handleAddReferralProfit = () => {
    if (!referralProfitInput) return;
    const amount = parseFloat(referralProfitInput);
    setReferralProfit(referralProfit + amount);
    setReferralProfitInput('');
    setShowReferralProfitModal(false);
  };

  const handleAddBondsProfit = () => {
    if (!bondsProfitInput) return;
    const amount = parseFloat(bondsProfitInput);
    setBondsProfit(bondsProfit + amount);
    setBondsProfitInput('');
    setShowBondsProfitModal(false);
  };

  const handleDeleteCategory = () => {
    // Move stocks from deleted category to Uncategorized
    setStocks(stocks.map(s =>
      s.category === selectedCategory ? { ...s, category: 'Uncategorized' } : s
    ));
    // Remove category from list
    setCategories(categories.filter(c => c !== selectedCategory));
    setShowDeleteCategoryModal(false);
  };

  const handleBuy = () => {
    if (!modalShares || !modalPrice) return;
    const shares = parseFloat(modalShares);
    const price = parseFloat(modalPrice);
    const total = shares * price;

    setStocks(stocks.map(s => {
      if (s.id === selectedStock.id) {
        const newShares = s.shares + shares;
        const timerEndTime = (startTimerOnBuy || shares >= s.limit4h) ? Date.now() + (4 * 60 * 60 * 1000) : s.timerEndTime;
        return { ...s, totalCost: s.totalCost + total, shares: newShares, timerEndTime };
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

  const handleSell = () => {
    if (!modalShares || !modalPrice) return;
    const shares = parseFloat(modalShares);
    const price = parseFloat(modalPrice);

    // Validation: Check if trying to sell more than available
    if (shares > selectedStock.shares) {
      alert(`Cannot sell ${shares} shares. You only have ${selectedStock.shares} shares available.`);
      return;
    }

    if (shares <= 0) {
      alert('Please enter a valid number of shares to sell.');
      return;
    }

    const total = shares * price;

    setStocks(stocks.map(s => {
      if (s.id === selectedStock.id) {
        // Calculate current average buy price
        const avgBuy = s.shares > 0 ? s.totalCost / s.shares : 0;

        // Calculate the cost basis of shares being sold
        const costBasisOfSharesSold = avgBuy * shares;

        return {
          ...s,
          shares: s.shares - shares,  // Reduce inventory
          totalCost: s.totalCost - costBasisOfSharesSold,  // Reduce total cost proportionally
          sharesSold: s.sharesSold + shares,  // Track shares sold
          totalCostSold: s.totalCostSold + total,  // Track revenue from sales
          totalCostBasisSold: (s.totalCostBasisSold || 0) + costBasisOfSharesSold  // Track actual cost basis
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

  const openHistoryModal = (stock) => {
    setSelectedStockForHistory(stock);
    setShowHistoryModal(true);
  };

  const handleSaveNote = (stockId, note) => {
    setStockNotes({ ...stockNotes, [stockId]: note });
  };

  const handleAdjustNeeded = () => {
    if (!newNeededValue) return;
    const newVal = parseFloat(newNeededValue);
    setStocks(stocks.map(s =>
      s.id === selectedStock.id ? { ...s, needed: newVal, category: newCategoryValue } : s
    ));
    highlightRow(selectedStock.id);
    setShowAdjustModal(false);
  };

  const handleAddStock = () => {
    if (!newStockName.trim() || !newStockLimit) return;
    setStocks([...stocks, {
      id: Date.now(),
      name: newStockName,
      totalCost: 0,
      shares: 0,
      sharesSold: 0,
      totalCostSold: 0,
      totalCostBasisSold: 0,  // ADD THIS
      limit4h: parseFloat(newStockLimit),
      needed: parseFloat(newStockNeeded) || 0,
      timerEndTime: null,
      category: newStockCategory || 'Uncategorized',
    }]);
    setNewStockName('');
    setNewStockLimit('');
    setNewStockNeeded('');
    setNewStockCategory('');
    setShowNewStockModal(false);
  };

  const handleAddDumpProfit = () => {
    if (!dumpProfitInput) return;
    const amount = parseFloat(dumpProfitInput);
    setDumpProfit(dumpProfit + amount);
    setDumpProfitInput('');
    setShowDumpProfitModal(false);
  };

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
          if (imported.stockNotes) {
            setStockNotes(imported.stockNotes);
          }
          if (imported.bondsProfit !== undefined) {
            setBondsProfit(imported.bondsProfit);
          }
          if (imported.transactions && Array.isArray(imported.transactions)) {
            setTransactions(imported.transactions);
          }
          alert('Data imported successfully!');
        } else if (Array.isArray(imported)) {
          // Legacy format support (just stocks array)
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

  // Group stocks by category
  const groupedStocks = categories.reduce((acc, cat) => {
    acc[cat] = stocks.filter(s => s.category === cat);
    return acc;
  }, {});

  // Add uncategorized stocks
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
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, rgb(96, 165, 250), rgb(192, 132, 252))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Stock Portfolio Tracker
            </h1>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={exportData}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(21, 128, 61)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
              >
                <Download size={18} /> Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(126, 34, 206)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgb(107, 33, 168)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgb(126, 34, 206)'}
              >
                <Upload size={18} /> Import
              </button>
              <input type="file" ref={fileInputRef} accept=".json" onChange={importData} hidden />
              <button
                onClick={() => setShowCategoryModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(67, 56, 202)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgb(55, 48, 163)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
              >
                <FolderPlus size={18} /> Add Category
              </button>
              <button
                onClick={() => setShowNewStockModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(29, 78, 216)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgb(30, 64, 175)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
              >
                <Plus size={18} /> Add Stock
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(71, 85, 105)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Portfolio Summary Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {/* Top Row - 4 items */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Total Portfolio Value */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Total Portfolio:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(96, 165, 250)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(stocks.reduce((sum, s) => sum + s.totalCost, 0))}
                </span>
              </div>

              {/* Total Shares */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Total Shares:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(251, 146, 60)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(stocks.reduce((sum, s) => sum + s.shares, 0))}
                </span>
              </div>

              {/* Total Sales */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Total Sales:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(168, 85, 247)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(stocks.reduce((sum, s) => sum + s.totalCostSold, 0))}
                </span>
              </div>
              {/* Total Profit */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Total Profit:
                </span>
                <span style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: (() => {
                    const stocksProfit = stocks.reduce((sum, s) => {
                      return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
                    }, 0);
                    const totalProfit = stocksProfit + dumpProfit + referralProfit + bondsProfit;
                    return totalProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)';
                  })(),
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  {(() => {
                    const stocksProfit = stocks.reduce((sum, s) => {
                      return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
                    }, 0);
                    return formatNumber(stocksProfit + dumpProfit + referralProfit);
                  })()}
                </span>
              </div>
            </div>

            {/* Bottom Row - 3 items */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Stock Profit */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Stock Profit:
                </span>
                <span style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: (() => {
                    const profit = stocks.reduce((sum, s) => {
                      return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
                    }, 0);
                    return profit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)';
                  })(),
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  {(() => {
                    const profit = stocks.reduce((sum, s) => {
                      return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
                    }, 0);
                    return formatNumber(profit);
                  })()}
                </span>
              </div>

              {/* Dump Profit */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Dump Profit:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(52, 211, 153)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(dumpProfit)}
                </span>
                <button
                  onClick={() => setShowDumpProfitModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgb(5, 150, 105)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(4, 120, 87)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(5, 150, 105)'}
                >
                  <Plus size={18} /> Add
                </button>
              </div>

              {/* Referral Profit */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Referral Profit:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(168, 85, 247)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(referralProfit)}
                </span>
                <button
                  onClick={() => setShowReferralProfitModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgb(126, 34, 206)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(107, 33, 168)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(126, 34, 206)'}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
              {/* Bonds Profit */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'linear-gradient(to right, rgb(30, 41, 59), rgb(51, 65, 85))',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgb(71, 85, 105)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '500', color: 'rgb(209, 213, 219)' }}>
                  Bonds Profit:
                </span>
                <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'rgb(234, 179, 8)', minWidth: '120px', textAlign: 'center' }}>
                  {formatNumber(bondsProfit)}
                </span>
                <button
                  onClick={() => setShowBondsProfitModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgb(161, 98, 7)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(133, 77, 14)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Chart Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowProfitChartModal(true)}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(to right, rgb(67, 56, 202), rgb(147, 51, 234))',
              borderRadius: '0.75rem',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(55, 48, 163), rgb(126, 34, 206))'}
            onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(67, 56, 202), rgb(147, 51, 234))'}
          >
            📊 View Profit Breakdown
          </button>

          <button
            onClick={() => setShowCategoryChartModal(true)}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
              borderRadius: '0.75rem',
              border: 'none',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))'}
            onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))'}
          >
            📈 Category Comparison
          </button>
        </div>

        {Object.entries(groupedStocks).map(([category, categoryStocks]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 0.5rem',
              marginBottom: '0.5rem',
              userSelect: 'none'
            }}>
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('categoryName', category);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedCategory = e.dataTransfer.getData('categoryName');
                  if (draggedCategory && draggedCategory !== category) {
                    const allCategories = Object.keys(groupedStocks);
                    const draggedIndex = allCategories.indexOf(draggedCategory);
                    const targetIndex = allCategories.indexOf(category);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                      // Reorder categories array
                      const newCategories = [...categories];
                      const draggedCatIndex = newCategories.indexOf(draggedCategory);
                      const targetCatIndex = newCategories.indexOf(category);

                      if (draggedCatIndex !== -1 && targetCatIndex !== -1) {
                        newCategories.splice(draggedCatIndex, 1);
                        newCategories.splice(targetCatIndex, 0, draggedCategory);
                        setCategories(newCategories);
                      } else if (draggedCategory === 'Uncategorized' && targetCatIndex !== -1) {
                        // Handle Uncategorized specially since it's not in categories array
                        // Just re-render, Uncategorized always stays at end
                      } else if (category === 'Uncategorized' && draggedCatIndex !== -1) {
                        // Moving a category to Uncategorized position (end)
                        newCategories.splice(draggedCatIndex, 1);
                        newCategories.push(draggedCategory);
                        setCategories(newCategories);
                      }
                    }
                  }
                }}
                onClick={() => toggleCategory(category)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'move', flex: 1 }}
              >
                <span style={{ fontSize: '1.25rem', transition: 'transform 0.2s', display: 'inline-block', transform: collapsedCategories[category] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'rgb(96, 165, 250)' }}>
                  {category} ({categoryStocks.length})
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewStockCategory(category);
                    setShowNewStockModal(true);
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgb(29, 78, 216)',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(30, 64, 175)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
                >
                  <Plus size={12} /> Add Stock
                </button>
                {category !== 'Uncategorized' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteCategoryModal(category);
                    }}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgb(153, 27, 27)',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgb(127, 29, 29)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgb(153, 27, 27)'}
                  >
                    <Trash2 size={12} /> Delete Category
                  </button>
                )}
              </div>
            </div>
            {!collapsedCategories[category] && (
              <>
                {/* Category Stats Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '1rem',
                  background: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  border: '1px solid rgb(71, 85, 105)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>Total Cost</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(96, 165, 250)' }}>
                      {formatNumber(categoryStocks.reduce((sum, s) => sum + s.totalCost, 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>Total Shares</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(251, 146, 60)' }}>
                      {formatNumber(categoryStocks.reduce((sum, s) => sum + s.shares, 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>Total Profit</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(52, 211, 153)' }}>
                      {formatNumber(categoryStocks.reduce((sum, s) => sum + (s.totalCostSold - (s.totalCostBasisSold || 0)), 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>Sold Shares</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(168, 85, 247)' }}>
                      {formatNumber(categoryStocks.reduce((sum, s) => sum + s.sharesSold, 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>Sold Cost</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgb(192, 132, 252)' }}>
                      {formatNumber(categoryStocks.reduce((sum, s) => sum + s.totalCostSold, 0))}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgb(51, 65, 85)',
                  borderRadius: '0.5rem',
                  overflowX: 'auto',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', color: 'rgb(229, 231, 235)', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgb(30, 41, 59)', borderBottom: '1px solid rgb(51, 65, 85)' }}>
                      <tr>
                        <th style={{ padding: '0.5rem', width: '2rem', border: '1px solid rgb(51, 65, 85)' }}></th>
                        {[
                          { label: 'Name', key: 'name', visible: true },
                          { label: 'Status', key: null, visible: visibleColumns.status },
                          { label: 'In Stock', key: 'shares', visible: true },
                          { label: 'Total Cost', key: 'totalCost', visible: true },
                          { label: 'Avg Buy', key: 'avgBuy', visible: visibleColumns.avgBuy },
                          { label: 'Stock Sold', key: 'sharesSold', visible: true },
                          { label: 'Total Sold Price', key: 'totalCostSold', visible: true },
                          { label: 'Avg Sell', key: 'avgSell', visible: visibleColumns.avgSell },
                          { label: 'Profit', key: 'profit', visible: visibleColumns.profit },
                          { label: 'Desired Stock', key: 'needed', visible: true },
                          { label: '4H Limit', key: 'limit4h', visible: visibleColumns.limit4h },
                          { label: 'Timer', key: 'timer', visible: visibleColumns.timer },
                          { label: 'Notes', key: null, visible: visibleColumns.notes },
                          { label: 'Actions', key: null, visible: true }
                        ].filter(col => col.visible).map((col) => (
                          <th
                            key={col.label}
                            onClick={() => col.key && handleSort(col.key)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              fontWeight: '600',
                              color: 'rgb(209, 213, 219)',
                              border: '1px solid rgb(51, 65, 85)',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              cursor: col.key ? 'pointer' : 'default',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onMouseOver={(e) => {
                              if (col.key) e.currentTarget.style.background = 'rgb(51, 65, 85)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              {col.label}
                              {col.key && sortConfig.key === col.key && (
                                <span style={{ fontSize: '0.75rem' }}>
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortStocks(categoryStocks, sortConfig.key).map((s, i) => {
                        const avgBuy = s.shares > 0 ? s.totalCost / s.shares : 0;
                        const avgSell = s.sharesSold > 0 ? s.totalCostSold / s.sharesSold : 0;
                        const profit = (s.totalCostSold - (s.totalCostBasisSold || 0)).toFixed(0);
                        const timerDisplay = formatTimer(s.timerEndTime);
                        const isTimerActive = s.timerEndTime && s.timerEndTime > Date.now();

                        return (
                          <tr
                            key={s.id}
                            style={{
                              background: highlightedRows[s.id]
                                ? 'rgba(96, 165, 250, 0.3)'
                                : (i % 2 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.4)'),
                              cursor: 'move',
                              transition: 'background 0.3s',
                              boxShadow: highlightedRows[s.id] ? '0 0 20px rgba(96, 165, 250, 0.5)' : 'none'
                            }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('stockId', s.id);
                              e.dataTransfer.setData('sourceCategory', category);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedStockId = parseInt(e.dataTransfer.getData('stockId'));
                              const sourceCategory = e.dataTransfer.getData('sourceCategory');

                              if (draggedStockId !== s.id && sourceCategory === category) {
                                // Reorder within same category
                                const categoryStocks = stocks.filter(stock => stock.category === category);
                                const draggedIndex = categoryStocks.findIndex(stock => stock.id === draggedStockId);
                                const targetIndex = categoryStocks.findIndex(stock => stock.id === s.id);

                                const reordered = [...categoryStocks];
                                const [draggedStock] = reordered.splice(draggedIndex, 1);
                                reordered.splice(targetIndex, 0, draggedStock);

                                const otherStocks = stocks.filter(stock => stock.category !== category);
                                setStocks([...otherStocks, ...reordered]);
                              } else if (draggedStockId !== s.id && sourceCategory !== category) {
                                // Move to different category
                                setStocks(stocks.map(stock =>
                                  stock.id === draggedStockId ? { ...stock, category: category } : stock
                                ));
                              }
                            }}
                            onMouseOver={(e) => {
                              if (!highlightedRows[s.id]) {
                                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!highlightedRows[s.id]) {
                                e.currentTarget.style.background = i % 2 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.4)';
                              }
                            }}
                          >
                            <td style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
                              <GripVertical size={16} style={{ color: 'rgb(107, 114, 128)', margin: '0 auto' }} />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: '600', color: 'white', border: '1px solid rgb(51, 65, 85)' }}>{s.name}</td>
                            {visibleColumns.status && (
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
                                {s.timerEndTime && s.timerEndTime > Date.now() ? (
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'rgb(202, 138, 4)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    ⏰ TIMER
                                  </span>
                                ) : s.shares < s.needed ? (
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'rgb(220, 38, 38)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    🔴 LOW
                                  </span>
                                ) : (
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'rgb(21, 128, 61)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    🟢 OK
                                  </span>
                                )}
                              </td>
                            )}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.shares)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.totalCost)}</td>
                            {visibleColumns.avgBuy && (<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>${avgBuy.toFixed(2)}</td>)}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.sharesSold)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.totalCostSold)}</td>
                            {visibleColumns.avgSell && (<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'rgb(134, 239, 172)', border: '1px solid rgb(51, 65, 85)' }}>${avgSell.toFixed(2)}</td>)}
                            {visibleColumns.profit && (<td style={{
                              padding: '0.5rem 0.75rem',
                              textAlign: 'right',
                              border: '1px solid rgb(51, 65, 85)',
                              color: parseFloat(profit) >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'
                            }}>
                              {parseFloat(profit) >= 0 ? '+' : ''}{formatNumber(parseFloat(profit))}
                            </td>)}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.needed)}</td>
                            {visibleColumns.limit4h && (<td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', border: '1px solid rgb(51, 65, 85)' }}>{formatNumber(s.limit4h)}</td>)}
                            {visibleColumns.timer && (<td style={{
                              padding: '0.5rem 0.75rem',
                              textAlign: 'center',
                              border: '1px solid rgb(51, 65, 85)',
                              fontFamily: 'monospace',
                              color: isTimerActive ? 'rgb(251, 146, 60)' : 'rgb(156, 163, 175)'
                            }}>
                              {timerDisplay}
                            </td>)}
                            {visibleColumns.notes && (<td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
                              <button
                                onClick={() => openNotesModal(s)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: stockNotes[s.id] ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  borderRadius: '0.25rem',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = stockNotes[s.id] ? 'rgb(147, 51, 234)' : 'rgb(51, 65, 85)'}
                                onMouseOut={(e) => e.currentTarget.style.background = stockNotes[s.id] ? 'rgb(168, 85, 247)' : 'rgb(71, 85, 105)'}
                              >
                                {stockNotes[s.id] ? '📝 Edit' : '➕ Add'}
                              </button>
                            </td>)}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgb(51, 65, 85)' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                                <button
                                  onClick={() => openBuyModal(s)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgb(21, 128, 61)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '0.25rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
                                >
                                  Buy
                                </button>
                                <button
                                  onClick={() => openSellModal(s)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgb(185, 28, 28)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '0.25rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(153, 27, 27)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
                                >
                                  Sell
                                </button>
                                <button
                                  onClick={() => openHistoryModal(s)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgb(67, 56, 202)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '0.25rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(55, 48, 163)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
                                >
                                  📜
                                </button>
                                <button
                                  onClick={() => openAdjustModal(s)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgb(202, 138, 4)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(202, 138, 4)'}
                                >
                                  <Edit3 size={12} /> Adjust
                                </button>
                                <button
                                  onClick={() => openDeleteModal(s)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgb(127, 29, 29)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    borderRadius: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgb(69, 10, 10)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgb(127, 29, 29)'}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Modals */}
        {[showBuyModal, showSellModal, showNewStockModal, showAdjustModal, showDeleteModal, showCategoryModal, showDeleteCategoryModal, showDumpProfitModal, showReferralProfitModal, showBondsProfitModal, showHistoryModal, showNotesModal, showProfitChartModal, showCategoryChartModal, showSettingsModal].some(Boolean) && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              background: 'rgb(30, 41, 59)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              width: '24rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgb(51, 65, 85)'
            }}>
              {showBuyModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Buy {selectedStock?.name}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Shares
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(mult => (
                          <button
                            key={mult}
                            onClick={() => {
                              setBuyMultiplier(mult);
                              setModalShares((selectedStock.limit4h * mult).toString());
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              background: buyMultiplier === mult ? 'rgb(34, 197, 94)' : 'rgb(71, 85, 105)',
                              borderRadius: '0.5rem',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => {
                              if (buyMultiplier !== mult) e.currentTarget.style.background = 'rgb(51, 65, 85)';
                            }}
                            onMouseOut={(e) => {
                              if (buyMultiplier !== mult) e.currentTarget.style.background = 'rgb(71, 85, 105)';
                            }}
                          >
                            {mult}x
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={modalShares}
                        onChange={(e) => setModalShares(e.target.value)}
                        placeholder="Number of shares"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(34, 197, 94)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Price per Share
                      </label>
                      <input
                        type="number"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(e.target.value)}
                        placeholder="Price"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(34, 197, 94)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={startTimerOnBuy}
                        onChange={(e) => setStartTimerOnBuy(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>Start timer after purchase</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleBuy}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(21, 128, 61)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowBuyModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 85)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showSellModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Sell {selectedStock?.name}</h2>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(251, 146, 60, 0.1)',
                    border: '1px solid rgb(251, 146, 60)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(251, 146, 60)', fontWeight: '600' }}>
                      Available: {formatNumber(selectedStock?.shares)} shares
                    </span>
                  </div>
                  {/* Profit Calculator */}
                  {modalShares && modalPrice && parseFloat(modalShares) > 0 && parseFloat(modalPrice) > 0 && (
                    <div style={{
                      padding: '0.75rem',
                      background: (() => {
                        const shares = parseFloat(modalShares);
                        const price = parseFloat(modalPrice);
                        const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
                        const profit = (price - avgBuy) * shares;
                        return profit >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)';
                      })(),
                      border: (() => {
                        const shares = parseFloat(modalShares);
                        const price = parseFloat(modalPrice);
                        const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
                        const profit = (price - avgBuy) * shares;
                        return profit >= 0 ? '1px solid rgb(52, 211, 153)' : '1px solid rgb(248, 113, 113)';
                      })(),
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
                          Avg Buy Price:
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
                          ${(selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
                          Sell Price:
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
                          ${parseFloat(modalPrice).toFixed(2)}
                        </span>
                      </div>
                      <div style={{
                        borderTop: '1px solid rgba(209, 213, 219, 0.2)',
                        paddingTop: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '600', color: 'rgb(209, 213, 219)' }}>
                            Expected Profit:
                          </span>
                          <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: (() => {
                              const shares = parseFloat(modalShares);
                              const price = parseFloat(modalPrice);
                              const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
                              const profit = (price - avgBuy) * shares;
                              return profit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)';
                            })()
                          }}>
                            {(() => {
                              const shares = parseFloat(modalShares);
                              const price = parseFloat(modalPrice);
                              const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
                              const profit = (price - avgBuy) * shares;
                              return (profit >= 0 ? '+' : '') + formatNumber(profit);
                            })()}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginTop: '0.25rem' }}>
                          {(() => {
                            const shares = parseFloat(modalShares);
                            const price = parseFloat(modalPrice);
                            const avgBuy = selectedStock.shares > 0 ? selectedStock.totalCost / selectedStock.shares : 0;
                            const profitPercent = avgBuy > 0 ? ((price - avgBuy) / avgBuy * 100) : 0;
                            return (profitPercent >= 0 ? '+' : '') + profitPercent.toFixed(2) + '%';
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Shares (Max: {selectedStock?.shares?.toLocaleString()})
                      </label>
                      <input
                        type="number"
                        value={modalShares}
                        onChange={(e) => setModalShares(e.target.value)}
                        placeholder="Number of shares"
                        max={selectedStock?.shares}
                        min="0"
                        step="1"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(239, 68, 68)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Price per Share
                      </label>
                      <input
                        type="number"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(e.target.value)}
                        placeholder="Price"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(239, 68, 68)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleSell}
                        disabled={!modalShares || parseFloat(modalShares) > selectedStock?.shares || parseFloat(modalShares) <= 0}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: (!modalShares || parseFloat(modalShares) > selectedStock?.shares || parseFloat(modalShares) <= 0)
                            ? 'rgb(100, 100, 100)'
                            : 'rgb(185, 28, 28)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: (!modalShares || parseFloat(modalShares) > selectedStock?.shares || parseFloat(modalShares) <= 0)
                            ? 'not-allowed'
                            : 'pointer',
                          fontWeight: '500',
                          opacity: (!modalShares || parseFloat(modalShares) > selectedStock?.shares || parseFloat(modalShares) <= 0)
                            ? 0.5
                            : 1
                        }}
                        onMouseOver={(e) => {
                          if (modalShares && parseFloat(modalShares) <= selectedStock?.shares && parseFloat(modalShares) > 0) {
                            e.currentTarget.style.background = 'rgb(153, 27, 27)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (modalShares && parseFloat(modalShares) <= selectedStock?.shares && parseFloat(modalShares) > 0) {
                            e.currentTarget.style.background = 'rgb(185, 28, 28)';
                          }
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowSellModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showAdjustModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Adjust {selectedStock?.name}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Desired Stock
                      </label>
                      <input
                        type="number"
                        value={newNeededValue}
                        onChange={(e) => setNewNeededValue(e.target.value)}
                        placeholder="Enter new needed value"
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgb(209, 213, 219)', marginBottom: '0.5rem' }}>
                        Category
                      </label>
                      <select
                        value={newCategoryValue}
                        onChange={(e) => setNewCategoryValue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          outline: 'none',
                          border: '2px solid transparent',
                          color: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgb(202, 138, 4)'}
                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Uncategorized">Uncategorized</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAdjustNeeded}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(202, 138, 4)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(202, 138, 4)'}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowAdjustModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showNewStockModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Stock</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      value={newStockName}
                      onChange={(e) => setNewStockName(e.target.value)}
                      placeholder="Stock name"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <select
                      value={newStockCategory}
                      onChange={(e) => setNewStockCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Uncategorized">Uncategorized</option>
                    </select>
                    <input
                      type="number"
                      value={newStockLimit}
                      onChange={(e) => setNewStockLimit(e.target.value)}
                      placeholder="4h limit"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <input
                      type="number"
                      value={newStockNeeded}
                      onChange={(e) => setNewStockNeeded(e.target.value)}
                      placeholder="Needed"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(37, 99, 235)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAddStock}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(37, 99, 235)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(37, 99, 235)'}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowNewStockModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showCategoryModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Category</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(79, 70, 229)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAddCategory}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(79, 70, 229)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(79, 70, 229)'}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowCategoryModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showDeleteModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'rgb(248, 113, 113)' }}>Delete Stock</h2>
                  <p style={{ color: 'rgb(209, 213, 219)', marginBottom: '1.5rem' }}>
                    Are you sure you want to delete <span style={{ fontWeight: 'bold', color: 'white' }}>{selectedStock?.name}</span>?
                    This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleDelete}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgb(220, 38, 38)',
                        borderRadius: '0.5rem',
                        transition: 'background 0.2s',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(220, 38, 38)'}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        transition: 'background 0.2s',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {showDeleteCategoryModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'rgb(248, 113, 113)' }}>Delete Category</h2>
                  <p style={{ color: 'rgb(209, 213, 219)', marginBottom: '1.5rem' }}>
                    Are you sure you want to delete the <span style={{ fontWeight: 'bold', color: 'white' }}>{selectedCategory}</span> category?
                    All stocks in this category will be moved to "Uncategorized".
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleDeleteCategory}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgb(220, 38, 38)',
                        borderRadius: '0.5rem',
                        transition: 'background 0.2s',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(220, 38, 38)'}
                    >
                      Delete Category
                    </button>
                    <button
                      onClick={() => setShowDeleteCategoryModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        transition: 'background 0.2s',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {showDumpProfitModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Dump Profit</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="number"
                      value={dumpProfitInput}
                      onChange={(e) => setDumpProfitInput(e.target.value)}
                      placeholder="Enter profit amount"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(16, 185, 129)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAddDumpProfit}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(16, 185, 129)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(5, 150, 105)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(16, 185, 129)'}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowDumpProfitModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showHistoryModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Transaction History - {selectedStockForHistory?.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button
                      onClick={() => setTransactionFilter('all')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: transactionFilter === 'all' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (transactionFilter !== 'all') e.currentTarget.style.background = 'rgb(51, 65, 85)';
                      }}
                      onMouseOut={(e) => {
                        if (transactionFilter !== 'all') e.currentTarget.style.background = 'rgb(71, 85, 105)';
                      }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTransactionFilter('buy')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: transactionFilter === 'buy' ? 'rgb(21, 128, 61)' : 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (transactionFilter !== 'buy') e.currentTarget.style.background = 'rgb(51, 65, 85)';
                      }}
                      onMouseOut={(e) => {
                        if (transactionFilter !== 'buy') e.currentTarget.style.background = 'rgb(71, 85, 105)';
                      }}
                    >
                      Buys
                    </button>
                    <button
                      onClick={() => setTransactionFilter('sell')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: transactionFilter === 'sell' ? 'rgb(185, 28, 28)' : 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => {
                        if (transactionFilter !== 'sell') e.currentTarget.style.background = 'rgb(51, 65, 85)';
                      }}
                      onMouseOut={(e) => {
                        if (transactionFilter !== 'sell') e.currentTarget.style.background = 'rgb(71, 85, 105)';
                      }}
                    >
                      Sales
                    </button>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {transactions
                      .filter(t => t.stockId === selectedStockForHistory?.id)
                      .filter(t => transactionFilter === 'all' || t.type === transactionFilter)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(t => (
                        <div key={t.id} style={{
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: 'rgb(51, 65, 85)',
                          borderRadius: '0.5rem',
                          borderLeft: `4px solid ${t.type === 'buy' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{
                              fontWeight: '600',
                              color: t.type === 'buy' ? 'rgb(134, 239, 172)' : 'rgb(252, 165, 165)',
                              textTransform: 'uppercase',
                              fontSize: '0.875rem'
                            }}>
                              {t.type}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                              {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>
                            {t.shares.toLocaleString()} shares @ ${t.price.toFixed(2)} = ${t.total.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    {transactions.filter(t => t.stockId === selectedStockForHistory?.id).filter(t => transactionFilter === 'all' || t.type === transactionFilter).length === 0 && (
                      <p style={{ textAlign: 'center', color: 'rgb(156, 163, 175)', padding: '2rem' }}>
                        No transactions yet
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid rgb(71, 85, 105)' }}>
                    <button
                      onClick={() => setShowHistoryModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgb(71, 85, 105)',
                        borderRadius: '0.5rem',
                        transition: 'background 0.2s',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
              {showReferralProfitModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Referral Profit</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="number"
                      value={referralProfitInput}
                      onChange={(e) => setReferralProfitInput(e.target.value)}
                      placeholder="Enter profit amount"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(168, 85, 247)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAddReferralProfit}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(126, 34, 206)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(107, 33, 168)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(126, 34, 206)'}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowReferralProfitModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showBondsProfitModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Bonds Profit</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="number"
                      value={bondsProfitInput}
                      onChange={(e) => setBondsProfitInput(e.target.value)}
                      placeholder="Enter profit amount"
                      style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(234, 179, 8)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleAddBondsProfit}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(161, 98, 7)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(133, 77, 14)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(161, 98, 7)'}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowBondsProfitModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showNotesModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Notes - {selectedStockForNotes?.name}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Add your notes here..."
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgb(51, 65, 85)',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        border: '2px solid transparent',
                        color: 'white',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgb(168, 85, 247)'}
                      onBlur={(e) => e.target.style.borderColor = 'transparent'}
                    />
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                      <button
                        onClick={handleSaveNoteFromModal}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(168, 85, 247)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(147, 51, 234)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(168, 85, 247)'}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowNotesModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          background: 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          transition: 'background 0.2s',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
              {showProfitChartModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Profit Breakdown
                  </h2>
                  {(() => {
                    const stocksProfit = stocks.reduce((sum, s) => {
                      return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
                    }, 0);
                    const totalProfit = stocksProfit + dumpProfit + referralProfit + bondsProfit;

                    const stocksPct = totalProfit > 0 ? (stocksProfit / totalProfit * 100) : 0;
                    const dumpPct = totalProfit > 0 ? (dumpProfit / totalProfit * 100) : 0;
                    const referralPct = totalProfit > 0 ? (referralProfit / totalProfit * 100) : 0;

                    // Calculate pie chart segments
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;

                    let cumulativePercent = 0;

                    const getCoordinatesForPercent = (percent) => {
                      const x = Math.cos(2 * Math.PI * percent);
                      const y = Math.sin(2 * Math.PI * percent);
                      return [x, y];
                    };

                    const createSlice = (startPercent, percent, color) => {
                      const [startX, startY] = getCoordinatesForPercent(startPercent);
                      const [endX, endY] = getCoordinatesForPercent(startPercent + percent);
                      const largeArcFlag = percent > 0.5 ? 1 : 0;

                      return `
          M ${centerX + startX * radius} ${centerY + startY * radius}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${centerX + endX * radius} ${centerY + endY * radius}
          L ${centerX} ${centerY}
        `;
                    };

                    const segments = [];
                    if (stocksPct > 0) {
                      segments.push({ percent: stocksPct / 100, color: 'rgb(96, 165, 250)', label: 'Stocks', value: stocksProfit });
                      cumulativePercent += stocksPct / 100;
                    }
                    if (dumpPct > 0) {
                      segments.push({ percent: dumpPct / 100, color: 'rgb(52, 211, 153)', label: 'Dump', value: dumpProfit });
                    }
                    if (referralPct > 0) {
                      segments.push({ percent: referralPct / 100, color: 'rgb(168, 85, 247)', label: 'Referral', value: referralProfit });
                    }

                    let currentPercent = 0;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Pie Chart */}
                        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                          {segments.map((segment, index) => {
                            const slice = createSlice(currentPercent, segment.percent, segment.color);
                            const sliceElement = (
                              <path
                                key={index}
                                d={slice}
                                fill={segment.color}
                                stroke="rgb(30, 41, 59)"
                                strokeWidth="2"
                              />
                            );
                            currentPercent += segment.percent;
                            return sliceElement;
                          })}
                          {/* Center circle for donut effect */}
                          <circle cx={centerX} cy={centerY} r="40" fill="rgb(30, 41, 59)" />
                        </svg>

                        {/* Total in center */}
                        <div style={{
                          marginTop: '-140px',
                          marginBottom: '60px',
                          textAlign: 'center',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>
                            Total
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                            {formatNumber(totalProfit)}
                          </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                          {segments.map((segment, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgb(51, 65, 85)',
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${segment.color}`
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  background: segment.color,
                                  borderRadius: '50%'
                                }}></div>
                                <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)', fontWeight: '500' }}>
                                  {segment.label}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                                  {formatNumber(segment.value)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                                  {(segment.percent * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {totalProfit === 0 && (
                          <div style={{
                            textAlign: 'center',
                            color: 'rgb(156, 163, 175)',
                            padding: '2rem',
                            fontSize: '0.875rem'
                          }}>
                            No profit data yet. Start trading to see your breakdown!
                          </div>
                        )}

                        {/* Close Button */}
                        <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid rgb(71, 85, 105)', paddingTop: '1rem' }}>
                          <button
                            onClick={() => setShowProfitChartModal(false)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgb(71, 85, 105)',
                              borderRadius: '0.5rem',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '0.875rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
              {showCategoryChartModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
                    Category Comparison
                  </h2>

                  {/* Mode Selector */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                      { key: 'totalCost', label: 'Total Cost', color: 'rgb(96, 165, 250)' },
                      { key: 'shares', label: 'Shares', color: 'rgb(251, 146, 60)' },
                      { key: 'profit', label: 'Profit', color: 'rgb(52, 211, 153)' },
                      { key: 'soldCost', label: 'Sold Cost', color: 'rgb(192, 132, 252)' },
                      { key: 'soldShares', label: 'Sold Shares', color: 'rgb(168, 85, 247)' }
                    ].map(mode => (
                      <button
                        key={mode.key}
                        onClick={() => setCategoryChartMode(mode.key)}
                        style={{
                          flex: 1,
                          minWidth: '80px',
                          padding: '0.5rem',
                          background: categoryChartMode === mode.key ? mode.color : 'rgb(71, 85, 105)',
                          borderRadius: '0.5rem',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => {
                          if (categoryChartMode !== mode.key) e.currentTarget.style.background = 'rgb(51, 65, 85)';
                        }}
                        onMouseOut={(e) => {
                          if (categoryChartMode !== mode.key) e.currentTarget.style.background = 'rgb(71, 85, 105)';
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const categoryData = Object.entries(groupedStocks).map(([cat, stocks]) => {
                      let value = 0;
                      switch (categoryChartMode) {
                        case 'totalCost':
                          value = stocks.reduce((sum, s) => sum + s.totalCost, 0);
                          break;
                        case 'shares':
                          value = stocks.reduce((sum, s) => sum + s.shares, 0);
                          break;
                        case 'profit':
                          value = stocks.reduce((sum, s) => sum + (s.totalCostSold - (s.totalCostBasisSold || 0)), 0);
                          break;
                        case 'soldCost':
                          value = stocks.reduce((sum, s) => sum + s.totalCostSold, 0);
                          break;
                        case 'soldShares':
                          value = stocks.reduce((sum, s) => sum + s.sharesSold, 0);
                          break;
                      }
                      return { category: cat, value };
                    }).filter(d => d.value > 0);

                    const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                    const colors = ['rgb(96, 165, 250)', 'rgb(52, 211, 153)', 'rgb(168, 85, 247)', 'rgb(251, 146, 60)', 'rgb(234, 179, 8)', 'rgb(239, 68, 68)'];

                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;

                    const getCoordinatesForPercent = (percent) => {
                      const x = Math.cos(2 * Math.PI * percent);
                      const y = Math.sin(2 * Math.PI * percent);
                      return [x, y];
                    };

                    const createSlice = (startPercent, percent) => {
                      const [startX, startY] = getCoordinatesForPercent(startPercent);
                      const [endX, endY] = getCoordinatesForPercent(startPercent + percent);
                      const largeArcFlag = percent > 0.5 ? 1 : 0;

                      return `
          M ${centerX + startX * radius} ${centerY + startY * radius}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${centerX + endX * radius} ${centerY + endY * radius}
          L ${centerX} ${centerY}
        `;
                    };

                    let currentPercent = 0;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        {/* Pie Chart */}
                        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                          {categoryData.map((data, index) => {
                            const percent = data.value / total;
                            const slice = createSlice(currentPercent, percent);
                            const sliceElement = (
                              <path
                                key={index}
                                d={slice}
                                fill={colors[index % colors.length]}
                                stroke="rgb(30, 41, 59)"
                                strokeWidth="2"
                              />
                            );
                            currentPercent += percent;
                            return sliceElement;
                          })}
                          <circle cx={centerX} cy={centerY} r="40" fill="rgb(30, 41, 59)" />
                        </svg>

                        {/* Total in center */}
                        <div style={{
                          marginTop: '-140px',
                          marginBottom: '60px',
                          textAlign: 'center',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)', marginBottom: '0.25rem' }}>
                            Total
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                            {formatNumber(total)}
                          </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                          {categoryData.map((data, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgb(51, 65, 85)',
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${colors[index % colors.length]}`
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  background: colors[index % colors.length],
                                  borderRadius: '50%'
                                }}></div>
                                <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)', fontWeight: '500' }}>
                                  {data.category}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>
                                  {formatNumber(data.value)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'rgb(156, 163, 175)' }}>
                                  {((data.value / total) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {categoryData.length === 0 && (
                          <div style={{
                            textAlign: 'center',
                            color: 'rgb(156, 163, 175)',
                            padding: '2rem',
                            fontSize: '0.875rem'
                          }}>
                            No data available for this metric
                          </div>
                        )}

                        {/* Close Button */}
                        <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid rgb(71, 85, 105)', paddingTop: '1rem' }}>
                          <button
                            onClick={() => setShowCategoryChartModal(false)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgb(71, 85, 105)',
                              borderRadius: '0.5rem',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '0.875rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
              {showSettingsModal && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>

                    {/* Theme Setting */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
                        Theme
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setTheme('dark')}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: theme === 'dark' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                            borderRadius: '0.5rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                        >
                          🌙 Dark
                        </button>
                        <button
                          onClick={() => setTheme('light')}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: theme === 'light' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                            borderRadius: '0.5rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                        >
                          ☀️ Light
                        </button>
                      </div>
                    </div>

                    {/* Number Format Setting */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
                        Number Format
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setNumberFormat('compact')}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: numberFormat === 'compact' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                            borderRadius: '0.5rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                        >
                          Compact (100K, 1.5M)
                        </button>
                        <button
                          onClick={() => setNumberFormat('full')}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: numberFormat === 'full' ? 'rgb(37, 99, 235)' : 'rgb(71, 85, 105)',
                            borderRadius: '0.5rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                          }}
                        >
                          Full (100,000, 1,500,000)
                        </button>
                      </div>
                    </div>

                    {/* Visible Columns Setting */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgb(209, 213, 219)', marginBottom: '0.75rem' }}>
                        Visible Columns
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { key: 'status', label: 'Status' },
                          { key: 'avgBuy', label: 'Avg Buy' },
                          { key: 'avgSell', label: 'Avg Sell' },
                          { key: 'profit', label: 'Profit' },
                          { key: 'limit4h', label: '4H Limit' },
                          { key: 'timer', label: 'Timer' },
                          { key: 'notes', label: 'Notes' }
                        ].map(col => (
                          <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgb(51, 65, 85)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={visibleColumns[col.key]}
                              onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'rgb(209, 213, 219)' }}>{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid rgb(71, 85, 105)' }}>
                    <button
                      onClick={() => setShowSettingsModal(false)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgb(37, 99, 235)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgb(37, 99, 235)'}
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalForm({ modalShares, modalPrice, setModalShares, setModalPrice, onConfirm, onCancel, color }) {
  const colorMap = {
    green: { main: 'rgb(21, 128, 61)', hover: 'rgb(22, 101, 52)', ring: 'rgb(34, 197, 94)' },
    red: { main: 'rgb(185, 28, 28)', hover: 'rgb(153, 27, 27)', ring: 'rgb(239, 68, 68)' }
  };

  const colors = colorMap[color];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input
        type="number"
        value={modalShares}
        onChange={(e) => setModalShares(e.target.value)}
        placeholder="Shares"
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          background: 'rgb(51, 65, 85)',
          borderRadius: '0.5rem',
          outline: 'none',
          border: '2px solid transparent',
          color: 'white'
        }}
        onFocus={(e) => e.target.style.borderColor = colors.ring}
        onBlur={(e) => e.target.style.borderColor = 'transparent'}
      />
      <input
        type="number"
        value={modalPrice}
        onChange={(e) => setModalPrice(e.target.value)}
        placeholder="Price"
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          background: 'rgb(51, 65, 85)',
          borderRadius: '0.5rem',
          outline: 'none',
          border: '2px solid transparent',
          color: 'white'
        }}
        onFocus={(e) => e.target.style.borderColor = colors.ring}
        onBlur={(e) => e.target.style.borderColor = 'transparent'}
      />
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            background: colors.main,
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = colors.hover}
          onMouseOut={(e) => e.currentTarget.style.background = colors.main}
        >
          Confirm
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            background: 'rgb(71, 85, 105)',
            borderRadius: '0.5rem',
            transition: 'background 0.2s',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
