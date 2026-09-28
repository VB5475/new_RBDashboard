/**
 * Client-side row grouping + aggregation for the DataGrid Columns tool panel.
 * Deliberately small: ordered group keys, sum / count aggregations, and a flat
 * list of display rows (group headers + leaves) that the table can paginate.
 */

const PATH_SEPARATOR = '\u0001';
export const BLANK_GROUP_LABEL = '(Blanks)';

function groupLabel(value) {
  const text = value == null ? '' : String(value).trim();
  return text || BLANK_GROUP_LABEL;
}

/** Legacy custom sum aggregation used parseInt, so keep integer semantics. */
function sumValues(rows, key) {
  return rows.reduce((total, row) => {
    const n = parseInt(String(row?.[key] ?? '').replace(/,/g, ''), 10);
    return Number.isNaN(n) ? total : total + n;
  }, 0);
}

export function aggregate(rows = [], key, aggFunc = 'sum') {
  if (aggFunc === 'count') {
    return rows.filter((row) => {
      const raw = row?.[key];
      return raw != null && String(raw).trim() !== '';
    }).length;
  }
  return sumValues(rows, key);
}

function aggregateAll(rows, valueAggs) {
  const out = {};
  valueAggs.forEach(({ key, aggFunc }) => {
    out[key] = aggregate(rows, key, aggFunc);
  });
  return out;
}

/** Children are only built for expanded nodes, so depth costs nothing when collapsed. */
function buildLevel(rows, groupKeys, valueAggs, level, parentPath, expanded) {
  const key = groupKeys[level];
  const buckets = new Map();

  rows.forEach((row) => {
    const label = groupLabel(row?.[key]);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push(row);
  });

  return [...buckets.entries()]
    .sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map(([label, bucketRows]) => {
      const path = parentPath ? `${parentPath}${PATH_SEPARATOR}${label}` : label;
      const isOpen = expanded.has(path);
      return {
        path,
        key,
        label,
        level,
        isOpen,
        count: bucketRows.length,
        aggs: aggregateAll(bucketRows, valueAggs),
        rows: bucketRows,
        children:
          isOpen && level + 1 < groupKeys.length
            ? buildLevel(
                bucketRows,
                groupKeys,
                valueAggs,
                level + 1,
                path,
                expanded,
              )
            : null,
      };
    });
}

function flatten(nodes, out) {
  nodes.forEach((node) => {
    out.push({
      __group: {
        path: node.path,
        key: node.key,
        label: node.label,
        level: node.level,
        count: node.count,
        aggs: node.aggs,
        expanded: node.isOpen,
      },
    });
    if (!node.isOpen) return;
    if (node.children) flatten(node.children, out);
    else node.rows.forEach((row) => out.push(row));
  });
  return out;
}

export function isGroupRow(row) {
  return Boolean(row?.__group);
}

/**
 * @returns {{ displayRows: Array, leafCount: number, grouped: boolean }}
 * `displayRows` mixes group-header rows (`{ __group }`) with original leaf rows.
 * Collapsed groups contribute only their header, so the caller can paginate the
 * flattened list directly.
 */
export function groupRows(
  rows = [],
  groupKeys = [],
  valueAggs = [],
  expanded = new Set(),
) {
  const keys = groupKeys.filter(Boolean);
  if (!keys.length) {
    return { displayRows: rows, leafCount: rows.length, grouped: false };
  }

  const tree = buildLevel(rows, keys, valueAggs, 0, '', expanded);
  return {
    displayRows: flatten(tree, []),
    leafCount: rows.length,
    grouped: true,
  };
}
