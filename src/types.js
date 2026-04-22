/**
 * JSDoc type definitions for OSRS Profit Tracker domain objects.
 *
 * These mirror the camelCase shapes returned by hooks after Supabase row mapping.
 * Import with: @import('./types.js') or reference via triple-slash directive.
 *
 * @module types
 */

// ──────────────────────────────────────────────
// Stock (useStocks)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} Stock
 * @property {number} id
 * @property {string} name - Item display name
 * @property {number} totalCost - Total GP spent buying shares currently held
 * @property {number} shares - Quantity currently held
 * @property {number} sharesSold - Lifetime quantity sold
 * @property {number} totalCostSold - Lifetime GP received from sales
 * @property {number} totalCostBasisSold - Cost basis of all sold shares (for profit calc)
 * @property {number} limit4h - GE 4-hour buy limit
 * @property {number} needed - Desired quantity to hold
 * @property {string|null} timerEndTime - ISO timestamp when GE buy limit resets
 * @property {string} category - Category name this stock belongs to
 * @property {number} position - Sort order within its category
 * @property {boolean} onHold - Whether the stock is paused from trading
 * @property {boolean} isInvestment - Whether this is an investment-mode stock
 * @property {number|null} itemId - GE item ID (links to prices API), null if unlinked
 * @property {string|null} investmentStartDate - ISO date when investment tracking began
 */

// ──────────────────────────────────────────────
// Transaction (useTransactions)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} Transaction
 * @property {number} id
 * @property {number} stockId - FK to stocks.id
 * @property {string} stockName - Denormalized item name
 * @property {'buy'|'sell'|'remove'} type
 * @property {number} shares - Quantity transacted
 * @property {number} price - Per-unit price in GP
 * @property {number} total - shares * price
 * @property {string} date - ISO timestamp
 * @property {string} category - Category name (from transactions_view, or fallback)
 * @property {number|null} profitHistoryId - FK to profit_history.id (sells only)
 * @property {number|null} profit - Realized profit (from transactions_view, sells only)
 * @property {number|null} margin - Per-unit margin (from transactions_view, sells only)
 */

// ──────────────────────────────────────────────
// Category (useCategories)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name
 * @property {boolean} isInvestment - Whether this category belongs to investment mode
 * @property {number} position - Sort order within its mode
 * @property {string} created_at - ISO timestamp
 */

// ──────────────────────────────────────────────
// Profits (useProfits)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} Profits
 * @property {number} dumpProfit - Extra profit from item dumps
 * @property {number} referralProfit - Extra profit from referrals
 * @property {number} bondsProfit - Extra profit from bonds
 */

// ──────────────────────────────────────────────
// ProfitHistory (useProfitHistory)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} ProfitHistoryEntry
 * @property {number} id
 * @property {string} profit_type - e.g. 'sell', 'dump', 'referral', 'bonds'
 * @property {number} amount - GP amount (rounded integer)
 * @property {number|null} stock_id - FK to stocks.id (null for non-trade profits)
 * @property {number|null} transaction_id - FK to transactions.id (null for non-trade profits)
 * @property {string} created_at - ISO timestamp
 */

// ──────────────────────────────────────────────
// StockNote (useStockNotes)
// ──────────────────────────────────────────────

/**
 * Notes are stored as a plain object keyed by stock ID.
 * @typedef {Object<number, string>} StockNotesMap
 */

// ──────────────────────────────────────────────
// Milestone (useMilestones)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} MilestoneGoal
 * @property {number} goal - Target GP amount
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} Milestones
 * @property {MilestoneGoal} day
 * @property {MilestoneGoal} week
 * @property {MilestoneGoal} month
 * @property {MilestoneGoal} year
 */

/**
 * @typedef {Object} MilestoneHistoryEntry
 * @property {number} id
 * @property {'day'|'week'|'month'|'year'} period
 * @property {string} period_start - YYYY-MM-DD
 * @property {number} goal_amount
 * @property {number} actual_amount
 * @property {string} achieved_at - ISO timestamp
 */

// ──────────────────────────────────────────────
// Settings (useSettings)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} VisibleColumns
 * @property {boolean} status
 * @property {boolean} avgBuy
 * @property {boolean} avgSell
 * @property {boolean} profit
 * @property {boolean} desiredStock
 * @property {boolean} notes
 * @property {boolean} limit4h
 * @property {boolean} investmentStartDate
 * @property {boolean} membershipIcon
 * @property {boolean} [geHigh]
 * @property {boolean} [geLow]
 * @property {boolean} [unrealizedProfit]
 */

