import axios from 'axios';
import toast from 'react-hot-toast';
import { WS_DASH_URL, BASIC_TOKEN_HEADER, CHART_CLICK, DATA_DRILL_DOWN } from '../config/api.config';

export async function fetchChartClickRows({
  menuCode,
  sessionId,
  objectId,
  filterString,
  clickedValue1,
  clickedValue2,
  loginId,
}) {
  const params = new URLSearchParams({
    MenuCode: menuCode,
    SessionID: sessionId,
    ObjectID: objectId,
    Level: '1',
    FilterSeldVals: filterString,
    ClickedValue1: clickedValue1,
    ClickedValue2: clickedValue2 ?? '',
    LoginID: loginId,
  });

  const response = await axios.get(`${WS_DASH_URL}/${CHART_CLICK}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });

  if (response.data?.ErrMsg) {
    const msg = response.data.ErrMsg[0]?.ErrMsg || 'Chart click failed';
    toast.error(msg);
    return [];
  }

  return response.data?.Table ?? [];
}

export async function fetchDrilldownTables({ level, objectId, filterString, loginId }) {
  const params = new URLSearchParams({
    Level: String(level),
    ObjectID: objectId,
    FilterSeldVals: filterString,
    LoginID: loginId,
  });

  const response = await axios.get(`${WS_DASH_URL}/${DATA_DRILL_DOWN}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });

  if (response.data?.ErrMsg?.[0]?.ErrCode === '-1') {
    const msg = response.data.ErrMsg[0]?.ErrMsg || 'Drilldown failed';
    toast.error(msg);
    return null;
  }

  return {
    mainTable: response.data?.Table ?? [],
    refTable: response.data?.Table1 ?? [],
  };
}
