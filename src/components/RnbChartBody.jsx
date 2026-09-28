import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {

  BarChart,

  Bar,

  LineChart,

  Line,

  PieChart,

  Pie,

  Cell,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  LabelList,

  ResponsiveContainer,

} from 'recharts';

import DataGrid from './grid/DataGrid';
import { useTheme } from '../hooks/useTheme';
import {
  barColorAt,
  chartFallbackPalette,
  datasetUsesPerBarColors,
  pieColorAt,
  resolveSeriesColor,
} from '../utils/chartApiColors';

function readChartTheme() {
  if (typeof document === 'undefined') {
    return {
      grid: 'rgba(0,0,0,0.06)',
      axis: '#64748b',
      label: '#334155',
      tooltipBg: '#ffffff',
      tooltipFg: '#0f172a',
      tooltipBorder: 'rgba(0,0,0,0.12)',
    };
  }
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback;
  return {
    grid: v('--chart-grid', 'rgba(0,0,0,0.06)'),
    axis: v('--chart-axis', '#64748b'),
    label: v('--chart-label', '#334155'),
    tooltipBg: v('--bg-elevated', '#ffffff'),
    tooltipFg: v('--text-primary', '#0f172a'),
    tooltipBorder: v('--border-light', 'rgba(0,0,0,0.12)'),
  };
}

function buildChartRows(chart) {

  const { labels = [], datasets = [] } = chart;

  return labels.map((label, i) => {

    const row = { label };

    chart.datasets.forEach((ds) => {

      row[ds.label] = ds.data[i];

    });

    return row;

  });

}



function handleChartAreaClick(onChartClick, state) {

  if (!onChartClick || state?.activeLabel == null) return;

  const series = state.activePayload?.[0]?.dataKey ?? '';

  onChartClick(String(state.activeLabel).trim(), String(series).trim());

}



function barFillCells(dataset, pointCount, seriesIndex, colorPalette) {
  if (!datasetUsesPerBarColors(dataset)) return null;
  return Array.from({ length: pointCount }, (_, i) => (
    <Cell
      key={`cell-${i}`}
      fill={barColorAt(dataset, i, seriesIndex, colorPalette)}
    />
  ));
}



function xAxisLayout(data, size) {

  const longest = data.reduce(

    (max, row) => Math.max(max, String(row.label ?? '').length),

    0,

  );

  const crowded = data.length > 4 || longest > 14;

  return {

    angle: crowded ? -34 : 0,

    textAnchor: crowded ? 'end' : 'middle',

    fontSize: size === 'expanded' ? 11 : 10,

    bottom: crowded ? 28 : 4,

    height: crowded ? 48 : 24,

  };

}



function chartNumericMax(data, seriesKeys) {

  let max = 0;

  for (const row of data) {

    for (const key of seriesKeys) {

      const value = Number(row[key]);

      if (Number.isFinite(value)) max = Math.max(max, value);

    }

  }

  return max;

}



function formatChartValue(value) {

  const n = Number(value);

  if (!Number.isFinite(n)) return '';

  const abs = Math.abs(n);

  if (abs >= 1000) return String(Math.round(n));

  if (Number.isInteger(n)) return String(n);

  if (abs >= 100) return n.toFixed(1).replace(/\.0$/, '');

  if (abs >= 10) return n.toFixed(1).replace(/\.0$/, '');

  if (abs >= 1) return n.toFixed(2).replace(/\.?0+$/, '');

  return n.toFixed(2).replace(/\.?0+$/, '');

}



function yAxisUpperBound(max, withBarLabels) {

  if (max <= 0) return 1;

  const factor = withBarLabels ? 1.18 : 1.08;

  const padded = max * factor;

  if (max >= 1000) return Math.ceil(padded / 100) * 100;

  if (max >= 100) return Math.ceil(padded / 10) * 10;

  if (max >= 10) return Math.ceil(padded);

  return Math.ceil(padded * 10) / 10;

}



