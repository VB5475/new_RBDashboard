import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Filter, RotateCcw, X } from 'lucide-react';
import {
  applyWidgetFilters,
  cascadeFilterSelection,
  isFilterVisible,
  normalizeControlType,
} from '../services/filters';
import FilterDrawerSelect from './FilterDrawerSelect';
import './FilterDrawer.css';

function emptySelectionForFilter(filter) {
  const type = normalizeControlType(filter.controlType);
  if (type === 'FTDATE') return { type: 'FTDATE', fromDate: '', toDate: '' };
  if (type === 'DATE') return { type: 'DATE', date: '' };
  return null;
}

function isSelectionActive(filter, selection) {
  if (!selection) return false;
  const type = normalizeControlType(filter?.controlType);
  if (type === 'FTDATE') return Boolean(selection.fromDate || selection.toDate);
  if (type === 'DATE') return Boolean(selection.date);
  return selection.value != null && selection.value !== '';
}

function cloneDraftFilters(filters = []) {
  return filters.map((f) => ({ ...f, Values: f.Values ? [...f.Values] : f.Values }));
}

function selectionsForFilters(filters, savedSelections) {
  if (!savedSelections?.length) {
    return filters.map((f) => emptySelectionForFilter(f));
  }
  return filters.map((f, i) => {
    const saved = savedSelections[i];
    if (saved && isSelectionActive(f, saved)) return { ...saved };
    return emptySelectionForFilter(f);
  });
}

