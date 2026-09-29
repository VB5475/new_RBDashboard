import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, RotateCcw, X } from 'lucide-react';
import DataGrid from './grid/DataGrid';
import RnbLoader from './RnbLoader';
import RnbWorkMapModal from './RnbWorkMapModal';
import { columnsForChartClick } from '../utils/chartClickMap';
import { chartClickPanelWidthPx } from './RnbChartClickPanel';
import './RnbDrilldownModal.css';
import './RnbChartClickPanel.css';

export default function RnbChartClickModal({
  open,
  menuCode,
  title,
  subtitle,
  rows = [],
  loading = false,
  onClose,
}) {
  const [mapTarget, setMapTarget] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    if (!open) setMapTarget(null);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const columns = useMemo(
    () => columnsForChartClick(rows, menuCode, setMapTarget),
    [rows, menuCode],
  );

  const dialogWidthPx = chartClickPanelWidthPx(columns.length);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="rnb-drilldown-backdrop"
        onClick={onClose}
        aria-label="Close grid"
      />
      <div
        className="rnb-drilldown-dialog rnb-chart-click-dialog glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rnb-chart-click-modal-title"
        style={{
          width: `min(96vw, ${dialogWidthPx}px)`,
          maxWidth: '96vw',
        }}
      >
        <header className="rnb-drilldown-header">
          <div className="rnb-drilldown-heading">
            <span className="rnb-drilldown-icon" aria-hidden>
              <LayoutGrid size={22} />
            </span>
            <div>
              <h2 id="rnb-chart-click-modal-title">{title || 'Status details'}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          </div>
          <div className="rnb-drilldown-header-actions">
            {!loading && rows.length > 0 ? (
              <button
                type="button"
                className="rnb-drilldown-reset"
                onClick={() => gridRef.current?.resetAll?.()}
                title="Reset all column filters, visibility, groups, and values"
              >
                <RotateCcw size={16} aria-hidden />
                Reset all
              </button>
            ) : null}
            <button
              type="button"
              className="rnb-drilldown-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="rnb-drilldown-body">
          {loading ? (
            <RnbLoader variant="inline" message="Loading grid…" />
          ) : rows.length > 0 ? (
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
          ) : (
            <p className="rnb-drilldown-empty">No data to display.</p>
          )}
        </div>
      </div>

      <RnbWorkMapModal
        open={Boolean(mapTarget)}
        workID={mapTarget?.workID}
        source={mapTarget?.source}
        onClose={() => setMapTarget(null)}
      />
    </>
  );
}
