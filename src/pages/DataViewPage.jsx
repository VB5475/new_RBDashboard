import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DataGrid from '../components/grid/DataGrid';
import { columnsFromRows } from '../utils/gridColumns';
import {
  fetchIntegrationList,
  fetchIntegrationPaged,
  fetchIntegrationTotalCount,
  fetchLastRunDetail,
  fetchZipGridRows,
} from '../services/dataView';
import RnbLoader from '../components/RnbLoader';
import './DataViewPage.css';

function formatDateInput(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DataViewPage({ sourceName, databasepaging }) {
  const zipMode = databasepaging?.trim?.() !== 'NO';
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedRange, setAppliedRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [useServerPaging, setUseServerPaging] = useState(false);
  const pageSize = 50;

  const { data: lastRun } = useQuery({
    queryKey: ['rnb-last-run', sourceName],
    queryFn: () => fetchLastRunDetail(sourceName),
    enabled: Boolean(sourceName) && !zipMode,
  });

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      'rnb-dataview',
      sourceName,
      zipMode ? 'zip' : useServerPaging ? 'paged' : 'list',
      page,
      appliedRange.from,
      appliedRange.to,
    ],
    queryFn: async () => {
      if (zipMode) return fetchZipGridRows(sourceName);
      if (useServerPaging) {
        return fetchIntegrationPaged({
          sourceName,
          pageSize,
          pageNumber: page,
          fromDate: appliedRange.from,
          toDate: appliedRange.to,
        });
      }
      return fetchIntegrationList({
        sourceName,
        pageSize,
        pageNumber: page,
        fromDate: appliedRange.from,
        toDate: appliedRange.to,
      });
    },
    enabled: Boolean(sourceName) && (zipMode || (appliedRange.from && appliedRange.to)),
    staleTime: zipMode ? Infinity : 0,
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['rnb-dataview-count', sourceName, appliedRange.from, appliedRange.to],
    queryFn: () =>
      fetchIntegrationTotalCount(sourceName, appliedRange.from, appliedRange.to),
    enabled: Boolean(sourceName) && !zipMode && useServerPaging && appliedRange.from,
  });

  const columns = useMemo(() => columnsFromRows(rows), [rows]);

  function handleLoadWithDates() {
    if (!fromDate || !toDate) {
      toast.error('Select both from and to dates');
      return;
    }
    if (fromDate > toDate) {
      toast.error('Invalid date range');
      return;
    }
    setPage(1);
    setAppliedRange({
      from: formatDateInput(fromDate),
      to: formatDateInput(toDate),
    });
  }

  const serverPagination =
    !zipMode && useServerPaging
      ? {
          page,
          total: totalCount || rows.length,
          onPageChange: setPage,
          loading: isFetching,
        }
      : null;

  return (
    <div className="data-view-page">
      <div className="data-view-toolbar glass-card">
        <div>
          <h2 className="chart-title">{sourceName}</h2>
          <p className="chart-subtitle">
            {zipMode
              ? 'Static datapool (zip) — client paging'
              : `Last fetched: ${lastRun || '—'}`}
          </p>
        </div>

        {!zipMode && (
          <div className="data-view-dates">
            <label>
              From
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
            <button type="button" onClick={handleLoadWithDates}>
              Load
            </button>
            <label className="data-view-toggle">
              <input
                type="checkbox"
                checked={useServerPaging}
                onChange={(e) => {
                  setUseServerPaging(e.target.checked);
                  setPage(1);
                }}
              />
              Server paging (SRCHWITHPAGING)
            </label>
          </div>
        )}
      </div>

      {isLoading ? (
        <RnbLoader variant="page" message="Loading table data" />
      ) : isError ? (
        <div className="rnb-home-message rnb-home-error">
          {error?.message || 'Failed to load data'}
        </div>
      ) : zipMode || appliedRange.from ? (
        <DataGrid
          title="Records"
          subtitle={zipMode ? `${rows.length} rows loaded` : `Page ${page}`}
          columns={columns}
          rows={rows}
          pageSize={pageSize}
          serverPagination={serverPagination}
        />
      ) : (
        <div className="rnb-home-message">Choose a date range and click Load.</div>
      )}
    </div>
  );
}
