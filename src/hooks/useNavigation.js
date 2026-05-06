import { useState, useEffect, useCallback } from 'react';
import { useUIState } from '../contexts/UIStateContext';

const PAGE_PATHS = {
  home: '/',
  trade: '/trade',
  history: '/history',
  graphs: '/graphs',
  analytics: '/analytics',
  watchlist: '/watchlist',
};

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
  if (path === '/analytics') return 'analytics';
  if (path === '/watchlist') return 'watchlist';
  return 'home';
}

function filtersFromHistoryParams(params) {
  if (params.has('search')) {
    return { ...HISTORY_EMPTY_FILTERS, stockName: params.get('search') };
  }

  if (params.has('dateFrom') || params.has('dateTo')) {
    return {
      ...HISTORY_EMPTY_FILTERS,
      dateFrom: params.get('dateFrom') || '',
      dateTo: params.get('dateTo') || '',
    };
  }

  return { ...HISTORY_EMPTY_FILTERS };
}

export function useNavigation({
  refetch,
  fetchCategories,
  refetchGPStats,
  refetchProfitHistory,
  applyFilters,
  stocks,
  categories,
}) {
  const [currentPage, setCurrentPage] = useState(getPageFromURL);
  const [graphItemId, setGraphItemId] = useState(() => new URLSearchParams(window.location.search).get('item'));
  const { collapsedCategories, setCollapsedCategories } = useUIState();

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
      if (page === 'history') {
        applyFilters(filtersFromHistoryParams(params));
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
        applyFilters(filtersFromHistoryParams(searchParams));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch, fetchCategories, refetchGPStats, refetchProfitHistory, applyFilters]);

  const toggleCategory = useCallback((category) => {
    setCollapsedCategories(prev => {
      const newState = { ...prev, [category]: !prev[category] };
      localStorage.setItem('collapsedCategories', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const expandCategory = useCallback((category) => {
    setCollapsedCategories(prev => {
      if (!prev[category]) return prev;
      const next = { ...prev, [category]: false };
      localStorage.setItem('collapsedCategories', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleQuickNavNavigate = useCallback((category) => {
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
  }, [collapsedCategories]);

  const handleNotificationNavigate = useCallback((target) => {
    if (!target) return;
    if (target.externalUrl) {
      window.open(target.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigateToPage(target.page);
    if (target.stockId) {
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

  return {
    currentPage,
    graphItemId,
    navigateToPage,
    toggleCategory,
    expandCategory,
    handleQuickNavNavigate,
    handleNotificationNavigate,
  };
}
