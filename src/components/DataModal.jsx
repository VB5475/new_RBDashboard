import DataGrid from './grid/DataGrid';
import { columnsFromRows } from '../utils/gridColumns';
import './DataModal.css';

export default function DataModal({ title, subtitle, rows, onClose }) {
  if (!rows) return null;

  const columns = columnsFromRows(rows);

  return (
    <>
      <button type="button" className="data-modal-backdrop" onClick={onClose} aria-label="Close" />
      <div className="data-modal glass-card" role="dialog" aria-modal="true">
        <div className="data-modal-header">
          <div>
            <h3>{title || 'Details'}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="data-modal-close">
            ×
          </button>
        </div>
        <div className="data-modal-body">
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
      </div>
    </>
  );
}
