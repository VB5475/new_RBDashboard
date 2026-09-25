import axios from 'axios';
import {
  WS_DASH_URL,
  DDL_DRPT_URL,
  BASIC_TOKEN_HEADER,
  FETCH_MENU_CODEWISE_OBJECTLIST_FOR_DRPT,
  FETCH_DDL_DRPT,
  GET_DIRECT_REPORT,
} from '../config/api.config';
import { getUserToken } from '../utils/session';

export async function fetchDirectReportList(menuCode) {
  const params = new URLSearchParams({
    MenuCode: menuCode?.trim(),
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${FETCH_MENU_CODEWISE_OBJECTLIST_FOR_DRPT}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  const table = response.data?.Table ?? [];
  return table.map((report, index) => {
    const fileName = report.ReportPath
      ? report.ReportPath.split('/').pop().replace(/%20/g, ' ')
      : 'Unknown';
    const ext = fileName.toLowerCase().split('.').pop();
    const fileType = (() => {
      switch (ext) {
        case 'pdf':
          return 'PDF Document';
        case 'xlsx':
        case 'xls':
          return 'Excel Document';
        case 'docx':
        case 'doc':
          return 'Word Document';
        case 'rpt':
          return 'Crystal Report';
        default:
          return 'Document';
      }
    })();
    return {
      id: report.Ref_MenuID ?? index,
      objectId: report.ObjectID ?? report.Ref_MenuID ?? index,
      title: report.Ref_MenuTitle?.replace(/"/g, '') || 'Untitled Report',
      description: report.Description || 'No description available',
      fileName,
      fileType,
      reportPath: report.ReportPath || '',
    };
  });
}

export async function fetchDrptOptions(mode, { wingId = -1, circleId = -1, divisionId = -1 } = {}) {
  const params = new URLSearchParams({
    Mode: mode,
    WingID: String(wingId),
    CircleID: String(circleId),
    DivisionID: String(divisionId),
    LoginID: getUserToken(),
  });
  const response = await axios.get(`${DDL_DRPT_URL}/${FETCH_DDL_DRPT}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });
  return (response.data?.Links ?? []).map((item) => ({
    id: Math.round(item.IDNumber),
    name: item.Name,
  }));
}

export async function downloadDirectReport({ objectId, wingId, circleId, divisionId }) {
  const params = new URLSearchParams({
    ObjectID: String(objectId),
    WingID: String(wingId ?? -1),
    CircleID: String(circleId ?? -1),
    DivId: String(divisionId ?? -1),
    LoginID: getUserToken(),
  });
  const response = await axios.get(`${DDL_DRPT_URL}/${GET_DIRECT_REPORT}?${params}`, {
    headers: BASIC_TOKEN_HEADER,
  });
  const url = response.data?.ErrMsg?.[0]?.ErrMsg;
  if (!url) throw new Error('No download URL returned');
  return url;
}
