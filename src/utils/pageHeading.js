import { ALL_MODULES_LABEL, isOverviewRoutePath } from '../constants/routes';
import { toTitleCase } from './displayText';

export function getPageHeading(userRights, pathname) {
  if (isOverviewRoutePath(pathname)) {
    return {
      parentTitle: toTitleCase(ALL_MODULES_LABEL),
      childTitle: null,
    };
  }

  for (const group of userRights ?? []) {
    const child = group.children?.find((c) => {
      const formPath = c.formobjname?.trim();
      return formPath && (formPath === pathname || pathname.startsWith(formPath));
    });
    if (child) {
      return {
        parentTitle: toTitleCase(
          group.formtitle?.trim() ||
            group.menutitle?.trim() ||
            group.menucode?.trim(),
        ),
        childTitle: toTitleCase(
          child.formtitle?.trim() ||
            child.menutitle?.trim() ||
            child.menucode?.trim(),
        ),
      };
    }
  }

  return { parentTitle: null, childTitle: null };
}

/** STROBES | Panchayat | GujMARG — legacy AppHeader targetSystem */
export function getMotherLinkTarget(childTitle) {
  const upper = String(childTitle ?? '').toUpperCase();
  if (upper.includes('STROBES')) return 'STROBES';
  if (upper.includes('PANCHAYAT')) return 'Panchayat';
  if (upper.includes('GUJMARG')) return 'GujMARG';
  return null;
}
