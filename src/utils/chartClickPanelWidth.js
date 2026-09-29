/** Comfortable per-column width + chrome (side rail, padding, footer). */
const COL_WIDTH_PX = 200;
const GRID_CHROME_PX = 96;
/** Keep header/actions readable even with few columns. */
const PANEL_MIN_PX = 640;

export function chartClickPanelWidthPx(columnCount) {
  const n = Math.max(1, Number(columnCount) || 1);
  return Math.max(PANEL_MIN_PX, n * COL_WIDTH_PX + GRID_CHROME_PX);
}
