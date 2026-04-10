import React, { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import GraphsPage from './pages/GraphsPage';
import { supabase } from './lib/supabase';
import { useGPTradedStats } from './hooks/useGPTradedStats';
import { useStockNotes } from './hooks/useStockNotes.js';
import { useSettings } from './hooks/useSettings';
import { useNotificationSettings } from './hooks/useNotificationSettings';
import { useGEData } from './contexts/GEDataContext';
import { TradeProvider } from './contexts/TradeContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { UIStateProvider, useUIState, useHighlight } from './contexts/UIStateContext';
import { StocksProvider, useStocksContext } from './contexts/StocksContext';
import { TransactionsProvider, useTransactionsContext } from './contexts/TransactionsContext';
import { CategoriesProvider, useCategoriesContext } from './contexts/CategoriesContext';
import { ProfitsProvider, useProfitsContext } from './contexts/ProfitsContext';
import { MilestonesProvider, useMilestonesContext } from './contexts/MilestonesContext';
import { ProfitHistoryProvider, useProfitHistoryContext } from './contexts/ProfitHistoryContext';
import { useNotifications } from './hooks/useNotifications';
import { useOSRSNews } from './hooks/useOSRSNews';
import { useJmodComments } from './hooks/useJmodComments';
import CategoryQuickNav from './components/CategoryQuickNav';
import MilestoneProgressBar from './components/MilestoneProgressBar';
import Footer from './components/Footer';
import Header from './components/Header';
import NotificationCenter from './components/NotificationCenter';
import PortfolioSummary from './components/PortfolioSummary';
import ChartButtons from './components/ChartButtons';
import CategorySection from './components/CategorySection';
import ModalManager from './components/ModalManager';
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
import { useModalHandlers } from './hooks/useModalHandlers';
import { useNavigation } from './hooks/useNavigation';

export default function MainApp(props) {
  const userId = props.session.user.id;
  return (
    <ModalProvider>
      <StocksProvider userId={userId}>
        <TransactionsProvider userId={userId}>
          <CategoriesProvider userId={userId}>
            <ProfitsProvider userId={userId}>
              <MilestonesProvider userId={userId}>
                <ProfitHistoryProvider userId={userId}>
                  <UIStateProvider userId={userId}>
                    <MainAppInner {...props} />
                  </UIStateProvider>
                </ProfitHistoryProvider>
              </MilestonesProvider>
            </ProfitsProvider>
          </CategoriesProvider>
        </TransactionsProvider>
      </StocksProvider>
    </ModalProvider>
  );
}

function MainAppInner({ session, onLogout }) {
  const userId = session.user.id;
  const userEmail = session.user.email;
  const {
    tradeMode,
    setTradeMode,
    collapsedCategories,
    setCollapsedCategories,
    milestoneProgress,
    setMilestoneProgress,
    calculateMilestoneProgress,
    firedTimerNotifs,
    saveFiredTimers,
  } = useUIState();
  const { highlightedRows, highlightRow } = useHighlight();
  const { gePrices, geMapping, geIconMap, membershipMap, mappingLoading } = useGEData();

  const switchTradeMode = (mode) => {
    refetch();
    fetchCategories();
    setTradeMode(mode);
  };
  const { stocks, loading: stocksLoading, addStock: addStockToDB, updateStock, deleteStock, refetch, reorderStocks, archiveStock, restoreStock, fetchArchivedStocks } = useStocksContext();
  const { categories, loading: categoriesLoading, addCategory, deleteCategory, updateCategory, fetchCategories, reorderCategories } = useCategoriesContext();
  const {
    transactions, loading: transactionsLoading, addTransaction,
    pagedTransactions, pagedLoading, totalCount, totalPages,
    page, pageSize, filters, goToPage, changePageSize, applyFilters, initPaged,
    sortConfig: historySortConfig, applySort, resetPaged, undoTransaction
  } = useTransactionsContext();
 const { stats: gpTradedStats, loading: gpStatsLoading, refetch: refetchGPStats } = useGPTradedStats(userId);
  const { notes: stockNotes, loading: notesLoading, saveNote, deleteNote } = useStockNotes(userId);
  const { settings, loading: settingsLoading, updateSettings } = useSettings(userId);
  const { notificationPreferences, updateNotificationPreference, loading: notificationSettingsLoading } = useNotificationSettings(userId);
  const { profits, loading: profitsLoading, updateProfit } = useProfitsContext();
  const { profitHistory, loading: profitHistoryLoading, refetch: refetchProfitHistory } = useProfitHistoryContext();
  const { milestones, milestoneHistory, loading: milestonesLoading, updateMilestone, recordMilestoneAchievement, recordCompletedPeriods, PRESET_GOALS } = useMilestonesContext();
  const { alerts: priceAlerts, allAlerts: allPriceAlerts, loading: priceAlertsLoading, saveAlert: savePriceAlert, dismissAlert: dismissPriceAlert, deactivateAlert: deactivatePriceAlert, updateLastChecked: updatePriceAlertLastChecked, refetch: refetchPriceAlerts } = usePriceAlerts(userId);

  // Destructure profits
  const { dumpProfit, referralProfit, bondsProfit } = profits;

  // Destructure settings
  const { numberFormat, visibleColumns, visibleProfits, altAccountTimer, showCategoryStats,
          showUnrealisedProfitStats, showCategoryUnrealisedProfit, notificationVolume } = settings;
  // Local UI state
  const {
    currentPage,
    graphItemId,
    navigateToPage,
    toggleCategory,
    expandCategory,
    handleQuickNavNavigate,
    handleNotificationNavigate,
  } = useNavigation({ refetch, fetchCategories, refetchGPStats, refetchProfitHistory, applyFilters, stocks, categories });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dataLoaded = !stocksLoading && !categoriesLoading && !transactionsLoading && !notesLoading && !settingsLoading && !profitsLoading && !milestonesLoading && !profitHistoryLoading && !gpStatsLoading;

  const [selectedMilestonePeriod, setSelectedMilestonePeriod] = useState('day');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Modal context
  const { openModal, closeModal, selectedStock, setSelectedStock, selectedCategory, setSelectedCategory, newStockCategory, setNewStockCategory, setSelectedAlertItem } = useModal();

  // Price alert handlers
  const handleOpenPriceAlert = (stockOrItem) => {
    const itemId = stockOrItem.itemId ?? stockOrItem.itemId;
    const itemName = stockOrItem.itemName ?? stockOrItem.name;
    if (!itemId) return;
    openModal('priceAlert', { alertItem: { itemId, itemName } });
  };

  const handleSavePriceAlert = async (itemId, itemName, highThreshold, lowThreshold) => {
    await savePriceAlert(itemId, itemName, highThreshold, lowThreshold);
    closeModal('priceAlert');
  };

  const handleDeletePriceAlert = async (alertId) => {
    await dismissPriceAlert(alertId);
    closeModal('priceAlert');
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

  useEffect(() => {
    if (!profitHistory || profitHistoryLoading) return;

    const newProgress = calculateMilestoneProgress();
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
  }, [profitHistory, milestones, calculateMilestoneProgress, setMilestoneProgress]);

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
      openModal('changelog');
    }
  }, [userId]);

  const handleCloseChangelog = () => {
    localStorage.setItem(`lastSeenVersion_${userId}`, CURRENT_VERSION);
    closeModal('changelog');
  };


  const {
    isSubmitting,
    bulkSummaryData,
    isUndoing,
    undoResult,
    handleBuy,
    handleSell,
    handleBulkBuy,
    handleBulkSell,
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
  } = useModalHandlers();

  const handleInvestmentDateChange = async (stock, date) => {
    await updateStock(stock.id, { investmentStartDate: date });
    await refetch();
  };


  const handleSetAltTimer = async (days) => {
    const timerEndTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    firedAltTimerNotif.current = false;
    await updateSettings({ altAccountTimer: timerEndTime });
    closeModal('altTimer');
  };

  const handleResetAltTimer = async () => {
    firedAltTimerNotif.current = false;
    await updateSettings({ altAccountTimer: null });
  };

  const handleSaveNotes = async (noteText) => {
    await saveNote(selectedStock.id, noteText);
    closeModal('notes');
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
    if (action === 'calculate') {
      handleCalculateTime(stock);
      return;
    }
    openModal(action, { stock });
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

  const handleCalculateTime = (stock) => {
    openModal('timeCalculator', { stock });
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
            onExpandCategory={expandCategory}
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
            onEditAlert={(alert) => openModal('priceAlert', { alertItem: { itemId: alert.itemId, itemName: alert.itemName } })}
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
                  onClick={() => { openModal('settings'); setUserMenuOpen(false); }}
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
            onOpenMilestoneModal={() => openModal('milestone', { milestoneView: 'main' })}
            onOpenMilestoneHistory={() => openModal('milestone', { milestoneView: 'history' })}
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
              onAddDumpProfit={() => openModal('dumpProfit')}
              onAddReferralProfit={() => openModal('referralProfit')}
              onAddBondsProfit={() => openModal('bondsProfit')}
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
                onOpenModal={() => openModal('milestone', { milestoneView: 'main' })}
                numberFormat={numberFormat}
              />

              <ChartButtons
                onShowProfitChart={() => openModal('profitChart')}
                onShowCategoryChart={() => openModal('categoryChart')}
                altAccountTimer={altAccountTimer}
                onSetAltTimer={() => openModal('altTimer')}
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
                onClick={() => openModal('category')}
                className="btn btn-primary"
              >
                + Add Category
              </button>
              <button
                onClick={async () => {
                  await refreshArchivedStocks();
                  openModal('newStock', { newStockCategory: '' });
                }}
                className="btn btn-success"
              >
                + Add Stock
              </button>
              <button
                onClick={() => openModal('bulkBuy')}
                className="btn btn-success"
              >
                Bulk Buy
              </button>
              <button
                onClick={() => openModal('bulkSell')}
                className="btn btn-danger"
              >
                Bulk Sell
              </button>
              <button
                onClick={async () => {
                  await handleOpenArchive();
                  openModal('archive');
                }}
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
                onAddStock={(cat) => openModal('newStock', { newStockCategory: cat })}
                onDeleteCategory={(cat) => openModal('deleteCategory', { category: cat })}
                onEditCategory={(cat) => openModal('editCategory', { category: cat })}
                onBuy={(stock) => openModal('buy', { stock })}
                onSell={(stock) => openModal('sell', { stock })}
                onRemove={(stock) => openModal('remove', { stock })}
                onAdjust={(stock) => openModal('adjust', { stock })}
                onDelete={(stock) => openModal('delete', { stock })}
                onArchive={(stock) => {
                  handleArchive(stock);
                  openModal('archiveConfirm');
                }}
                onNotes={(stock) => openModal('notes', { stock })}
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

          </>
        )}

        <ModalManager
          isSubmitting={isSubmitting}
          bulkSummaryData={bulkSummaryData}
          isUndoing={isUndoing}
          undoResult={undoResult}
          handleBuy={handleBuy}
          handleSell={handleSell}
          handleBulkBuy={handleBulkBuy}
          handleBulkSell={handleBulkSell}
          handleBulkUndo={handleBulkUndo}
          handleBulkSummaryDone={handleBulkSummaryDone}
          handleRemoveStock={handleRemoveStock}
          handleAdjust={handleAdjust}
          handleDelete={handleDelete}
          handleAddStock={handleAddStock}
          handleAddCategory={handleAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleEditCategory={handleEditCategory}
          handleAddDumpProfit={handleAddDumpProfit}
          handleAddReferralProfit={handleAddReferralProfit}
          handleAddBondsProfit={handleAddBondsProfit}
          handleUpdateMilestone={handleUpdateMilestone}
          archivedStocks={archivedStocks}
          archivedLoading={archivedLoading}
          stockToArchive={stockToArchive}
          handleConfirmArchive={handleConfirmArchive}
          handleRestore={handleRestore}
          handleSetAltTimer={handleSetAltTimer}
          handleSaveNotes={handleSaveNotes}
          handleCloseChangelog={handleCloseChangelog}
          handleSavePriceAlert={handleSavePriceAlert}
          handleDeletePriceAlert={handleDeletePriceAlert}
          tradeMode={tradeMode}
          stockNotes={stockNotes}
          dumpProfit={dumpProfit}
          referralProfit={referralProfit}
          bondsProfit={bondsProfit}
          numberFormat={numberFormat}
          groupedStocks={groupedStocks}
          categoryNames={categoryNames}
          geIconMap={geIconMap}
          gePrices={gePrices}
          priceAlerts={priceAlerts}
          visibleColumns={visibleColumns}
          visibleProfits={visibleProfits}
          showCategoryStats={showCategoryStats}
          showUnrealisedProfitStats={showUnrealisedProfitStats}
          showCategoryUnrealisedProfit={showCategoryUnrealisedProfit}
          notificationPreferences={notificationPreferences}
          updateNotificationPreference={updateNotificationPreference}
          notificationVolume={notificationVolume}
          updateSettings={updateSettings}
          milestones={milestones}
          milestoneProgress={milestoneProgress}
          milestoneHistory={milestoneHistory}
          PRESET_GOALS={PRESET_GOALS}
        />

      </div>
      <Footer />
    </div>
    </TradeProvider>
  );
}