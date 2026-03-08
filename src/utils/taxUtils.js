// Item IDs exempt from GE tax per:
// https://oldschool.runescape.wiki/w/Grand_Exchange#Exempt_from_tax
const TAX_EXEMPT_IDS = new Set([
  13190,        // Old school bond
  // Energy potions
  3010, 3008, 3006, 3004,
  // Low level food
  379,          // Lobster
  365,          // Bass
  315,          // Shrimps
  347,          // Herring
  353,          // Mackerel
  329,          // Salmon
  359,          // Tuna
  351,          // Pike
  1891,         // Cake
  2309,         // Bread
  2140,         // Cooked chicken
  2142,         // Cooked meat
  2327,         // Meat pie
  // Low level combat consumables
  558,          // Mind rune
  882,          // Bronze arrow
  884,          // Iron arrow
  886,          // Steel arrow
  806,          // Bronze dart
  807,          // Iron dart
  808,          // Steel dart
  // Tools
  1755,         // Chisel
  2347,         // Hammer
  1733,         // Needle
  952,          // Spade
  1735,         // Shears
  5329,         // Secateurs
  // Teleport tablets
  8007,         // Varrock teleport
  8008,         // Lumbridge teleport
  8009,         // Falador teleport
  8010,         // Camelot teleport
  8011,         // Ardougne teleport
  8013,         // Teleport to house
  // Jewellery
  3853,         // Games necklace(8)
  2552,         // Ring of dueling(8)
]);

const TAX_RATE = 0.02;
const TAX_CAP = 5_000_000;

/**
 * Returns the tax deducted from a sale at the given price per item.
 * Tax is 2%, capped at 5M. Items under 50gp have no tax (rounds to 0).
 */
export function calculateGETax(itemId, pricePerItem) {
  if (TAX_EXEMPT_IDS.has(itemId)) return 0;
  const rawTax = Math.floor(pricePerItem * TAX_RATE);
  return Math.min(rawTax, TAX_CAP);
}

/**
 * Returns unrealized profit if you sold all current stock right now
 * at the latest GE high price, including tax.
 * Returns null if no GE data is available.
 */
export function calculateUnrealizedProfit(stock, latestHigh, itemId) {
  if (latestHigh == null || stock.shares <= 0) return null;

  const avgBuyPrice = stock.totalCost / stock.shares;
  const taxPerItem = calculateGETax(itemId, latestHigh);
  const netSellPerItem = latestHigh - taxPerItem;
  const profit = (netSellPerItem - avgBuyPrice) * stock.shares;

  return Math.round(profit);
}