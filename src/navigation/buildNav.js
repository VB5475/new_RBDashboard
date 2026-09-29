import {
  Gauge,
  Fingerprint,
  BarChart3,
  ExternalLink,
  Database,
  MessageSquare,
  Settings,
  Server,
  Link2,
  FolderOpen,
  LayoutGrid,
} from 'lucide-react';
import { createElement } from 'react';
import { WEB_DOMAIN } from '../config/api.config';
import { ALL_MODULES_LABEL, isOverviewRoutePath } from '../constants/routes';

const ICON_SIZE = 22;

const iconByCode = {
  DSH_MAIN_DASHBOARD: Gauge,
  DSH_SINGLE_SIGN_ON: Fingerprint,
  WHS: BarChart3,
  DSH_RNBD_LINKS: ExternalLink,
  DSH_API_INTEGRATION: Database,
  DSH_SUPPORT: MessageSquare,
  DSH_CNFG: Settings,
  DSH_DP: Server,
  DSH_DIRECT_RPT: FolderOpen,
  DSH_OVRVW: LayoutGrid,
};

export function isDashboardOverviewNavItem(item) {
  if (!item) return false;
  if (item.code?.trim() === 'DSH_OVRVW') return true;
  const name = (item.name || '').trim().toLowerCase();
  if (name === ALL_MODULES_LABEL.toLowerCase()) return true;
  return isOverviewRoutePath(item.to);
}

function applyOverviewNavPresentation(item) {
  if (!isDashboardOverviewNavItem(item)) return item;
  return { ...item, icon: navIcon('DSH_OVRVW') };
}

export function navIcon(code, forSearch = false, size = ICON_SIZE) {
  const Icon = forSearch ? Link2 : iconByCode[code?.trim()] || BarChart3;
  return createElement(Icon, { size, strokeWidth: 2, className: 'rnb-nav-icon-svg' });
}

export function createNavObjectFromRights(child, forSearch, encLoginUserID) {
  const isURL = (str) => /^https?:\/\//.test(str);
  const toOrUrl = child?.formobjname?.trim().replace(/[\r\n]/g, '') || '/*';

  const item = {
    type: 'item',
    name: child.menutitle?.trim() || child.formtitle?.trim() || '',
    code: child.code?.trim(),
    icon: forSearch ? navIcon(null, true) : null,
  };

  if (isURL(toOrUrl) && child?.IsSSOURL?.trim() === 'Yes') {
    item.href = `${toOrUrl}?encryptedUrl=${encLoginUserID};abc1`;
    item.external = true;
  } else if (!isURL(toOrUrl) && child?.IsSSOURL?.trim() === 'Yes') {
    item.href = `${WEB_DOMAIN}/${toOrUrl}?encryptedUrl=${encLoginUserID};abc1`;
    item.external = true;
  } else if (isURL(toOrUrl) && child?.IsSSOURL?.trim() === 'No') {
    item.href = toOrUrl;
    item.external = true;
  } else if (child.code?.trim() === 'DSH_CNFG_BRMSG') {
    item.to = '/home';
    item.broadcast = true;
  } else {
    item.to = toOrUrl;
  }

  return item;
}

/**
 * Sidebar from GetMenuRightBased UserRights (same model as R-BDashboard _nav.jsx):
 * first-level groups or standalone leaves; icons mapped by menu code on the frontend.
 */
export function buildNavigation(userData) {
  if (!userData?.UserRights?.length) {
    return { sections: [], searchItems: [], groups: [] };
  }

  const enc = userData.EncLoginUserID;
  const sections = [];

  userData.UserRights.forEach((userRight) => {
    const children = userRight.children || [];

    if (!children.length) {
      let item = createNavObjectFromRights(userRight, false, enc);
      item = applyOverviewNavPresentation(item);
      if (!isDashboardOverviewNavItem(item)) {
        item.icon = navIcon(userRight.code);
      }
      sections.push({
        type: 'standalone',
        code: userRight.code?.trim(),
        item,
      });
      return;
    }

    sections.push({
      type: 'group',
      name: userRight.menutitle?.trim() || '',
      code: userRight.code?.trim(),
      icon: navIcon(userRight.code),
      items: children
        .map((child) => createNavObjectFromRights(child, false, enc))
        .map((item) => applyOverviewNavPresentation(item)),
    });
  });

  const overviewStandaloneIdx = sections.findIndex(
    (s) => s.type === 'standalone' && isDashboardOverviewNavItem(s.item),
  );
  if (overviewStandaloneIdx > 0) {
    const [overviewSection] = sections.splice(overviewStandaloneIdx, 1);
    sections.unshift(overviewSection);
  }

  const groups = sections.filter((s) => s.type === 'group');

  const searchItems = sections.flatMap((section) => {
    if (section.type === 'standalone') {
      return [{ ...section.item, icon: navIcon(section.item.code, true) }];
    }
    return section.items.map((item) => ({
      ...item,
      icon: navIcon(item.code, true),
    }));
  });

  return { sections, groups, searchItems };
}

export function groupAccentColor(code) {
  switch (code?.trim()) {
    case 'DSH_MAIN_DASHBOARD':
      return '#60a5fa';
    case 'DSH_SINGLE_SIGN_ON':
      return '#f97316';
    case 'DSH_RNBD_LINKS':
      return '#22c55e';
    default:
      return null;
  }
}
