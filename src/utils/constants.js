export const STORAGE_KEY = 'stockTrackerData';
export const DUMP_PROFIT_KEY = 'dumpProfit';
export const CATEGORIES_KEY = 'stockCategories';

export const DEFAULT_STOCKS = [
  {
    id: 1,
    name: 'Feathers',
    totalCost: 0,
    shares: 0,
    sharesSold: 0,
    totalCostSold: 0,
    totalCostBasisSold: 0,
    limit4h: 30000,
    needed: 10000000,
    timerEndTime: null,
    category: 'Fishing',
  },
  {
    id: 2,
    name: 'Diamond Bolts',
    totalCost: 0,
    shares: 0,
    sharesSold: 0,
    totalCostSold: 0,
    totalCostBasisSold: 0,
    limit4h: 11000,
    needed: 100000,
    timerEndTime: null,
    category: 'Ranged Ammo',
  },
  {
    id: 3,
    name: 'Fire Rune',
    totalCost: 0,
    shares: 0,
    sharesSold: 0,
    totalCostSold: 0,
    totalCostBasisSold: 0,
    limit4h: 50000,
    needed: 1000000,
    timerEndTime: null,
    category: 'Runes',
  },
];

export const DEFAULT_CATEGORIES = ['Fishing', 'Ranged Ammo', 'Runes'];

export const DEFAULT_VISIBLE_COLUMNS = {
  status: true,
  avgBuy: true,
  avgSell: true,
  profit: true,
  timer: true,
  notes: true,
  limit4h: true,
  geHigh: true,
  geLow: true,
  unrealizedProfit: true
};