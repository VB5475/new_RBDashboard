import axios from 'axios';
import toast from 'react-hot-toast';
import { DASHBOARD_URL, BASIC_TOKEN_HEADER, BROADCAST_MSG_FETCH } from '../config/api.config';
import { getUserToken, globalLogout } from '../utils/session';

export async function fetchBroadcastMessages() {
  const params = new URLSearchParams({ LoginID: getUserToken() });
  const response = await axios.get(`${DASHBOARD_URL}/${BROADCAST_MSG_FETCH}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });

  if (response.data?.ErrMsg?.[0]?.ErrCode === '-1') {
    const msg = response.data.ErrMsg[0]?.ErrMsg || 'Session expired';
    toast.error(msg);
    await globalLogout();
    return { logout: true, messages: [] };
  }

  return { logout: false, messages: response.data?.Links ?? [] };
}
