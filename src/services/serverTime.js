import axios from 'axios';
import { BASIC_TOKEN_HEADER, DASHBOARD_URL, GET_SERVER_DATE } from '../config/api.config';

/** @returns {Promise<string|null>} ISO-ish datetime from wsWDMS fnGetServerDate */
export async function fetchServerDateTime() {
  const response = await axios.get(`${DASHBOARD_URL}/${GET_SERVER_DATE}`, {
    headers: BASIC_TOKEN_HEADER,
  });
  const raw = response?.data?.Table?.[0]?.CurrentDate;
  if (raw == null || raw === '') return null;
  return String(raw).trim();
}

export function serverDateTimeHasClock(iso) {
  if (!iso || !String(iso).includes('T')) return false;
  const normalized = String(iso).trim();
  return !/^[\d-]+T00:00:00(\.0+)?$/i.test(normalized);
}

export function formatServerDateTime(iso, { dateOnly = false } = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);

  const opts = { timeZone: 'Asia/Kolkata' };
  if (dateOnly || !serverDateTimeHasClock(iso)) {
    return d.toLocaleDateString('en-IN', {
      ...opts,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return d.toLocaleString('en-IN', {
    ...opts,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
