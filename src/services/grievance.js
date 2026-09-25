import axios from 'axios';
import {
  BASIC_TOKEN_HEADER,
  DASHBOARD_URL,
  FETCH_MODULE,
  REGISTER_GRIEVANCE,
} from '../config/api.config';
import { getUserToken } from '../utils/session';

export async function fetchGrievanceModules() {
  const { data } = await axios.get(`${DASHBOARD_URL}/${FETCH_MODULE}`, {
    headers: BASIC_TOKEN_HEADER,
  });
  return data.Links ?? [];
}

export async function registerGrievance(payload) {
  const params = new URLSearchParams({
    OperatorUserName: payload.operatorName,
    MobileNo: payload.mobile,
    LoginUserID: getUserToken(),
    OfficerName: payload.officerName,
    ComplainDesc: payload.description,
    ForModule: payload.modules.join(','),
    LoginID: getUserToken(),
  });
  const { data } = await axios.get(
    `${DASHBOARD_URL}/${REGISTER_GRIEVANCE}?${params.toString()}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  const err = data?.ErrMsg?.[0];
  if (err?.ErrCode === '1' && err.ErrMsg) {
    return { ok: true, message: err.ErrMsg };
  }
  return { ok: false, message: err?.ErrMsg || 'Request failed' };
}
