import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsTimeframe } from './useAnalyticsTimeframe';

describe('useAnalyticsTimeframe', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to 1M when no localStorage entry exists', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));

    expect(result.current.window).toBe('1M');
  });

  it('derives bucket=day for 1W/1M/3M', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));

    act(() => result.current.setWindow('1W'));
    expect(result.current.bucket).toBe('day');
    act(() => result.current.setWindow('1M'));
    expect(result.current.bucket).toBe('day');
    act(() => result.current.setWindow('3M'));
    expect(result.current.bucket).toBe('day');
  });

  it('derives bucket=week for 6M/1Y', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));

    act(() => result.current.setWindow('6M'));
    expect(result.current.bucket).toBe('week');
    act(() => result.current.setWindow('1Y'));
    expect(result.current.bucket).toBe('week');
  });

  it('derives bucket=month for All', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));

    act(() => result.current.setWindow('All'));
    expect(result.current.bucket).toBe('month');
  });

  it('persists window selection per user', () => {
    const { result, unmount } = renderHook(() => useAnalyticsTimeframe('user-1'));
    act(() => result.current.setWindow('3M'));
    unmount();

    const { result: result2 } = renderHook(() => useAnalyticsTimeframe('user-1'));

    expect(result2.current.window).toBe('3M');
  });

  it('returns ISO date strings for start/end', () => {
    const { result } = renderHook(() => useAnalyticsTimeframe('user-1'));

    expect(result.current.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
