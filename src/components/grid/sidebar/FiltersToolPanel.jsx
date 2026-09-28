import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import SetFilterBody from '../filters/SetFilterBody';
import {
  countActiveColumnFilters,
  isSetFilterActive,
} from '../../../utils/gridFilters';

/**
 * Filters tool panel: searchable accordion of filterable columns, each body is
 * the same set filter the header popup uses (shared committed model).
 */
export default function FiltersToolPanel({
  columns = [],
  distinctByColumn = {},
  columnFilters = {},
  onFilterChange,
  onResetAllFilters,
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const filterable = columns.filter(
    (col) => col.filter !== false && distinctByColumn[col.key],
  );
  const query = search.trim().toLowerCase();
  const visible = query
    ? filterable.filter((col) =>
        String(col.label ?? col.key).toLowerCase().includes(query),
      )
    : filterable;

  const activeCount = countActiveColumnFilters(columnFilters);

  function toggle(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="grid-tool-panel">
      <div className="grid-tool-search-row">
        <input
          type="text"
          className="grid-tool-search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search filters"
        />
        {onResetAllFilters ? (
          <button
            type="button"
            className="grid-tool-reset-btn"
            disabled={activeCount === 0}
            onClick={onResetAllFilters}
            title="Clear all column filters"
          >
            <RotateCcw size={11} aria-hidden />
            Reset
          </button>
        ) : null}
      </div>

      <div className="grid-tool-accordion">
        {visible.length === 0 ? (
          <span className="grid-tool-empty">No filterable columns</span>
        ) : (
          visible.map((col) => {
            const meta = distinctByColumn[col.key];
            const isOpen = expanded.has(col.key);
            const active = isSetFilterActive(columnFilters[col.key]);

            return (
              <div
                key={col.key}
                className={`grid-tool-accordion-item${isOpen ? ' is-open' : ''}`}
              >
                <div className="grid-tool-accordion-head-row">
                  <button
                    type="button"
                    className={`grid-tool-accordion-head${
                      active ? ' is-active' : ''
                    }`}
                    onClick={() => toggle(col.key)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <ChevronDown size={13} aria-hidden />
                    ) : (
                      <ChevronRight size={13} aria-hidden />
                    )}
                    <span className="grid-tool-accordion-label">
                      {col.label ?? col.key}
                    </span>
                    {active ? (
                      <span
                        className="grid-tool-filter-dot"
                        title={`${columnFilters[col.key].values.length} selected`}
                      />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className="grid-tool-reset-btn grid-tool-reset-btn--icon"
                    disabled={!active}
                    title={`Reset ${col.label ?? col.key} filter`}
                    aria-label={`Reset ${col.label ?? col.key} filter`}
                    onClick={() => onFilterChange?.(col.key, null)}
                  >
                    <RotateCcw size={11} aria-hidden />
                  </button>
                </div>

                {isOpen ? (
                  <div className="grid-tool-accordion-body">
                    <SetFilterBody
                      label={col.label ?? col.key}
                      values={meta.values}
                      hasBlanks={meta.hasBlanks}
                      model={columnFilters[col.key] ?? null}
                      listMaxHeight={160}
                      onApply={(model) => onFilterChange?.(col.key, model)}
                      onReset={() => onFilterChange?.(col.key, null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
