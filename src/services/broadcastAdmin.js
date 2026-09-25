import axios from 'axios';
import { BASIC_TOKEN_HEADER, BROADCAST_MSG_SAVE, DASHBOARD_URL } from '../config/api.config';
import { getUserToken } from '../utils/session';

export async function saveBroadcastMessage(message) {
  const params = new URLSearchParams({
    Message: message,
    LoginID: getUserToken(),
  });
  const { data } = await axios.get(
    `${DASHBOARD_URL}/${BROADCAST_MSG_SAVE}?${params.toString()}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  const err = data?.ErrMsg?.[0];
  if (err?.ErrCode === '1' && err.ErrMsg) {
    return { ok: true, message: err.ErrMsg };
  }
  return { ok: false, message: err?.ErrMsg || 'Save failed' };
}
