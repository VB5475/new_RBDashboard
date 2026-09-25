/** Route for the cross-module status page (DSH_OVRVW catalog). */
export const ALL_MODULES_PATH = '/all-modules';
export const ALL_MODULES_LABEL = 'Dashboard Overview';

/** API menu path for Dashboard Overview (DSH_OVRVW). */
export const DSH_OVERVIEW_PATH = '/dashboard/dsh-overview';

export function isOverviewRoutePath(path) {
  const p = path?.trim();
  if (!p) return false;
  if (p === ALL_MODULES_PATH || p === DSH_OVERVIEW_PATH) return true;
  return /\/dsh-overview\/?$/i.test(p);
}

/** React routes that render the overview page (aliases + user-specific path). */
export function overviewPathsToRegister(allowedRoutes = []) {
  const paths = new Set([ALL_MODULES_PATH, DSH_OVERVIEW_PATH]);
  allowedRoutes.filter(isOverviewRoutePath).forEach((p) => paths.add(p.trim()));
  return [...paths];
}

export function canAccessOverview(allowedRoutes = []) {
  return allowedRoutes.some(isOverviewRoutePath);
}

export function pickOverviewNavPath(allowedRoutes = []) {
  return allowedRoutes.find(isOverviewRoutePath) || DSH_OVERVIEW_PATH;
}

/** First screen after login and for `/` redirect. */
export function pickDefaultLandingPath(allowedRoutes = []) {
  if (canAccessOverview(allowedRoutes)) {
    return pickOverviewNavPath(allowedRoutes);
  }
  if (allowedRoutes.includes('/home')) return '/home';
  const first = allowedRoutes.find((p) => typeof p === 'string' && p.startsWith('/'));
  if (first) return first;
  return DSH_OVERVIEW_PATH;
}
