import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import DataGrid from './grid/DataGrid';
import RnbWorkMapModal from './RnbWorkMapModal';
import { columnsForChartClick } from '../utils/chartClickMap';
import './RnbChartClickPanel.css';

export default function RnbChartClickPanel({
  menuCode,
  title,
  subtitle,
  rows,
  onBack,
}) {
  const [mapTarget, setMapTarget] = useState(null);

  const columns = useMemo(
    () => columnsForChartClick(rows, menuCode, setMapTarget),
    [rows, menuCode],
  );

  return (
    <section className="rnb-chart-click-panel glass-card">
      <header className="rnb-chart-click-header">
        <div className="rnb-chart-click-heading">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button type="button" className="rnb-chart-click-back" onClick={onBack}>
          <ChevronLeft size={18} aria-hidden />
          Back
        </button>
      </header>

      <div className="rnb-chart-click-body">
        <DataGrid
          columns={columns}
          rows={rows}
          plain
          appearance="dashboard"
          chrome="modal"
          enableColumnFilters={false}
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
