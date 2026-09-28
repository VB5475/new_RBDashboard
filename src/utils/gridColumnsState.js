/** Column order / visibility state for the DataGrid Columns tool panel. */

/**
 * Build order + hidden state for a new `columns` array, keeping any visibility
 * and ordering the user already chose for keys that still exist.
 */
export function mergeColumnsState(columns = [], prev = null) {
  const keys = columns.map((col) => col.key);
  const keySet = new Set(keys);

  const kept = (prev?.order ?? []).filter((key) => keySet.has(key));
  const added = keys.filter((key) => !kept.includes(key));
  const order = [...kept, ...added];

  const hidden = {};
  Object.keys(prev?.hidden ?? {}).forEach((key) => {
    if (keySet.has(key)) hidden[key] = true;
  });

  // Parents that rebuild `columns` on every render would otherwise churn the
  // memos that depend on this state.
  if (
    prev &&
    prev.order.length === order.length &&
    prev.order.every((key, i) => key === order[i]) &&
    Object.keys(prev.hidden).length === Object.keys(hidden).length
  ) {
    return prev;
  }

  return { order, hidden };
}

/** Columns in tool-panel order (hidden ones included). */
export function orderedColumns(columns = [], order = []) {
  const byKey = new Map(columns.map((col) => [col.key, col]));
  const ordered = order.map((key) => byKey.get(key)).filter(Boolean);
  if (ordered.length === columns.length) return ordered;
  const seen = new Set(order);
  return [...ordered, ...columns.filter((col) => !seen.has(col.key))];
}

/** Columns actually rendered in the table. */
export function visibleColumns(columns = [], order = [], hidden = {}) {
  return orderedColumns(columns, order).filter((col) => !hidden[col.key]);
}

export function isColumnVisible(hidden = {}, key) {
  return !hidden[key];
}

export function setColumnsVisible(hidden = {}, keys = [], visible = true) {
  const next = { ...hidden };
  keys.forEach((key) => {
    if (visible) delete next[key];
    else next[key] = true;
  });
  return next;
}

/** Tri-state for the panel's Select All box. */
export function selectAllState(keys = [], hidden = {}) {
  if (!keys.length) return 'none';
  const shown = keys.filter((key) => !hidden[key]).length;
  if (shown === 0) return 'none';
  if (shown === keys.length) return 'all';
  return 'some';
}

/**
 * Move `key` so it lands at `targetKey`'s slot. `after` drops it below the
 * target instead of above (used when dragging onto the last row).
 */
export function moveColumnKey(order = [], key, targetKey, after = false) {
  if (key === targetKey) return order;
  const without = order.filter((k) => k !== key);
  const at = without.indexOf(targetKey);
  if (at < 0) return order;
  without.splice(after ? at + 1 : at, 0, key);
  return without;
}

/** Reorder an arbitrary key list (row-group / value pills) the same way. */
export function moveKeyInList(list = [], key, targetKey, after = false) {
  return moveColumnKey(list, key, targetKey, after);
}

/** Columns whose sampled values parse as numbers — used by pivot-mode routing. */
export function detectNumericColumns(rows = [], columns = [], sampleSize = 50) {
  const sample = rows.slice(0, sampleSize);
  const numeric = new Set();

  columns.forEach((col) => {
    if (col.align === 'right') {
      numeric.add(col.key);
      return;
    }
    let seen = 0;
    let numbers = 0;
    sample.forEach((row) => {
      const raw = row?.[col.key];
      if (raw == null || String(raw).trim() === '') return;
      seen += 1;
      if (!Number.isNaN(Number(String(raw).replace(/,/g, '')))) numbers += 1;
    });
    if (seen > 0 && numbers === seen) numeric.add(col.key);
  });

  return numeric;
}