function yAxisLayout(data, seriesKeys, size, withBarLabels) {

  const max = chartNumericMax(data, seriesKeys);

  const upper = yAxisUpperBound(max, withBarLabels);

  const sample = formatChartValue(upper) || String(upper);

  const charWidth = size === 'expanded' ? 7.5 : 7;

  const width = Math.min(76, Math.max(52, Math.ceil(sample.length * charWidth) + 14));

  return {

    width,

    domain: [0, upper],

    tickFormatter: (v) => formatChartValue(v),

  };

}



/** Fit bars to plot width; scroll only when categories cannot fit comfortably. */

function responsiveBarMetrics(categoryCount, seriesCount, plotWidth, yAxisWidth, sizeMode) {

  const categories = Math.max(1, categoryCount);

  const series = Math.max(1, seriesCount);

  const plotW = Math.max(160, plotWidth || 0);

  const usable = Math.max(120, plotW - yAxisWidth - 12);

  const slot = usable / categories;

  const idealBar = Math.floor((slot - 10) / series) - 2;

  const cap = sizeMode === 'expanded' ? 36 : 30;



  if (idealBar >= 10 || plotW === 0) {

    return {

      maxBarSize: Math.min(cap, Math.max(8, idealBar || 20)),

      barGap: seriesCount > 1 ? 2 : 4,

      barCategoryGap: seriesCount > 1 ? '12%' : '16%',

      minScrollWidth: null,

    };

  }



  const scrollBarSize = sizeMode === 'expanded' ? 26 : 20;

  const slotMin = series * (scrollBarSize + 2) + 12;

  const minScrollWidth = categories * slotMin + yAxisWidth + 16;

  return {

    maxBarSize: scrollBarSize,

    barGap: 2,

    barCategoryGap: '8%',

    minScrollWidth: minScrollWidth > plotW + 4 ? minScrollWidth : null,

  };

}



function usePlotBox(ref, deps) {

  const [box, setBox] = useState({ width: 0, height: 0 });



  useLayoutEffect(() => {

    const el = ref.current;

    if (!el) return undefined;



    const sync = () => {

      const rect = el.getBoundingClientRect();

      const width = Math.floor(rect.width);

      const height = Math.floor(rect.height);

      if (width > 0 && height > 0) setBox({ width, height });

    };



    sync();

    const observer = new ResizeObserver(sync);

    observer.observe(el);

    return () => observer.disconnect();

  }, deps);



  return box;

}



function ChartFixedLegend({
  chart,
  type,
  data,
  fontSize,
  iconSize,
  roundSwatch,
  colorPalette,
}) {

  if (type === 'pie' && chart.datasets[0]) {

    const pieDs = chart.datasets[0];

    return (

      <ul className="rnb-chart-series-legend" aria-label="Chart legend">

        {data.map((entry, i) => (

          <li key={entry.label ?? i} className="rnb-chart-series-legend-item">

            <span

              className="rnb-chart-series-legend-swatch"

              style={{

                background: pieColorAt(pieDs, i, colorPalette),

                width: iconSize,

                height: iconSize,

                borderRadius: roundSwatch ? '50%' : 2,

              }}

              aria-hidden

            />

            <span className="rnb-chart-series-legend-label" style={{ fontSize }}>

              {entry.label}

            </span>

          </li>

        ))}

      </ul>

    );

  }



  if (!chart?.datasets?.length) return null;

  return (

    <ul className="rnb-chart-series-legend" aria-label="Chart legend">

      {chart.datasets.map((ds, i) => (

        <li key={ds.label ?? i} className="rnb-chart-series-legend-item">

          <span

            className="rnb-chart-series-legend-swatch"

            style={{

              background: resolveSeriesColor(ds, i, colorPalette),

              width: iconSize,

              height: iconSize,

            }}

            aria-hidden

          />

          <span className="rnb-chart-series-legend-label" style={{ fontSize }}>

            {ds.label}

          </span>

        </li>

      ))}

    </ul>

  );

}



