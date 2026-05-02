import { describe, it, expect } from 'vitest';
import { aggregateBucketsLocally } from './useAnalytics';

const t = (overrides) => ({
  id: 1,
  user_id: 'u1',
  stockId: 1,
  type: 'sell',
  total: 0,
  date: '2026-04-15',
  ...overrides,
});

describe('aggregateBucketsLocally', () => {
  it('buckets sells into days, computes profit_items and gp_traded', () => {
    const transactions = [
      t({ id: 1, type: 'buy', total: 100, date: '2026-04-15' }),
      t({ id: 2, type: 'sell', total: 200, date: '2026-04-15', stockId: 1 }),
      t({ id: 3, type: 'sell', total: 150, date: '2026-04-16', stockId: 1 }),
    ];
    const stocks = [{ id: 1, category: 'Runes' }];
    const profitHistory = [
      { id: 10, profit_type: 'stock', amount: 80, stock_id: 1, transaction_id: 2, created_at: '2026-04-15T10:00:00Z' },
      { id: 11, profit_type: 'stock', amount: 50, stock_id: 1, transaction_id: 3, created_at: '2026-04-16T10:00:00Z' },
    ];

    const result = aggregateBucketsLocally({
      transactions,
      stocks,
      profitHistory,
      start: '2026-04-15',
      end: '2026-04-16',
      bucket: 'day',
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      bucket_date: '2026-04-15',
      profit_items: 80,
      gp_traded: 300,
      sells_count: 1,
      wins_count: 1,
      by_category: { Runes: 80 },
    });
    expect(result[1]).toMatchObject({
      bucket_date: '2026-04-16',
      profit_items: 50,
      gp_traded: 150,
      sells_count: 1,
      wins_count: 1,
    });
  });

  it('includes dump/referral/bonds from profit_history', () => {
    const result = aggregateBucketsLocally({
      transactions: [],
      stocks: [],
      profitHistory: [
        { profit_type: 'dump', amount: 1000, created_at: '2026-04-15T10:00:00Z' },
        { profit_type: 'referral', amount: 200, created_at: '2026-04-15T11:00:00Z' },
        { profit_type: 'bonds', amount: 500, created_at: '2026-04-16T09:00:00Z' },
      ],
      start: '2026-04-15',
      end: '2026-04-16',
      bucket: 'day',
    });

    expect(result.find((r) => r.bucket_date === '2026-04-15')).toMatchObject({
      profit_dump: 1000,
      profit_referral: 200,
      profit_bonds: 0,
    });
    expect(result.find((r) => r.bucket_date === '2026-04-16')).toMatchObject({
      profit_bonds: 500,
    });
  });

  it('counts losing sells in sells_count but not wins_count', () => {
    const result = aggregateBucketsLocally({
      transactions: [
        t({ id: 1, type: 'sell', total: 50, date: '2026-04-15' }),
        t({ id: 2, type: 'sell', total: 200, date: '2026-04-15' }),
      ],
      stocks: [{ id: 1, category: 'Runes' }],
      profitHistory: [
        { profit_type: 'stock', amount: -50, stock_id: 1, transaction_id: 1, created_at: '2026-04-15T10:00:00Z' },
        { profit_type: 'stock', amount: 80, stock_id: 1, transaction_id: 2, created_at: '2026-04-15T11:00:00Z' },
      ],
      start: '2026-04-15',
      end: '2026-04-15',
      bucket: 'day',
    });

    expect(result[0]).toMatchObject({ sells_count: 2, wins_count: 1 });
  });

  it('buckets weekly when bucket=week', () => {
    const result = aggregateBucketsLocally({
      transactions: [
        t({ id: 1, type: 'sell', total: 100, date: '2026-04-13' }),
        t({ id: 2, type: 'sell', total: 100, date: '2026-04-19' }),
        t({ id: 3, type: 'sell', total: 100, date: '2026-04-20' }),
      ],
      stocks: [{ id: 1, category: 'Runes' }],
      profitHistory: [
        { profit_type: 'stock', amount: 50, stock_id: 1, transaction_id: 1, created_at: '2026-04-13T10:00:00Z' },
        { profit_type: 'stock', amount: 50, stock_id: 1, transaction_id: 2, created_at: '2026-04-19T10:00:00Z' },
        { profit_type: 'stock', amount: 50, stock_id: 1, transaction_id: 3, created_at: '2026-04-20T10:00:00Z' },
      ],
      start: '2026-04-13',
      end: '2026-04-20',
      bucket: 'week',
    });

    expect(result).toHaveLength(2);
  });
});
