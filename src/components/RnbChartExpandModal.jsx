import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, X } from 'lucide-react';
import RnbAppliedFilters from './RnbAppliedFilters';
import RnbChartBody from './RnbChartBody';
import RnbWidgetHeader from './RnbWidgetHeader';
import { chartGridFromWidget } from '../utils/chartGridData';
import './RnbChartExpandModal.css';

export default function RnbChartExpandModal({
  chart,
  appliedFilters = [],
  onClose,
  onChartClick,
  onDrilldownClick,
}) {
  const [showGrid, setShowGrid] = useState(false);

  const gridData = useMemo(
    () =>
      chart?.datasets?.length
        ? chartGridFromWidget(chart)
        : { rows: [], columns: [] },
    [chart],
  );

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!chart) return null;

  return (
    <div className="rnb-chart-expand-root">
      <button
        type="button"
        className="rnb-chart-expand-backdrop"
        onClick={onClose}
        aria-label="Close expanded chart"
      />
      <div
        className={[
          'rnb-chart-expand-dialog',
          chart.type === 'pie' ? 'rnb-chart-expand-dialog--pie' : '',
          showGrid ? 'rnb-chart-expand-dialog--grid' : 'rnb-chart-expand-dialog--chart',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rnb-chart-expand-title"
      >
        <RnbWidgetHeader
          variant="modal"
          titleId="rnb-chart-expand-title"
          title={chart.title}
          subtitle={chart.yAxisTitle}
          actions={
            <>
              <div className="rnb-chart-grid-toggle">
                <span
                  className={`rnb-chart-grid-label${showGrid ? ' is-active' : ''}`}
                >
                  Grid view
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
              {onDrilldownClick ? (
                <button
                  type="button"
                  className="rnb-chart-action rnb-chart-action--icon"
                  onClick={onDrilldownClick}
                  aria-label="Drill down"
                  title="Drill down"
                >
                  <LayoutGrid size={18} aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                className="rnb-chart-action rnb-chart-action--icon rnb-chart-expand-close"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} aria-hidden />
              </button>
            </>
          }
        />
        {appliedFilters.length > 0 ? (
          <div className="rnb-chart-expand-filters">
            <RnbAppliedFilters filters={appliedFilters} variant="compact" />
          </div>
        ) : null}
        <RnbChartBody
          chart={chart}
          showGrid={showGrid}
          gridData={gridData}
          onChartClick={onChartClick}
          size="expanded"
        />
      </div>
    </div>
  );
}
