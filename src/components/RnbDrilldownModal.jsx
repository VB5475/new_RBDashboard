import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, LayoutGrid, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DataGrid from './grid/DataGrid';
import RnbLoader from './RnbLoader';
import { fetchDrilldownTables } from '../services/drilldown';
import { getUserToken } from '../utils/session';
import {
  buildDrilldownFilterString,
  columnsFromDrilldown,
  hasDrilldownGridData,
} from '../utils/drilldownGrid';
import './RnbDrilldownModal.css';

export default function RnbDrilldownModal({
  open,
  title,
  objectId,
  initialMainTable,
  initialRefTable,
  level0FilterString = '',
  onClose,
}) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [mainTable, setMainTable] = useState([]);
  const [refTable, setRefTable] = useState([]);
  const [drillDownState, setDrillDownState] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentLevel(1);
    setMainTable(initialMainTable ?? []);
    setRefTable(initialRefTable ?? []);
    setDrillDownState({ 0: level0FilterString ?? '' });
  }, [open, objectId, initialMainTable, initialRefTable, level0FilterString]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const columns = useMemo(
    () => columnsFromDrilldown(mainTable, refTable),
    [mainTable, refTable],
  );

  const canShowGrid = hasDrilldownGridData(mainTable, refTable);

  const applyDrilldownResult = useCallback((result) => {
    if (!result?.mainTable?.length || !result?.refTable?.length) {
      toast.error('No drilldown data');
      return false;
    }
    setMainTable(result.mainTable);
    setRefTable(result.refTable);
    return true;
  }, []);

  const handleBack = useCallback(async () => {
    if (currentLevel <= 1 || !objectId) return;
    setLoading(true);
    try {
      const prevLevel = currentLevel - 1;
      const filterString = drillDownState[currentLevel - 1] ?? '';
      const result = await fetchDrilldownTables({
        level: prevLevel,
        objectId,
        filterString,
        loginId: getUserToken(),
      });
      if (applyDrilldownResult(result)) {
        setCurrentLevel(prevLevel);
        setDrillDownState((prev) => ({ ...prev, [currentLevel - 1]: '' }));
      }
    } finally {
      setLoading(false);
    }
  }, [applyDrilldownResult, currentLevel, drillDownState, objectId]);

  const handleRowClick = useCallback(
    async (row) => {
      if (loading || !objectId) return;
      const nextFilter = buildDrilldownFilterString(row, refTable);
      if (!nextFilter) {
        toast.error('No more drill down available');
        return;
      }

      setLoading(true);
      try {
        const result = await fetchDrilldownTables({
          level: currentLevel + 1,
          objectId,
          filterString: nextFilter,
          loginId: getUserToken(),
        });
        if (applyDrilldownResult(result)) {
          setCurrentLevel((l) => l + 1);
          setDrillDownState((prev) => ({
            ...prev,
            [currentLevel]: nextFilter,
          }));
        }
      } finally {
        setLoading(false);
      }
    },
    [applyDrilldownResult, currentLevel, loading, objectId, refTable],
  );

  const handleClose = useCallback(() => {
    setDrillDownState({});
    onClose?.();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="rnb-drilldown-backdrop"
        onClick={handleClose}
        aria-label="Close drilldown"
      />
      <div
        className="rnb-drilldown-dialog glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rnb-drilldown-title"
      >
        <header className="rnb-drilldown-header">
          <div className="rnb-drilldown-heading">
            <span className="rnb-drilldown-icon" aria-hidden>
              <LayoutGrid size={22} />
            </span>
            <div>
              <h2 id="rnb-drilldown-title">{title || 'Data in grid view'}</h2>
              <p>Interactive grid with drill-down</p>
            </div>
          </div>
          <div className="rnb-drilldown-header-actions">
            <span className="rnb-drilldown-level">Level {currentLevel}</span>
            {currentLevel > 1 ? (
              <button
                type="button"
                className="rnb-drilldown-back"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft size={18} aria-hidden />
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="rnb-drilldown-close"
              onClick={handleClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="rnb-drilldown-body">
          {loading ? (
            <RnbLoader variant="inline" message="Loading data…" />
          ) : canShowGrid ? (
            <>
              <p className="rnb-drilldown-grid-hint">
                Click a row to drill down to the next level
              </p>
              <DataGrid
                columns={columns}
                rows={mainTable}
                plain
                appearance="dashboard"
                chrome="modal"
                enableColumnFilters={false}
                pageSize={100}
                onRowClick={handleRowClick}
              />
            </>
          ) : (
            <p className="rnb-drilldown-empty">No data to display.</p>
          )}
        </div>
      </div>
    </>
  );
}
