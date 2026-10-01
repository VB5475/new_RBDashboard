import { useState } from 'react';
import DataGrid from './grid/DataGrid';
import { columnsFromRows } from '../utils/gridColumns';
import './DataModal.css';

export default function DataModal({ title, subtitle, rows, onClose }) {
  const [rangeLabel, setRangeLabel] = useState('');
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
          <div className="data-modal-header-actions">
            {rangeLabel ? (
              <span className="rnb-header-range rnb-header-range--panel" title={rangeLabel}>
                {rangeLabel}
              </span>
            ) : null}
            <button type="button" onClick={onClose} className="data-modal-close">
              ×
            </button>
          </div>
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
            onRangeChange={setRangeLabel}
          />
        </div>
      </div>
    </>
  );
}
