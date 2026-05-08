-- Issue #275: composite indexes for hot-path Supabase queries.
--
-- Apply manually in the Supabase SQL Editor.
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block; if the
-- editor reports that error, run each statement below one at a time.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profit_history_user_created
  ON profit_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stocks_user_position
  ON stocks(user_id, position ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stocks_user_archived_name
  ON stocks(user_id, archived, name ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_user_position
  ON categories(user_id, position ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_notes_user_stock
  ON stock_notes(user_id, stock_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_milestones_user
  ON milestones(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_milestone_history_user_period_start
  ON milestone_history(user_id, period_start DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_price_alerts_user_created_active
  ON price_alerts(user_id, created_at DESC)
  WHERE dismissed = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlist_items_user_created
  ON watchlist_items(user_id, created_at DESC);

-- Verification examples after applying the indexes.
-- Replace '<user-id>' with a real auth.users.id value from the target project.
--
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM transactions
-- WHERE user_id = '<user-id>'
-- ORDER BY date DESC
-- LIMIT 25;
--
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM profit_history
-- WHERE user_id = '<user-id>'
-- ORDER BY created_at DESC
-- LIMIT 25;
--
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM categories
-- WHERE user_id = '<user-id>'
-- ORDER BY position ASC;
--
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM price_alerts
-- WHERE user_id = '<user-id>'
--   AND dismissed = false
-- ORDER BY created_at DESC;
--
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM watchlist_items
-- WHERE user_id = '<user-id>'
-- ORDER BY created_at DESC;
