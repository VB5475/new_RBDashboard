import { useEffect, useRef } from 'react';
import { Columns3, Filter, RotateCcw } from 'lucide-react';
import ColumnsToolPanel from './ColumnsToolPanel';
import FiltersToolPanel from './FiltersToolPanel';
import './sidebar.css';

/**
 * AG-Grid-style right edge side bar: vertical Columns / Filters tabs with one
 * tool panel open at a time (closed by default, matching `defaultToolPanel: ''`).
 * Clicking outside the side bar closes the open panel.
 */
export default function GridSideBar({
  panel = '',
  onPanelChange,
  showFilters = true,
  activeFilterCount = 0,
  columnsProps,
  filtersProps,
  onGlobalReset,
}) {
  const rootRef = useRef(null);
  const tabs = [
    { id: 'columns', label: 'Columns', Icon: Columns3 },
    ...(showFilters ? [{ id: 'filters', label: 'Filters', Icon: Filter }] : []),
  ];
  const openPanel = tabs.some((tab) => tab.id === panel) ? panel : '';

  useEffect(() => {
    if (!openPanel) return undefined;

    function onPointerDown(e) {
      if (rootRef.current?.contains(e.target)) return;
      onPanelChange?.('');
    }

    document.addEventListener('mousedown', onPointerDown, true);
    return () => document.removeEventListener('mousedown', onPointerDown, true);
  }, [openPanel, onPanelChange]);

  return (
    <div className="grid-sidebar" ref={rootRef}>
      {openPanel ? (
        <div className="grid-sidebar-panel">
          <div className="grid-sidebar-panel-head">
            <span>{openPanel === 'columns' ? 'Columns' : 'Filters'}</span>
            {onGlobalReset ? (
              <button
                type="button"
                className="grid-tool-reset-btn grid-tool-reset-btn--global"
                onClick={onGlobalReset}
                title="Reset columns, filters, groups, and values"
              >
                <RotateCcw size={11} aria-hidden />
                Reset all
              </button>
            ) : null}
          </div>
          {openPanel === 'columns' ? (
            <ColumnsToolPanel {...columnsProps} />
          ) : (
            <FiltersToolPanel {...filtersProps} />
          )}
        </div>
      ) : null}

      <div className="grid-sidebar-tabs" role="tablist" aria-label="Grid tool panels">
        {tabs.map((tab) => {
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={openPanel === tab.id}
              className={`grid-sidebar-tab${
                openPanel === tab.id ? ' is-active' : ''
              }`}
              onClick={() => onPanelChange?.(openPanel === tab.id ? '' : tab.id)}
              title={tab.label}
            >
              <TabIcon size={14} aria-hidden />
              <span className="grid-sidebar-tab-text">{tab.label}</span>
              {tab.id === 'filters' && activeFilterCount > 0 ? (
                <span className="grid-sidebar-tab-badge">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