/**
 * @typedef {Object} VisibleProfits
 * @property {boolean} dumpProfit
 * @property {boolean} referralProfit
 * @property {boolean} bondsProfit
 */

/**
 * @typedef {Object} Settings
 * @property {'compact'|'full'} numberFormat
 * @property {VisibleColumns} visibleColumns
 * @property {VisibleProfits} visibleProfits
 * @property {string|null} altAccountTimer - ISO timestamp or null
 * @property {boolean} showCategoryStats
 * @property {boolean} showUnrealisedProfitStats
 * @property {boolean} showCategoryUnrealisedProfit
 * @property {number} notificationVolume - 0-100
 */

// ──────────────────────────────────────────────
// GE Prices (useGEPrices)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} GEPrice
 * @property {number} high - Instant-buy price
 * @property {number} low - Instant-sell price
 * @property {number} highTime - Unix timestamp of last high trade
 * @property {number} lowTime - Unix timestamp of last low trade
 */

/**
 * Keyed by item ID string.
 * @typedef {Object<string, GEPrice>} GEPricesMap
 */

/**
 * @typedef {Object} GEMappingItem
 * @property {number} id - Item ID
 * @property {string} name - Item name
 * @property {number} limit - GE buy limit
 * @property {string} [icon] - Wiki icon filename
 * @property {boolean} [members] - Members-only item
 */

// ──────────────────────────────────────────────
// Price Alert (usePriceAlerts)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} PriceAlert
 * @property {number} id
 * @property {number} itemId - GE item ID
 * @property {string} itemName
 * @property {number|null} highThreshold - Alert when price >= this
 * @property {number|null} lowThreshold - Alert when price <= this
 * @property {boolean} isActive
 * @property {string} createdAt - ISO timestamp
 * @property {string} lastCheckedAt - ISO timestamp
 * @property {string|null} triggeredAt - ISO timestamp when alert fired
 * @property {'high'|'low'|null} triggeredType
 * @property {number|null} triggeredPrice - Price that triggered the alert
 */

/**
 * @typedef {Object} WatchlistItem
 * @property {number} id
 * @property {number} itemId - GE item ID
 * @property {string} itemName
 * @property {number|null} targetBuyPrice - Alert when live low <= this
 * @property {number|null} targetSellPrice - Alert when live high >= this
 * @property {string} notes
 * @property {string|null} createdAt - ISO timestamp
 * @property {string|null} updatedAt - ISO timestamp
 */

// ──────────────────────────────────────────────
// Notification (useNotifications)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} Notification
 * @property {number} id
 * @property {string} type - e.g. 'limitTimer', 'altAccountTimer', 'milestone', 'osrsNews', 'jmodReddit', 'priceAlertHigh', 'priceAlertLow', 'watchlistAlertHigh', 'watchlistAlertLow'
 * @property {string} message
 * @property {number} timestamp - Date.now() value
 * @property {boolean} read
 * @property {*} [navigationTarget] - Optional context for click navigation
 */

// ──────────────────────────────────────────────
// Notification Settings (useNotificationSettings)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} NotificationTypePreference
 * @property {boolean} enabled
 * @property {boolean} browserPush
 * @property {boolean} sound
 * @property {string} soundChoice - Preset ID: 'chime', 'ping', 'triple', 'soft', 'alert'
 * @property {string|null} customSoundUri - Data URI for custom sound
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {NotificationTypePreference} limitTimer
 * @property {NotificationTypePreference} altAccountTimer
 * @property {NotificationTypePreference} milestones
 * @property {NotificationTypePreference} osrsNews
 * @property {NotificationTypePreference} jmodReddit
 * @property {NotificationTypePreference} priceAlert
 * @property {NotificationTypePreference} watchlistAlert
 */

// ──────────────────────────────────────────────
// GP Traded Stats (useGPTradedStats)
// ──────────────────────────────────────────────

/**
 * @typedef {Object} GPTradedStats
 * @property {number} daily
 * @property {number} weekly
 * @property {number} monthly
 * @property {number} yearly
 * @property {number} total
 */

export {};
