import React from 'react';
import { formatNumber } from '../utils/formatters';

export default function HomePage({ 
  stocks, 
  transactions, 
  profits, 
  numberFormat,
  milestones,
  milestoneProgress,
  onNavigateToTrade,
  onOpenMilestoneModal
}) {
  // Calculate GP traded
  const totalGPTraded = transactions?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  
  const weeklyGPTraded = transactions?.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.date) >= weekAgo;
  }).reduce((sum, t) => sum + (t.total || 0), 0) || 0;
  
  const monthlyGPTraded = transactions?.filter(t => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(t.date) >= monthAgo;
  }).reduce((sum, t) => sum + (t.total || 0), 0) || 0;

  // Calculate total unrealized profit from current holdings
  const totalUnrealizedProfit = stocks?.reduce((sum, stock) => {
    const avgBuy = stock.shares > 0 ? stock.totalCost / stock.shares : 0;
    const currentValue = stock.shares * avgBuy; // Since we don't have current_price, use cost basis
    return sum + (stock.totalCostSold - stock.totalCostBasisSold);
  }, 0) || 0;

  // Calculate total realized profit (from sells)
  const totalRealizedProfit = stocks?.reduce((sum, stock) => {
    return sum + (stock.totalCostSold - (stock.totalCostBasisSold || 0));
  }, 0) || 0;

  // Add dump, referral, bonds profit
  const { dumpProfit = 0, referralProfit = 0, bondsProfit = 0 } = profits || {};
  const totalProfit = totalRealizedProfit + dumpProfit + referralProfit + bondsProfit;

  // Calculate inventory value (current holdings at cost basis)
  const inventoryValue = stocks?.reduce((sum, stock) => 
    sum + stock.totalCost, 0
  ) || 0;

  // Total items in stock
  const itemsInStock = stocks?.reduce((sum, stock) => sum + stock.shares, 0) || 0;
  
  // Unrealized value (non-GE items - items without limit4h set)
  const unrealizedValue = stocks?.filter(s => !s.limit4h).reduce((sum, stock) => 
    sum + stock.totalCost, 0
  ) || 0;

  // Recent activity (last 5 transactions)
  const recentActivity = transactions?.slice(0, 5) || [];

  // Top items by profit (based on realized profit from sells)
  const topItems = stocks
    ?.map(stock => {
      const realizedProfit = stock.totalCostSold - (stock.totalCostBasisSold || 0);
      const margin = stock.totalCostBasisSold > 0 
        ? ((realizedProfit / stock.totalCostBasisSold) * 100) 
        : 0;
      return { 
        ...stock, 
        profit: realizedProfit, 
        margin 
      };
    })
    .filter(stock => stock.sharesSold > 0) // Only show items that have been sold
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5) || [];

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Home Overview</h1>
        <p className="home-subtitle">Your bulking summary, goals, and quick insights.</p>
      </div>

      <div className="home-actions">
        <button onClick={onNavigateToTrade} className="btn btn-purple btn-large">
          Go to Trade
        </button>
        <button className="btn btn-blue btn-large">
          Open Analytics
        </button>
      </div>

      <div className="summary-grid">
        {/* Profit Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-icon">💰</span>
            <span className="summary-card-label">Profit</span>
          </div>
          <div className="summary-card-value">
            {formatNumber(totalProfit, numberFormat)}
          </div>
          <div className="summary-card-detail">
            Week: {formatNumber(weeklyGPTraded, numberFormat)}
          </div>
          <div className="summary-card-detail">
            Month: {formatNumber(monthlyGPTraded, numberFormat)}
          </div>
        </div>

        {/* GP Traded Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-icon">📈</span>
            <span className="summary-card-label">GP Traded</span>
          </div>
          <div className="summary-card-value">
            {formatNumber(totalGPTraded, numberFormat)}
          </div>
          <div className="summary-card-detail">
            Week: {formatNumber(weeklyGPTraded, numberFormat)}
          </div>
          <div className="summary-card-detail">
            Month: {formatNumber(monthlyGPTraded, numberFormat)}
          </div>
        </div>

        {/* Inventory Card */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-icon">📦</span>
            <span className="summary-card-label">Inventory</span>
          </div>
          <div className="summary-card-value">
            {formatNumber(inventoryValue, numberFormat)}
          </div>
          <div className="summary-card-detail">
            Items in stock: {itemsInStock.toLocaleString()}
          </div>
          <div className="summary-card-detail">
            Unrealized (Non-GE): {formatNumber(unrealizedValue, numberFormat)}
          </div>
        </div>
      </div>

      <div className="activity-grid">
        {/* Recent Activity */}
        <div className="activity-section">
          <h3 className="activity-section-title">
            <span>📜</span> Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="activity-empty">No recent transactions</p>
          ) : (
            <div className="table-container">
              <table className="table-base">
                <thead className="thead-base">
                  <tr>
                    <th className="th-base">Date</th>
                    <th className="th-base">Action</th>
                    <th className="th-base">Item</th>
                    <th className="th-base td-right">Qty</th>
                    <th className="th-base td-right">GP</th>
                    <th className="th-base td-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((transaction, idx) => {
                    // Calculate profit for sell transactions
                    const stock = stocks?.find(s => s.id === transaction.stockId);
                    let profit = null;
                    
                    if (transaction.type === 'sell' && stock) {
                      const avgBuy = stock.totalCostBasisSold > 0 
                        ? (stock.totalCostBasisSold / (stock.sharesSold || 1))
                        : 0;
                      const costBasis = avgBuy * transaction.shares;
                      profit = transaction.total - costBasis;
                    }

                    return (
                      <tr 
                        key={idx} 
                        className={idx % 2 === 0 ? 'tr-even' : 'tr-odd'}
                      >
                        <td className="td-base">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="td-base">
                          <span className={transaction.type === 'buy' ? 'badge badge-ok' : 'badge badge-low'}>
                            {transaction.type === 'buy' ? '🛒 Buy' : '💵 Sell'}
                          </span>
                        </td>
                        <td className="td-base">{transaction.stockName}</td>
                        <td className="td-base td-right">
                          {transaction.shares?.toLocaleString()}
                        </td>
                        <td className="td-base td-right">
                          {formatNumber(transaction.total, numberFormat)}
                        </td>
                        <td className={`td-base td-right ${profit !== null ? (profit >= 0 ? 'td-profit-positive' : 'td-profit-negative') : ''}`}>
                          {profit !== null ? formatNumber(profit, numberFormat) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div className="activity-section">
          <h3 className="activity-section-title">
            <span>🎯</span> Goals
          </h3>
          <div className="activity-list">
            {['day', 'week', 'month', 'year'].map((period) => {
              const milestone = milestones?.[period];
              const progress = milestoneProgress?.[period] || 0;
              const percentage = milestone?.goal > 0 ? (progress / milestone.goal) * 100 : 0;
              const displayPercentage = Math.min(percentage, 100);
              const isComplete = milestone && progress >= milestone.goal;

              const periodLabels = {
                day: { label: 'Daily', emoji: '☀️' },
                week: { label: 'Weekly', emoji: '📅' },
                month: { label: 'Monthly', emoji: '📊' },
                year: { label: 'Yearly', emoji: '🎯' }
              };

              return (
                <div key={period} className="activity-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div className="activity-item-title">
                      {periodLabels[period].emoji} {periodLabels[period].label}
                    </div>
                    <div className="activity-item-subtitle" style={{ color: isComplete ? 'rgb(34, 197, 94)' : 'white', fontWeight: '600' }}>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'rgb(51, 65, 85)', 
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      width: `${displayPercentage}%`,
                      height: '100%',
                      background: isComplete 
                        ? 'linear-gradient(90deg, rgb(34, 197, 94), rgb(22, 163, 74))'
                        : percentage > 75 
                          ? 'linear-gradient(90deg, rgb(234, 179, 8), rgb(202, 138, 4))'
                          : 'linear-gradient(90deg, rgb(59, 130, 246), rgb(37, 99, 235))',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="activity-item-subtitle">
                      {formatNumber(progress, numberFormat)}
                    </div>
                    <div className="activity-item-subtitle">
                      {formatNumber(milestone?.goal || 0, numberFormat)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

           <button 
            onClick={() => {
              console.log('Button clicked!');
              console.log('onOpenMilestoneModal:', onOpenMilestoneModal);
              if (onOpenMilestoneModal) {
                onOpenMilestoneModal();
              } else {
                console.error('onOpenMilestoneModal is not defined!');
              }
            }}
            className="btn btn-purple"
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
          >
            🎯 Edit Goals
          </button>
        </div>
      </div>

        {/* Top Items by Profit */}
        <div className="activity-section">
          <h3 className="activity-section-title">
            <span>🏆</span> Top Items (By Profit)
          </h3>
          <div className="activity-list">
            {topItems.length === 0 ? (
              <p className="activity-empty">No items sold yet</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-item-title">
                      {item.name}
                    </div>
                    <div className="activity-item-subtitle">
                      Sold: {item.sharesSold?.toLocaleString()} | Margin: {item.margin.toFixed(2)}%
                    </div>
                  </div>
                  <div className="activity-item-right">
                    <div className={`activity-item-value ${item.profit >= 0 ? 'activity-item-value-positive' : 'activity-item-value-negative'}`}>
                      {formatNumber(item.profit, numberFormat)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}