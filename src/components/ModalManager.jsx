import React from 'react';
import { useModal } from '../contexts/ModalContext';
import ModalContainer from './modals/ModalContainer';
import TradeModal from './modals/TradeModal';
import BulkTradeModal from './modals/BulkTradeModal';
import BulkSummaryModal from './modals/BulkSummaryModal';
import RemoveStockModal from './modals/RemoveStockModal';
import AdjustModal from './modals/AdjustModal';
import ConfirmModal from './modals/ConfirmModal';
import NewStockModal from './modals/NewStockModal';
import CategoryModal from './modals/CategoryModal';
import EditCategoryModal from './modals/EditCategoryModal';
import ProfitModal from './modals/ProfitModal';
import NotesModal from './modals/NotesModal';
import SettingsModal from './modals/SettingsModal';
import ChangelogModal from './modals/ChangelogModal';
import ChangePasswordModal from './modals/ChangePasswordModal';
import PriceAlertModal from './modals/PriceAlertModal';
import ArchiveModal from './modals/ArchiveModal';
import MilestoneTrackerModal from './modals/MilestoneTrackerModal';
import AltTimerModal from './modals/AltTimerModal';
import TimeCalculatorModal from './modals/TimeCalculatorModal';

export default function ModalManager({
  // Handlers from useModalHandlers
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
  handleConfirmArchive,
  handleRestore,
  // Other handlers
  handleSetAltTimer,
  handleSaveNotes,
  handleCloseChangelog,
  handleSavePriceAlert,
  handleDeletePriceAlert,
  // Data
  tradeMode,
  stockNotes,
  numberFormat,
  categoryNames,
  geIconMap,
  gePrices,
  priceAlerts,
  // Settings
  visibleColumns,
  visibleProfits,
  showCategoryStats,
  showUnrealisedProfitStats,
  showCategoryUnrealisedProfit,
  notificationPreferences,
  updateNotificationPreference,
  notificationVolume,
  updateSettings,
  // Milestones
  milestones,
  milestoneProgress,
  milestoneHistory,
  PRESET_GOALS,
}) {
  const {
    modals,
    closeModal,
    selectedStock,
    selectedCategory,
    newStockCategory,
    newStockPreset,
    selectedAlertItem,
    milestoneInitialView,
    openModal,
  } = useModal();

  return (
    <>
      <ModalContainer isOpen={modals.buy}>
        <TradeModal
          mode="buy"
          stock={selectedStock}
          onConfirm={handleBuy}
          onCancel={() => closeModal('buy')}
          isSubmitting={isSubmitting}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.bulkBuy}>
        <BulkTradeModal
          mode="buy"
          tradeMode={tradeMode}
          onConfirm={handleBulkBuy}
          onCancel={() => closeModal('bulkBuy')}
          isSubmitting={isSubmitting}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.bulkSell}>
        <BulkTradeModal
          mode="sell"
          tradeMode={tradeMode}
          onConfirm={handleBulkSell}
          onCancel={() => closeModal('bulkSell')}
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

      <ModalContainer isOpen={modals.sell}>
        <TradeModal
          mode="sell"
          stock={selectedStock}
          onConfirm={handleSell}
          onCancel={() => closeModal('sell')}
          isSubmitting={isSubmitting}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.remove}>
        <RemoveStockModal
          stock={selectedStock}
          onConfirm={handleRemoveStock}
          onCancel={() => closeModal('remove')}
          isSubmitting={isSubmitting}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.adjust}>
        <AdjustModal
          stock={selectedStock}
          onConfirm={handleAdjust}
          onCancel={() => closeModal('adjust')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.delete}>
        <ConfirmModal
          title="Delete Item"
          message={<>Are you sure you want to delete <strong>{selectedStock?.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => closeModal('delete')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.newStock}>
        <NewStockModal
          defaultCategory={newStockCategory}
          defaultIsInvestment={tradeMode === 'investment'}
          defaultItem={newStockPreset}
          onConfirm={handleAddStock}
          archivedStocks={archivedStocks}
          onRestoreFromArchive={async (stock) => {
            await handleRestore(stock);
            closeModal('newStock');
          }}
          onCancel={() => closeModal('newStock')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.category}>
        <CategoryModal
          defaultIsInvestment={tradeMode === 'investment'}
          onConfirm={handleAddCategory}
          onCancel={() => closeModal('category')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.deleteCategory}>
        <ConfirmModal
          title="Delete Category"
          message={<>Are you sure you want to delete the <strong>{selectedCategory}</strong> category? All items in this category will be moved to "Uncategorized".</>}
          confirmLabel="Delete Category"
          confirmVariant="danger"
          onConfirm={() => handleDeleteCategory(selectedCategory)}
          onCancel={() => closeModal('deleteCategory')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.dumpProfit}>
        <ProfitModal
          type="dump"
          onConfirm={handleAddDumpProfit}
          onCancel={() => closeModal('dumpProfit')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.referralProfit}>
        <ProfitModal
          type="referral"
          onConfirm={handleAddReferralProfit}
          onCancel={() => closeModal('referralProfit')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.bondsProfit}>
        <ProfitModal
          type="bonds"
          onConfirm={handleAddBondsProfit}
          onCancel={() => closeModal('bondsProfit')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.notes}>
        <NotesModal
          stock={selectedStock}
          notes={stockNotes[selectedStock?.id]}
          onConfirm={handleSaveNotes}
          onCancel={() => closeModal('notes')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.editCategory}>
        <EditCategoryModal
          category={selectedCategory}
          categories={categoryNames}
          onConfirm={handleEditCategory}
          onCancel={() => closeModal('editCategory')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.timeCalculator}>
        <TimeCalculatorModal
          stock={selectedStock}
          onClose={() => closeModal('timeCalculator')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.altTimer}>
        <AltTimerModal
          onConfirm={handleSetAltTimer}
          onCancel={() => closeModal('altTimer')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.changePassword}>
        <ChangePasswordModal
          onCancel={() => closeModal('changePassword')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.priceAlert}>
        <PriceAlertModal
          itemId={selectedAlertItem?.itemId}
          itemName={selectedAlertItem?.itemName}
          defaultHighThreshold={selectedAlertItem?.defaultHighThreshold}
          defaultLowThreshold={selectedAlertItem?.defaultLowThreshold}
          currentAlert={selectedAlertItem ? priceAlerts[selectedAlertItem.itemId] : null}
          gePrice={selectedAlertItem ? gePrices[selectedAlertItem.itemId] : null}
          onSave={handleSavePriceAlert}
          onDelete={handleDeletePriceAlert}
          onCancel={() => closeModal('priceAlert')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.settings}>
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
          onCancel={() => closeModal('settings')}
          onChangePassword={() => {
            closeModal('settings');
            openModal('changePassword');
          }}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.changelog}>
        <ChangelogModal onClose={handleCloseChangelog} />
      </ModalContainer>

      <ModalContainer isOpen={modals.archive}>
        <ArchiveModal
          archivedStocks={archivedStocks}
          loading={archivedLoading}
          geIconMap={geIconMap}
          onRestore={handleRestore}
          onClose={() => closeModal('archive')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.archiveConfirm}>
        <ConfirmModal
          title="Archive Item"
          message={<>Are you sure you want to archive <strong>{stockToArchive?.name}</strong>? It will be removed from your trade screen but can be restored anytime.</>}
          confirmLabel="Archive"
          confirmVariant="warning"
          onConfirm={handleConfirmArchive}
          onCancel={() => closeModal('archiveConfirm')}
        />
      </ModalContainer>

      <ModalContainer isOpen={modals.milestone}>
        <MilestoneTrackerModal
          milestones={milestones}
          currentProgress={milestoneProgress}
          milestoneHistory={milestoneHistory}
          initialView={milestoneInitialView}
          onUpdateMilestone={handleUpdateMilestone}
          onCancel={() => closeModal('milestone')}
          numberFormat={numberFormat}
          PRESET_GOALS={PRESET_GOALS}
        />
      </ModalContainer>
    </>
  );
}
