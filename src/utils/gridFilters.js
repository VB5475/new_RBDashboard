/** Client-side set filters for DataGrid (parity with legacy agSetColumnFilter). */

export const BLANK_VALUE = '__BLANK__';

function cellText(value) {
  if (value == null) return '';
  return String(value).trim();
}

export function getDistinctColumnValues(rows = [], key) {
  const set = new Set();
  let hasBlanks = false;

  rows.forEach((row) => {
    const text = cellText(row?.[key]);
    if (text) set.add(text);
    else hasBlanks = true;
  });

  const values = [...set].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  );

  return { values, hasBlanks };
}

export function createEmptySetFilterDraft(values = [], hasBlanks = false) {
  const draft = new Map();
  values.forEach((value) => draft.set(value, false));
  if (hasBlanks) draft.set(BLANK_VALUE, false);
  return draft;
}

export function createSetFilterDraft(values = [], hasBlanks = false, model = null) {
  const draft = createEmptySetFilterDraft(values, hasBlanks);
  if (!isSetFilterActive(model)) return draft;
  model.values.forEach((value) => {
    if (draft.has(value)) draft.set(value, true);
  });
  return draft;
}

export function draftSelectedValues(draft) {
  if (!draft) return [];
  const selected = [];
  draft.forEach((checked, value) => {
    if (checked) selected.push(value);
  });
  return selected;
}

/**
 * Legacy `defaultToNothingSelected: true` means nothing filters until a value is
 * picked, so an empty selection is a cleared filter, not a "match nothing" one.
 */
export function createSetFilterModel(values = []) {
  if (!values.length) return null;
  return { type: 'set', values: [...values] };
}

export function isSetFilterActive(model) {
  return (
    Boolean(model) &&
    model.type === 'set' &&
    Array.isArray(model.values) &&
    model.values.length > 0
  );
}

function matchesSelection(cellValue, selection) {
  const text = cellText(cellValue);
  return selection.has(text || BLANK_VALUE);
}

export function matchesSetFilter(cellValue, filterModel) {
  if (!isSetFilterActive(filterModel)) return true;
  return matchesSelection(cellValue, new Set(filterModel.values));
}

export function applyColumnFilters(rows = [], columnFilters = {}) {
  const active = Object.entries(columnFilters)
    .filter(([, model]) => isSetFilterActive(model))
    .map(([key, model]) => [key, new Set(model.values)]);

  if (!active.length) return rows;

  return rows.filter((row) =>
    active.every(([key, selection]) => matchesSelection(row?.[key], selection)),
  );
}

export function countActiveColumnFilters(columnFilters = {}) {
  return Object.values(columnFilters).filter(isSetFilterActive).length;
}
