/**
 * Maps a database row to a JS object using a key map.
 *
 * keyMap entries:
 *   camelKey: 'snake_key'               — direct rename
 *   camelKey: ['snake_key', defaultVal] — rename with ?? fallback
 */
export function mapRow(row, keyMap) {
  const result = {};
  for (const [camelKey, spec] of Object.entries(keyMap)) {
    if (Array.isArray(spec)) {
      const [snakeKey, defaultVal] = spec;
      result[camelKey] = row[snakeKey] ?? defaultVal;
    } else {
      result[camelKey] = row[spec];
    }
  }
  return result;
}
