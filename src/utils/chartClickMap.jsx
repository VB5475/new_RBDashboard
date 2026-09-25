import { columnsFromRows } from './gridColumns';

/** Legacy CustomAgGrid modalTableWithoutDrillDown map column menus */
const MAP_ENABLED_MENU_CODES = new Set(['DSH_HOME', 'DSH_DP_STROBES_RDNBR']);

function rowWorkId(row) {
  return row?.WorkID ?? row?.workID ?? row?.WorkId ?? null;
}

function rowMapSource(row) {
  const raw = row?.Source ?? row?.source ?? 'Strobes';
  return String(raw).trim() || 'Strobes';
}

export function chartClickSupportsMap(menuCode, rows = []) {
  if (!MAP_ENABLED_MENU_CODES.has(String(menuCode ?? '').trim())) {
    return false;
  }
  return rows.some((row) => {
    const id = rowWorkId(row);
    return id != null && String(id).trim() !== '';
  });
}

export function mapTargetFromRow(row) {
  const workID = rowWorkId(row);
  if (workID == null || String(workID).trim() === '') return null;
  return {
    workID: String(workID).trim(),
    source: rowMapSource(row),
  };
}

export function columnsForChartClick(rows, menuCode, onMapClick) {
  const base = columnsFromRows(rows);
  if (!chartClickSupportsMap(menuCode, rows)) {
    return base;
  }

  return [
    {
      key: '__viewMap',
      label: 'View Map',
      align: 'center',
      render: (row) => {
        const target = mapTargetFromRow(row);
        if (!target) return null;
        return (
          <button
            type="button"
            className="rnb-map-cell-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMapClick(target);
            }}
            aria-label="View map"
            title="View map"
          >
            Map
          </button>
        );
      },
    },
    ...base,
  ];
}
