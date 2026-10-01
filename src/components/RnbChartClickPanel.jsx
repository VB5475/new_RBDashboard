import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import DataGrid from './grid/DataGrid';
import { columnsForChartClick } from '../utils/chartClickMap';
import { chartClickPanelWidthPx } from '../utils/chartClickPanelWidth';
import { lazyModal } from '../utils/lazyModal';
import './RnbChartClickPanel.css';

const RnbWorkMapModal = lazyModal(() => import('./RnbWorkMapModal'));

export default function RnbChartClickPanel({
  menuCode,
  title,
  subtitle,
  rows,
  onBack,
}) {
  const [mapTarget, setMapTarget] = useState(null);
  const [rangeLabel, setRangeLabel] = useState('');
  const gridRef = useRef(null);

  const columns = useMemo(
    () => columnsForChartClick(rows, menuCode, setMapTarget),
    [rows, menuCode],
  );

  const panelWidthPx = chartClickPanelWidthPx(columns.length);

  return (
    <section
      className="rnb-chart-click-panel glass-card"
      style={{ '--chart-click-panel-width': `${panelWidthPx}px` }}
    >
      <header className="rnb-chart-click-header">
        <div className="rnb-chart-click-heading">
          <h2 title={title}>{title}</h2>
          {subtitle ? <p title={subtitle}>{subtitle}</p> : null}
        </div>
        <div className="rnb-chart-click-header-actions">
          {rangeLabel ? (
            <span className="rnb-header-range rnb-header-range--panel" title={rangeLabel}>
              {rangeLabel}
            </span>
          ) : null}
          <button
            type="button"
            className="rnb-chart-click-reset"
            onClick={() => gridRef.current?.resetAll?.()}
            title="Reset all column filters, visibility, groups, and values"
          >
            <RotateCcw size={14} aria-hidden />
            Reset all
          </button>
          <button type="button" className="rnb-chart-click-back" onClick={onBack}>
            <ChevronLeft size={16} aria-hidden />
            Back
          </button>
        </div>
      </header>

      <div className="rnb-chart-click-body">
        <DataGrid
          ref={gridRef}
          columns={columns}
          rows={rows}
          plain
          appearance="dashboard"
          chrome="modal"
          enableColumnFilters
          enableSideBar
          pageSize={100}
          onRangeChange={setRangeLabel}
        />
      </div>

      <RnbWorkMapModal
        open={Boolean(mapTarget)}
        workID={mapTarget?.workID}
        source={mapTarget?.source}
        onClose={() => setMapTarget(null)}
      />
    </section>
  );
}
