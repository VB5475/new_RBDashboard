import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import DataGrid from './grid/DataGrid';
import RnbWorkMapModal from './RnbWorkMapModal';
import { columnsForChartClick } from '../utils/chartClickMap';
import './RnbChartClickPanel.css';

/** Comfortable per-column width + chrome (side rail, padding, footer). */
const COL_WIDTH_PX = 200;
const GRID_CHROME_PX = 96;
/** Keep header/actions readable even with few columns. */
const PANEL_MIN_PX = 640;

export function chartClickPanelWidthPx(columnCount) {
  const n = Math.max(1, Number(columnCount) || 1);
  return Math.max(PANEL_MIN_PX, n * COL_WIDTH_PX + GRID_CHROME_PX);
}

export default function RnbChartClickPanel({
  menuCode,
  title,
  subtitle,
  rows,
  onBack,
}) {
  const [mapTarget, setMapTarget] = useState(null);
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
