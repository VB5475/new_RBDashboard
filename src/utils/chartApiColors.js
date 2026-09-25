/**
 * Default chart colours — aligned with R-BDashboard HomeChartWrapper.jsx
 * (StatusColors / AllColors) and HomeNew.jsx single-series bar (#2196f3).
 */

/** Single-series bar when Table1 has no per-row Colour (HomeNew dataSetsGiver). */
export const SINGLE_SERIES_BAR_FALLBACK = '#2196f3';

/** Bar charts with more than 4 series (HomeChartWrapper StatusColors). */
export const STATUS_CHART_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEEAD',
  '#D4A5A5',
  '#9FA4C4',
];

/** Default multi-series / pie slice fallbacks (HomeChartWrapper AllColors). */
export const ALL_CHART_COLORS = [
  ...STATUS_CHART_COLORS,
  '#CC99FF',
];

/** @deprecated Use ALL_CHART_COLORS or chartFallbackPalette() */
export const CHART_FALLBACK_COLORS = ALL_CHART_COLORS;

export function chartFallbackPalette(chartType, seriesCount) {
  const type = String(chartType ?? '').toLowerCase();
  if (type === 'bar' && seriesCount > 4) return STATUS_CHART_COLORS;
  return ALL_CHART_COLORS;
}

export function normalizeApiColor(value, fallback = '') {
  if (value == null || value === '') return fallback;
  const s = String(value).trim();
  if (!s) return fallback;
  if (/^#?[0-9a-fA-F]{3,8}$/.test(s)) {
    return s.startsWith('#') ? s : `#${s}`;
  }
  if (/^(rgb|hsl)a?\(/i.test(s)) return s;
  return s;
}

export function rowColour(row, fallback = '') {
  return normalizeApiColor(row?.Colour ?? row?.Color, fallback);
}

export function seriesColourFromTable2(table2, labelKey) {
  if (!Array.isArray(table2) || !labelKey) return '';
  const key = labelKey.trim().toLowerCase();
  const row = table2.find((t) => t.YAxisLabel?.trim().toLowerCase() === key);
  return rowColour(row, '');
}

export function resolveSeriesColor(
  dataset,
  seriesIndex,
  fallbacks = ALL_CHART_COLORS,
) {
  const raw = dataset?.backgroundColor ?? dataset?.borderColor;
  if (typeof raw === 'string') {
    const c = normalizeApiColor(raw, '');
    if (c) return c;
  }
  if (Array.isArray(raw) && raw.length) {
    const c = normalizeApiColor(raw[0], '');
    if (c) return c;
  }
  return fallbacks[seriesIndex % fallbacks.length];
}

export function datasetUsesPerBarColors(dataset) {
  return Array.isArray(dataset?.backgroundColor) && dataset.backgroundColor.length > 0;
}

export function barColorAt(
  dataset,
  pointIndex,
  seriesIndex,
  fallbacks = ALL_CHART_COLORS,
) {
  const raw = dataset?.backgroundColor ?? dataset?.borderColor;
  if (Array.isArray(raw)) {
    return normalizeApiColor(
      raw[pointIndex],
      fallbacks[pointIndex % fallbacks.length],
    );
  }
  return resolveSeriesColor(dataset, seriesIndex, fallbacks);
}

export function pieColorAt(dataset, pointIndex, fallbacks = ALL_CHART_COLORS) {
  return barColorAt(dataset, pointIndex, 0, fallbacks);
}
