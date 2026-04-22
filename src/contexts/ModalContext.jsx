import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ModalContext = createContext(null);

const MODAL_DEFAULTS = {
  buy: false,
  bulkBuy: false,
  bulkSell: false,
  sell: false,
  remove: false,
  adjust: false,
  delete: false,
  milestone: false,
  newStock: false,
  category: false,
  altTimer: false,
  changePassword: false,
  deleteCategory: false,
  dumpProfit: false,
  referralProfit: false,
  bondsProfit: false,
  notes: false,
  profitChart: false,
  categoryChart: false,
  settings: false,
  timeCalculator: false,
  editCategory: false,
  priceAlert: false,
  archive: false,
  archiveConfirm: false,
  changelog: false,
};

export function ModalProvider({ children }) {
  const [modals, setModals] = useState(MODAL_DEFAULTS);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newStockCategory, setNewStockCategory] = useState('');
  const [newStockPreset, setNewStockPreset] = useState(null);
  const [selectedAlertItem, setSelectedAlertItem] = useState(null);
  const [milestoneInitialView, setMilestoneInitialView] = useState('main');

  const openModal = useCallback((type, payload) => {
    if (payload?.stock) setSelectedStock(payload.stock);
    if (payload?.category) setSelectedCategory(payload.category);
    if (payload?.newStockCategory !== undefined) setNewStockCategory(payload.newStockCategory);
    if (payload?.newStockPreset !== undefined) setNewStockPreset(payload.newStockPreset);
    if (payload?.alertItem) setSelectedAlertItem(payload.alertItem);
    if (payload?.milestoneView) setMilestoneInitialView(payload.milestoneView);

    setModals(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeModal = useCallback((type) => {
    setModals(prev => ({ ...prev, [type]: false }));

    if (type === 'priceAlert') setSelectedAlertItem(null);
    if (type === 'newStock') setNewStockPreset(null);
  }, []);

  const value = useMemo(() => ({
    modals,
    openModal,
    closeModal,
    selectedStock,
    setSelectedStock,
    selectedCategory,
    setSelectedCategory,
    newStockCategory,
    setNewStockCategory,
    newStockPreset,
    setNewStockPreset,
    selectedAlertItem,
    setSelectedAlertItem,
    milestoneInitialView,
    setMilestoneInitialView,
  }), [modals, openModal, closeModal, selectedStock, selectedCategory, newStockCategory, newStockPreset, selectedAlertItem, milestoneInitialView]);

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within a ModalProvider');
  return ctx;
}