export default function RnbChartBody({

  chart,

  showGrid,

  gridData,

  onChartClick,

  size = 'card',

}) {
  const { theme } = useTheme();
  const chartTheme = useMemo(() => readChartTheme(), [theme]);

  const data = buildChartRows(chart);

  const seriesKeys = chart.datasets.map((d) => d.label);

  const type = chart.type || 'bar';

  const seriesCount = seriesKeys.length;

  const plotHostRef = useRef(null);

  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    color: chartTheme.tooltipFg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    borderRadius: 8,
  };



  const bodyClass = [

    'rnb-chart-panel-body',

    showGrid ? 'rnb-chart-panel-body--grid' : 'rnb-chart-panel-body--chart',

    size === 'expanded' ? 'rnb-chart-panel-body--expanded' : '',

  ]

    .filter(Boolean)

    .join(' ');



  const plotBox = usePlotBox(plotHostRef, [

    showGrid,

    size,

    data.length,

    seriesCount,

    type,

  ]);

  const colorPalette = useMemo(
    () => chartFallbackPalette(type, seriesCount),
    [type, seriesCount],
  );

  const xLayout = type !== 'pie' ? xAxisLayout(data, size) : null;

  const showBarValueLabels = type === 'bar';

  const showLineValueLabels = type === 'line' && seriesCount === 1;

  const yLayout =

    type !== 'pie' ? yAxisLayout(data, seriesKeys, size, showBarValueLabels) : null;



  const barMetrics = useMemo(() => {

    if (type !== 'bar') return null;

    return responsiveBarMetrics(

      data.length,

      seriesCount,

      plotBox.width,

      yLayout?.width ?? 56,

      size,

    );

  }, [type, data.length, seriesCount, plotBox.width, yLayout?.width, size]);



  const chartMargin = {

    top: showBarValueLabels ? (seriesCount > 1 ? 28 : 22) : showLineValueLabels ? 18 : 8,

    right: 8,

    left: 4,

    bottom: xLayout?.bottom ?? 4,

  };



  const barLabelFontSize =

    seriesCount > 1 ? (size === 'expanded' ? 9 : 8) : size === 'expanded' ? 11 : 10;



  const labelListProps = {

    position: 'top',

    offset: 4,

    fontSize: barLabelFontSize,

    fill: chartTheme.label,

    formatter: (value) => formatChartValue(value),

  };



  const legendFontSize = seriesCount > 5 ? 10 : 11;

  const legendIconSize = seriesCount > 5 ? 8 : 10;



  const useHorizontalScroll = Boolean(barMetrics?.minScrollWidth);

  const plotAreaClass = useHorizontalScroll

    ? 'rnb-chart-plot-area rnb-chart-hscroll'

    : 'rnb-chart-plot-area';



  const slotStyle = useHorizontalScroll

    ? { minWidth: barMetrics.minScrollWidth, width: '100%', height: '100%' }

    : { width: '100%', height: '100%' };



  const renderBarChart = () => (

    <BarChart

      data={data}

      margin={chartMargin}

      barCategoryGap={barMetrics?.barCategoryGap}

      barGap={barMetrics?.barGap}

      onClick={(state) => handleChartAreaClick(onChartClick, state)}

    >

      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />

      <XAxis

        dataKey="label"

        interval={0}

        height={xLayout.height}

        tick={{

          fontSize: xLayout.fontSize,

          angle: xLayout.angle,

          textAnchor: xLayout.textAnchor,

          fill: chartTheme.axis,

        }}

      />

      <YAxis

        width={yLayout.width}

        domain={yLayout.domain}

        tick={{ fontSize: size === 'expanded' ? 11 : 10, fill: chartTheme.axis }}

        tickFormatter={yLayout.tickFormatter}

        allowDecimals={yLayout.domain[1] < 20}

      />

      <Tooltip
        formatter={(value) => formatChartValue(value)}
        contentStyle={tooltipStyle}
        labelStyle={{ color: chartTheme.tooltipFg }}
        itemStyle={{ color: chartTheme.tooltipFg }}
      />

      {seriesKeys.map((key, i) => {
        const ds = chart.datasets[i];
        const perBarColors = datasetUsesPerBarColors(ds);
        return (
        <Bar

          key={key}

          dataKey={key}

          fill={perBarColors ? 'transparent' : resolveSeriesColor(ds, i, colorPalette)}

          maxBarSize={barMetrics?.maxBarSize ?? 32}

          radius={[3, 3, 0, 0]}

        >

          {showBarValueLabels ? <LabelList dataKey={key} {...labelListProps} /> : null}

          {barFillCells(ds, data.length, i, colorPalette)}

        </Bar>
        );
      })}

    </BarChart>

  );



  const renderLineChart = () => (

    <LineChart

      data={data}

      margin={chartMargin}

      onClick={(state) => handleChartAreaClick(onChartClick, state)}

    >

      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />

      <XAxis

        dataKey="label"

        interval={0}

        height={xLayout.height}

        tick={{

          fontSize: xLayout.fontSize,

          angle: xLayout.angle,

          textAnchor: xLayout.textAnchor,

          fill: chartTheme.axis,

        }}

      />

      <YAxis

        width={yLayout.width}

        domain={yLayout.domain}

        tick={{ fontSize: size === 'expanded' ? 11 : 10, fill: chartTheme.axis }}

        tickFormatter={yLayout.tickFormatter}

        allowDecimals={yLayout.domain[1] < 20}

      />

      <Tooltip
        formatter={(value) => formatChartValue(value)}
        contentStyle={tooltipStyle}
        labelStyle={{ color: chartTheme.tooltipFg }}
        itemStyle={{ color: chartTheme.tooltipFg }}
      />

      {seriesKeys.map((key, i) => {
        const stroke = resolveSeriesColor(chart.datasets[i], i, colorPalette);
        return (
        <Line

          key={key}

          type="monotone"

          dataKey={key}

          stroke={stroke}

          strokeWidth={2}

          dot={{ r: 3, fill: stroke, stroke }}

        >

          {showLineValueLabels ? <LabelList dataKey={key} {...labelListProps} /> : null}

        </Line>
        );
      })}

    </LineChart>

  );



  const renderPieChart = () => (

    <PieChart onClick={(state) => handleChartAreaClick(onChartClick, state)}>

      <Pie

        data={data}

        dataKey={seriesKeys[0]}

        nameKey="label"

        cx="50%"

        cy="50%"

        outerRadius="72%"

        label

      >

        {data.map((entry, i) => {
          const pieDs = chart.datasets[0];
          return (
            <Cell key={entry.label ?? i} fill={pieColorAt(pieDs, i, colorPalette)} />
          );
        })}

      </Pie>

      <Tooltip
        contentStyle={tooltipStyle}
        labelStyle={{ color: chartTheme.tooltipFg }}
        itemStyle={{ color: chartTheme.tooltipFg }}
      />

    </PieChart>

  );



  const renderResponsiveChart = () => {

    if (type === 'pie') return renderPieChart();

    if (type === 'line') return renderLineChart();

    return renderBarChart();

  };



  return (

    <div className={bodyClass}>

      {showGrid ? (

        <DataGrid

          plain

          embedded

          columns={gridData.columns}

          rows={gridData.rows}

          pageSize={100}

          enableColumnFilters={false}

          emptyMessage="No chart data"

        />

      ) : (

        <div className="rnb-chart-with-fixed-legend">

          <div ref={plotHostRef} className={plotAreaClass}>

            <div className="rnb-chart-responsive-slot" style={slotStyle}>

              <ResponsiveContainer width="100%" height="100%">

                {renderResponsiveChart()}

              </ResponsiveContainer>

            </div>

          </div>

          <ChartFixedLegend

            chart={chart}

            type={type}

            data={data}

            fontSize={legendFontSize}

            iconSize={legendIconSize}

            roundSwatch={type === 'pie'}

            colorPalette={colorPalette}

          />

        </div>

      )}

    </div>

  );

}


