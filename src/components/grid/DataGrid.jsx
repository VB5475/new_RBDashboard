import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import SetColumnFilter from './filters/SetColumnFilter';
import GridSideBar from './sidebar/GridSideBar';
import {
  applyColumnFilters,
  countActiveColumnFilters,
  getDistinctColumnValues,
  isSetFilterActive,
} from '../../utils/gridFilters';
import {
  detectNumericColumns,
  mergeColumnsState,
  orderedColumns,
  visibleColumns,
} from '../../utils/gridColumnsState';
import { groupRows, isGroupRow } from '../../utils/gridGrouping';
import './DataGrid.css';

function cellText(value) {
  if (value == null) return '';
  return String(value).trim();
}

/** Summary row from chart grids — always last, never reordered by sort. */
function isPinnedTotalRow(row) {
  const candidates = [row?.label, row?.Label, row?.LABEL];
  return candidates.some(
    (v) => String(v ?? '').trim().toLowerCase() === 'total',
  );
}

function formatCellValue(value) {
  if (value == null || value === '') return '';
  return value;
}

function formatAggValue(value) {
  if (value == null) return '';
  return typeof value === 'number' ? value.toLocaleString() : value;
}

/**
 * Shared data table for RNB (replaces AG Grid).
 * Client mode: sorts/filters/paginates `rows` locally.
 * Server mode: pass `serverPagination` — parent supplies current page rows + total.
 *
 * Imperative API (`ref`): `{ resetAll() }` clears filters, column state, groups, values.
 */
