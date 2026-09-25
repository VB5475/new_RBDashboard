/** Primary: dashboard2209 --sidebar; secondary: legacy light sidebar. */
const DEFAULT_PRIMARY = '#1a3a6e';
const DEFAULT_SECONDARY = 'rgba(248, 250, 252, 0.95)';

export function applySidebarBackgroundFromConfig(config) {
  const colors = config?.configSideBarColors;
  const primary = colors?.sidebarPrimary ?? DEFAULT_PRIMARY;
  const secondary = colors?.sidebarSecondary ?? DEFAULT_SECONDARY;
  const useSecondary =
    colors?.useSecondarySidebarBackground === true ||
    colors?.sidebarBackgroundVariant === 'secondary';
  const background = useSecondary ? secondary : primary;
  document.documentElement.style.setProperty('--bg-sidebar', background);
  document.documentElement.classList.toggle('sidebar-dark', !useSecondary);
  document.documentElement.classList.toggle('sidebar-light', useSecondary);
}
