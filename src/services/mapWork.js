import axios from 'axios';
import toast from 'react-hot-toast';
import {
  WSMIS_URL,
  BASIC_TOKEN_HEADER,
  FETCH_WORK_DATA_FOR_MAP,
} from '../config/api.config';

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
    !startLat ||
    !startLon ||
    !endLat ||
    !endLon
  ) {
    return null;
  }
  return {
    WorkID: parseFloat(record.WorkID) || record.WorkID,
    StartLatitude: startLat,
    StartLongitude: startLon,
    EndLatitude: endLat,
    EndLongitude: endLon,
    Description: record.Description ?? '',
    RoadCat: record.RoadCat ?? '',
  };
}
