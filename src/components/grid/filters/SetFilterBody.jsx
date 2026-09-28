import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BLANK_VALUE,
  createEmptySetFilterDraft,
  createSetFilterDraft,
  createSetFilterModel,
  draftSelectedValues,
} from '../../../utils/gridFilters';
import './SetColumnFilter.css';

const MAX_RENDERED_VALUES = 500;
const BLANK_LABEL = '(Blanks)';

function optionLabel(value) {
  return value === BLANK_VALUE ? BLANK_LABEL : value;
}

/**
 * Set-filter controls (search, select all, value list, Reset / Apply) without
 * any popup chrome — shared by the header filter popup and the Filters side bar.
 */
export default function SetFilterBody({
  label,
  values = [],
  hasBlanks = false,
  model = null,
  onApply,
  onReset,
  autoFocusSearch = false,
  listMaxHeight,
}) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(() =>
    createSetFilterDraft(values, hasBlanks, model),
  );
  const [source, setSource] = useState({ model, values, hasBlanks });
  const searchRef = useRef(null);

  // Re-sync the draft when the committed model or value list changes elsewhere
  // (header popup, another panel, "Clear filters").
  if (
    source.model !== model ||
    source.values !== values ||
    source.hasBlanks !== hasBlanks
  ) {
    setSource({ model, values, hasBlanks });
    setDraft(createSetFilterDraft(values, hasBlanks, model));
  }

  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  const options = useMemo(
    () => (hasBlanks ? [...values, BLANK_VALUE] : values),
    [values, hasBlanks],
  );

  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = query
      ? options.filter((value) =>
          optionLabel(value).toLowerCase().includes(query),
        )
      : options;
    // After Apply, committed selections stay pinned to the top of the list.
    const applied = new Set(model?.values ?? []);
    if (!applied.size) return filtered;
    const selected = [];
    const unselected = [];
    filtered.forEach((value) => {
      if (applied.has(value)) selected.push(value);
      else unselected.push(value);
    });
    return [...selected, ...unselected];
  }, [options, query, model]);
  const rendered = visible.slice(0, MAX_RENDERED_VALUES);
  const hiddenCount = visible.length - rendered.length;
  const allVisibleChecked =
    visible.length > 0 && visible.every((value) => draft.get(value));
  const someVisibleChecked = visible.some((value) => draft.get(value));

  function setDraftValues(keys, checked) {
    setDraft((prev) => {
      const next = new Map(prev);
      keys.forEach((key) => next.set(key, checked));
      return next;
    });
  }

  function handleApply() {
    onApply?.(createSetFilterModel(draftSelectedValues(draft)));
  }

  function handleReset() {
    setDraft(createEmptySetFilterDraft(values, hasBlanks));
    setSearch('');
    onReset?.();
  }

  return (
    <>
      <input
        ref={searchRef}
        type="text"
        className="grid-set-filter-search"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label={`Search ${label} values`}
      />

      <label className="grid-set-filter-option grid-set-filter-option--all">
        <input
          type="checkbox"
          checked={allVisibleChecked}
          ref={(el) => {
            if (el) el.indeterminate = !allVisibleChecked && someVisibleChecked;
          }}
          disabled={visible.length === 0}
          onChange={(e) => setDraftValues(visible, e.target.checked)}
        />
        <span>(Select All)</span>
      </label>

      <div
        className="grid-set-filter-list"
        style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
      >
        {rendered.length === 0 ? (
          <span className="grid-set-filter-no-match">No matches</span>
        ) : (
          rendered.map((value) => (
            <label key={value} className="grid-set-filter-option">
              <input
                type="checkbox"
                checked={Boolean(draft.get(value))}
                onChange={(e) => setDraftValues([value], e.target.checked)}
              />
              <span title={optionLabel(value)}>{optionLabel(value)}</span>
            </label>
          ))
        )}
        {hiddenCount > 0 ? (
          <span className="grid-set-filter-no-match">
            +{hiddenCount} more — refine search
          </span>
        ) : null}
      </div>

      <div className="grid-set-filter-footer">
        <button type="button" className="grid-set-filter-btn" onClick={handleReset}>
          Reset
        </button>
        <button
          type="button"
          className="grid-set-filter-btn grid-set-filter-btn--primary"
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
    </>
  );
}
