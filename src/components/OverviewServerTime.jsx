import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import {
  fetchServerDateTime,
  formatServerDateTime,
  serverDateTimeHasClock,
} from '../services/serverTime';
import './OverviewServerTime.css';

const REFETCH_MS = 60_000;
const TICK_MS = 1000;

export default function OverviewServerTime({ variant = 'header' }) {
  const { data: serverIso, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['rnb-server-date'],
    queryFn: fetchServerDateTime,
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
    retry: 1,
  });

  const hasClock = useMemo(
    () => (serverIso ? serverDateTimeHasClock(serverIso) : false),
    [serverIso],
  );

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!serverIso || !hasClock) return undefined;
    const id = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [serverIso, hasClock]);

  const anchorMs = useMemo(() => {
    if (!serverIso || !hasClock) return null;
    const parsed = new Date(serverIso).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [serverIso, hasClock]);

  const fetchedAtMs = dataUpdatedAt || 0;

  const display = useMemo(() => {
    if (!serverIso) return null;
    if (hasClock && anchorMs != null && fetchedAtMs) {
      const live = new Date(anchorMs + (Date.now() - fetchedAtMs));
      return formatServerDateTime(live.toISOString());
    }
    return formatServerDateTime(serverIso, { dateOnly: !hasClock });
  }, [serverIso, hasClock, anchorMs, fetchedAtMs, tick]);

  const label = hasClock ? 'Server time' : 'Server date';
  const isHeader = variant === 'header';

  const valueText =
    isLoading && !display ? 'Syncing…' : isError ? 'Unavailable' : display ?? '—';

  return (
    <div
      className={`overview-server-time overview-server-time--${variant}${isError ? ' overview-server-time--error' : ''}`}
      aria-live="polite"
      title={`${label} (IST)`}
    >
      <span className="overview-server-time-icon" aria-hidden>
        <Clock size={isHeader ? 16 : 18} strokeWidth={2} />
      </span>
      <div className="overview-server-time-text">
        {!isHeader ? (
          <span className="overview-server-time-label">{label}</span>
        ) : null}
        <span className="overview-server-time-value">{valueText}</span>
      </div>
      <span className="overview-server-time-zone">IST</span>
    </div>
  );
}