const DataGrid = forwardRef(function DataGrid(
  {
  columns = [],
  rows = [],
  searchKeys,
  title,
  subtitle,
  emptyMessage = 'No rows to display',
  pageSize = 50,
  serverPagination = null,
  enableColumnFilters = true,
  /**
   * Columns / Filters side bar. Defaults on for full-chrome grids and off for
   * embedded / modal chrome; pass explicitly to override.
   */
  enableSideBar = null,
  plain = false,
  /** Chart card inline table: no search toolbar, compact chrome */
  embedded = false,
  /** Match chart / expand-modal grid (header, stripes, total row) */
  appearance = embedded ? 'dashboard' : 'default',
  /** Modal-style grid: no toolbar, fills container */
  chrome = embedded ? 'embedded' : 'default',
  onRowClick = null,
  rowClickHint = '',
},
  ref,
) {
  const [sortField, setSortField] = useState(columns[0]?.key ?? '');
  const [sortDir, setSortDir] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [clientPage, setClientPage] = useState(1);
  const [columnsState, setColumnsState] = useState(() =>
    mergeColumnsState(columns),
  );
  const [panel, setPanel] = useState('');
  const [pivotMode, setPivotMode] = useState(false);
  const [rowGroupKeys, setRowGroupKeys] = useState([]);
  const [valueAggs, setValueAggs] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const scrollRef = useRef(null);
  const headRowRef = useRef(null);

  useEffect(() => {
    setSortField(columns[0]?.key ?? '');
    setColumnFilters({});
    setColumnsState((prev) => mergeColumnsState(columns, prev));

    const keySet = new Set(columns.map((col) => col.key));
    setRowGroupKeys((prev) => {
      const next = prev.filter((key) => keySet.has(key));
      return next.length === prev.length ? prev : next;
    });
    setValueAggs((prev) => {
      const next = prev.filter((agg) => keySet.has(agg.key));
      return next.length === prev.length ? prev : next;
    });
    setExpandedGroups(new Set());
  }, [columns]);

  useEffect(() => {
    setClientPage(1);
  }, [rows, searchTerm, columnFilters, rowGroupKeys, serverPagination?.page]);

  const keysForSearch = searchKeys?.length ? searchKeys : columns.map((c) => c.key);
  const isServer = Boolean(serverPagination);
  const showColumnFilters = enableColumnFilters && !isServer;

  const isModalChrome = chrome === 'modal' || embedded;
  const sideBarEnabled =
    enableSideBar == null ? !isModalChrome : Boolean(enableSideBar);
  /** Filters panel and grouping both rely on the client-side row pipeline. */
  const sideBarFilters = sideBarEnabled && enableColumnFilters && !isServer;
  const groupingEnabled = sideBarEnabled && !isServer;

  const needDistinctValues =
    showColumnFilters || (sideBarFilters && panel === 'filters');

  const distinctByColumn = useMemo(() => {
    if (!needDistinctValues) return {};
    const map = {};
    columns.forEach((col) => {
      if (col.filter === false) return;
      const { values, hasBlanks } = getDistinctColumnValues(rows, col.key);
      if (!values.length && !hasBlanks) return;
      map[col.key] = { values, hasBlanks };
    });
    return map;
  }, [rows, columns, needDistinctValues]);

  const numericKeys = useMemo(
    () => (groupingEnabled ? detectNumericColumns(rows, columns) : new Set()),
    [rows, columns, groupingEnabled],
  );

  const panelColumns = useMemo(
    () => orderedColumns(columns, columnsState.order),
    [columns, columnsState.order],
  );
  const displayColumns = useMemo(
    () => visibleColumns(columns, columnsState.order, columnsState.hidden),
    [columns, columnsState.order, columnsState.hidden],
  );

  /**
   * Sticky filter row must sit exactly under the header. A hardcoded top (e.g.
   * 40px) is taller/shorter than the real header and overlaps the first data row.
   */
  useLayoutEffect(() => {
    const head = headRowRef.current;
    const scroll = scrollRef.current;
    if (!head || !scroll) return undefined;

    const syncHeadHeight = () => {
      const height = Math.ceil(head.getBoundingClientRect().height);
      scroll.style.setProperty('--data-grid-head-height', `${height}px`);
    };

    syncHeadHeight();
    const observer = new ResizeObserver(syncHeadHeight);
    observer.observe(head);
    return () => observer.disconnect();
  }, [
    columnsState,
    showColumnFilters,
    appearance,
    chrome,
    displayColumns.length,
  ]);

  const activeColumnFilterCount = useMemo(
    () => countActiveColumnFilters(columnFilters),
    [columnFilters],
  );

  const activeFilterColumns = useMemo(
    () =>
      columns
        .filter((col) => isSetFilterActive(columnFilters[col.key]))
        .map((col) => ({
          key: col.key,
          label: col.label ?? col.key,
          count: columnFilters[col.key].values.length,
        })),
    [columns, columnFilters],
  );

  const filtered = useMemo(() => {
    if (isServer) return rows;
    const result = applyColumnFilters(rows, columnFilters);

    if (!searchTerm.trim()) return result;
    const q = searchTerm.toLowerCase();
    return result.filter((row) =>
      keysForSearch.some((key) =>
        cellText(row[key]).toLowerCase().includes(q),
      ),
    );
  }, [rows, columnFilters, searchTerm, keysForSearch, isServer]);

  const sorted = useMemo(() => {
    const pinned = filtered.filter(isPinnedTotalRow);
    const sortable = filtered.filter((r) => !isPinnedTotalRow(r));

    if (isServer || !sortField) {
      return [...sortable, ...pinned];
    }

    const sortedData = [...sortable].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        aVal = aNum;
        bVal = bNum;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return [...sortedData, ...pinned];
  }, [filtered, sortField, sortDir, isServer]);

  /** Grouping sits between sort and pagination: paginate the flattened list. */
  const { displayRows, grouped } = useMemo(() => {
    if (!groupingEnabled || !rowGroupKeys.length) {
      return { displayRows: sorted, grouped: false };
    }
    const result = groupRows(sorted, rowGroupKeys, valueAggs, expandedGroups);
    return { displayRows: result.displayRows, grouped: result.grouped };
  }, [sorted, rowGroupKeys, valueAggs, expandedGroups, groupingEnabled]);

  const totalRows = isServer ? serverPagination.total : displayRows.length;

  const page = isServer ? serverPagination.page : clientPage;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const pageRows = useMemo(() => {
    if (isServer) return rows;
    const start = (clientPage - 1) * pageSize;
    return displayRows.slice(start, start + pageSize);
  }, [isServer, rows, displayRows, clientPage, pageSize]);

  const handleSort = (field) => {
    if (isServer) return;
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const goPage = (next) => {
    if (isServer) {
      serverPagination.onPageChange(next);
    } else {
      setClientPage(next);
    }
  };

  function clearColumnFilters() {
    setColumnFilters({});
  }

  function resetColumnsState() {
    setColumnsState(mergeColumnsState(columns));
  }

  function resetGridState() {
    clearColumnFilters();
    resetColumnsState();
    setPivotMode(false);
    setRowGroupKeys([]);
    setValueAggs([]);
    setExpandedGroups(new Set());
    setSearchTerm('');
    setClientPage(1);
  }

  useImperativeHandle(ref, () => ({ resetAll: resetGridState }), [columns]);

  function setColumnFilter(key, model) {
    setColumnFilters((prev) => {
      if (model == null) {
        if (prev[key] == null) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: model };
    });
  }

  function changeRowGroups(keys) {
    setRowGroupKeys(keys);
    setExpandedGroups(new Set());
  }

  function toggleGroup(path) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const labelByKey = useMemo(() => {
    const map = new Map();
    columns.forEach((col) => map.set(col.key, col.label ?? col.key));
    return map;
  }, [columns]);

  const SortIcon = ({ field }) => (
    <span
      className={`data-grid-sort-icon${
        sortField === field ? ' is-active' : ''
      }`}
      aria-hidden
    >
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const displayFrom = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const displayTo = isServer
    ? Math.min(page * pageSize, totalRows)
    : Math.min(page * pageSize, displayRows.length);

  const isDashboard = appearance === 'dashboard';

  const wrapperClass = [
    'data-grid-wrapper',
    plain ? 'data-grid-wrapper--plain' : 'glass-card fade-in-up',
    embedded ? 'data-grid-wrapper--embedded' : '',
    isDashboard ? 'data-grid-wrapper--dashboard' : '',
    isModalChrome ? 'data-grid-wrapper--modal-chrome' : '',
    sideBarEnabled ? 'data-grid-wrapper--with-sidebar' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showToolbar =
    !isModalChrome &&
    (title || subtitle || rowClickHint || !isServer);
  // Always show the range/pager so small result sets still display totals
  // (e.g. "1–20 of 20"). Previously modal chrome hid the footer when
  // totalPages === 1, which hid counts whenever rows <= pageSize.
  const showFooter = true;
  const colCount = displayColumns.length || 1;

  return (
    <div className={wrapperClass}>
      {showToolbar && (
        <div className="data-grid-toolbar">
          <div className="data-grid-toolbar-text">
            {title ? <h3 className="data-grid-title">{title}</h3> : null}
            {subtitle ? (
              <span className="data-grid-subtitle">{subtitle}</span>
            ) : null}
            {rowClickHint ? (
              <span className="data-grid-subtitle data-grid-row-hint">
                {rowClickHint}
              </span>
            ) : null}
          </div>
          {!isServer && (
            <div className="data-grid-toolbar-actions">
              <label className="data-grid-search">
                <Search size={16} className="data-grid-search-icon" aria-hidden />
                <input
                  type="text"
                  placeholder="Search all columns…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="data-grid-search-input"
                />
              </label>
              {activeColumnFilterCount > 0 ? (
                <button
                  type="button"
                  className="data-grid-clear-filters"
                  onClick={clearColumnFilters}
                >
                  <X size={14} aria-hidden />
                  Clear filters ({activeColumnFilterCount})
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div className="data-grid-body">
        <div className="data-grid-main">
          {!showToolbar && showColumnFilters ? (
            <div
              className={`data-grid-filter-bar${
                activeColumnFilterCount > 0 ? ' is-open' : ''
              }`}
              aria-hidden={activeColumnFilterCount === 0}
            >
              <div className="data-grid-filter-bar-inner">
                <div className="data-grid-filter-bar-meta">
                  <span className="data-grid-filter-bar-text">
                    {activeColumnFilterCount} column filter
                    {activeColumnFilterCount !== 1 ? 's' : ''} active
                  </span>
                  {activeFilterColumns.length > 0 ? (
                    <div className="data-grid-filter-bar-chips" aria-label="Active filter columns">
                      {activeFilterColumns.map(({ key, label, count }) => (
                        <button
                          key={key}
                          type="button"
                          className="data-grid-filter-chip"
                          title={`Clear ${label} filter (${count} selected)`}
                          onClick={() => setColumnFilter(key, null)}
                          tabIndex={activeColumnFilterCount > 0 ? 0 : -1}
                        >
                          <span className="data-grid-filter-chip-label">{label}</span>
                          <span className="data-grid-filter-chip-count">{count}</span>
                          <X size={10} aria-hidden />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="data-grid-clear-filters data-grid-clear-filters--compact"
                  onClick={clearColumnFilters}
                  tabIndex={activeColumnFilterCount > 0 ? 0 : -1}
                >
                  <X size={12} aria-hidden />
                  Clear filters
                </button>
              </div>
            </div>
          ) : null}

          <div className="data-grid-scroll" ref={scrollRef}>
            <table className="data-grid-table">
              <thead>
                <tr className="data-grid-head-row" ref={headRowRef}>
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      className={col.align === 'right' ? 'align-right' : ''}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="data-grid-th-inner">
                        <span className="data-grid-th-label">{col.label}</span>
                        {!isServer ? <SortIcon field={col.key} /> : null}
                      </span>
                    </th>
                  ))}
                </tr>
                {showColumnFilters ? (
                  <tr className="data-grid-filter-row">
                    {displayColumns.map((col) => {
                      const meta = distinctByColumn[col.key];

                      return (
                        <th
                          key={`filter-${col.key}`}
                          className="data-grid-filter-cell"
                        >
                          {meta ? (
                            <SetColumnFilter
                              label={col.label}
                              values={meta.values}
                              hasBlanks={meta.hasBlanks}
                              model={columnFilters[col.key] ?? null}
                              onApply={(model) => setColumnFilter(col.key, model)}
                              onReset={() => setColumnFilter(col.key, null)}
                            />
                          ) : (
                            <span className="data-grid-filter-na">—</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ) : null}
              </thead>
              <tbody>
                {serverPagination?.loading ? (
                  <tr>
                    <td colSpan={colCount} className="data-grid-empty">
                      Loading…
                    </td>
                  </tr>
                ) : displayColumns.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="data-grid-empty">
                      All columns are hidden — pick columns in the side bar.
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="data-grid-empty">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, idx) => {
                    if (isGroupRow(row)) {
                      const group = row.__group;
                      return (
                        <tr
                          key={`group-${group.path}`}
                          className="data-grid-group-row"
                        >
                          {displayColumns.map((col, colIdx) => {
                            if (colIdx === 0) {
                              return (
                                <td
                                  key={col.key}
                                  className="data-grid-group-cell"
                                  style={{ paddingLeft: 10 + group.level * 16 }}
                                >
                                  <button
                                    type="button"
                                    className="data-grid-group-toggle"
                                    onClick={() => toggleGroup(group.path)}
                                    aria-expanded={group.expanded}
                                  >
                                    {group.expanded ? (
                                      <ChevronDown size={13} aria-hidden />
                                    ) : (
                                      <ChevronRight size={13} aria-hidden />
                                    )}
                                    <span className="data-grid-group-label">
                                      {labelByKey.get(group.key) ?? group.key}:{' '}
                                      {group.label}
                                    </span>
                                    <span className="data-grid-group-count">
                                      ({group.count})
                                    </span>
                                  </button>
                                </td>
                              );
                            }
                            return (
                              <td
                                key={col.key}
                                className={
                                  col.align === 'right' ? 'align-right' : ''
                                }
                              >
                                {formatAggValue(group.aggs[col.key])}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }

                    const isTotalRow = isPinnedTotalRow(row);
                    const clickable = Boolean(onRowClick) && !isTotalRow;
                    return (
                      <tr
                        key={row.id ?? row.ID ?? row._rowKey ?? `row-${idx}`}
                        className={[
                          isTotalRow ? 'data-grid-total-row' : '',
                          clickable ? 'data-grid-row--clickable' : '',
                          grouped ? 'data-grid-leaf-row' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined}
                        onClick={clickable ? () => onRowClick(row) : undefined}
                        onKeyDown={
                          clickable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onRowClick(row);
                                }
                              }
                            : undefined
                        }
                        tabIndex={clickable ? 0 : undefined}
                        role={clickable ? 'button' : undefined}
                      >
                        {displayColumns.map((col) => (
                          <td
                            key={col.key}
                            className={col.align === 'right' ? 'align-right' : ''}
                            title={cellText(row[col.key])}
                          >
                            {col.render
                              ? col.render(row)
                              : formatCellValue(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {showFooter ? (
            <div className="data-grid-footer data-grid-footer-pager">
              <span className="data-grid-range">
                {displayFrom}–{displayTo} of {totalRows.toLocaleString()}
                {grouped ? ' rows (grouped)' : ''}
              </span>
              <div className="data-grid-pager">
                <button
                  type="button"
                  className="data-grid-pager-btn"
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                <span className="data-grid-page-label">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="data-grid-pager-btn"
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {sideBarEnabled ? (
          <GridSideBar
            panel={panel}
            onPanelChange={setPanel}
            showFilters={sideBarFilters}
            activeFilterCount={activeColumnFilterCount}
            onGlobalReset={resetGridState}
            columnsProps={{
              columns: panelColumns,
              hidden: columnsState.hidden,
              onVisibilityChange: (hidden) =>
                setColumnsState((prev) => ({ ...prev, hidden })),
              onReorder: (order) =>
                setColumnsState((prev) => ({ ...prev, order })),
              onResetColumns: resetColumnsState,
              defaultOrder: columns.map((col) => col.key),
              pivotMode,
              onPivotModeChange: setPivotMode,
              rowGroupKeys,
              valueAggs,
              onRowGroupsChange: changeRowGroups,
              onValuesChange: setValueAggs,
              numericKeys,
              enableGrouping: groupingEnabled,
            }}
            filtersProps={{
              columns: panelColumns,
              distinctByColumn,
              columnFilters,
              onFilterChange: setColumnFilter,
              onResetAllFilters: clearColumnFilters,
            }}
          />
        ) : null}
      </div>
    </div>
  );
});

export default DataGrid;