export default function FilterDrawer({
  open,
  widget,
  savedDraft,
  onClose,
  onApplied,
  onDraftPersist,
}) {
  const [selections, setSelections] = useState([]);
  const [filters, setFilters] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open || !widget?.filters) return;

    const nextFilters = savedDraft?.filters?.length
      ? cloneDraftFilters(savedDraft.filters)
      : widget.filters.map((f) => ({ ...f }));
    const nextSelections = selectionsForFilters(
      nextFilters,
      savedDraft?.selections,
    );

    setFilters(nextFilters);
    setSelections(nextSelections);
  }, [open, widget, savedDraft]);

  function persistDraftAndClose() {
    if (widget?.id && onDraftPersist) {
      onDraftPersist(widget.id, {
        selections: selections.map((s) => (s ? { ...s } : s)),
        filters: cloneDraftFilters(filters),
      });
    }
    onClose();
  }

  const visibleCount = useMemo(
    () => filters.filter((f) => isFilterVisible(f)).length,
    [filters],
  );

  const activeCount = useMemo(
    () =>
      filters.reduce((count, filter, index) => {
        if (!isFilterVisible(filter)) return count;
        return count + (isSelectionActive(filter, selections[index]) ? 1 : 0);
      }, 0),
    [filters, selections],
  );

  if (!open || !widget) return null;

  async function handleSelect(index, filter, value, label) {
    const next = [...selections];
    next[index] = {
      value,
      label,
      FilterID: filter.idnumber,
    };

    for (let i = index + 1; i < next.length; i += 1) {
      next[i] = emptySelectionForFilter(filters[i]);
    }
    setSelections(next);

    if (value && filter.sessionid) {
      try {
        const cascaded = await cascadeFilterSelection(
          filter.sessionid,
          filter.idnumber,
          { value },
        );
        if (cascaded?.length) {
          const updated = filters.map((f) => {
            const match = cascaded.find(
              (c) =>
                String(c.Ref_FilterID2Refill) === String(f.idnumber),
            );
            if (!match) return f;
            return { ...f, Values: match.Values ?? [] };
          });
          setFilters(updated);
        }
      } catch {
        toast.error('Could not refresh dependent filters');
      }
    }
  }

  function handleDateChange(index, filter, patch) {
    const next = [...selections];
    const prev = next[index] ?? emptySelectionForFilter(filter);
    next[index] = { ...prev, ...patch, FilterID: filter.idnumber };
    setSelections(next);
  }

  async function handleApply() {
    setApplying(true);
    try {
      const { filterString, data } = await applyWidgetFilters(
        widget.id,
        widget.sessionId,
        filters,
        selections,
      );

      const appliedFilters = filters
        .map((f, index) => {
          const sel = selections[index];
          if (!isSelectionActive(f, sel)) return null;
          const type = normalizeControlType(f.controlType);
          let value = sel.label;
          if (!value && type === 'FTDATE') {
            value = [sel.fromDate, sel.toDate].filter(Boolean).join(' – ');
          }
          if (!value && type === 'DATE') value = sel.date;
          if (!value && sel.value != null) value = String(sel.value);
          return {
            label: f.displayName || 'Filter',
            value: value || '—',
          };
        })
        .filter(Boolean);

      const draft = {
        selections: selections.map((s) => (s ? { ...s } : s)),
        filters: cloneDraftFilters(filters),
      };
      onApplied(
        widget.id,
        widget.objectType,
        filterString,
        data,
        false,
        appliedFilters,
        draft,
      );
      onClose();
      toast.success('Filters applied');
    } catch (e) {
      toast.error(e.message || 'Failed to apply filters');
    } finally {
      setApplying(false);
    }
  }

  function handleClear() {
    setSelections(filters.map((f) => emptySelectionForFilter(f)));
    onApplied(widget.id, widget.objectType, widget.filterString, null, true, [], null);
    onClose();
    toast.success('Filters reset');
  }

  function renderFilterControl(filter, index) {
    const type = normalizeControlType(filter.controlType);
    const active = isSelectionActive(filter, selections[index]);

    if (type === 'FTDATE') {
      const sel = selections[index] ?? { fromDate: '', toDate: '' };
      return (
        <div className="filter-drawer-date-row">
          <div className="filter-drawer-date-cell">
            <span className="filter-drawer-date-label">From</span>
            <input
              type="date"
              className="filter-drawer-input"
              value={sel.fromDate ?? ''}
              onChange={(e) =>
                handleDateChange(index, filter, {
                  type: 'FTDATE',
                  fromDate: e.target.value,
                })
              }
            />
          </div>
          <div className="filter-drawer-date-cell">
            <span className="filter-drawer-date-label">To</span>
            <input
              type="date"
              className="filter-drawer-input"
              value={sel.toDate ?? ''}
              onChange={(e) =>
                handleDateChange(index, filter, {
                  type: 'FTDATE',
                  toDate: e.target.value,
                })
              }
            />
          </div>
        </div>
      );
    }

    if (type === 'DATE') {
      const sel = selections[index] ?? { date: '' };
      return (
        <input
          type="date"
          className="filter-drawer-input"
          value={sel.date ?? ''}
          onChange={(e) =>
            handleDateChange(index, filter, {
              type: 'DATE',
              date: e.target.value,
            })
          }
        />
      );
    }

    const values = filter.Values ?? [];
    const hint =
      values.length === 0 && filter.isCascadingControl
        ? 'Choose filters above first'
        : null;

    return (
      <>
        <FilterDrawerSelect
          value={selections[index]?.value ?? ''}
          options={values}
          disabled={values.length === 0 && Boolean(hint)}
          active={active}
          onChange={(val, label) =>
            handleSelect(index, filter, val, label)
          }
        />
        {hint ? (
          <span className="filter-drawer-hint">{hint}</span>
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="filter-drawer-backdrop"
        onClick={persistDraftAndClose}
        aria-label="Close filters"
      />
      <aside className="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
        <header className="filter-drawer-header">
          <div className="filter-drawer-header-main">
            <span className="filter-drawer-header-icon" aria-hidden>
              <Filter size={22} strokeWidth={2.25} />
            </span>
            <div>
              <div className="filter-drawer-title-row">
                <h3 id="filter-drawer-title">Filters</h3>
                {activeCount > 0 ? (
                  <span className="filter-drawer-badge">{activeCount} active</span>
                ) : (
                  <span className="filter-drawer-badge filter-drawer-badge--muted">
                    {visibleCount} fields
                  </span>
                )}
              </div>
              <p className="filter-drawer-subtitle">{widget.title}</p>
            </div>
          </div>
          <button
            type="button"
            className="filter-drawer-close"
            onClick={persistDraftAndClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="filter-drawer-body">
          {filters.map((filter, index) => {
            if (!isFilterVisible(filter)) return null;
            const active = isSelectionActive(filter, selections[index]);

            return (
              <div
                key={filter.idnumber}
                className={`filter-drawer-field-card${active ? ' is-active' : ''}`}
              >
                <label className="filter-drawer-field">
                  <span className="filter-drawer-field-label">
                    {filter.displayName}
                    {active ? (
                      <span className="filter-drawer-field-dot" aria-hidden />
                    ) : null}
                  </span>
                  {renderFilterControl(filter, index)}
                </label>
              </div>
            );
          })}
        </div>

        <footer className="filter-drawer-actions">
          <button
            type="button"
            className="filter-btn secondary"
            onClick={handleClear}
            disabled={activeCount === 0}
          >
            <RotateCcw size={16} aria-hidden />
            Reset
          </button>
          <button
            type="button"
            className="filter-btn primary"
            onClick={handleApply}
            disabled={applying}
          >
            <Check size={16} aria-hidden />
            {applying ? 'Applying…' : 'Apply'}
          </button>
        </footer>
      </aside>
    </>
  );
}
