const FILTER_KEY = 'filterStatesPageWise';
const SESSION_KEY = 'allChartsSessionIdStatePageWise';

export function setFilterStringsForMenu(menuCode, filterMap) {
  if (!menuCode || !filterMap) return;
  try {
    const all = JSON.parse(sessionStorage.getItem(FILTER_KEY)) || {};
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({ ...all, [menuCode]: filterMap }));
  } catch (e) {
    console.error(e);
  }
}

export function getFilterStringsForMenu(menuCode) {
  if (!menuCode) return null;
  try {
    const all = JSON.parse(sessionStorage.getItem(FILTER_KEY));
    return all?.[menuCode] ?? null;
  } catch {
    return null;
  }
}

export function setSessionIdsForMenu(menuCode, sessionMap) {
  if (!menuCode || !sessionMap) return;
  try {
    const all = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...all, [menuCode]: sessionMap }));
  } catch (e) {
    console.error(e);
  }
}

export function getSessionIdsForMenu(menuCode) {
  if (!menuCode) return null;
  try {
    const all = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return all?.[menuCode] ?? null;
  } catch {
    return null;
  }
}
