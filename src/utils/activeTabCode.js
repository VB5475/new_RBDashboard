import { getStoredUser } from './session';

export function activeTabCodeFromPath(pathname) {
  const userdata = getStoredUser();
  if (!userdata?.UserRights?.length) return null;

  function findPath(items, targetPath) {
    for (const item of items) {
      if (item?.formobjname?.trim() === targetPath.trim()) {
        return item;
      }
      if (item.children?.length) {
        const found = findPath(item.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  }

  const matched = findPath(userdata.UserRights, pathname);
  return matched?.code?.trim() ?? null;
}
