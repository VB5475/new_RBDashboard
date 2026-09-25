/**
 * Build grid rows/columns from chart widget data (legacy HomeNew setChartGridData).
 */
export function chartGridFromWidget(chart) {
  if (!chart?.datasets?.length) {
    return { rows: [], columns: [] };
  }

  const type = (chart.type || 'bar').toLowerCase();

  if (type === 'pie') {
    const columns = [
      { key: 'label', label: 'Name' },
      { key: 'value', label: 'Value', align: 'right' },
    ];
    let total = 0;
    const rows = (chart.labels || []).map((label, index) => {
      let value = chart.datasets[0].data[index];
      if (value === '' || value == null) value = '0';
      total += Number(value) || 0;
      return { label, value, _rowKey: index };
    });

    const hasTotalRow = (chart.labels || []).some(
      (s) => String(s).toLowerCase() === 'total',
    );
    if (!hasTotalRow) {
      rows.push({ label: 'Total', value: total, _rowKey: 'total' });
    }
    return { rows, columns };
  }

  const columns = [{ key: 'label', label: 'LABEL' }];
  const seriesKeys = chart.datasets.map((ds) => {
    columns.push({ key: ds.label, label: ds.label, align: 'right' });
    return ds.label;
  });

  const totals = seriesKeys.map(() => 0);
  const rows = (chart.labels || []).map((label, j) => {
    const row = { label, _rowKey: j };
    seriesKeys.forEach((key, index) => {
      const raw = chart.datasets[index].data[j];
      row[key] = raw;
      if (String(label).toLowerCase() !== 'total') {
        totals[index] += Number(raw ?? 0) || 0;
      }
    });
    return row;
  });

  const hasTotalRow = (chart.labels || []).some(
    (s) => String(s).toLowerCase() === 'total',
  );
  if (!hasTotalRow) {
    const totalRow = { label: 'Total', _rowKey: 'total' };
    seriesKeys.forEach((key, index) => {
      totalRow[key] = totals[index];
    });
    rows.push(totalRow);
  }

  return { rows, columns };
}
