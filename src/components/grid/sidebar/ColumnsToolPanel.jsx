import { useMemo, useRef, useState } from 'react';
import { GripVertical, RotateCcw, Sigma, X } from 'lucide-react';
import {
  moveColumnKey,
  moveKeyInList,
  selectAllState,
  setColumnsVisible,
} from '../../../utils/gridColumnsState';

const AGG_CYCLE = ['sum', 'count'];

/**
 * Columns tool panel: pivot-mode toggle, searchable column list with
 * drag-to-reorder, and Row Groups / Values drop zones.
 */
export default function ColumnsToolPanel({
  columns = [],
  hidden = {},
  onVisibilityChange,
  onReorder,
  onResetColumns,
  defaultOrder = null,
  pivotMode = false,
  onPivotModeChange,
  rowGroupKeys = [],
  valueAggs = [],
  onRowGroupsChange,
  onValuesChange,
  numericKeys,
  enableGrouping = true,
}) {
  const [search, setSearch] = useState('');
  const [dropTarget, setDropTarget] = useState(null);
  const dragRef = useRef(null);

  const labelByKey = useMemo(() => {
    const map = new Map();
    columns.forEach((col) => map.set(col.key, col.label ?? col.key));
    return map;
  }, [columns]);

  const query = search.trim().toLowerCase();
  const visibleList = query
    ? columns.filter((col) =>
        String(col.label ?? col.key).toLowerCase().includes(query),
      )
    : columns;

  const listKeys = visibleList.map((col) => col.key);
  const allState = selectAllState(listKeys, hidden);
  const hasHidden = Object.keys(hidden).length > 0;
  const baselineOrder = defaultOrder?.length
    ? defaultOrder
    : columns.map((col) => col.key);
  const currentOrder = columns.map((col) => col.key);
  const orderChanged =
    currentOrder.length !== baselineOrder.length ||
    currentOrder.some((key, i) => key !== baselineOrder[i]);
  const columnsDirty = hasHidden || orderChanged;

  function startDrag(e, key, from) {
    dragRef.current = { key, from };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  }

  function endDrag() {
    dragRef.current = null;
    setDropTarget(null);
  }

  function allowDrop(e, target) {
    if (!dragRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(target);
  }

  function dropOnColumn(e, targetKey) {
    e.preventDefault();
    e.stopPropagation();
    const drag = dragRef.current;
    endDrag();
    if (!drag || drag.from !== 'columns') return;
    onReorder?.(moveColumnKey(columns.map((c) => c.key), drag.key, targetKey));
  }

  function addToRowGroups(key, beforeKey = null) {
    const next = rowGroupKeys.includes(key)
      ? rowGroupKeys
      : [...rowGroupKeys, key];
    onValuesChange?.(valueAggs.filter((v) => v.key !== key));
    onRowGroupsChange?.(
      beforeKey ? moveKeyInList(next, key, beforeKey) : next,
    );
  }

  function addToValues(key, beforeKey = null) {
    const exists = valueAggs.some((v) => v.key === key);
    const next = exists
      ? valueAggs
      : [...valueAggs, { key, aggFunc: numericKeys?.has(key) ? 'sum' : 'count' }];
    onRowGroupsChange?.(rowGroupKeys.filter((k) => k !== key));
    if (beforeKey) {
      const order = moveKeyInList(next.map((v) => v.key), key, beforeKey);
      onValuesChange?.(order.map((k) => next.find((v) => v.key === k)));
    } else {
      onValuesChange?.(next);
    }
  }

  function dropOnRowGroups(e, beforeKey = null) {
    e.preventDefault();
    e.stopPropagation();
    const drag = dragRef.current;
    endDrag();
    if (!drag) return;
    addToRowGroups(drag.key, beforeKey);
  }

  function dropOnValues(e, beforeKey = null) {
    e.preventDefault();
    e.stopPropagation();
    const drag = dragRef.current;
    endDrag();
    if (!drag) return;
    addToValues(drag.key, beforeKey);
  }

  /**
   * Pivot mode routes the checkbox to grouping instead of visibility, the way
   * AG Grid's pivot-mode column list does: numeric columns become values,
   * everything else becomes a row group.
   */
  function handleCheck(key, checked) {
    if (!pivotMode || !enableGrouping) {
      onVisibilityChange?.(setColumnsVisible(hidden, [key], checked));
      return;
    }
    if (checked) {
      if (numericKeys?.has(key)) addToValues(key);
      else addToRowGroups(key);
      return;
    }
    onRowGroupsChange?.(rowGroupKeys.filter((k) => k !== key));
    onValuesChange?.(valueAggs.filter((v) => v.key !== key));
  }

  function handleCheckAll(checked) {
    if (pivotMode && enableGrouping) {
      if (!checked) {
        onRowGroupsChange?.(rowGroupKeys.filter((k) => !listKeys.includes(k)));
        onValuesChange?.(valueAggs.filter((v) => !listKeys.includes(v.key)));
      }
      return;
    }
    onVisibilityChange?.(setColumnsVisible(hidden, listKeys, checked));
  }

  function isChecked(key) {
    if (pivotMode && enableGrouping) {
      return (
        rowGroupKeys.includes(key) || valueAggs.some((v) => v.key === key)
      );
    }
    return !hidden[key];
  }

  function cycleAgg(key) {
    onValuesChange?.(
      valueAggs.map((v) =>
        v.key === key
          ? {
              ...v,
              aggFunc:
                AGG_CYCLE[(AGG_CYCLE.indexOf(v.aggFunc) + 1) % AGG_CYCLE.length],
            }
          : v,
      ),
    );
  }

  const checkAllChecked =
    pivotMode && enableGrouping
      ? listKeys.length > 0 && listKeys.every((key) => isChecked(key))
      : allState === 'all';
  const checkAllMixed =
    pivotMode && enableGrouping
      ? !checkAllChecked && listKeys.some((key) => isChecked(key))
      : allState === 'some';

  return (
    <div className="grid-tool-panel">
      {enableGrouping ? (
        <label className="grid-tool-pivot">
          <input
            type="checkbox"
            checked={pivotMode}
            onChange={(e) => onPivotModeChange?.(e.target.checked)}
          />
          <span>Pivot Mode</span>
        </label>
      ) : null}

      <div className="grid-tool-search-row">
        <input
          type="text"
          className="grid-tool-search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search columns"
        />
        <label className="grid-tool-select-all" title="Select all">
          <input
            type="checkbox"
            checked={checkAllChecked}
            ref={(el) => {
              if (el) el.indeterminate = checkAllMixed;
            }}
            disabled={listKeys.length === 0}
            onChange={(e) => handleCheckAll(e.target.checked)}
          />
        </label>
        {onResetColumns ? (
          <button
            type="button"
            className="grid-tool-reset-btn"
            disabled={!columnsDirty}
            onClick={onResetColumns}
            title="Reset column visibility and order"
          >
            <RotateCcw size={11} aria-hidden />
            Reset
          </button>
        ) : null}
      </div>

      <div className="grid-tool-column-list">
        {visibleList.length === 0 ? (
          <span className="grid-tool-empty">No matching columns</span>
        ) : (
          visibleList.map((col) => (
            <div
              key={col.key}
              className={`grid-tool-column${
                dropTarget === `col:${col.key}` ? ' is-drop-target' : ''
              }`}
              draggable
              onDragStart={(e) => startDrag(e, col.key, 'columns')}
              onDragEnd={endDrag}
              onDragOver={(e) => allowDrop(e, `col:${col.key}`)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => dropOnColumn(e, col.key)}
            >
              <GripVertical
                size={13}
                className="grid-tool-grip"
                aria-hidden
              />
              <label className="grid-tool-column-label">
                <input
                  type="checkbox"
                  checked={isChecked(col.key)}
                  onChange={(e) => handleCheck(col.key, e.target.checked)}
                />
                <span title={col.label ?? col.key}>{col.label ?? col.key}</span>
              </label>
            </div>
          ))
        )}
      </div>

      {enableGrouping ? (
        <>
          <section className="grid-tool-section">
            <div className="grid-tool-section-head">
              <h4 className="grid-tool-section-title">Row Groups</h4>
              <button
                type="button"
                className="grid-tool-reset-btn"
                disabled={rowGroupKeys.length === 0}
                onClick={() => onRowGroupsChange?.([])}
                title="Clear all row groups"
              >
                <RotateCcw size={11} aria-hidden />
                Reset
              </button>
            </div>
            <div
              className={`grid-tool-zone${
                dropTarget === 'zone:rowGroups' ? ' is-drop-target' : ''
              }${rowGroupKeys.length ? ' has-items' : ''}`}
              onDragOver={(e) => allowDrop(e, 'zone:rowGroups')}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => dropOnRowGroups(e)}
            >
              {rowGroupKeys.length === 0 ? (
                <span className="grid-tool-zone-hint">
                  Drag here to set row groups
                </span>
              ) : (
                rowGroupKeys.map((key) => (
                  <span
                    key={key}
                    className="grid-tool-pill"
                    draggable
                    onDragStart={(e) => startDrag(e, key, 'rowGroups')}
                    onDragEnd={endDrag}
                    onDragOver={(e) => allowDrop(e, 'zone:rowGroups')}
                    onDrop={(e) => dropOnRowGroups(e, key)}
                  >
                    <GripVertical size={11} aria-hidden />
                    {labelByKey.get(key) ?? key}
                    <button
                      type="button"
                      className="grid-tool-pill-remove"
                      aria-label={`Remove ${labelByKey.get(key) ?? key} from row groups`}
                      onClick={() =>
                        onRowGroupsChange?.(
                          rowGroupKeys.filter((k) => k !== key),
                        )
                      }
                    >
                      <X size={10} aria-hidden />
                    </button>
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="grid-tool-section">
            <div className="grid-tool-section-head">
              <h4 className="grid-tool-section-title">
                <Sigma size={12} aria-hidden /> Values
              </h4>
              <button
                type="button"
                className="grid-tool-reset-btn"
                disabled={valueAggs.length === 0}
                onClick={() => onValuesChange?.([])}
                title="Clear all value aggregations"
              >
                <RotateCcw size={11} aria-hidden />
                Reset
              </button>
            </div>
            <div
              className={`grid-tool-zone${
                dropTarget === 'zone:values' ? ' is-drop-target' : ''
              }${valueAggs.length ? ' has-items' : ''}`}
              onDragOver={(e) => allowDrop(e, 'zone:values')}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => dropOnValues(e)}
            >
              {valueAggs.length === 0 ? (
                <span className="grid-tool-zone-hint">
                  Drag here to aggregate
                </span>
              ) : (
                valueAggs.map(({ key, aggFunc }) => (
                  <span
                    key={key}
                    className="grid-tool-pill"
                    draggable
                    onDragStart={(e) => startDrag(e, key, 'values')}
                    onDragEnd={endDrag}
                    onDragOver={(e) => allowDrop(e, 'zone:values')}
                    onDrop={(e) => dropOnValues(e, key)}
                  >
                    <GripVertical size={11} aria-hidden />
                    <button
                      type="button"
                      className="grid-tool-pill-agg"
                      onClick={() => cycleAgg(key)}
                      title="Click to switch aggregation"
                    >
                      {aggFunc}
                    </button>
                    {labelByKey.get(key) ?? key}
                    <button
                      type="button"
                      className="grid-tool-pill-remove"
                      aria-label={`Remove ${labelByKey.get(key) ?? key} from values`}
                      onClick={() =>
                        onValuesChange?.(valueAggs.filter((v) => v.key !== key))
                      }
                    >
                      <X size={10} aria-hidden />
                    </button>
                  </span>
                ))
              )}
            </div>
            {valueAggs.length > 0 && rowGroupKeys.length === 0 ? (
              <p className="grid-tool-note">
                Add a row group to see aggregated values.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
