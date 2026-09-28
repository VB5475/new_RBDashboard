import { unzipSync, strFromU8 } from 'fflate';
import axios from 'axios';
import { applySidebarBackgroundFromConfig } from '../theme/applySidebarBackground';

export const GET_MENU_RIGHT_BASED = 'GetMenuRightBased';
export const VALIDATE_USER = 'ValidateUser';
export const FETCH_MENU_CODEWISE_OBJECTLIST = 'FetchMenucodewiseObjectList';
export const FETCH_OBJECTWISE_DATASET = 'FetchObjectwiseDataSet';
export const CREATE_NEWSESSION_FOR_OBJECT_FILTER_REQUEST = 'CreateNewSessionForObjectFilterRequest';
export const FETCH_OBJECTWISE_FILTERS = 'FetchObjectwiseFilters';
export const FETCH_FILTERWISE_DATA = 'FetchFilterswiseData';
export const FETCH_OBJECTWISE_DATASET_FILTERED = 'FetchObjectwiseDataSetFiltered';
export const FILTER_VALUE_SELECTED = 'FilterValueSelected';
export const CHART_CLICK = 'ChartClick';
export const DATA_DRILL_DOWN = 'DataDrilldown';
export const FETCH_WORK_DATA_FOR_MAP = 'FetchWorkData4Map';
export const FETCH_API_DATA = 'FetchAPIData';
export const LIST = 'LIST';
export const SEARCH_WITH_PAGING = 'SRCHWITHPAGING';
export const FETXHAPILOG_LASTRUN_DETAIL = 'FetchAPILOG_LastRunDtl';
export const GET_TOTAL_COUNT = 'GetTotalCNT';
export const FETCH_MENU_CODEWISE_OBJECTLIST_FOR_DRPT = 'FetchMenucodewiseObjectList4DRPT';
export const FETCH_DDL_DRPT = 'FetchDDL_DRPT';
export const GET_DIRECT_REPORT = 'GetDirectReport';
export const BROADCAST_MSG_FETCH = 'BroadCastMsg_Fetch';
export const BROADCAST_MSG_SAVE = 'BroadCastMessage_Save';
export const FETCH_MODULE = 'FetchModule';
export const REGISTER_GRIEVANCE = 'RegisterGrievance';
export const USER_VISIT_COUNT = 'UserVisitCount';
export const FORGOT_PASSWORD = 'ForgotPassword';
export const FORGOT_USERID = 'ForgotUserID';
export const CHANGE_PASSWORD = 'ChangePassword';
export const UPDATE_USER = 'UpdateUser';
export const FETCH_USER_DETAILS = 'FetchUserDetails';
export const FETCH_PASSWORD_POLICY = 'FetchPasswordPolicy';
export const GET_SERVER_DATE = 'fnGetServerDate';

export let DDL_DRPT_URL;
export let WEB_DOMAIN;

export let CK_Dsh_DBLogin;
export let CK_Dsh_DBData;
export let CK_Dsh_DBData3;
export let MOBILEAPP_LINK;
export let USERMANUAL_URL;
export let CK_Dsh_Gujmarg;
export let CK_Dsh_Gujrams;
export let CK_Dsh_MMGSY;
export let SHOW_TRAFFIC_STATUS = false;
export let DATAPOOL_RESOURCE;
export let DASHBOARD_URL;
export let WS_DASH_URL;
export let WSMIS_URL;
export let MAP_URL;
export let MAP_CREDENTIALS = null;
/** NIC Bharat Maps MapServer (SoI-aligned — preferred over OSM for gov portals) */
export let BHARAT_MAPS_URL =
  'https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer';
export let BHARAT_MAPS_TOKEN = '';
export let BASIC_TOKEN_HEADER = {};
export let SIDEBAR_COLOR_CONFIG = null;

export const loadZipData = async (resourcePath) => {
  const response = await axios.get(resourcePath, { responseType: 'arraybuffer' });
  const zip = unzipSync(new Uint8Array(response.data));
  const cache = {};
  for (const fileName in zip) {
    if (fileName.endsWith('.json')) {
      cache[fileName] = JSON.parse(strFromU8(zip[fileName]));
    }
  }
  return cache;
};

export function loadConfig(config) {
  const webDomain =
    import.meta.env.VITE_WEB_DOMAIN ||
    `${window.location.protocol}//103.27.120.198`;

  WEB_DOMAIN = webDomain;
  DATAPOOL_RESOURCE = config.DATAPOOL_RESOURCE;
  CK_Dsh_DBLogin = `${webDomain}/${config.CK_Dsh_DBLogin}`;
  CK_Dsh_DBData = `${webDomain}/${config.CK_Dsh_DBData}`;
  CK_Dsh_DBData3 = `${webDomain}/${config.CK_Dsh_DBData3}`;
  MOBILEAPP_LINK = config.MOBILEAPP_LINK;
  CK_Dsh_Gujmarg = config.CK_Dsh_Gujmarg;
  CK_Dsh_Gujrams = config.CK_Dsh_Gujrams;
  CK_Dsh_MMGSY = config.CK_Dsh_MMGSY;
  SHOW_TRAFFIC_STATUS = Boolean(config.SHOW_TRAFFIC_STATUS);
  USERMANUAL_URL = config.MANUAL_URL
    ? `${webDomain}/${config.MANUAL_URL}`
    : null;

  DASHBOARD_URL = `${CK_Dsh_DBLogin}/webservice/wsWDMS.asmx`;
  WS_DASH_URL = `${CK_Dsh_DBData3}/webservice/wsDash.asmx`;
  WSMIS_URL = `${CK_Dsh_DBData}/webservice/wsmis.asmx`;
  DDL_DRPT_URL = `${CK_Dsh_DBData3}/webservice/wsMIS_DRPT.asmx`;
  MAP_URL = config.MAP_URL ?? '';
  MAP_CREDENTIALS = config.MAP_CREDENTIALS ?? null;
  BHARAT_MAPS_URL =
    config.BHARAT_MAPS_URL ||
    'https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer';
  BHARAT_MAPS_TOKEN =
    config.BHARAT_MAPS_TOKEN ||
    import.meta.env.VITE_BHARAT_MAPS_TOKEN ||
    '';

  SIDEBAR_COLOR_CONFIG = config.configSideBarColors ?? null;
  applySidebarBackgroundFromConfig(config);

  const token = btoa(`${config.USER_NAME}:${config.PASSWORD}`);
  BASIC_TOKEN_HEADER = {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Basic ${token}`,
  };
}

export async function fetchAppConfig() {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error('Failed to load config.json');
  return response.json();
}
