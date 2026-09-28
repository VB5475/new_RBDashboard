# AG Grid configuration inventory (R-BDashboard → rnb-dashboard)

Reference for the filters and grid options actually used in legacy
`R-BDashboard`, and how they map to the custom `DataGrid` in `rnb-dashboard`.

Source of truth in legacy: `R-BDashboard/src/components/shared/CustomAgGrid.jsx`
(packages: `ag-grid-enterprise` / `ag-grid-react` ^33).

---

## Architecture

| Legacy piece | Role |
|---|---|
| `CustomAgGrid.jsx` | Only real `<AgGridReact>` mount; all filter behavior lives here |
| `NonServerCustomAgGrid.jsx` | Client rows, `gridType="first"` |
| `ServerCustomAgGrid2.jsx` | Zip/JSON fetch, still **client-side** grid, `gridType="firstWithOutDateHandler"` |
| `ServerCustomAgGrid.jsx` | Infinite row model, `gridType="second"` — **dead** (imported nowhere) |
| `ModalTable.jsx` / drilldown views | `gridType="modalTable"` / `"modalTableWithoutDrillDown"` |

There is **no server-side filter API** in use. Live paths load rows then filter in the browser.

---

## Filters that are live (port these)

### `agSetColumnFilter` — the only live filter

Applied to **every data column** (no column-type detection). Repeated for
`modalTable`, `first` / `firstWithOutDateHandler` / `modalTableWithoutDrillDown`,
and the dead `second` branch.

```js
filter: 'agSetColumnFilter',
filterParams: {
  buttons: ['reset', 'apply'],
  defaultToNothingSelected: true,
  values: (params) => {
    // Distinct-ish list from all row values for this field
    // (AG Grid dedupes; legacy passed raw map of all rows)
    params.success(options.map((row) => row[fieldName]));
  },
},
```

| Setting | Meaning | rnb-dashboard equivalent |
|---|---|---|
| `agSetColumnFilter` | Multi-select value list | `SetColumnFilter` + `{ type: 'set', values: string[] }` |
| `buttons: ['reset', 'apply']` | Staged draft; commit on Apply; Reset clears | Same UX on filter panel |
| `defaultToNothingSelected: true` | Popup opens with nothing checked | Draft starts empty until Apply |
| Async `values` callback | Supply checkbox options from row data | `getDistinctColumnValues(rows, key)` |
| `filter: false` | Map / action columns | Column `filter: false` |

**Not configured on live set filters:** `excelMode`, floating filters,
`menuTabs`, `refreshValuesOnOpen` (only on dead `second` branch).

### Global “List All” / clear

`DateHandlerComponent` calls `api.setFilterModel(null)` to clear all column
filters. Custom grid: toolbar / modal “Clear filters” control.

### Quick filter

`quickFilterText` is bound in legacy but **never set** (no search box).
`DataGrid` already provides a working “Search all columns…” box — keep it.

---

## Filters that exist in code but are unreachable (do not port)

Guarded by `isMapRequired === false`, which no caller passes (default `true`):

```js
filter: 'agMultiColumnFilter',
filterParams: {
  filters: [
    { filter: 'agNumberColumnFilter', filterParams: { buttons: ['reset'] } },
    { filter: 'agSetColumnFilter',     filterParams: { buttons: ['reset'] } },
    { filter: 'agDateColumnFilter',    filterParams: { buttons: ['reset'], comparator } },
  ],
},
```

Also unused anywhere in live paths:

- `agTextColumnFilter`
- Floating filters (`floatingFilter: true`)
- Server filter endpoints `AgGridFilter` / `AgGridFilterChart` in `api.config.js`

---

## Related grid options (non-filter, for context)

### `defaultColDef` (live)

| Option | Live value |
|---|---|
| `filter` | `true` except `gridType === "second"` |
| `sortable` | `true` only for `first` / `firstWithOutDateHandler` |
| `resizable` | `true` |
| `wrapHeaderText` / `autoHeaderHeight` | `true` |
| `enablePivot` | `true` |
| `enableRowGroup` | `false` |

### Sidebar (enterprise)

Live client grid:

- `agColumnsToolPanel`
- `agFiltersToolPanel`
- `defaultToolPanel: ''` (collapsed)

