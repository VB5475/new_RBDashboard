import axios from 'axios';
import { DASHBOARD_URL, BASIC_TOKEN_HEADER } from '../config/api.config';

const USER_KEY = 'RNB_LOGGED_IN_USER_DATA';
const SESSION_KEY = 'RNB_SESSION_ID';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function getUserToken() {
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  const loginData = getStoredUser();
  if (sessionId && loginData?.UniqueUID) {
    return `${sessionId};;;${loginData.UniqueUID}`;
  }
  return null;
}

export function isAuthenticated() {
  return Boolean(getUserToken());
}

export async function closeRemoteSession() {
  const token = getUserToken();
  if (!token) return false;
  try {
    const params = new URLSearchParams({ UserCode: token });
    const response = await axios.get(`${DASHBOARD_URL}/CloseUserSession?${params}`, {
      headers: BASIC_TOKEN_HEADER,
    });
    return response.data?.ErrMsg?.[0]?.ErrCode === '1';
  } catch {
    return false;
  }
}

export async function globalLogout() {
  await closeRemoteSession();
  localStorage.clear();
  sessionStorage.clear();
}

export function persistSession(sessionId, userPayload) {
  sessionStorage.setItem(SESSION_KEY, sessionId);
  localStorage.setItem(USER_KEY, JSON.stringify(userPayload));
}

export { USER_KEY, SESSION_KEY };
