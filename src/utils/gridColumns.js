import { toTitleCase } from './displayText';

export function columnsFromRows(rows = [], headerMap = {}) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: toTitleCase(headerMap[key] ?? key),
    align: typeof rows[0][key] === 'number' ? 'right' : 'left',
  }));
}
