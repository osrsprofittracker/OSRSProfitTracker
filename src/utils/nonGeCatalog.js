import { NON_GE_CATALOG } from '../data/nonGeCatalog';
import { CURRENT_VERSION } from '../data/changelog';

const NON_GE_ICON_BASE_PATH = '/icons/non-ge';

function getVersionedIconUrl(path) {
  if (!path || path.startsWith('http')) return path || '';
  return `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(CURRENT_VERSION)}`;
}

export function getNonGECatalogItem(key) {
  if (!key) return null;
  return NON_GE_CATALOG.find(item => item.key === key) || null;
}

export function normalizeNonGESearch(value) {
  return String(value || '').trim().toLowerCase();
}

export function searchNonGECatalog(query, limit = 50) {
  const normalized = normalizeNonGESearch(query);
  const items = normalized
    ? NON_GE_CATALOG.filter(item => item.name.toLowerCase().includes(normalized))
    : NON_GE_CATALOG;
  return items.slice(0, limit);
}

export function nonGEItemDisplayName(stockOrItem) {
  return stockOrItem?.nameSnapshot || stockOrItem?.name || stockOrItem?.name_snapshot || 'Unknown item';
}

export function nonGEItemRangeLabel(item) {
  return item?.rangeLabel || 'Unknown';
}

export function getNonGEItemImageUrl(item) {
  if (!item) return '';
  if (item.key) return getVersionedIconUrl(`${NON_GE_ICON_BASE_PATH}/${item.key}.png`);
  if (item.imageUrl) return item.imageUrl;
  return '';
}

export const getNonGEWikiImageUrl = getNonGEItemImageUrl;
