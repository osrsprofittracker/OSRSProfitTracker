const WORD_BOUNDARY = /[^a-z0-9]+/;

function normalizeSearchValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getMatchRank(name, query) {
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;

  const words = name.split(WORD_BOUNDARY).filter(Boolean);
  if (words.some(word => word === query)) return 2;
  if (words.some(word => word.startsWith(query))) return 3;
  if (name.includes(query)) return 4;

  return null;
}

export function searchGEItems(items, query, limit = 50) {
  const q = normalizeSearchValue(query);
  if (!q) return [];

  return (items || [])
    .map((item, index) => {
      const name = normalizeSearchValue(item.name);
      const rank = getMatchRank(name, q);
      return rank === null ? null : { item, rank, index, name };
    })
    .filter(Boolean)
    .sort((a, b) => (
      a.rank - b.rank ||
      a.name.localeCompare(b.name) ||
      a.index - b.index
    ))
    .slice(0, limit)
    .map(result => result.item);
}
