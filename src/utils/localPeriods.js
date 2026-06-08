export const getLocalPeriodStart = (value, period) => {
  const date = new Date(value);

  switch (period) {
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    case 'week': {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      return start;
    }
    case 'month':
      return new Date(date.getFullYear(), date.getMonth(), 1);
    case 'year':
      return new Date(date.getFullYear(), 0, 1);
    default:
      return date;
  }
};

export const getLocalPeriodEnd = (periodStart, period) => {
  const date = new Date(periodStart);

  switch (period) {
    case 'day':
      date.setDate(date.getDate() + 1);
      return date;
    case 'week':
      date.setDate(date.getDate() + 7);
      return date;
    case 'month':
      date.setMonth(date.getMonth() + 1);
      return date;
    case 'year':
      date.setFullYear(date.getFullYear() + 1);
      return date;
    default:
      return date;
  }
};

export const getNextLocalMidnight = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
};

export const formatLocalDate = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateStartIso = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
};

export const getLocalDateEndIso = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
};

export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};
