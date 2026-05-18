import { NON_GE_CATALOG } from '../data/nonGeCatalog';

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

export function getNonGEWikiImageUrl(item) {
  if (!item) return '';
  if (item.imageUrl) return item.imageUrl;
  if (!item.wikiUrl) return '';

  const pagePath = String(item.wikiUrl).split('#')[0].split('?')[0];
  const pageName = decodeURIComponent(pagePath.split('/').pop() || '').replace(/ /g, '_');
  if (!pageName) return '';

  return `https://oldschool.runescape.wiki/images/${pageName}.png`;
}
