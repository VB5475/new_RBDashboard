/** Column metadata + row keys for DataDrilldown grids (legacy CustomAgGrid modalTable). */

function normalizeKey(key) {
  return String(key ?? '').replace(/\s+/g, '').trim();
}

export function rowValueForRefColumn(row, refEntry) {
  if (!row || !refEntry) return '';
  const displayName = String(refEntry.DisplayName ?? '').trim();
  if (displayName && row[displayName] != null) return row[displayName];
  const compact = normalizeKey(displayName);
  const direct = Object.keys(row).find((k) => normalizeKey(k) === compact);
  if (direct) return row[direct];
  return '';
}

export function columnsFromDrilldown(mainTable = [], refTable = []) {
  if (!mainTable?.length) return [];
  const headerMap = {};
  const hiddenKeys = new Set();

  Object.keys(mainTable[0]).forEach((columnKey) => {
    const compact = normalizeKey(columnKey);
    const meta = refTable.find(
      (r) => normalizeKey(r.DisplayName) === compact,
    );
    if (meta) {
      headerMap[columnKey] = meta.DisplayName?.trim() || columnKey;
      if (String(meta.Visibility ?? '').trim().toUpperCase() === 'NO') {
        hiddenKeys.add(columnKey);
      }
    } else {
      headerMap[columnKey] = columnKey;
    }
  });

  return Object.keys(mainTable[0])
    .filter((key) => !hiddenKeys.has(key))
    .map((key) => ({
      key,
      label: headerMap[key] ?? key,
      align:
        typeof mainTable[0][key] === 'number' ? 'right' : 'left',
    }));
}

export function buildDrilldownFilterString(row, refTable = []) {
  const keyCols = refTable.filter(
    (entry) => String(entry.IsKeyCol ?? '').trim().toUpperCase() === 'YES',
  );
  if (!keyCols.length) return null;

  const parts = keyCols
    .map((entry) => {
      const value = rowValueForRefColumn(row, entry);
      if (value == null || value === '') return null;
      return `${entry.ColID}=${value}`;
    })
    .filter(Boolean);

  return parts.length ? parts.join('') : null;
}

export function hasDrilldownGridData(mainTable, refTable) {
  return (
    Array.isArray(mainTable) &&
    mainTable.length > 0 &&
    Array.isArray(refTable) &&
    refTable.length > 0
  );
}
