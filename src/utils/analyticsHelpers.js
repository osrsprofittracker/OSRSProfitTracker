const MS_PER_DAY = 86400000;

export const toIsoDate = (date) => date.toISOString().slice(0, 10);

export const parseIsoDateUtc = (iso) => {
  if (!iso) return new Date();
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const addDays = (iso, days) => {
  const date = parseIsoDateUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

export const subtractDays = (iso, days) => addDays(iso, -days);

export const subtractYears = (iso, years) => {
  const date = parseIsoDateUtc(iso);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return toIsoDate(date);
};

export const daysBetween = (startIso, endIso) => {
  const ms = parseIsoDateUtc(endIso) - parseIsoDateUtc(startIso);
  return Math.max(1, Math.round(ms / MS_PER_DAY));
};

export const periodSpanDays = (startIso, endIso) => {
  if (!startIso || !endIso) return 0;
  return daysBetween(startIso, endIso) + 1;
};

export const totalProfit = (bucket) => (
  Number(bucket.profit_items || 0)
  + Number(bucket.profit_dump || 0)
  + Number(bucket.profit_referral || 0)
  + Number(bucket.profit_bonds || 0)
);

export const sumProfit = (buckets = []) => (
  buckets.reduce((sum, bucket) => sum + totalProfit(bucket), 0)
);
