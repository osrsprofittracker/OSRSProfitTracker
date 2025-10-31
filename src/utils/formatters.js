export const formatNumber = (num, numberFormat = 'compact') => {
  if (num == null || isNaN(num)) return '-';

  if (numberFormat === 'full') {
    return num.toLocaleString();
  }

  // Compact format
  if (num < 100_000) {
    return num.toLocaleString();
  }

  if (num < 10_000_000) {
    return (num / 1_000).toFixed(0) + ' K';
  }

  return (num / 1_000_000).toFixed(1) + ' M';
};

export const formatTimer = (endTime) => {
  if (!endTime) return '--:--:--';
  const remaining = endTime - Date.now();
  if (remaining <= 0) return 'Ready';

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};