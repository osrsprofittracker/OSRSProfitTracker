export const parseMK = (value) => {
  const str = String(value).trim().toLowerCase();
  if (str.endsWith('m')) {
    const num = parseFloat(str) * 1_000_000;
    return isNaN(num) ? value : String(Math.round(num));
  }
  if (str.endsWith('k')) {
    const num = parseFloat(str) * 1_000;
    return isNaN(num) ? value : String(Math.round(num));
  }
  return value;
};

export const handleMKInput = (value, setter) => {
  const lower = value.toLowerCase();
  if (lower.endsWith('k') || lower.endsWith('m')) {
    const parsed = parseMK(value);
    if (parsed !== value) {
      setter(parsed);
      return parsed;
    }
  }
  setter(value);
  return value;
};

export const formatNumber = (num, numberFormat = 'compact') => {
  if (num == null || isNaN(num)) return '-';

  // Round to nearest integer first
  const rounded = Math.round(num);
  const sign = rounded < 0 ? '-' : '';
  const absolute = Math.abs(rounded);

  if (numberFormat === 'full') {
    return rounded.toLocaleString();
  }

  // Compact format
   if (absolute < 100_000) {
    return rounded.toLocaleString();
  }

  if (absolute < 10_000_000) {
    return sign + (absolute / 1_000).toFixed(0) + ' K';
  }

  if (absolute < 1_000_000_000) {
    return sign + (absolute / 1_000_000).toFixed(2) + ' M';
  }

  return sign + (absolute / 1_000_000_000).toFixed(2) + ' B';
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

export function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
