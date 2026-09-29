import axios from 'axios';
import {
  WS_DASH_URL,
  BASIC_TOKEN_HEADER,
  FETCH_MENU_CODEWISE_OBJECTLIST,
  FETCH_OBJECTWISE_DATASET,
  CREATE_NEWSESSION_FOR_OBJECT_FILTER_REQUEST,
} from '../config/api.config';
import { getUserToken } from '../utils/session';
import { fetchObjectFilters, buildDefaultFilterString } from './filters';
import {
  setFilterStringsForMenu,
  setSessionIdsForMenu,
} from '../utils/chartSessionStorage';
import {
  SINGLE_SERIES_BAR_FALLBACK,
  chartFallbackPalette,
  normalizeApiColor,
  rowColour,
  seriesColourFromTable2,
} from '../utils/chartApiColors';

/**
 * Build Chart.js-style datasets from API Table1/Table2 (R-BDashboard HomeNew dataSetsGiver).
 */
export function chartDatasetsFromTable(tablePayload, chartType) {
  const table1 = tablePayload?.Table1;
  if (!Array.isArray(table1) || !table1.length) {
    return { labels: [], datasets: [] };
  }

  const labelKeys = Object.keys(table1[0]).filter(
    (key) => !['ID', 'Colour', 'Color', 'XAxisLabel'].includes(key.trim()),
  );

  const chartTypeNorm = String(chartType ?? '').toUpperCase();
  const table2 = tablePayload?.Table2;
  const isMultiSeries = labelKeys.length > 1 && Array.isArray(table2) && table2.length > 0;
  const palette = chartFallbackPalette(chartTypeNorm, labelKeys.length);

  const datasets = labelKeys.map((labelKey, seriesIndex) => {
    let color = palette[seriesIndex % palette.length];

    if (chartTypeNorm === 'PIE') {
      color = table1.map((row, i) =>
        rowColour(row, palette[i % palette.length]),
      );
    } else if (isMultiSeries) {
      color =
        seriesColourFromTable2(table2, labelKey) ||
        palette[seriesIndex % palette.length];
    } else {
      color = SINGLE_SERIES_BAR_FALLBACK;
    }

    if (typeof color === 'string') {
      color = normalizeApiColor(color, palette[seriesIndex % palette.length]);
    } else if (Array.isArray(color)) {
      color = color.map((c, i) =>
        normalizeApiColor(c, palette[i % palette.length]),
      );
    }

    return {
      label: labelKey,
      data: table1.map((row) => (row[labelKey] === 0 ? null : row[labelKey])),
      backgroundColor: color,
      borderColor: color,
    };
  });

  const labels = table1.map((row) => row.XAxisLabel);
  return { labels, datasets };
}

export async function createFilterSession(objectId) {
  const params = new URLSearchParams({
    ObjectID: objectId,
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${CREATE_NEWSESSION_FOR_OBJECT_FILTER_REQUEST}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return response.data?.Table?.[0]?.SessionID ?? null;
}

export async function fetchObjectDataset(objectId) {
  const params = new URLSearchParams({
    ObjectID: objectId,
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${FETCH_OBJECTWISE_DATASET}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return response.data;
}

export async function fetchHomeWidgets(menuCode, options = {}) {
  const { persistSession = true } = options;
  if (!menuCode) throw new Error('Menu code is required');

  const listParams = new URLSearchParams({
    MenuCode: menuCode,
    LoginID: getUserToken(),
  });

  const listResponse = await axios.get(
    `${WS_DASH_URL}/${FETCH_MENU_CODEWISE_OBJECTLIST}?${listParams}`,
    { headers: BASIC_TOKEN_HEADER },
  );

  const objects = listResponse.data?.Table;
  if (!Array.isArray(objects) || !objects.length) {
    return { cards: [], charts: [], errors: [] };
  }

  const sessionMap = {};
  const filterStringMap = {};

  const results = await Promise.allSettled(
    objects.map(async (obj) => {
      const objectId = obj.Ref_MenuID;
      const viewType = obj.Ref_ViewType?.trim();
      const sessionId = await createFilterSession(objectId);
      sessionMap[objectId] = sessionId;

      const filters = await fetchObjectFilters(objectId, sessionId);
      const filterString = buildDefaultFilterString(filters);
      filterStringMap[objectId] = filterString;

      const dataset = await fetchObjectDataset(objectId);
      const objectType = viewType;
      const isDrillDown = obj.IsDrillDownPresent?.trim?.() === 'YES';

      if (viewType === 'CARD') {
        return {
          kind: 'card',
          id: objectId,
          title: obj.Ref_MenuTitle,
          columnSpan: obj.ColumnSpan,
          rows: dataset?.Table1 ?? [],
          objectType,
          sessionId,
          filters,
          filterString,
          isDrillDown,
        };
      }

      if (viewType === 'CHART') {
        const chartType = obj.Ref_ChartType?.trim()?.toUpperCase() || 'BAR';
        const { labels, datasets } = chartDatasetsFromTable(dataset, chartType);
        return {
          kind: 'chart',
          id: objectId,
          title: obj.Ref_MenuTitle,
          type: chartType.toLowerCase(),
          columnSpan: obj.ColumnSpan,
          labels,
          datasets,
          xAxisTitle: obj.xAxisTitle,
          yAxisTitle: obj.yAxisTitle,
          objectType,
          sessionId,
          filters,
          filterString,
          isDrillDown,
        };
      }

      return { kind: 'unknown', id: objectId, title: obj.Ref_MenuTitle };
    }),
  );

  if (persistSession) {
    setSessionIdsForMenu(menuCode, sessionMap);
    setFilterStringsForMenu(menuCode, filterStringMap);
  }

  const cards = [];
  const charts = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.kind === 'card') cards.push(value);
      else if (value.kind === 'chart') charts.push(value);
    } else {
      errors.push({
        objectId: objects[index]?.Ref_MenuID,
        message: result.reason?.message,
      });
    }
  });

  return { cards, charts, errors };
}
