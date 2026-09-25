const DEFAULT_MAIN = { r: 25, g: 118, b: 210 };
const DEFAULT_SECOND = { r: 255, g: 255, b: 255 };

function rgba(c, a) {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

/** CSS custom properties matching legacy sidebarTheme.js */
export function getSidebarCssVars(config = null) {
  const main = config?.mainColor ?? DEFAULT_MAIN;
  const second = config?.secondMainColor ?? DEFAULT_SECOND;
  const isBgWhite = main.r === 255 && main.g === 255 && main.b === 255;

  return {
    '--sidebar-main': rgba(main, 1),
    '--sidebar-main-90': rgba(main, 0.9),
    '--sidebar-main-50': rgba(main, 0.5),
    '--sidebar-main-20': rgba(main, 0.2),
    '--sidebar-main-06': rgba(main, 0.06),
    '--sidebar-text': rgba(second, 1),
    '--sidebar-text-90': rgba(second, 0.9),
    '--sidebar-text-50': rgba(second, 0.5),
    '--sidebar-text-20': rgba(second, 0.2),
    '--sidebar-text-06': rgba(second, 0.06),
    '--sidebar-hover-bg': rgba(second, 0.2),
    '--sidebar-nav-group-hover': rgba(second, 1),
    '--sidebar-icon': rgba(second, 1),
    '--sidebar-icon-active': rgba(main, 1),
    '--sidebar-divider': rgba(second, 1),
    '--sidebar-is-light-bg': isBgWhite ? '1' : '0',
    '--sidebar-bg': rgba(main, 1),
    '--sidebar-bg-expanded': rgba(main, 0.9),
    '--sidebar-search-bg': isBgWhite ? rgba(second, 0.06) : rgba(second, 0.06),
    '--sidebar-search-border': isBgWhite ? rgba(second, 0.2) : rgba(second, 0.2),
  };
}
