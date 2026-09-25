import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import './DataGrid.css';

const MAX_COLUMN_FILTER_OPTIONS = 150;

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

/**
 * Shared data table for RNB (replaces AG Grid).
 * Client mode: sorts/filters/paginates `rows` locally.
 * Server mode: pass `serverPagination` — parent supplies current page rows + total.
 */
export default function DataGrid({
  columns = [],
  rows = [],
  searchKeys,
  title,
  subtitle,
  emptyMessage = 'No rows to display',
  pageSize = 50,
  serverPagination = null,
  enableColumnFilters = true,
  plain = false,
  /** Chart card inline table: no search toolbar, compact chrome */
  embedded = false,
  /** Match chart / expand-modal grid (header, stripes, total row) */
  appearance = embedded ? 'dashboard' : 'default',
  /** Modal-style grid: no toolbar, fills container */
  chrome = embedded ? 'embedded' : 'default',
  onRowClick = null,
  rowClickHint = '',
}) {
  const [sortField, setSortField] = useState(columns[0]?.key ?? '');
  const [sortDir, setSortDir] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [clientPage, setClientPage] = useState(1);

  useEffect(() => {
    setSortField(columns[0]?.key ?? '');
    setColumnFilters({});
  }, [columns]);

  useEffect(() => {
    setClientPage(1);
  }, [rows, searchTerm, columnFilters, serverPagination?.page]);

  const keysForSearch = searchKeys?.length ? searchKeys : columns.map((c) => c.key);
  const isServer = Boolean(serverPagination);
  const showColumnFilters = enableColumnFilters && !isServer;

  const distinctByColumn = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      const set = new Set();
      rows.forEach((row) => {
        const text = cellText(row[col.key]);
        if (text) set.add(text);
      });
      map[col.key] = [...set].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      );
    });
    return map;
  }, [rows, columns]);

  const activeColumnFilterCount = useMemo(
    () =>
      Object.values(columnFilters).filter((v) => v != null && v !== '').length,
    [columnFilters],
  );

  const filtered = useMemo(() => {
    if (isServer) return rows;
    let result = rows;

    Object.entries(columnFilters).forEach(([key, selected]) => {
      if (selected == null || selected === '') return;
      result = result.filter((row) => cellText(row[key]) === selected);
    });

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

  const totalRows = isServer ? serverPagination.total : sorted.length;

  const page = isServer ? serverPagination.page : clientPage;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const pageRows = useMemo(() => {
    if (isServer) return rows;
    const start = (clientPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [isServer, rows, sorted, clientPage, pageSize]);

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
    : Math.min(page * pageSize, sorted.length);

  const isDashboard = appearance === 'dashboard';
  const isModalChrome = chrome === 'modal' || embedded;

  const wrapperClass = [
    'data-grid-wrapper',
    plain ? 'data-grid-wrapper--plain' : 'glass-card fade-in-up',
    embedded ? 'data-grid-wrapper--embedded' : '',
    isDashboard ? 'data-grid-wrapper--dashboard' : '',
    isModalChrome ? 'data-grid-wrapper--modal-chrome' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const showToolbar =
    !isModalChrome &&
    (title || subtitle || rowClickHint || !isServer);
  const showFooter = !isModalChrome || totalPages > 1;

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

      <div className="data-grid-scroll">
        <table className="data-grid-table">
          <thead>
            <tr className="data-grid-head-row">
              {columns.map((col) => (
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
                {columns.map((col) => {
                  const options = distinctByColumn[col.key] ?? [];
                  const tooMany = options.length > MAX_COLUMN_FILTER_OPTIONS;
                  const value = columnFilters[col.key] ?? '';

                  return (
                    <th key={`filter-${col.key}`} className="data-grid-filter-cell">
                      {tooMany || options.length === 0 ? (
                        <span className="data-grid-filter-na" title="Too many unique values">
                          —
                        </span>
                      ) : (
                        <select
                          className={`data-grid-col-filter${
                            value ? ' is-active' : ''
                          }`}
                          value={value}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = e.target.value;
                            setColumnFilters((prev) => ({
                              ...prev,
                              [col.key]: next,
                            }));
                          }}
                          aria-label={`Filter ${col.label}`}
                        >
                          <option value="">All</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
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
                <td colSpan={columns.length} className="data-grid-empty">
                  Loading…
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-grid-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const isTotalRow = isPinnedTotalRow(row);
                return (
                <tr
                  key={row.id ?? row.ID ?? row._rowKey ?? idx}
                  className={[
                    isTotalRow ? 'data-grid-total-row' : '',
                    onRowClick && !isTotalRow ? 'data-grid-row--clickable' : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined}
                  onClick={
                    onRowClick && !isTotalRow
                      ? () => onRowClick(row)
                      : undefined
                  }
                  onKeyDown={
                    onRowClick && !isTotalRow
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick && !isTotalRow ? 0 : undefined}
                  role={onRowClick && !isTotalRow ? 'button' : undefined}
                >
                  {columns.map((col) => (
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
  );
}
