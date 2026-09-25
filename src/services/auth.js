import axios from 'axios';
import toast from 'react-hot-toast';
import {
  DASHBOARD_URL,
  BASIC_TOKEN_HEADER,
  VALIDATE_USER,
  GET_MENU_RIGHT_BASED,
} from '../config/api.config';
import { persistSession } from '../utils/session';

const isURL = (str) => /^https?:\/\//.test(str);

function parseRouteJson(raw) {
  if (!raw?.trim()) return null;
  try {
    const normalized = raw
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')
      .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, ': "$1"');
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

export async function fetchMenuRights(userID, moduleCode = 'DSH', baseUser = {}) {
  const params = new URLSearchParams({
    LoginCode: userID,
    DivCode: 'RNB',
    ParentCode: '',
    ModuleCode: moduleCode,
    prmLangCode: 'en-US',
  });

  const result = await axios.get(`${DASHBOARD_URL}/${GET_MENU_RIGHT_BASED}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });

  const links = result?.data?.Links;
  if (!links?.length) {
    const msg = result?.data?.ErrMsg?.[0]?.ErrMsg || result?.data?.ErrMsg;
    if (msg) toast.error(msg);
    return null;
  }

  const firstLevel = links.filter((item) => item.Level === 'FirstLevel');
  const secondLevel = links.filter((item) => item.Level === 'SecondLevel');

  const userRights = firstLevel.map((parent) => ({
    ...parent,
    children: secondLevel.filter(
      (child) => child.parentcode.trim() === parent.code.trim(),
    ),
  }));

  const allowedRoutes = [];
  const registeringRoutes = [];

  const registerMenuPath = (entry) => {
    const route = parseRouteJson(entry.RouteJson);
    if (route) registeringRoutes.push(route);
    const path = isURL(entry.formobjname)
      ? entry.formobjname
      : entry.formobjname?.replace(/[\r\n]/g, '') || '/*';
    allowedRoutes.push(path);
  };

  userRights.forEach((right) => {
    if (!right.children?.length) {
      registerMenuPath(right);
      return;
    }
    right.children.forEach((child) => registerMenuPath(child));
  });

  const merged = {
    ...baseUser,
    UserRights: userRights,
    AllowedRoutes: allowedRoutes,
    RegisteringRoutes: registeringRoutes,
    ShowWelcomePage:
      userRights?.length && userRights[0]?.ShowWelcomePage === 'NO' ? false : true,
  };

  localStorage.setItem('RNB_LOGGED_IN_USER_DATA', JSON.stringify(merged));
  return merged;
}

export async function login({ loginID, password }) {
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const params = new URLSearchParams({
    UserCode: loginID?.trim(),
    Password: password?.trim(),
    SessionID: sessionId.trim(),
  });

  const result = await axios.get(`${DASHBOARD_URL}/${VALIDATE_USER}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });

  const link = result?.data?.Links?.[0];
  if (!link) {
    const msg = result?.data?.ErrMsg?.[0]?.ErrMsg || result?.data?.ErrMsg;
    if (msg) toast.error(msg);
    return null;
  }

  const baseUser = {
    RoleCode: link.RoleCode,
    ErpUserID: link.ErpUserID,
    YearID: link.YearID,
    YearCode: link.YearCode,
    Ref_DivisionID: link.Ref_DivisionID,
    UserID: link.UserID,
    UserName: link.UserName,
    LoginUserID: link.LoginUserID,
    EncLoginUserID: link.encLoginUserID,
    UniqueUID: link.UniqueUID,
  };

  const withRights = await fetchMenuRights(link.UserID?.trim(), 'DSH', baseUser);
  if (!withRights) return null;

  persistSession(sessionId, withRights);
  toast.success('Login successful');
  return withRights;
}

export async function restoreSessionFromStorage() {
  const raw = localStorage.getItem('RNB_LOGGED_IN_USER_DATA');
  if (!raw || !sessionStorage.getItem('RNB_SESSION_ID')) return null;
  const user = JSON.parse(raw);
  return fetchMenuRights(user.UserID?.trim(), 'DSH', user);
}
