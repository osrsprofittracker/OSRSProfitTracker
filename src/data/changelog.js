export const CURRENT_VERSION = "2.2.0";

export const changelog = [
  {
    version: "2.2.0",
    date: "2026-03-12",
    changes: [
      { type: "new", text: "Item Price Charts page — search any OSRS item and view interactive price history with high/low lines" },
      { type: "new", text: "Volume bars — buy and sell volume displayed beneath the price chart with synced time scales" },
      { type: "new", text: "Crosshair tooltips — hover over the chart to see exact prices, volumes, and OHLC data" },
      { type: "new", text: "Item info panel — live buy/sell prices, margin, potential profit, buy limit, high alch, and volume stats" },
      { type: "new", text: "Candlestick chart mode — toggle between line and candlestick views for price data" },
      { type: "new", text: "Graph favorites & recents — star items to pin them for quick access, with recent items tracked automatically" },
      { type: "new", text: "Collapsible favorites bar — click the header to collapse or expand your favorites, state persists per account" },
      { type: "new", text: "Drag-and-drop favorite reordering — drag favorites to rearrange them, order persists across sessions" },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-03-08",
    changes: [
      { type: "new", text: "GE High price button in buy and sell modals — one click to fill the current GE High price" },
      { type: "new", text: "K/M shorthand input for quantities — type 10k or 2.5m instead of the full number" },
      { type: "new", text: "Unrealised profit now shown in portfolio summary and per-category stats" },
      { type: "new", text: "Milestone history — milestones are recorded when reached and viewable in a dedicated history panel" },
      { type: "fix", text: "Double-clicking the confirm button in buy/sell modals no longer creates duplicate transactions" },
      { type: "fix", text: "Modal centering restored after a layout regression" },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-02-27",
    changes: [
      { type: "new", text: "Live GE prices — stocks linked to OSRS items now show real-time High and Low prices from the OSRS Wiki API, refreshing at the same price as the API" },
      { type: "new", text: "Unrealized Profit column — shows estimated profit if you sold all current stock at the latest GE High price, including 2% tax" },
      { type: "new", text: "OSRS item linking — stocks can now be linked to an OSRS Grand Exchange item via a searchable dropdown when adding or adjusting" },
      { type: "tip", text: "Linking existing stocks: click Adjust on any stock, switch to OSRS Item mode, search and select the item, then Save. Icons and GE prices will appear immediately." },
      { type: "new", text: "Auto-fill 4H Limit — linking an item automatically fills in the correct GE buy limit" },
      { type: "new", text: "Item icons — linked stocks show the OSRS item icon next to their name on the trade screen" },
      { type: "new", text: "Custom stocks — Add Stock now supports a Custom mode for items not on the GE" },
      { type: "new", text: "Stock Archive — stocks can now be archived to remove them from the trade screen without deleting them" },
      { type: "new", text: "Restore from Archive — archived stocks can be restored at any time, with smart detection when adding a stock that already exists in the archive" },
      { type: "improved", text: "GE High, GE Low and Unrealized Profit columns are toggleable in Settings like all other columns" },
      { type: "improved", text: "Tax calculation respects all GE tax rules including the 5M cap, sub-50gp floor, and all exempt items" },
      { type: "fix", text: "Category quick nav now scrolls when there are too many categories to fit on screen" },
      { type: "fix", text: "Column order mismatch when hiding certain columns is now fixed" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-02-26",
    changes: [
      { type: "new", text: "Added an Investment Page to separate normal trading and investment trading" },
      { type: "new", text: "Stocks can be swapped between normal trading and investment trading" },
      { type: "new", text: "Added a version changelog popup to show what's new on login" },
      { type: "fix", text: "Uncategorized category was not visible for new accounts" },
      { type: "fix", text: "Refreshing after an Undo is no longer necessary to see the stock change" },
    ],
  },
];