import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut } from 'lucide-react';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import GraphsPage from './pages/GraphsPage';
import { supabase } from './lib/supabase';
import { useStocks } from './hooks/useStocks';
import { useCategories } from './hooks/useCategories';
import { useTransactions } from './hooks/useTransactions';
import { useGPTradedStats } from './hooks/useGPTradedStats';
import { useStockNotes } from './hooks/useStockNotes.js';
import { useSettings } from './hooks/useSettings';
import { useNotificationSettings } from './hooks/useNotificationSettings';
import { useProfits } from './hooks/useProfits';
import { useMilestones } from './hooks/useMilestones';
import { useProfitHistory } from './hooks/useProfitHistory';
import { useGEData } from './contexts/GEDataContext';
import { TradeProvider } from './contexts/TradeContext';
import { useNotifications } from './hooks/useNotifications';
import { useOSRSNews } from './hooks/useOSRSNews';
import { useJmodComments } from './hooks/useJmodComments';
import CategoryQuickNav from './components/CategoryQuickNav';
import MilestoneProgressBar from './components/MilestoneProgressBar';
import MilestoneTrackerModal from './components/modals/MilestoneTrackerModal';
import AltTimerModal from './components/modals/AltTimerModal';
import Footer from './components/Footer';
import EditCategoryModal from './components/modals/EditCategoryModal';
import TimeCalculatorModal from './components/modals/TimeCalculatorModal';
import Header from './components/Header';
import NotificationCenter from './components/NotificationCenter';
import PortfolioSummary from './components/PortfolioSummary';
import ChartButtons from './components/ChartButtons';
import CategorySection from './components/CategorySection';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import ModalContainer from './components/modals/ModalContainer';
import BuyModal from './components/modals/BuyModal';
import BulkBuyModal from './components/modals/BulkBuyModal';
import BulkSellModal from './components/modals/BulkSellModal';
import BulkSummaryModal from './components/modals/BulkSummaryModal';
import SellModal from './components/modals/SellModal';
import RemoveStockModal from './components/modals/RemoveStockModal';
import AdjustModal from './components/modals/AdjustModal';
import DeleteModal from './components/modals/DeleteModal';
import NewStockModal from './components/modals/NewStockModal';
import CategoryModal from './components/modals/CategoryModal';
import DeleteCategoryModal from './components/modals/DeleteCategoryModal';
import ProfitModal from './components/modals/ProfitModal';
import NotesModal from './components/modals/NotesModal';
import ProfitChartModal from './components/modals/ProfitChartModal';
import CategoryChartModal from './components/modals/CategoryChartModal';
import SettingsModal from './components/modals/SettingsModal';
import ChangelogModal from './components/modals/ChangelogModal';
import PriceAlertModal from './components/modals/PriceAlertModal';
import { CURRENT_VERSION } from './data/changelog';
import { usePriceAlerts } from './hooks/usePriceAlerts';
import { usePriceAlertChecker } from './hooks/usePriceAlertChecker';
import GlobalSearch from './components/GlobalSearch';

import {
  STORAGE_KEY,
  DUMP_PROFIT_KEY,
  CATEGORIES_KEY,
  DEFAULT_STOCKS,
  DEFAULT_CATEGORIES,
  DEFAULT_VISIBLE_COLUMNS
} from './utils/constants';
import { calculateCostBasis, calculateSellProfit, calculateAvgBuyPrice } from './utils/calculations';

const PAGE_PATHS = { home: '/', trade: '/trade', history: '/history', graphs: '/graphs' };

const HISTORY_EMPTY_FILTERS = {
  type: 'all', mode: 'all', stockName: '', category: '',
  dateFrom: '', dateTo: '', gpMin: '', gpMax: '',
  priceMin: '', priceMax: '', profitMin: '', profitMax: '',
  qtyMin: '', qtyMax: '', marginMin: '', marginMax: ''
};

function getPageFromURL() {
  const path = window.location.pathname;
  if (path === '/trade') return 'trade';
  if (path === '/history') return 'history';
  if (path === '/graphs') return 'graphs';
  return 'home';
}

