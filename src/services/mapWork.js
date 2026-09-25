import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MAP_URL,
  MAP_CREDENTIALS,
  WSMIS_URL,
  BASIC_TOKEN_HEADER,
  FETCH_WORK_DATA_FOR_MAP,
} from '../config/api.config';

export async function fetchMapApiToken() {
  if (!MAP_URL || !MAP_CREDENTIALS?.username) {
    throw new Error('Map service is not configured');
  }
  const response = await fetch(`${MAP_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(MAP_CREDENTIALS),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch map token');
  }
  const data = await response.json();
  return data?.token ?? null;
}

export async function fetchWorkDataForMap({ workId, source = 'Strobes' }) {
  const params = new URLSearchParams({
    Mode: 'Default',
    Source: source,
    WorkId: String(workId),
  });
  const response = await axios.get(
    `${WSMIS_URL}/${FETCH_WORK_DATA_FOR_MAP}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  if (!response.data?.Table?.length) {
    toast.error('No data found for this record');
    return null;
  }
  return response.data.Table[0];
}

export function parseWorkMapGeometry(record) {
  if (!record) return null;
  const startLat = parseFloat(record.StartLatitude);
  const startLon = parseFloat(record.StartLongitude);
  const endLat = parseFloat(record.EndLatitude);
  const endLon = parseFloat(record.EndLongitude);
  if (
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLon) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLon) ||
    (startLat === 0 && startLon === 0 && endLat === 0 && endLon === 0)
  ) {
    return null;
  }
  return {
    workId: record.WorkID,
    description: record.Description ?? '',
    roadCat: record.RoadCat ?? '',
    start: [startLat, startLon],
    end: [endLat, endLon],
  };
}
