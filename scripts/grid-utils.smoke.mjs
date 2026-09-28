import assert from 'node:assert/strict';
import {
  BLANK_VALUE,
  applyColumnFilters,
  countActiveColumnFilters,
  createSetFilterDraft,
  createSetFilterModel,
  draftSelectedValues,
  getDistinctColumnValues,
  isSetFilterActive,
  matchesSetFilter,
} from '../src/utils/gridFilters.js';
import {
  detectNumericColumns,
  mergeColumnsState,
  moveColumnKey,
  selectAllState,
  setColumnsVisible,
  visibleColumns,
} from '../src/utils/gridColumnsState.js';
import { aggregate, groupRows, isGroupRow } from '../src/utils/gridGrouping.js';

const rows = [
  { region: 'North', wing: 'A', qty: '10' },
  { region: 'North', wing: 'B', qty: '5' },
  { region: 'South', wing: 'A', qty: '7' },
  { region: '', wing: 'B', qty: '' },
];
const columns = [
  { key: 'region', label: 'Region' },
  { key: 'wing', label: 'Wing' },
  { key: 'qty', label: 'Qty', align: 'right' },
];

// --- set filter semantics -------------------------------------------------
assert.equal(createSetFilterModel([]), null, 'empty selection -> null model');
assert.deepEqual(createSetFilterModel(['North']), { type: 'set', values: ['North'] });
assert.equal(isSetFilterActive({ type: 'set', values: [] }), false, 'empty values not active');
assert.equal(isSetFilterActive({ type: 'set', values: ['North'] }), true);
assert.equal(isSetFilterActive(null), false);

// empty model must not filter anything out (defaultToNothingSelected)
assert.equal(applyColumnFilters(rows, { region: { type: 'set', values: [] } }).length, 4);
assert.equal(countActiveColumnFilters({ region: { type: 'set', values: [] } }), 0);
assert.equal(matchesSetFilter('North', { type: 'set', values: [] }), true);

// real filter still works, including blanks
assert.equal(applyColumnFilters(rows, { region: { type: 'set', values: ['North'] } }).length, 2);
assert.equal(
  applyColumnFilters(rows, { region: { type: 'set', values: [BLANK_VALUE] } }).length,
  1,
);
assert.equal(countActiveColumnFilters({ region: { type: 'set', values: ['North'] } }), 1);

const { values, hasBlanks } = getDistinctColumnValues(rows, 'region');
assert.deepEqual(values, ['North', 'South']);
assert.equal(hasBlanks, true);

// draft round trip
const draft = createSetFilterDraft(values, hasBlanks, { type: 'set', values: ['South'] });
assert.deepEqual(draftSelectedValues(draft), ['South']);
assert.deepEqual(draftSelectedValues(createSetFilterDraft(values, hasBlanks, null)), []);
assert.deepEqual(
  draftSelectedValues(createSetFilterDraft(values, hasBlanks, { type: 'set', values: [] })),
  [],
  'empty model behaves like no model',
);

// --- columns state --------------------------------------------------------
let state = mergeColumnsState(columns);
assert.deepEqual(state.order, ['region', 'wing', 'qty']);
state = { ...state, hidden: setColumnsVisible(state.hidden, ['wing'], false) };
assert.deepEqual(
  visibleColumns(columns, state.order, state.hidden).map((c) => c.key),
  ['region', 'qty'],
);
assert.equal(selectAllState(['region', 'wing', 'qty'], state.hidden), 'some');
assert.equal(selectAllState(['region', 'qty'], state.hidden), 'all');
assert.equal(selectAllState(['wing'], state.hidden), 'none');

// hidden survives a columns identity change, dropped keys are pruned
const merged = mergeColumnsState(
  [{ key: 'qty' }, { key: 'wing' }, { key: 'extra' }],
  state,
);
assert.deepEqual(merged.order, ['wing', 'qty', 'extra']);
assert.deepEqual(merged.hidden, { wing: true });

assert.deepEqual(moveColumnKey(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
assert.deepEqual(moveColumnKey(['a', 'b', 'c'], 'a', 'c', true), ['b', 'c', 'a']);
assert.deepEqual([...detectNumericColumns(rows, columns)].sort(), ['qty']);

// --- grouping -------------------------------------------------------------
const flat = groupRows(rows, [], []);
assert.equal(flat.grouped, false);
assert.equal(flat.displayRows.length, 4);

const valueAggs = [{ key: 'qty', aggFunc: 'sum' }];
const collapsed = groupRows(rows, ['region'], valueAggs, new Set());
assert.equal(collapsed.displayRows.length, 3, 'collapsed: one row per group');
assert.ok(collapsed.displayRows.every(isGroupRow));
const north = collapsed.displayRows.find((r) => r.__group.label === 'North').__group;
assert.equal(north.count, 2);
assert.equal(north.aggs.qty, 15);
assert.equal(collapsed.displayRows[0].__group.label, '(Blanks)');

const expanded = groupRows(rows, ['region'], valueAggs, new Set(['North']));
assert.equal(expanded.displayRows.length, 5, 'expanded group adds its leaves');
assert.equal(isGroupRow(expanded.displayRows[0]), true);

const nested = groupRows(rows, ['region', 'wing'], valueAggs, new Set(['North']));
assert.equal(nested.displayRows.filter(isGroupRow).length, 5);
assert.equal(
  nested.displayRows.filter((r) => r.__group?.level === 1).length,
  2,
  'North expands into its two wings',
);

assert.equal(aggregate(rows, 'qty', 'sum'), 22);
assert.equal(aggregate(rows, 'qty', 'count'), 3, 'count skips blanks');

console.log('grid utils smoke tests passed');