export default function MainApp({ session, onLogout }) {
  const userId = session.user.id;
  const userEmail = session.user.email;
  const [showChangelog, setShowChangelog] = useState(false);
  // Custom hooks for Supabase
  const [tradeMode, setTradeMode] = useState('trade');
  const { gePrices, geMapping, geIconMap, membershipMap, mappingLoading } = useGEData();

  const switchTradeMode = (mode) => {
    refetch();
    fetchCategories();
    setTradeMode(mode);
  };
  const { stocks, loading: stocksLoading, addStock: addStockToDB, updateStock, deleteStock, refetch, reorderStocks, archiveStock, restoreStock, fetchArchivedStocks } = useStocks(userId);
  const { categories, loading: categoriesLoading, addCategory, deleteCategory, updateCategory, fetchCategories, reorderCategories } = useCategories(userId);
  const {
    transactions, loading: transactionsLoading, addTransaction,
    pagedTransactions, pagedLoading, totalCount, totalPages,
    page, pageSize, filters, goToPage, changePageSize, applyFilters, initPaged,
    sortConfig: historySortConfig, applySort, resetPaged, undoTransaction
  } = useTransactions(userId);
 const { stats: gpTradedStats, loading: gpStatsLoading, refetch: refetchGPStats } = useGPTradedStats(userId);
  const { notes: stockNotes, loading: notesLoading, saveNote, deleteNote } = useStockNotes(userId);
  const { settings, loading: settingsLoading, updateSettings } = useSettings(userId);
  const { notificationPreferences, updateNotificationPreference, loading: notificationSettingsLoading } = useNotificationSettings(userId);
  const { profits, loading: profitsLoading, updateProfit } = useProfits(userId);
  const { profitHistory, loading: profitHistoryLoading, addProfitEntry, refetch: refetchProfitHistory } = useProfitHistory(userId);
  const { milestones, milestoneHistory, loading: milestonesLoading, updateMilestone, recordMilestoneAchievement, recordCompletedPeriods, PRESET_GOALS } = useMilestones(userId);
  const { alerts: priceAlerts, allAlerts: allPriceAlerts, loading: priceAlertsLoading, saveAlert: savePriceAlert, dismissAlert: dismissPriceAlert, deactivateAlert: deactivatePriceAlert, updateLastChecked: updatePriceAlertLastChecked, refetch: refetchPriceAlerts } = usePriceAlerts(userId);

  // Destructure profits
  const { dumpProfit, referralProfit, bondsProfit } = profits;

  // Destructure settings
  const { numberFormat, visibleColumns, visibleProfits, altAccountTimer, showCategoryStats,
          showUnrealisedProfitStats, showCategoryUnrealisedProfit, notificationVolume } = settings;
  // Local UI state
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    // Load collapsed state from localStorage on initial render
    const saved = localStorage.getItem('collapsedCategories');
    return saved ? JSON.parse(saved) : {};
  });
  const [currentPage, setCurrentPage] = useState(getPageFromURL);
  const [graphItemId, setGraphItemId] = useState(() => new URLSearchParams(window.location.search).get('item'));

  const navigateToPage = useCallback((page, options = {}) => {
    if (page === 'trade') {
      refetch();
      fetchCategories();
    }
    if (page === 'home') {
      refetch();
      refetchGPStats();
      refetchProfitHistory();
    }
    setCurrentPage(page);
    let url = PAGE_PATHS[page] || '/';
    if (options.query) {
      const params = new URLSearchParams(options.query);
      url += '?' + params.toString();
      if (page === 'graphs' && params.has('item')) {
        setGraphItemId(params.get('item'));
      }
      if (page === 'history' && params.has('search')) {
        applyFilters({ ...HISTORY_EMPTY_FILTERS, stockName: params.get('search') });
      }
    } else if (page === 'graphs') {
      setGraphItemId(null);
    } else if (page === 'history') {
      applyFilters({ ...HISTORY_EMPTY_FILTERS });
    }
    window.history.pushState({ page }, '', url);
  }, [refetch, fetchCategories, refetchGPStats, refetchProfitHistory, applyFilters]);

  // Replace initial history entry so back button works correctly
  useEffect(() => {
    const page = getPageFromURL();
    window.history.replaceState({ page }, '', window.location.pathname + window.location.search);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromURL();
      if (page === 'trade') {
        refetch();
        fetchCategories();
      }
      if (page === 'home') {
        refetch();
        refetchGPStats();
        refetchProfitHistory();
      }
      setCurrentPage(page);
      const searchParams = new URLSearchParams(window.location.search);
      setGraphItemId(searchParams.get('item'));
      if (page === 'history') {
        const searchName = searchParams.get('search');
        applyFilters(searchName
          ? { ...HISTORY_EMPTY_FILTERS, stockName: searchName }
          : { ...HISTORY_EMPTY_FILTERS }
        );
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch, fetchCategories, refetchGPStats, refetchProfitHistory, applyFilters]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [highlightedRows, setHighlightedRows] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dataLoaded = !stocksLoading && !categoriesLoading && !transactionsLoading && !notesLoading && !settingsLoading && !profitsLoading && !milestonesLoading && !profitHistoryLoading && !gpStatsLoading;

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showBulkBuyModal, setShowBulkBuyModal] = useState(false);
  const [showBulkSellModal, setShowBulkSellModal] = useState(false);
  const [bulkSummaryData, setBulkSummaryData] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoResult, setUndoResult] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMilestonePeriod, setSelectedMilestonePeriod] = useState('day');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneInitialView, setMilestoneInitialView] = useState('main');
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAltTimerModal, setShowAltTimerModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showDumpProfitModal, setShowDumpProfitModal] = useState(false);
  const [showReferralProfitModal, setShowReferralProfitModal] = useState(false);
  const [showBondsProfitModal, setShowBondsProfitModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showProfitChartModal, setShowProfitChartModal] = useState(false);
  const [showCategoryChartModal, setShowCategoryChartModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTimeCalculatorModal, setShowTimeCalculatorModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [selectedAlertItem, setSelectedAlertItem] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newStockCategory, setNewStockCategory] = useState('');

  const [showArchive, setShowArchive] = useState(false);
  const [archivedStocks, setArchivedStocks] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [stockToArchive, setStockToArchive] = useState(null);

  const handleOpenArchive = async () => {
    setArchivedLoading(true);
    const data = await fetchArchivedStocks();
    setArchivedStocks(data);
    setArchivedLoading(false);
    setShowArchive(true);
  };

  const handleArchive = (stock) => {
    setStockToArchive(stock);
    setShowArchiveConfirmModal(true);
  };

  const handleConfirmArchive = async () => {
    await archiveStock(stockToArchive.id);
    await refetch();
    setShowArchiveConfirmModal(false);
    setStockToArchive(null);
  };

  const handleRestore = async (stock) => {
    await restoreStock(stock.id);
    const data = await fetchArchivedStocks();
    setArchivedStocks(data);
    await refetch();
  };

  // Price alert handlers
  const handleOpenPriceAlert = (stockOrItem) => {
    const itemId = stockOrItem.itemId ?? stockOrItem.itemId;
    const itemName = stockOrItem.itemName ?? stockOrItem.name;
    if (!itemId) return;
    setSelectedAlertItem({ itemId, itemName });
    setShowPriceAlertModal(true);
  };

  const handleSavePriceAlert = async (itemId, itemName, highThreshold, lowThreshold) => {
    await savePriceAlert(itemId, itemName, highThreshold, lowThreshold);
    setShowPriceAlertModal(false);
    setSelectedAlertItem(null);
  };

  const handleDeletePriceAlert = async (alertId) => {
    await dismissPriceAlert(alertId);
    setShowPriceAlertModal(false);
    setSelectedAlertItem(null);
  };

  // Notifications
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll: clearAllNotifications,
  } = useNotifications(notificationPreferences, userId, notificationVolume);

  const { newsItems } = useOSRSNews();
  const { jmodComments } = useJmodComments();

  usePriceAlertChecker({
    alerts: priceAlerts,
    gePrices,
    addNotification,
    deactivateAlert: deactivatePriceAlert,
    updateLastChecked: updatePriceAlertLastChecked,
  });

  // Track which timer notifications have already fired to avoid duplicates
  const firedTimerNotifs = useRef(new Set(JSON.parse(localStorage.getItem(`osrs_fired_limit_timers_${userId}`) || '[]')));
  const firedAltTimerNotif = useRef(false);
  const firedMilestoneNotifs = useRef(new Set(JSON.parse(localStorage.getItem(`osrs_fired_milestones_${userId}`) || '[]')));
  const seenNewsGuids = useRef(new Set(JSON.parse(localStorage.getItem(`osrs_seen_news_${userId}`) || '[]')));
  const seenJmodIds = useRef(new Set(JSON.parse(localStorage.getItem(`osrs_seen_jmod_${userId}`) || '[]')));
  const timerNotifsInitialized = useRef(false);
  const altTimerNotifInitialized = useRef(false);
  const milestoneNotifsInitialized = useRef(false);
  const newsNotifsInitialized = useRef(localStorage.getItem(`osrs_news_initialized_${userId}`) === 'true');
  const jmodNotifsInitialized = useRef(localStorage.getItem(`osrs_jmod_initialized_${userId}`) === 'true');
  const timerTimeoutsRef = useRef(new Map());

  // Helper to persist firedTimerNotifs to localStorage
  const saveFiredTimers = useCallback(() => {
    localStorage.setItem(`osrs_fired_limit_timers_${userId}`, JSON.stringify(Array.from(firedTimerNotifs.current)));
  }, [userId]);

  // Save when app closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(`osrs_last_closed_${userId}`, Date.now().toString());
      saveFiredTimers();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveFiredTimers]);

  // Timer update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect timer expirations for notifications
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;
    const now = Date.now();

    // On first run, initialize timers
    if (!timerNotifsInitialized.current) {
      timerNotifsInitialized.current = true;

      // Check if app was closed > 4 hours
      const lastClosedTime = localStorage.getItem(`osrs_last_closed_${userId}`);
      const closedTimeMs = lastClosedTime ? parseInt(lastClosedTime) : 0;
      const closedDuration = closedTimeMs ? now - closedTimeMs : 0;
      const fourHours = 4 * 60 * 60 * 1000;
      const shouldCheckExpiredTimers = closedTimeMs > 0 && closedDuration <= fourHours;

      // Notify only for timers that expired WHILE offline, not old expired timers
      if (shouldCheckExpiredTimers) {
        stocks.forEach(stock => {
          if (
            stock.timerEndTime &&
            stock.timerEndTime > closedTimeMs && // Timer was active when we closed
            stock.timerEndTime <= now && // But expired while we were offline
            !firedTimerNotifs.current.has(stock.id)
          ) {
            firedTimerNotifs.current.add(stock.id);
            addNotification('limitTimer', `${stock.name}: GE buy limit reset`, { page: 'trade', stockId: stock.id });
          }
        });
      }

      // Seed all currently-expired timers as already notified (to avoid spam)
      stocks.forEach(stock => {
        if (stock.timerEndTime && stock.timerEndTime <= now) {
          firedTimerNotifs.current.add(stock.id);
        }
      });

      saveFiredTimers();

      // Set up timeouts for active timers
      stocks.forEach(stock => {
        if (stock.timerEndTime && stock.timerEndTime > now) {
          const timeUntilExpiry = stock.timerEndTime - now;
          const timeoutId = setTimeout(() => {
            if (!firedTimerNotifs.current.has(stock.id)) {
              firedTimerNotifs.current.add(stock.id);
              addNotification('limitTimer', `${stock.name}: GE buy limit reset`, { page: 'trade', stockId: stock.id });
              saveFiredTimers();
            }
          }, timeUntilExpiry);
          timerTimeoutsRef.current.set(stock.id, timeoutId);
        }
      });

      return;
    }

    // Update timeouts: clear deleted stocks, add new ones, update changed timers
    const currentStockIds = new Set(stocks.map(s => s.id));
    const trackedStockIds = timerTimeoutsRef.current.keys();

    // Clear timeouts for deleted stocks
    for (const stockId of trackedStockIds) {
      if (!currentStockIds.has(stockId)) {
        clearTimeout(timerTimeoutsRef.current.get(stockId));
        timerTimeoutsRef.current.delete(stockId);
      }
    }

    // Update or create timeouts for active timers
    stocks.forEach(stock => {
      if (stock.timerEndTime && stock.timerEndTime > now) {
        const timeUntilExpiry = stock.timerEndTime - now;

        // Clear old timeout if timer was reset
        if (timerTimeoutsRef.current.has(stock.id)) {
          clearTimeout(timerTimeoutsRef.current.get(stock.id));
        }

        const timeoutId = setTimeout(() => {
          if (!firedTimerNotifs.current.has(stock.id)) {
            firedTimerNotifs.current.add(stock.id);
            addNotification('limitTimer', `${stock.name}: GE buy limit reset`, { page: 'trade', stockId: stock.id });
            saveFiredTimers();
          }
        }, timeUntilExpiry);
        timerTimeoutsRef.current.set(stock.id, timeoutId);
      } else if (timerTimeoutsRef.current.has(stock.id)) {
        // Stock exists but timer expired or was cleared, remove the timeout
        clearTimeout(timerTimeoutsRef.current.get(stock.id));
        timerTimeoutsRef.current.delete(stock.id);
      }
    });

    // Cleanup only on unmount
    return () => {
      timerTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timerTimeoutsRef.current.clear();
    };
  }, [stocks, addNotification, saveFiredTimers]);

  // Detect alt account timer expiration
  useEffect(() => {
    if (!altAccountTimer || firedAltTimerNotif.current) return;

    // On first run, seed if already expired (no notification)
    if (!altTimerNotifInitialized.current) {
      altTimerNotifInitialized.current = true;
      if (altAccountTimer <= Date.now()) {
        firedAltTimerNotif.current = true;
      }
      return;
    }

    if (altAccountTimer <= Date.now()) {
      firedAltTimerNotif.current = true;
      addNotification('altAccountTimer', 'Alt account timer is ready', { page: 'trade' });
    }
  }, [currentTime, altAccountTimer, addNotification]);

  useEffect(() => {
    const ensureUncategorizedExists = async () => {

      // Don't check categoriesLoading - let it run regardless
      console.log('Ensuring Uncategorized exists. Categories:');

      try {
        // Check database directly
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('name', 'Uncategorized');

        if (error) {
          console.error('Error checking for Uncategorized:', error);
          return;
        }

        const hasTrading = data?.some(c => c.is_investment === false);
        const hasInvestment = data?.some(c => c.is_investment === true);

        const toInsert = [];
        if (!hasTrading) toInsert.push({ name: 'Uncategorized', user_id: userId, is_investment: false, position: 0, created_at: new Date().toISOString() });
        if (!hasInvestment) toInsert.push({ name: 'Uncategorized', user_id: userId, is_investment: true, position: 0, created_at: new Date().toISOString() });
        for (const row of toInsert) {
          const { error: insertError } = await supabase
            .from('categories')
            .upsert(row, { onConflict: 'user_id,name,is_investment', ignoreDuplicates: true });

          if (insertError) {
            console.error('Error creating Uncategorized:', insertError);
          }
        }
      } catch (error) {
        console.error('Error in ensureUncategorizedExists:', error);
      }
    };

    // Only run once when userId changes
    if (userId) {
      ensureUncategorizedExists().then(() => fetchCategories());
    }
  }, [userId]); // Remove categoriesLoading and categories from dependencies
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
    if (onLogout) {
      onLogout();
    }
  };

  const handleEditCategory = async (oldCategory, newCategory) => {
    try {
      const isInvestment = categories.find(c => c.name === oldCategory && c.isInvestment === (tradeMode === 'investment'))?.isInvestment || false;
      await updateCategory(oldCategory, newCategory, isInvestment);

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

  const calculateMilestoneProgress = () => {
    if (!dataLoaded || !profitHistory) return { day: 0, week: 0, month: 0, year: 0 };

    const getStartOfPeriod = (period) => {
      const date = new Date();
      switch (period) {
        case 'day':
          date.setHours(0, 0, 0, 0);
          return date;
        case 'week':
          const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
          date.setDate(diff);
          date.setHours(0, 0, 0, 0);
          return date;
        case 'month':
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return date;
        case 'year':
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          return date;
        default:
          return date;
      }
    };

    const calculatePeriodProfit = (period) => {
      const startDate = getStartOfPeriod(period);
      const periodProfits = profitHistory.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= startDate && entry.profit_type !== 'bonds';
      });
      const totalProfit = periodProfits.reduce((sum, entry) => sum + entry.amount, 0);
      return totalProfit;
    };

    return {
      day: calculatePeriodProfit('day'),
      week: calculatePeriodProfit('week'),
      month: calculatePeriodProfit('month'),
      year: calculatePeriodProfit('year')
    };
  };

  useEffect(() => {
    if (!profitHistory || profitHistoryLoading) return;

    const getStartOfPeriod = (period) => {
      const date = new Date();
      switch (period) {
        case 'day':
          date.setHours(0, 0, 0, 0);
          return date;
        case 'week':
          const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
          date.setDate(diff);
          date.setHours(0, 0, 0, 0);
          return date;
        case 'month':
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          return date;
        case 'year':
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          return date;
        default:
          return date;
      }
    };

    const calculatePeriodProfit = (period) => {
      const startDate = getStartOfPeriod(period);

      const periodProfits = profitHistory.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const isInPeriod = entryDate >= startDate;
        const isNotBonds = entry.profit_type !== 'bonds';

        return isInPeriod && isNotBonds;
      });

      const totalProfit = periodProfits.reduce((sum, entry) => sum + entry.amount, 0);

      return Math.max(0, totalProfit);
    };

    const newProgress = {
      day: calculatePeriodProfit('day'),
      week: calculatePeriodProfit('week'),
      month: calculatePeriodProfit('month'),
      year: calculatePeriodProfit('year')
    };

    setMilestoneProgress(newProgress);

    // Check for milestone achievements and fire notifications
    const periods = ['day', 'week', 'month', 'year'];
    const periodLabels = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

    // On first run, seed already-achieved milestones without firing notifications
    if (!milestoneNotifsInitialized.current) {
      milestoneNotifsInitialized.current = true;
      let changed = false;
      periods.forEach(period => {
        const goal = milestones[period]?.goal;
        const enabled = milestones[period]?.enabled;
        if (enabled && goal && newProgress[period] >= goal) {
          const key = `${period}-${goal}`;
          if (!firedMilestoneNotifs.current.has(key)) {
            firedMilestoneNotifs.current.add(key);
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem(`osrs_fired_milestones_${userId}`, JSON.stringify([...firedMilestoneNotifs.current]));
      }
    } else {
      let changed = false;
      periods.forEach(period => {
        const goal = milestones[period]?.goal;
        const enabled = milestones[period]?.enabled;
        if (enabled && goal && newProgress[period] >= goal) {
          const key = `${period}-${goal}`;
          if (!firedMilestoneNotifs.current.has(key)) {
            firedMilestoneNotifs.current.add(key);
            changed = true;
            addNotification('milestone', `${periodLabels[period]} milestone achieved!`, { page: 'home' });
          }
        }
      });
      if (changed) {
        localStorage.setItem(`osrs_fired_milestones_${userId}`, JSON.stringify([...firedMilestoneNotifs.current]));
      }
    }

    if (!milestonesLoading) {
      recordCompletedPeriods(profitHistory, milestones);
    }
  }, [dataLoaded, profitHistory, milestones]);

  // OSRS News notification effect
  useEffect(() => {
    if (!newsItems || newsItems.length === 0) return;

    if (!newsNotifsInitialized.current) {
      newsNotifsInitialized.current = true;
      localStorage.setItem(`osrs_news_initialized_${userId}`, 'true');
      newsItems.forEach(item => seenNewsGuids.current.add(item.guid));
      localStorage.setItem(`osrs_seen_news_${userId}`, JSON.stringify([...seenNewsGuids.current]));
      return;
    }

    let changed = false;
    newsItems.forEach(item => {
      if (!seenNewsGuids.current.has(item.guid)) {
        seenNewsGuids.current.add(item.guid);
        changed = true;
        addNotification('osrsNews', item.title, { externalUrl: item.link });
      }
    });

    if (changed) {
      localStorage.setItem(`osrs_seen_news_${userId}`, JSON.stringify([...seenNewsGuids.current]));
    }
  }, [newsItems, addNotification, userId]);

  // Jmod Reddit notification effect
  useEffect(() => {
    if (!jmodComments || jmodComments.length === 0) return;

    if (!jmodNotifsInitialized.current) {
      jmodNotifsInitialized.current = true;
      localStorage.setItem(`osrs_jmod_initialized_${userId}`, 'true');
      jmodComments.forEach(c => seenJmodIds.current.add(c.id));
      localStorage.setItem(`osrs_seen_jmod_${userId}`, JSON.stringify([...seenJmodIds.current]));
      return;
    }

    let changed = false;
    jmodComments.forEach(c => {
      if (!seenJmodIds.current.has(c.id)) {
        seenJmodIds.current.add(c.id);
        changed = true;
        addNotification('jmodReddit', `${c.author}: ${c.body.slice(0, 80)}`, {
          externalUrl: `https://www.reddit.com${c.permalink}`,
        });
      }
    });

    if (changed) {
      localStorage.setItem(`osrs_seen_jmod_${userId}`, JSON.stringify([...seenJmodIds.current]));
    }
  }, [jmodComments, addNotification, userId]);

  useEffect(() => {
    const storageKey = `lastSeenVersion_${userId}`;
    const lastSeen = localStorage.getItem(storageKey);
    if (lastSeen !== CURRENT_VERSION) {
      setShowChangelog(true);
    }
  }, [userId]);

  const handleCloseChangelog = () => {
    localStorage.setItem(`lastSeenVersion_${userId}`, CURRENT_VERSION);
    setShowChangelog(false);
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => {
      const newState = {
        ...prev,
        [category]: !prev[category]
      };
      // Save to localStorage whenever state changes
      localStorage.setItem('collapsedCategories', JSON.stringify(newState));
      return newState;
    });
  };

  const handleBuy = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { shares, price, startTimer } = data;
    const total = shares * price;

    const newShares = selectedStock.shares + shares;
    let timerEndTime;
    let newOnHold = selectedStock.onHold; // Track if we should update onHold status

    if (startTimer) {
      // If startTimer is checked, always start the timer and take off hold
      timerEndTime = Date.now() + (4 * 60 * 60 * 1000);
      newOnHold = false; // Take it off hold when timer starts
    } else {
      // If startTimer is NOT checked, keep existing timer
      timerEndTime = selectedStock.timerEndTime;
    }

    // Check if timer just ended and stock is still below needed
    const timerJustEnded = selectedStock.timerEndTime && selectedStock.timerEndTime <= Date.now();
    if (timerJustEnded && newShares < selectedStock.needed && selectedStock.onHold) {
      // If timer ended, still below needed, and was on hold, keep it on hold
      newOnHold = true;
    } else if (newShares >= selectedStock.needed) {
      // If we now have enough stock, take it off hold
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
      // Reset notification after successful update so it can fire when the new timer expires
      if (startTimer) {
        firedTimerNotifs.current.delete(selectedStock.id);
        saveFiredTimers();
      }
      highlightRow(selectedStock.id);
      setShowBuyModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const processBuyItem = async (item) => {
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
  };

  const processSellItem = async (item) => {
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
  };

  const handleBulkOperation = async (type, items, closeModal) => {
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
      closeModal(false);
      if (items.length > 1) {
        setBulkSummaryData({ type, items: completedItems });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [milestoneProgress, setMilestoneProgress] = useState({ day: 0, week: 0, month: 0, year: 0 });


  const handleSell = async (data) => {
    const { shares, price } = data;
    await handleBulkOperation('sell', [{ stock: selectedStock, shares, price }], setShowSellModal);
  };

  const handleBulkSell = async (items) => {
    await handleBulkOperation('sell', items, setShowBulkSellModal);
  };

  const handleBulkUndo = async () => {
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
  };

  const handleBulkSummaryDone = () => {
    setBulkSummaryData(null);
    setUndoResult(null);
  };

  const handleRemoveStock = async (data) => {
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
      setShowRemoveModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvestmentDateChange = async (stock, date) => {
    await updateStock(stock.id, { investmentStartDate: date });
    await refetch();
  };

  const handleAdjust = async (data) => {
    const { name, needed, category, limit4h, onHold, isInvestment, itemId, investmentStartDate } = data;
    await updateStock(selectedStock.id, { name, needed, category, limit4h, onHold, isInvestment, itemId, investmentStartDate });
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
    setShowNewStockModal(false);
  };

  const handleAddCategory = async (name, isInvestment = false) => {
    if (!name.trim()) return;
    if (!categories.some(c => c.name === name && c.isInvestment === isInvestment)) {
      await addCategory(name, isInvestment);
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

      const result = await deleteCategory(categoryName, tradeMode === 'investment');

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
    const success = await updateProfit('dumpProfit', amount);
    if (success) {
      await addProfitEntry('dump', amount);
    }
    setShowDumpProfitModal(false);
  };

  const handleAddReferralProfit = async (amount) => {
    const success = await updateProfit('referralProfit', amount);
    if (success) {
      await addProfitEntry('referral', amount);
    }
    setShowReferralProfitModal(false);
  };

  const handleAddBondsProfit = async (amount) => {
    const success = await updateProfit('bondsProfit', amount);
    if (success) {
      await addProfitEntry('bonds', amount);
    }
    setShowBondsProfitModal(false);
  };

  const handleUpdateMilestone = async (period, goal, enabled) => {
    const success = await updateMilestone(period, goal, enabled);
    if (success) {
      // Recalculate milestone progress after updating
      setMilestoneProgress(calculateMilestoneProgress());
    }
  };

  const handleQuickNavNavigate = (category) => {
    const scrollToCategory = () => {
      const el = document.querySelector(`[data-category="${category}"]`);
      if (el) {
        const topbarHeight = document.querySelector('.topbar')?.offsetHeight || 60;
        const offset = topbarHeight + 16;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };

    if (collapsedCategories[category]) {
      setCollapsedCategories(prev => ({ ...prev, [category]: false }));
      setTimeout(scrollToCategory, 100);
    } else {
      scrollToCategory();
    }
  };

  const handleNotificationNavigate = useCallback((target) => {
    if (!target) return;
    if (target.externalUrl) {
      window.open(target.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigateToPage(target.page);
    if (target.stockId) {
      // Find the stock's category and expand it if collapsed
      const stock = stocks.find(s => s.id === target.stockId);
      if (stock && stock.categoryId) {
        const category = categories.find(c => c.id === stock.categoryId);
        if (category && collapsedCategories[category.name]) {
          setCollapsedCategories(prev => ({ ...prev, [category.name]: false }));
        }
      }

      const maxWait = 500;
      const interval = 50;
      let elapsed = 0;
      const tryScroll = () => {
        const el = document.querySelector(`[data-stock-id="${target.stockId}"]`);
        if (el) {
          const topbarHeight = document.querySelector('.topbar')?.offsetHeight || 60;
          const top = el.getBoundingClientRect().top + window.scrollY - topbarHeight - 16;
          window.scrollTo({ top, behavior: 'smooth' });
          el.classList.add('stock-row-highlight');
          setTimeout(() => el.classList.remove('stock-row-highlight'), 1500);
        } else if (elapsed < maxWait) {
          elapsed += interval;
          setTimeout(tryScroll, interval);
        }
      };
      setTimeout(tryScroll, interval);
    }
  }, [navigateToPage, stocks, categories, collapsedCategories]);

  const handleSetAltTimer = async (days) => {
    const timerEndTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    firedAltTimerNotif.current = false;
    await updateSettings({ altAccountTimer: timerEndTime });
    setShowAltTimerModal(false);
  };

  const handleResetAltTimer = async () => {
    firedAltTimerNotif.current = false;
    await updateSettings({ altAccountTimer: null });
  };

  const handleSaveNotes = async (noteText) => {
    await saveNote(selectedStock.id, noteText);
    setShowNotesModal(false);
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
      const filteredForMode = categories.filter(c =>
        c.name === 'Uncategorized' || (tradeMode === 'investment' ? c.isInvestment : !c.isInvestment)
      );
      const targetIndex = filteredForMode.findIndex(c => c.name === targetCategory);

      if (targetIndex === -1) {
        console.error('Target category not found');
        return;
      }

      await reorderCategories(draggedCategory, targetIndex, tradeMode === 'investment');
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
      case 'remove':
        setShowRemoveModal(true);
        break;
      case 'adjust':
        setShowAdjustModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
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
    setSelectedStock(stock);
    setShowTimeCalculatorModal(true);
  };



  const filteredStocks = stocks.filter(s =>
    tradeMode === 'investment' ? s.isInvestment : !s.isInvestment
  );
  const filteredCategories = categories.filter(c =>
    tradeMode === 'investment' ? c.isInvestment : !c.isInvestment
  );

  const categoryNames = filteredCategories.map(c => c.name);

  const groupedStocks = filteredCategories.reduce((acc, cat) => {
    acc[cat.name] = filteredStocks.filter(s => s.category === cat.name);
    return acc;
  }, {});

  // Add uncategorized investment/trade stocks that have no matching category
  const uncategorizedFiltered = filteredStocks.filter(s =>
    s.category === 'Uncategorized' || !s.category || !categoryNames.includes(s.category)
  );
  if (uncategorizedFiltered.length > 0 && !filteredCategories.some(c => c.name === 'Uncategorized')) {
    groupedStocks['Uncategorized'] = uncategorizedFiltered;
  }



  return (
    <TradeProvider stocks={stocks} categories={categories} refetchStocks={refetch} refetchCategories={fetchCategories}>
    <div style={{
      minHeight: '100vh',
      background: 'rgb(15, 23, 42)',
      color: 'white'
    }}>
      {/* Top bar - full width edge to edge */}
      <div className="topbar">
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left - Navigation tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigateToPage('home')}
              style={{
                padding: '0.75rem 1.5rem',
                background: currentPage === 'home' ? 'rgb(168, 85, 247)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => {
                if (currentPage !== 'home') {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== 'home') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              🏠 Home
            </button>
            <button
              onClick={() => navigateToPage('trade')}
              style={{
                padding: '0.75rem 1.5rem',
                background: currentPage === 'trade' ? 'rgb(168, 85, 247)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => {
                if (currentPage !== 'trade') {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (currentPage !== 'trade') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              💼 Trade
            </button>
            <button
              onClick={() => navigateToPage('history')}
              style={{
                padding: '0.75rem 1.5rem',
                background: currentPage === 'history' ? 'rgb(168, 85, 247)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => {
                if (currentPage !== 'history') e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
              }}
              onMouseOut={(e) => {
                if (currentPage !== 'history') e.currentTarget.style.background = 'transparent';
              }}
            >
              📜 History
            </button>
            <button
              onClick={() => navigateToPage('graphs')}
              style={{
                padding: '0.75rem 1.5rem',
                background: currentPage === 'graphs' ? 'rgb(168, 85, 247)' : 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => {
                if (currentPage !== 'graphs') e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
              }}
              onMouseOut={(e) => {
                if (currentPage !== 'graphs') e.currentTarget.style.background = 'transparent';
              }}
            >
              📊 Graphs
            </button>
          </div>

          {/* Center - Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, rgb(96, 165, 250), rgb(192, 132, 252))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              Stock Portfolio Tracker
            </h1>
            <a
              href="https://github.com/osrsprofittracker/OSRSProfitTracker/releases"
              target="_blank"
              rel="noreferrer"
              className="version-badge"
            >
              v{CURRENT_VERSION}
            </a>
          </div>

          {/* Right - Search + Notifications + User dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GlobalSearch
            transactions={transactions}
            navigateToPage={navigateToPage}
            onExpandCategory={(cat) => {
              setCollapsedCategories(prev => {
                if (!prev[cat]) return prev;
                const next = { ...prev, [cat]: false };
                localStorage.setItem('collapsedCategories', JSON.stringify(next));
                return next;
              });
            }}
          />
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDismiss={dismissNotification}
            onClearAll={clearAllNotifications}
            onNavigate={handleNotificationNavigate}
            newsItems={newsItems}
            jmodComments={jmodComments}
            newJmodCount={notifications.filter(n => n.type === 'jmodReddit' && !n.read).length}
            newOsrsNewsCount={notifications.filter(n => n.type === 'osrsNews' && !n.read).length}
            priceAlerts={priceAlerts}
            allPriceAlerts={allPriceAlerts}
            onEditAlert={(alert) => {
              setSelectedAlertItem({ itemId: alert.itemId, itemName: alert.itemName });
              setShowPriceAlertModal(true);
            }}
            onDismissAlert={dismissPriceAlert}
            onNewAlert={() => navigateToPage('graphs')}
          />
          <div className="user-dropdown-wrapper">
            <button
              className="user-dropdown-trigger"
              onClick={() => setUserMenuOpen(prev => !prev)}
            >
              <span className="user-dropdown-name">
                {session?.user?.user_metadata?.username || userEmail}
              </span>
              <span className="user-dropdown-caret">▾</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown-menu">
                <button
                  className="user-dropdown-item"
                  onClick={() => { setShowSettingsModal(true); setUserMenuOpen(false); }}
                >
                  ⚙️ Settings
                </button>
                <a
                  href="https://buymeacoffee.com/osrsprofittracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="user-dropdown-item user-dropdown-item--support"
                  onClick={() => setUserMenuOpen(false)}
                >
                  ☕ Support Me
                </a>
                <button
                  className="user-dropdown-item user-dropdown-item--danger"
                  onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 2rem' }}>
        {currentPage === 'home' ? (
          <HomePage
            transactions={transactions}
            profitHistory={profitHistory}
            gpTradedStats={gpTradedStats}
            profits={profits}
            numberFormat={numberFormat}
            milestones={milestones}
            milestoneProgress={milestoneProgress}
            onNavigateToTrade={() => navigateToPage('trade')}
            onOpenMilestoneModal={() => { setMilestoneInitialView('main'); setShowMilestoneModal(true); }}
            onOpenMilestoneHistory={() => { setMilestoneInitialView('history'); setShowMilestoneModal(true); }}
          />
        ) : currentPage === 'history' ? (
          <HistoryPage
            pagedTransactions={pagedTransactions}
            profitHistory={profitHistory}
            pagedLoading={pagedLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onGoToPage={goToPage}
            onChangePageSize={changePageSize}
            onApplyFilters={applyFilters}
            onInit={initPaged}
            numberFormat={numberFormat}
            sortConfig={historySortConfig}
            onApplySort={applySort}
            onReset={resetPaged}
            onUndo={undoTransaction}
            showMembershipIcon={visibleColumns.membershipIcon}
          />
        ) : currentPage === 'graphs' ? (
          <GraphsPage
            userId={userId}
            initialItemId={graphItemId}
            navigateToPage={navigateToPage}
            priceAlerts={priceAlerts}
            onPriceAlert={handleOpenPriceAlert}
            stockNotes={stockNotes}
            onSaveNote={saveNote}
          />
        ) : (
          <>
            <CategoryQuickNav
              categories={categoryNames}
              collapsedCategories={collapsedCategories}
              onNavigate={handleQuickNavNavigate}
            />

            <PortfolioSummary
              dumpProfit={dumpProfit}
              referralProfit={referralProfit}
              bondsProfit={bondsProfit}
              visibleProfits={visibleProfits}
              onAddDumpProfit={() => setShowDumpProfitModal(true)}
              onAddReferralProfit={() => setShowReferralProfitModal(true)}
              onAddBondsProfit={() => setShowBondsProfitModal(true)}
              numberFormat={numberFormat}
              showUnrealisedProfitStats={showUnrealisedProfitStats}
            />

            {/* Milestone Progress Bar and Chart Buttons Row */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
              marginTop: '1rem',
              flexWrap: 'wrap'
            }}>
              <MilestoneProgressBar
                milestones={milestones}
                currentProgress={milestoneProgress}
                selectedPeriod={selectedMilestonePeriod}
                onPeriodChange={setSelectedMilestonePeriod}
                onOpenModal={() => { setMilestoneInitialView('main'); setShowMilestoneModal(true); }}
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
            </div>
            {/* Trade Mode Toggle */}
            <div className="trade-mode-toggle-wrapper">
              <div className="trade-mode-toggle">
                <button
                  className={`trade-mode-btn ${tradeMode === 'trade' ? 'active' : ''}`}
                  onClick={() => switchTradeMode('trade')}
                >
                  💼 Trading
                </button>
                <button
                  className={`trade-mode-btn ${tradeMode === 'investment' ? 'active' : ''}`}
                  onClick={() => switchTradeMode('investment')}
                >
                  📈 Investments
                </button>
              </div>
            </div>

            {/* Category Actions */}
            <div className="category-actions-row">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn btn-primary"
              >
                + Add Category
              </button>
              <button
                onClick={async () => {
                  setNewStockCategory('');
                  const data = await fetchArchivedStocks();
                  setArchivedStocks(data);
                  setShowNewStockModal(true);
                }}
                className="btn btn-success"
              >
                + Add Stock
              </button>
              <button
                onClick={() => setShowBulkBuyModal(true)}
                className="btn btn-success"
              >
                Bulk Buy
              </button>
              <button
                onClick={() => setShowBulkSellModal(true)}
                className="btn btn-danger"
              >
                Bulk Sell
              </button>
              <button
                onClick={handleOpenArchive}
                className="btn btn-secondary"
              >
                📦 Archive
              </button>
            </div>


            {Object.entries(groupedStocks).map(([category, categoryStocks]) => (
              <CategorySection
                key={category}
                category={category}
                stocks={categoryStocks}
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
                onRemove={(stock) => {
                  setSelectedStock(stock);
                  setShowRemoveModal(true);
                }}
                onAdjust={(stock) => {
                  setSelectedStock(stock);
                  setShowAdjustModal(true);
                }}
                onDelete={(stock) => {
                  setSelectedStock(stock);
                  setShowDeleteModal(true);
                }}
                onArchive={handleArchive}
                onNotes={(stock) => {
                  setSelectedStock(stock);
                  setShowNotesModal(true);
                }}
                onCalculate={handleCalculateTime}
                onDragStart={handleStockDragStart}
                onDragOver={handleStockDragOver}
                onCategoryDragStart={handleCategoryDragStart}
                onCategoryDragOver={handleCategoryDragOver}
                onCategoryDrop={handleCategoryDrop}
                onDrop={handleStockDrop}
                highlightedRows={highlightedRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                visibleColumns={visibleColumns}
                stockNotes={stockNotes}
                currentTime={currentTime}
                numberFormat={numberFormat}
                showCategoryStats={showCategoryStats}
                showCategoryUnrealisedProfit={showCategoryUnrealisedProfit}
                showMembershipIcon={visibleColumns.membershipIcon}
                showInvestmentDate={tradeMode === 'investment' && visibleColumns.investmentStartDate}
                onInvestmentDateChange={handleInvestmentDateChange}
                onPriceAlert={handleOpenPriceAlert}
                priceAlerts={priceAlerts}
                onViewGraph={(stock) => stock.itemId && navigateToPage('graphs', { query: { item: stock.itemId } })}
              />
            ))}

            {/* Modals */}
            <ModalContainer isOpen={showBuyModal}>
              <BuyModal
                stock={selectedStock}
                onConfirm={handleBuy}
                onCancel={() => setShowBuyModal(false)}
                isSubmitting={isSubmitting}
              />
            </ModalContainer>

            <ModalContainer isOpen={showBulkBuyModal}>
              <BulkBuyModal
                tradeMode={tradeMode}
                onConfirm={(items) => handleBulkOperation('buy', items, setShowBulkBuyModal)}
                onCancel={() => setShowBulkBuyModal(false)}
                isSubmitting={isSubmitting}
              />
            </ModalContainer>

            <ModalContainer isOpen={showBulkSellModal}>
              <BulkSellModal
                tradeMode={tradeMode}
                onConfirm={handleBulkSell}
                onCancel={() => setShowBulkSellModal(false)}
                isSubmitting={isSubmitting}
              />
            </ModalContainer>

            <ModalContainer isOpen={bulkSummaryData !== null}>
              <BulkSummaryModal
                type={bulkSummaryData?.type}
                completedItems={bulkSummaryData?.items || []}
                onUndo={handleBulkUndo}
                onDone={handleBulkSummaryDone}
                isUndoing={isUndoing}
                undoResult={undoResult}
              />
            </ModalContainer>

            <ModalContainer isOpen={showSellModal}>
              <SellModal
                stock={selectedStock}
                onConfirm={handleSell}
                onCancel={() => setShowSellModal(false)}
                isSubmitting={isSubmitting}
              />
            </ModalContainer>

            <ModalContainer isOpen={showRemoveModal}>
              <RemoveStockModal
                stock={selectedStock}
                onConfirm={handleRemoveStock}
                onCancel={() => setShowRemoveModal(false)}
                isSubmitting={isSubmitting}
              />
            </ModalContainer>

            <ModalContainer isOpen={showAdjustModal}>
              <AdjustModal
                stock={selectedStock}
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
                defaultCategory={newStockCategory}
                defaultIsInvestment={tradeMode === 'investment'}
                onConfirm={handleAddStock}
                archivedStocks={archivedStocks}
                onRestoreFromArchive={async (stock) => {
                  await handleRestore(stock);
                  setShowNewStockModal(false);
                }}
                onCancel={() => setShowNewStockModal(false)}
              />
            </ModalContainer>

            <ModalContainer isOpen={showCategoryModal}>
              <CategoryModal
                defaultIsInvestment={tradeMode === 'investment'}
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



            <ModalContainer isOpen={showEditCategoryModal}>
              <EditCategoryModal
                category={selectedCategory}
                categories={categoryNames}
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

          </>
        )}

        <ModalContainer isOpen={showPriceAlertModal}>
          <PriceAlertModal
            itemId={selectedAlertItem?.itemId}
            itemName={selectedAlertItem?.itemName}
            currentAlert={selectedAlertItem ? priceAlerts[selectedAlertItem.itemId] : null}
            gePrice={selectedAlertItem ? gePrices[selectedAlertItem.itemId] : null}
            onSave={handleSavePriceAlert}
            onDelete={handleDeletePriceAlert}
            onCancel={() => { setShowPriceAlertModal(false); setSelectedAlertItem(null); }}
          />
        </ModalContainer>

        <ModalContainer isOpen={showSettingsModal}>
          <SettingsModal
            numberFormat={numberFormat}
            onNumberFormatChange={(newFormat) => updateSettings({ numberFormat: newFormat })}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={(newColumns) => updateSettings({ visibleColumns: newColumns })}
            visibleProfits={visibleProfits}
            onVisibleProfitsChange={(newProfits) => updateSettings({ visibleProfits: newProfits })}
            showCategoryStats={showCategoryStats}
            onShowCategoryStatsChange={(value) => updateSettings({ showCategoryStats: value })}
            showUnrealisedProfitStats={showUnrealisedProfitStats}
            onShowUnrealisedProfitStatsChange={(v) => updateSettings({ showUnrealisedProfitStats: v })}
            showCategoryUnrealisedProfit={showCategoryUnrealisedProfit}
            onShowCategoryUnrealisedProfitChange={(v) => updateSettings({ showCategoryUnrealisedProfit: v })}
            notificationPreferences={notificationPreferences}
            onNotificationTypeChange={updateNotificationPreference}
            notificationVolume={notificationVolume}
            onNotificationVolumeChange={(v) => updateSettings({ notificationVolume: v })}
            onCancel={() => setShowSettingsModal(false)}
            onChangePassword={() => {
              setShowSettingsModal(false);
              setShowChangePasswordModal(true);
            }}
          />
        </ModalContainer>

        <ModalContainer isOpen={showChangelog}>
          <ChangelogModal onClose={handleCloseChangelog} />
        </ModalContainer>

        <ModalContainer isOpen={showArchive}>
          <div style={{
            background: 'rgb(30, 41, 59)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            width: '36rem',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgb(51, 65, 85)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📦 Archive</h2>
              <button onClick={() => setShowArchive(false)} className="btn btn-secondary btn-sm">Close</button>
            </div>
            {archivedLoading ? (
              <p style={{ color: 'rgb(148, 163, 184)' }}>Loading...</p>
            ) : archivedStocks.length === 0 ? (
              <p style={{ color: 'rgb(148, 163, 184)' }}>No archived stocks.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {archivedStocks.map(stock => (
                  <div key={stock.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: 'rgb(51, 65, 85)',
                    borderRadius: '0.5rem', gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      {stock.itemId && geIconMap[stock.itemId] && (
                        <img src={geIconMap[stock.itemId]} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'white' }}>{stock.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(148, 163, 184)' }}>
                          {stock.isInvestment ? '📈 Investment' : '💼 Trade'} · {stock.category}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(stock)}
                      className="btn btn-success btn-sm"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalContainer>

        <ModalContainer isOpen={showArchiveConfirmModal}>
          <div style={{
            background: 'rgb(30, 41, 59)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            width: '24rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgb(51, 65, 85)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Archive Stock</h2>
            <p style={{ color: 'rgb(148, 163, 184)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Are you sure you want to archive <strong style={{ color: 'white' }}>{stockToArchive?.name}</strong>? It will be removed from your trade screen but can be restored anytime.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleConfirmArchive}
                className="btn btn-warning"
                style={{ flex: 1 }}
              >
                📦 Archive
              </button>
              <button
                onClick={() => { setShowArchiveConfirmModal(false); setStockToArchive(null); }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalContainer>

        <ModalContainer isOpen={showMilestoneModal}>
          <MilestoneTrackerModal
            milestones={milestones}
            currentProgress={milestoneProgress}
            milestoneHistory={milestoneHistory}
            initialView={milestoneInitialView}
            onUpdateMilestone={handleUpdateMilestone}
            onCancel={() => setShowMilestoneModal(false)}
            numberFormat={numberFormat}
            PRESET_GOALS={PRESET_GOALS}
          />
        </ModalContainer>


      </div>
      <Footer />
    </div>
    </TradeProvider>
  );
}