Custom `DataGrid` now ships both panels — see
[Side bar port](#side-bar-port-columns--filters-tool-panels) below.

### Pagination / status

- Client pagination (`pagination={true}`, position top in JSX)
- Status bar panels for total / filtered / selected / aggregation (enterprise)
- Custom grid: footer range + pager; filtered count implied by range after filter

### Row model

- Live: client `rowData`
- Dead: `rowModelType: 'infinite'` with page-local JS filter on set-filter `values`

---

## Column generation rules to mirror

1. Columns from `Object.keys(rows[0])` (or `refTable` display names for drilldown).
2. Every data column gets a **set** filter unless explicitly disabled.
3. Visibility from drilldown `refTable` (`Visibility === 'NO'` → hide) is already
   handled by `columnsFromDrilldown` in rnb-dashboard.
4. Map button column: `filter: false`, not sortable.

---

## Behaviour contract for `DataGrid` set filter

```ts
// Committed model per column (absent / null = no filter → show all)
type SetFilterModel = {
  type: 'set';
  values: string[]; // may include BLANK_VALUE for null/''
};

// Apply with zero selected values → cleared filter (null model) → show all,
// because legacy ran `defaultToNothingSelected: true`: "no filtering will occur
// until at least one value is selected."
// Reset / clear → remove model → show all
```

UI:

1. Open panel → if no committed filter, nothing selected.
2. Tick values → **Apply** commits; **Reset** clears that column.
3. Escape / click-outside discards draft.
4. Optional search within the value list (set-filter list UX).
5. “(Blanks)” when the column has null/empty cells.

---

## Call sites (rnb-dashboard)

| Surface | Filters |
|---|---|
| `DataViewPage` | On (client / zip mode); off when `serverPagination` |
| `RnbDrilldownModal` | On (parity with `modalTable`) |
| `RnbChartClickPanel` | On (parity with `modalTableWithoutDrillDown`) |
| `RnbChartBody` embedded | Off (compact chart chrome) |
| `DataModal` | Off (unused / compact) |

---

## Implementation in rnb-dashboard

| File | Role |
|---|---|
| `src/utils/gridFilters.js` | Set-filter model + matchers |
| `src/utils/gridColumnsState.js` | Column order / visibility, tri-state select all, numeric detection |
| `src/utils/gridGrouping.js` | `groupRows()` → display rows with `__group` meta + aggregations |
| `src/components/grid/filters/SetFilterBody.jsx` | Search / select all / list / Reset / Apply (no popup chrome) |
| `src/components/grid/filters/SetColumnFilter.jsx` | Header trigger + portal popup around `SetFilterBody` |
| `src/components/grid/sidebar/GridSideBar.jsx` | Vertical Columns / Filters tabs + open tool panel |
| `src/components/grid/sidebar/ColumnsToolPanel.jsx` | Pivot mode, column list, Row Groups / Values zones |
| `src/components/grid/sidebar/FiltersToolPanel.jsx` | Searchable filter accordion |
| `src/components/grid/DataGrid.jsx` | Shared grid (already common) |
| `src/components/grid/index.js` | Barrel export |
| `scripts/grid-utils.smoke.mjs` | `npm run smoke:grid` — filter / columns / grouping assertions |

---

## Out of scope for this port

- AG Grid Enterprise license, charts, pivot, Excel export, range selection
- Number / date / text / multi column filters (dead legacy path only)
- Server-side filter model push to API
- Floating-filter row as AG Grid floating filters (we keep a compact trigger row)

When adding new filter types later, extend the column `filter` field and
`gridFilters.js` matchers — do not reintroduce AG Grid.

---

# Side bar port (Columns + Filters tool panels)

## Legacy side bar config

`CustomAgGrid.jsx` mounted the enterprise side bar on the live client grid only:

```js
sideBar={{
  toolPanels: ['agColumnsToolPanel', 'agFiltersToolPanel'],
  defaultToolPanel: '', // collapsed — user clicks a tab to open
}}
```

Both tabs were on the right edge as vertical labels, one panel open at a time.

## Research: what was live vs inert

| Legacy capability | Status in production | Why |
|---|---|---|
| Columns tool panel (show / hide, reorder) | **Live** | Default `agColumnsToolPanel` behaviour |
| Filters tool panel | **Live** | Every column had `agSetColumnFilter` |
| Set filter | **Live** (the only filter type) | See sections above |
| Row Groups zone | **Inert** | `defaultColDef.enableRowGroup: false` in every live `gridType`, so no column could be dragged in |
| Values zone | **Rendered but dead-ended** | `enableValue: true`, but aggregations only surface on group rows and no groups could exist |
| Pivot Mode toggle | **Visible, no effect** | `enablePivot: true` on `defaultColDef`, but pivoting needs groups / values |
| Number / date / text / multi filters | **Unreachable** | Guarded by `isMapRequired === false`, never passed |

So the legacy side bar was, in practice, *column visibility + set filters*, with
the grouping UI present but unusable.

## Custom implementation contract

The port keeps the full UI (it is what users recognise from the screenshots) and
makes the grouping half genuinely work client-side.

### Enabling

`DataGrid` prop `enableSideBar`:

- `null` (default) → on for full-chrome grids, off when `embedded` or `chrome="modal"`
- `true` / `false` → explicit override

| Surface | Side bar |
|---|---|
| `DataViewPage` | On (default) |
| `RnbDrilldownModal` | On (`enableSideBar`) |
| `RnbChartClickPanel` | On (`enableSideBar`) |
| `RnbChartBody` embedded | Off |
| `DataModal` | Off |

Closed by default, matching `defaultToolPanel: ''`. Clicking the active tab
closes the panel again.

### Columns panel

1. **Pivot Mode** toggle, OFF by default.
2. Search box + tri-state Select All (applies to the searched subset).
3. Scrollable list: drag handle, checkbox, label. HTML5 drag-and-drop reorders
   columns; order is computed against the full list, not the search subset.
4. Checkbox = column visibility while pivot mode is OFF.
5. **Row Groups** dashed drop zone ("Drag here to set row groups").
6. **Values** dashed drop zone with Σ ("Drag here to aggregate"). Each pill's
   agg label toggles `sum` ↔ `count` on click.

Pivot-mode-lite: with Pivot Mode ON the checkbox no longer touches visibility.
Checking a column routes it to **Values** if it sampled as numeric, otherwise to
**Row Groups**; unchecking removes it from both. This mirrors AG Grid's
pivot-mode column list without implementing real pivot columns.

### Grouping / aggregation behaviour

`gridGrouping.js` runs after filter + sort and before pagination:

```ts
groupRows(rows, groupKeys, valueAggs, expandedPaths)
  → { displayRows, leafCount, grouped }

// displayRows mixes group headers and leaves:
type GroupRow = { __group: {
  path, key, label, level, count, aggs: Record<key, number>, expanded,
} };
```

- Groups are ordered by label (natural sort); blanks collapse into `(Blanks)`.
- Groups start collapsed; a collapsed group contributes only its header, so the
  flattened list is what gets paginated (page size counts headers + visible leaves).
- `sum` uses `parseInt`, matching the legacy custom sum aggregation; `count`
  counts rows with a non-blank value.
- Aggregated values render on group header rows for the columns in Values.
- Values pills with **no** row group configured are kept but change nothing —
  aggregations need a group row to render on. The panel says so inline.
- Server-pagination grids (`serverPagination`) only get the visibility /
  reorder half of the panel: grouping and filters operate on the client row set,
  which in server mode is a single page.

### Filters panel

- Search over column names.
- Accordion per filterable column, chevron collapsed / expanded, dot indicator
  when that column has an active filter.
- The expanded body is the *same* `SetFilterBody` component the header popup
  uses, bound to the same committed `columnFilters` state — applying from either
  place updates the other, and the toolbar "Clear filters" resets both.
- Distinct values are computed lazily: only when the floating filter row is
  shown or the Filters panel is open.

### Out of scope

- Real pivot columns / pivot result set
- Column resize, pinning, column groups, "reset columns"
- Aggregation functions beyond `sum` / `count`, and grand-total footer aggregation
- Persisting panel state across mounts (state resets when `columns` identity
  changes; visibility is preserved for keys that still exist)
