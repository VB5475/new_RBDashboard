import axios from 'axios';
import {
  WS_DASH_URL,
  BASIC_TOKEN_HEADER,
  FETCH_OBJECTWISE_FILTERS,
  FETCH_FILTERWISE_DATA,
  FETCH_OBJECTWISE_DATASET_FILTERED,
  FILTER_VALUE_SELECTED,
} from '../config/api.config';
import { getUserToken } from '../utils/session';

function norm(s) {
  return String(s ?? '').trim();
}

export function normalizeControlType(controlType) {
  return norm(controlType).toUpperCase();
}

/** Legacy drawer only renders filters with Visibility === YES (and not HIDDEN controls). */
export function isFilterVisible(filter) {
  if (norm(filter?.visibility).toUpperCase() !== 'YES') return false;
  if (normalizeControlType(filter?.controlType) === 'HIDDEN') return false;
  return true;
}

function isDateControl(controlType) {
  const t = normalizeControlType(controlType);
  return t === 'DATE' || t === 'FTDATE';
}

function shouldFetchPicklistValues(controlType) {
  const t = normalizeControlType(controlType);
  if (isDateControl(t)) return false;
  if (t === 'HIDDEN') return false;
  return true;
}

export function formatPicklistValues(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const first = rows[0];
  if (first == null) return [];
  if (typeof first !== 'object') {
    return rows.map((r) => ({ label: String(r), value: String(r) }));
  }

  const keys = Object.keys(first);
  const keyMatch = (candidates) =>
    keys.find((k) => candidates.includes(k.toLowerCase()));

  const idKey =
    keyMatch(['idnumber', 'id', 'value', 'code', 'key']) ??
    keys[0];
  const nameKey =
    keyMatch(['name', 'label', 'text', 'description', 'displayname']) ??
    keys[1] ??
    keys[0];

  if ('IDNumber' in first && 'Name' in first) {
    return rows.map((r) => ({
      label: String(r.Name ?? ''),
      value: String(r.IDNumber ?? ''),
    }));
  }

  return rows.map((r) => ({
    label: String(r[nameKey] ?? r[idKey] ?? ''),
    value: String(r[idKey] ?? r[nameKey] ?? ''),
  }));
}

async function fetchFilterPicklistValues(sessionId, filterId) {
  if (sessionId == null || sessionId === '') return [];

  const valueParams = new URLSearchParams({
    SessionID: String(sessionId),
    FilterID: String(filterId),
    LoginID: getUserToken(),
  });

  try {
    const valueRes = await axios.get(
      `${WS_DASH_URL}/${FETCH_FILTERWISE_DATA}?${valueParams}`,
      { headers: BASIC_TOKEN_HEADER },
    );
    return formatPicklistValues(valueRes.data?.Table ?? []);
  } catch {
    return [];
  }
}

function mapFilterRow(filter, sessionId) {
  return {
    displayName: filter.DisplayName,
    idnumber: filter.Ref_FilterID,
    objectId: filter.Ref_ObjectID,
    controlType: filter.ControlType,
    visibility: filter.Visibility,
    defValForAllData: filter.DefValForAllData,
    isCascadingControl: filter.IsCascadingControl,
    sortKey: filter.SeqNo ?? filter.FilterSeqNo ?? filter.lnkSeqNo ?? 0,
    sessionid: sessionId,
    Values: [],
  };
}

export async function fetchObjectFilters(objectId, sessionId) {
  const params = new URLSearchParams({
    ObjectID: objectId,
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${FETCH_OBJECTWISE_FILTERS}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );

  const table = response.data?.Table ?? [];

  const results = await Promise.all(
    table.map(async (filter) => {
      const base = mapFilterRow(filter, sessionId);

      if (shouldFetchPicklistValues(filter.ControlType)) {
        base.Values = await fetchFilterPicklistValues(
          sessionId,
          filter.Ref_FilterID,
        );
      }

      return base;
    }),
  );

  return results.sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
}

export function buildDefaultFilterString(filters = []) {
  return filters.map((f) => `${f.idnumber}=${f.defValForAllData};`).join('');
}

function selectionToFilterPart(filter, selected) {
  const type = normalizeControlType(filter.controlType);

  if (type === 'FTDATE' && selected?.fromDate && selected?.toDate) {
    return `${filter.idnumber}=${selected.fromDate}||${selected.toDate};`;
  }
  if (type === 'DATE' && selected?.date) {
    return `${filter.idnumber}=${selected.date};`;
  }
  if (selected?.value != null && selected?.value !== '') {
    return `${selected.FilterID ?? filter.idnumber}=${selected.value};`;
  }
  return `${filter.idnumber}=${filter.defValForAllData};`;
}

export async function applyWidgetFilters(objectId, sessionId, filters, selections) {
  const parts = filters.map((filter, i) =>
    selectionToFilterPart(filter, selections[i]),
  );

  const filterString = parts.join('');
  const params = new URLSearchParams({
    ObjectID: String(objectId),
    FilterSeldVals: filterString,
    SessionID: String(sessionId),
    LoginID: getUserToken(),
  });

  const response = await axios.get(
    `${WS_DASH_URL}/${FETCH_OBJECTWISE_DATASET_FILTERED}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );

  return { filterString, data: response.data };
}

function cascadeValueTables(responseData) {
  if (!responseData || typeof responseData !== 'object') return [];
  return Object.keys(responseData).filter(
    (key) => key !== 'Table' && Array.isArray(responseData[key]),
  );
}

export async function cascadeFilterSelection(sessionId, filterId, selectedValue) {
  const rawValue = selectedValue?.value ?? selectedValue;
  const params = new URLSearchParams({
    SessionID: String(sessionId),
    FilterID: String(filterId),
    SelectedValue: rawValue,
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${FILTER_VALUE_SELECTED}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );

  const table = response.data?.Table ?? [];
  const valueKeys = cascadeValueTables(response.data);

  return table.map((item, index) => {
    const valueKey = valueKeys[index];
    const values = formatPicklistValues(
      valueKey ? response.data[valueKey] ?? [] : [],
    );
    return {
      ...item,
      Values: values,
    };
  });
}
