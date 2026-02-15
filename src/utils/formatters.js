export const formatNumber = (num, numberFormat = 'compact') => {
  if (num == null || isNaN(num)) return '-';

  // Round to nearest integer first
  const rounded = Math.round(num);

  if (numberFormat === 'full') {
    return rounded.toLocaleString();
  }

  // Compact format
  if (rounded < 100_000) {
    return rounded.toLocaleString();
  }

  if (rounded < 10_000_000) {
    return (rounded / 1_000).toFixed(0) + ' K';
  }

  return (rounded / 1_000_000).toFixed(1) + ' M';
};

export function formatAvgPrice(value, numberFormat) {
  if (value < 100000) {
    // Below 100K: show with 2 decimals
    return `$${value.toFixed(2)}`;
  } else {
    // Above 100K: use formatNumber
    return `$${formatNumber(value, numberFormat)}`;
  }
}

export const formatTimer = (endTime) => {
  if (!endTime) return '--:--:--';
  const remaining = endTime - Date.now();
  if (remaining <= 0) return 'Ready';

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};