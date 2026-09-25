import axios from 'axios';
import {
  WSMIS_URL,
  BASIC_TOKEN_HEADER,
  FETCH_API_DATA,
  LIST,
  SEARCH_WITH_PAGING,
  GET_TOTAL_COUNT,
  FETXHAPILOG_LASTRUN_DETAIL,
  DATAPOOL_RESOURCE,
  loadZipData,
} from '../config/api.config';
import { getUserToken } from '../utils/session';

export async function fetchLastRunDetail(sourceName) {
  const params = new URLSearchParams({
    SourceName: sourceName.trim(),
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WSMIS_URL}/${FETXHAPILOG_LASTRUN_DETAIL}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return response.data?.Table?.[0]?.LastFetched ?? '';
}

async function fetchApiTable(mode, { sourceName, pageSize, pageNumber, fromDate, toDate }) {
  const params = new URLSearchParams({
    SourceName: sourceName.toUpperCase(),
    Mode: mode,
    PageSize: String(pageSize),
    PageNumber: String(pageNumber),
    FromDate: fromDate,
    ToDate: toDate,
    LoginID: getUserToken(),
  });
  const response = await axios.get(`${WSMIS_URL}/${FETCH_API_DATA}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });
  if (response.data?.ErrMsg?.[0]?.ErrCode === '-1') {
    throw new Error(response.data.ErrMsg[0]?.ErrMsg || 'Failed to load data');
  }
  return response.data?.Table ?? [];
}

export async function fetchIntegrationTotalCount(sourceName, fromDate, toDate) {
  const rows = await fetchApiTable(GET_TOTAL_COUNT, {
    sourceName,
    pageSize: 50,
    pageNumber: 1,
    fromDate,
    toDate,
  });
  return rows[0]?.RecCnt ?? 0;
}

export async function fetchIntegrationPaged({
  sourceName,
  pageSize = 50,
  pageNumber = 1,
  fromDate = '',
  toDate = '',
}) {
  return fetchApiTable(SEARCH_WITH_PAGING, {
    sourceName,
    pageSize,
    pageNumber,
    fromDate,
    toDate,
  });
}

export async function fetchIntegrationList({
  sourceName,
  pageSize = 50,
  pageNumber = 1,
  fromDate = '',
  toDate = '',
}) {
  return fetchApiTable(LIST, {
    sourceName,
    pageSize,
    pageNumber,
    fromDate,
    toDate,
  });
}

export async function fetchZipGridRows(sourceName) {
  const resourcePath = `${import.meta.env.BASE_URL}${DATAPOOL_RESOURCE}/${DATAPOOL_RESOURCE}/${sourceName}.zip`;
  const zip = await loadZipData(resourcePath);
  const jsonKey = `${sourceName}/${sourceName}.json`;
  const payload = zip[jsonKey];
  return payload?.Table ?? [];
}
