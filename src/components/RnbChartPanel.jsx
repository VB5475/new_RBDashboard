import { useMemo, useState } from 'react';
import { LayoutGrid, Maximize2 } from 'lucide-react';
import RnbAppliedFilters from './RnbAppliedFilters';
import RnbChartBody from './RnbChartBody';
import RnbWidgetHeader from './RnbWidgetHeader';
import { chartGridFromWidget } from '../utils/chartGridData';
import './RnbChartPanel.css';

function ChartPanelActions({
  chart,
  showGrid,
  setShowGrid,
  hasAppliedFilters,
  appliedFilters,
  onFilterClick,
  onExpandClick,
  onDrilldownClick,
}) {
  return (
    <>
      <div className="rnb-chart-grid-toggle">
        <span className={`rnb-chart-grid-label${showGrid ? ' is-active' : ''}`}>
          Grid
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showGrid}
          aria-label={showGrid ? 'Show chart view' : 'Show grid view'}
          className={`rnb-chart-grid-switch${showGrid ? ' is-on' : ''}`}
          onClick={() => setShowGrid((v) => !v)}
        >
          <span className="rnb-chart-grid-switch-thumb" />
        </button>
      </div>
      {chart.filters?.length > 0 && (
        <button
          type="button"
          className={`rnb-chart-action${hasAppliedFilters ? ' is-active' : ''}`}
          onClick={onFilterClick}
        >
          Filter
          {hasAppliedFilters && (
            <span className="rnb-chart-filter-count">
              {appliedFilters.length > 9 ? '9+' : appliedFilters.length}
            </span>
          )}
        </button>
      )}
      {onExpandClick ? (
        <button
          type="button"
          className="rnb-chart-action rnb-chart-action--icon"
          onClick={onExpandClick}
          aria-label="Expand chart"
          title="Expand"
        >
          <Maximize2 size={16} aria-hidden />
        </button>
      ) : null}
      {chart.isDrillDown && onDrilldownClick ? (
        <button
          type="button"
          className="rnb-chart-action rnb-chart-action--icon"
          onClick={onDrilldownClick}
          aria-label="Drill down"
          title="Drill down"
        >
          <LayoutGrid size={16} aria-hidden />
        </button>
      ) : null}
    </>
  );
}

export default function RnbChartPanel({
  chart,
  delay = 0,
  onFilterClick,
  onDrilldownClick,
  onExpandClick,
  onChartClick,
  appliedFilters = [],
  onClearFilters,
}) {
  const [showGrid, setShowGrid] = useState(false);
  const hasAppliedFilters = appliedFilters.length > 0;
  const gridData = useMemo(
    () =>
      chart?.datasets?.length
        ? chartGridFromWidget(chart)
        : { rows: [], columns: [] },
    [chart],
  );

  if (!chart?.datasets?.length) return null;

  return (
    <div
      className="rnb-chart-panel glass-card fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <RnbWidgetHeader
        variant="card"
        title={chart.title}
        subtitle={chart.yAxisTitle}
        actions={
          <ChartPanelActions
            chart={chart}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            hasAppliedFilters={hasAppliedFilters}
            appliedFilters={appliedFilters}
            onFilterClick={onFilterClick}
            onExpandClick={onExpandClick}
            onDrilldownClick={onDrilldownClick}
          />
        }
      />
      <div className="rnb-chart-panel-content">
        <RnbAppliedFilters
        filters={appliedFilters}
        onClearAll={onClearFilters}
        variant="compact"
      />
        <RnbChartBody
          chart={chart}
          showGrid={showGrid}
          gridData={gridData}
          onChartClick={onChartClick}
          size="card"
        />
      </div>
    </div>
  );
}
