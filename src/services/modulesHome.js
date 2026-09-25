import axios from 'axios';
import {
  WS_DASH_URL,
  BASIC_TOKEN_HEADER,
  FETCH_MENU_CODEWISE_OBJECTLIST,
} from '../config/api.config';
import { getUserToken } from '../utils/session';
import { fetchObjectDataset } from './dashboard';
import { createNavObjectFromRights } from '../navigation/buildNav';

/** Single catalog call for the Dashboard Overview page (DSH_OVRVW). */
export const ALL_MODULES_OVERVIEW_MENU_CODE = 'DSH_OVRVW';

const isURL = (str) => /^https?:\/\//.test(str);

function norm(s) {
  return String(s ?? '').trim().toLowerCase();
}

function normalizeObjectId(id) {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

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

function childPath(child) {
  const raw = child?.formobjname?.trim().replace(/[\r\n]/g, '') || '';
  if (!raw || isURL(raw)) return null;
  return raw;
}

function isOverviewEligibleModule(child) {
  const path = childPath(child);
  if (!path) return false;
  const menuCode = child.code?.trim();
  if (!menuCode) return false;
  const route = parseRouteJson(child?.RouteJson);
  const component = route?.component?.trim();
  if (component === 'DirectReport') return false;
  return true;
}

/** Dashboard-module rows in DSH_OVRVW use GroupCode DSH_MDL and Ref_Sys_MenuCode DSH_MDL_* */
const DASHBOARD_MODULES_GROUP_CODE = 'DSH_MDL';

function buildUserModuleLookup(user) {
  const groupByCode = new Map();
  const groupByTitle = new Map();
  const apiGroupCodeAlias = new Map();
  const allGroups = [];
  const homeModulesByMenuCode = new Map();

  (user?.UserRights ?? []).forEach((group, groupIndex) => {
    const groupName = group.menutitle?.trim() || 'Module';
    const groupKey = group.code?.trim() || String(groupIndex);
    const groupCode = group.code?.trim();
    const meta = { groupCode, groupName, key: groupKey };

    allGroups.push(meta);

    if (groupCode) {
      groupByCode.set(norm(groupCode), meta);
      groupByTitle.set(norm(groupName), meta);
    }

    (group.children || []).forEach((child) => {
      const childCode = child.code?.trim();
      if (childCode?.startsWith('DSH_MDL_')) {
        apiGroupCodeAlias.set(norm(DASHBOARD_MODULES_GROUP_CODE), meta);
      }

      if (!isOverviewEligibleModule(child)) return;

      const menuCode = childCode;
      const path = childPath(child);

      homeModulesByMenuCode.set(menuCode, {
        title: child.menutitle?.trim() || child.formtitle?.trim() || path,
        path,
        menuCode,
        groupName,
        groupCode,
        groupKey,
      });
    });
  });

  return { groupByCode, groupByTitle, apiGroupCodeAlias, allGroups, homeModulesByMenuCode };
}

function findSidebarGroupForCatalogRow(row, lookup) {
  const { groupByCode, groupByTitle, apiGroupCodeAlias, allGroups } = lookup;
  const apiGroupCode = row.GroupCode?.trim();

  if (apiGroupCode) {
    const direct = groupByCode.get(norm(apiGroupCode));
    if (direct) return direct;

    const aliased = apiGroupCodeAlias.get(norm(apiGroupCode));
    if (aliased) return aliased;
  }

  const apiTitle = row.GroupTitle?.trim();
  if (apiTitle) {
    const exact = groupByTitle.get(norm(apiTitle));
    if (exact) return exact;

    const apiNorm = norm(apiTitle);
    for (const meta of allGroups) {
      const sideNorm = norm(meta.groupName);
      if (sideNorm === apiNorm || sideNorm.includes(apiNorm) || apiNorm.includes(sideNorm)) {
        return meta;
      }
    }
  }

  if (norm(apiGroupCode) === norm(DASHBOARD_MODULES_GROUP_CODE)) {
    const sso = groupByCode.get(norm('DSH_SINGLE_SIGN_ON'));
    if (sso) return sso;

    const dashboardGroup = allGroups.find((g) => norm(g.groupName).includes('dashboard'));
    if (dashboardGroup) return dashboardGroup;
  }

  return null;
}

function resolveGroupMeta(row, userMod, lookup) {
  const fromCatalog = findSidebarGroupForCatalogRow(row, lookup);
  if (fromCatalog) return fromCatalog;

  const fromUserGroup =
    userMod.groupCode && lookup.groupByCode.get(norm(userMod.groupCode));
  if (fromUserGroup) return fromUserGroup;

  return {
    groupCode: userMod.groupCode,
    groupName: userMod.groupName,
    key: userMod.groupKey,
  };
}

/** Dashboard-module rows in DSH_OVRVW use GroupCode DSH_MDL and Ref_Sys_MenuCode DSH_MDL_* */
function isDashboardModulesCatalogRow(row) {
  return norm(row.GroupCode) === norm(DASHBOARD_MODULES_GROUP_CODE);
}

/**
 * Rights match for integrated modules; catalog-only entry for DSH_MDL overview rows
 * (menu codes like DSH_MDL_HR are not always present in UserRights children).
 */
function resolveModuleEntry(row, homeModulesByMenuCode) {
  const sysMenuCode = row.Ref_Sys_MenuCode?.trim();
  if (!sysMenuCode) return null;

  const fromRights = homeModulesByMenuCode.get(sysMenuCode);
  if (fromRights) {
    return { ...fromRights, openPath: fromRights.path };
  }

  if (!isDashboardModulesCatalogRow(row)) return null;

  return {
    title: row.Ref_ModuleTitle?.trim() || sysMenuCode,
    path: null,
    openPath: null,
    menuCode: sysMenuCode,
    groupName: '',
    groupCode: '',
    groupKey: '',
  };
}

export const IMPORTANT_LINKS_GROUP_CODE = 'DSH_RNBD_LINKS';

export function isImportantLinksGroup(group) {
  const target = norm(IMPORTANT_LINKS_GROUP_CODE);
  return (
    norm(group?.code) === target ||
    norm(group?.key) === target
  );
}

function buildLinkModulesFromRightsGroup(userRight, encLoginUserID) {
  return (userRight.children || [])
    .map((child, index) => {
      const nav = createNavObjectFromRights(child, false, encLoginUserID);
      if (!nav.href && !nav.to) return null;
      return {
        kind: 'link',
        title: nav.name || child.menutitle?.trim() || 'Link',
        menuCode: nav.code || child.code?.trim(),
        href: nav.href,
        to: nav.to,
        external: Boolean(nav.external),
        cardSections: [],
        loading: false,
        error: null,
        sortKey: index,
      };
    })
    .filter(Boolean);
}

function mergeLinkGroupsFromRights(user, lookup, groupMap) {
  const enc = user?.EncLoginUserID;

  (user?.UserRights ?? []).forEach((userRight) => {
    const groupCode = userRight.code?.trim();
    if (norm(groupCode) !== norm(IMPORTANT_LINKS_GROUP_CODE)) return;

    const meta = lookup.groupByCode.get(norm(groupCode));
    if (!meta) return;

    const linkModules = buildLinkModulesFromRightsGroup(userRight, enc);
    if (!linkModules.length) return;

    const existing = groupMap.get(meta.key);
    if (existing) {
      const statusModules = existing.modules.filter((m) => m.kind !== 'link');
      existing.modules = [...statusModules, ...linkModules];
      return;
    }

    groupMap.set(meta.key, {
      key: meta.key,
      name: meta.groupName,
      code: meta.groupCode,
      modules: linkModules,
    });
  });
}

async function fetchOverviewCatalog() {
  const params = new URLSearchParams({
    MenuCode: ALL_MODULES_OVERVIEW_MENU_CODE,
    LoginID: getUserToken(),
  });
  const response = await axios.get(
    `${WS_DASH_URL}/${FETCH_MENU_CODEWISE_OBJECTLIST}?${params}`,
    { headers: BASIC_TOKEN_HEADER },
  );
  return Array.isArray(response.data?.Table) ? response.data.Table : [];
}

/**
 * Compare old vs new HTTP call counts for the Dashboard Overview page.
 * Legacy: one object list + 3 calls per widget (session, filters, dataset) per home submodule.
 * New: one DSH_OVRVW catalog + one dataset call per unique overview card (no session/filter on preview).
 */
export function compareOverviewFetchEfficiency({
  homeModuleCount,
  overviewCardCount,
  avgWidgetsPerHomeModule = 2,
}) {
  const legacyPerModule = 1 + 3 * avgWidgetsPerHomeModule;
  const legacyTotal = homeModuleCount * legacyPerModule;
  const optimizedTotal = 1 + overviewCardCount;
  const saved = Math.max(0, legacyTotal - optimizedTotal);
  const percent =
    legacyTotal > 0 ? Math.round((saved / legacyTotal) * 100) : 0;

  return {
    legacyTotal,
    optimizedTotal,
    saved,
    percentFewer: percent,
    breakdown: {
      legacy: {
        objectListCalls: homeModuleCount,
        sessionFilterDatasetCalls: homeModuleCount * 3 * avgWidgetsPerHomeModule,
      },
      optimized: {
        catalogCalls: 1,
        datasetCalls: overviewCardCount,
      },
    },
  };
}

/**
 * Build overview from DSH_OVRVW: join catalog rows to user rights via Ref_Sys_MenuCode.
 */
export async function fetchAllModulesOverview(user) {
  const lookup = buildUserModuleLookup(user);
  const { homeModulesByMenuCode } = lookup;

  const catalogRows = await fetchOverviewCatalog();
  const cardDefs = catalogRows.filter((row) => norm(row.Ref_ViewType) === 'card');

  const moduleSlots = new Map();
  const matchedObjectIds = new Set();

  cardDefs.forEach((row) => {
    const sysMenuCode = row.Ref_Sys_MenuCode?.trim();
    if (!sysMenuCode) return;

    const userMod = resolveModuleEntry(row, homeModulesByMenuCode);
    if (!userMod) return;

    const objectId = normalizeObjectId(row.Ref_MenuID);
    if (objectId == null) return;

    matchedObjectIds.add(objectId);

    const groupMeta = resolveGroupMeta(row, userMod, lookup);
    const slotKey = `${norm(groupMeta.key)}::${norm(sysMenuCode)}`;

    if (!moduleSlots.has(slotKey)) {
      moduleSlots.set(slotKey, {
        kind: 'status',
        title: userMod.title,
        path: userMod.openPath ?? userMod.path ?? null,
        menuCode: userMod.menuCode,
        cardSections: [],
        loading: true,
        error: null,
        sortKey: row.mnuSeqNo ?? 0,
        groupKey: groupMeta.key,
        groupName: groupMeta.groupName,
        groupCode: groupMeta.groupCode,
        _cards: [],
      });
    }

    const slot = moduleSlots.get(slotKey);
    slot._cards.push({
      objectId,
      title: row.Ref_MenuTitle?.trim() || 'Status',
      sortKey: row.lnkSeqNo ?? 0,
    });
  });

  const uniqueObjectIds = [...matchedObjectIds];

  const datasetByObjectId = {};
  await Promise.allSettled(
    uniqueObjectIds.map(async (objectId) => {
      try {
        const data = await fetchObjectDataset(objectId);
        datasetByObjectId[objectId] = data?.Table1 ?? [];
      } catch {
        datasetByObjectId[objectId] = null;
      }
    }),
  );

  const groupMap = new Map();

  moduleSlots.forEach((slot) => {
    slot.loading = false;
    slot.cardSections = slot._cards
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((card) => ({
        title: card.title,
        rows:
          datasetByObjectId[card.objectId] == null
            ? []
            : datasetByObjectId[card.objectId],
      }));

    if (
      slot._cards.length &&
      slot._cards.every((c) => datasetByObjectId[c.objectId] == null)
    ) {
      slot.error = 'Failed to load status data';
    }

    delete slot._cards;

    if (!groupMap.has(slot.groupKey)) {
      groupMap.set(slot.groupKey, {
        key: slot.groupKey,
        name: slot.groupName,
        code: slot.groupCode,
        modules: [],
      });
    }
    groupMap.get(slot.groupKey).modules.push(slot);
  });

  groupMap.forEach((group) => {
    group.modules.sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    group.modules.forEach((m) => delete m.sortKey);
  });

  mergeLinkGroupsFromRights(user, lookup, groupMap);

  const overviewGroups = [...groupMap.values()].sort((a, b) => {
    const order = (key) => {
      const idx = lookup.allGroups.findIndex((g) => g.key === key || g.groupCode === key);
      return idx === -1 ? 999 : idx;
    };
    return order(a.key) - order(b.key);
  });

  const efficiency = compareOverviewFetchEfficiency({
    homeModuleCount: homeModulesByMenuCode.size,
    overviewCardCount: uniqueObjectIds.length,
    avgWidgetsPerHomeModule: 2,
  });

  if (import.meta.env.DEV) {
    console.info('[Dashboard Overview] API efficiency vs legacy per-submodule fetch:', efficiency);
  }

  return overviewGroups;
}
