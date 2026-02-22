export const calculateStocksProfit = (stocks) => {
  return stocks.reduce((sum, s) => {
    return sum + (s.totalCostSold - (s.totalCostBasisSold || 0));
  }, 0);
};

export const calculateTotalProfit = (stocks, dumpProfit, referralProfit, bondsProfit) => {
  const stocksProfit = calculateStocksProfit(stocks);
  return stocksProfit + dumpProfit + referralProfit + bondsProfit;
};

export const calculateAvgBuyPrice = (stock) => {
  return stock.shares > 0 ? stock.totalCost / stock.shares : 0;
};

export const calculateAvgSellPrice = (stock) => {
  return stock.sharesSold > 0 ? stock.totalCostSold / stock.sharesSold : 0;
};

export const calculateProfit = (stock) => {
  return stock.totalCostSold - (stock.totalCostBasisSold || 0);
};

export const sortStocks = (stocks, sortConfig) => {
  if (!sortConfig.key) return stocks;

  return [...stocks].sort((a, b) => {
    let aVal, bVal;

    switch (sortConfig.key) {
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
        aVal = calculateAvgBuyPrice(a);
        bVal = calculateAvgBuyPrice(b);
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
        aVal = calculateAvgSellPrice(a);
        bVal = calculateAvgSellPrice(b);
        break;
      case 'profit':
        aVal = calculateProfit(a);
        bVal = calculateProfit(b);
        break;
      case 'needed':
        aVal = a.needed;
        bVal = b.needed;
        break;
      case 'limit4h':
        aVal = a.limit4h;
        bVal = b.limit4h;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};