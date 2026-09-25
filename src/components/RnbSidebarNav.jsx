import { Fragment, useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { groupAccentColor, isDashboardOverviewNavItem } from '../navigation/buildNav';
import { resolveGroupAccent } from '../theme/overviewColors';
import { useUser } from '../context/UserContext';

function NavLeaf({
  item,
  nested,
  pinned,
  featured,
  groupAccent,
  collapsed,
  onLeafClick,
}) {
  const solidFeatured = featured && groupAccent;
  const className = ({ isActive }) =>
    [
      'rnb-nav-leaf',
      pinned ? ' rnb-nav-pinned' : '',
      solidFeatured ? ' rnb-nav-standalone-accent' : '',
      featured && !pinned && !solidFeatured ? ' rnb-nav-pinned' : '',
      nested ? ' rnb-nav-leaf--nested' : '',
      isActive ? ' active' : '',
    ].join('');

  const leafStyle =
    solidFeatured && groupAccent ? { '--group-accent': groupAccent } : undefined;

  const content = (
    <>
      {item.icon && <span className="rnb-nav-leaf-icon">{item.icon}</span>}
      {!collapsed && <span className="rnb-nav-leaf-label">{item.name}</span>}
    </>
  );

  const click = () => onLeafClick?.(item);

  if (item.external && item.href) {
    return (
      <a
        className="rnb-nav-leaf"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        title={collapsed ? item.name : undefined}
        onClick={click}
        style={leafStyle}
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink
      to={item.to || '/home'}
      className={className}
      title={collapsed ? item.name : undefined}
      onClick={click}
      style={leafStyle}
    >
      {content}
    </NavLink>
  );
}

export default function RnbSidebarNav({
  sections,
  groups,
  flatItems,
  collapsed,
  searchMode,
  expandedMenu,
  onExpandSidebar,
  onExpandedMenuChange,
  onMobileNav,
}) {
  const location = useLocation();
  const { setUser } = useUser();
  const [openStates, setOpenStates] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('rnb_sidebarOpenStates') || '{}');
    } catch {
      return {};
    }
  });

  const persistOpen = useCallback((next) => {
    setOpenStates(next);
    sessionStorage.setItem('rnb_sidebarOpenStates', JSON.stringify(next));
  }, []);

  const navGroups = groups ?? sections?.filter((s) => s.type === 'group') ?? [];

  useEffect(() => {
    const saved = sessionStorage.getItem('rnb_sidebarOpenStates');
    if (!saved && navGroups?.length) {
      const allOpen = {};
      navGroups.forEach((group, i) => {
        allOpen[group.code || String(i)] = true;
      });
      persistOpen(allOpen);
    }
  }, [navGroups, persistOpen]);

  useEffect(() => {
    const next = { ...openStates };
    navGroups?.forEach((group) => {
      const key = group.code || group.name;
      group.items?.forEach((item) => {
        const path = item.to?.trim();
        if (path && location.pathname.startsWith(path)) {
          next[key] = true;
        }
      });
    });
    persistOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navGroups]);

  useEffect(() => {
    if (expandedMenu != null && !collapsed) {
      const key = String(expandedMenu);
      persistOpen({ ...openStates, [key]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedMenu, collapsed]);

  function toggleGroup(groupKey) {
    if (collapsed) {
      onExpandSidebar?.(groupKey);
      onExpandedMenuChange?.(groupKey);
      return;
    }
    onExpandedMenuChange?.(groupKey);
    persistOpen({ ...openStates, [groupKey]: !openStates[groupKey] });
  }

  function handleLeaf(item) {
    if (item.broadcast) {
      setUser((u) => (u ? { ...u, showBrodCastMessage: true } : u));
    }
    onMobileNav?.();
  }

  if (searchMode && flatItems?.length) {
    return (
      <div className="rnb-nav-list">
        {flatItems.map((item, i) => (
          <NavLeaf
            key={`${item.name}-${i}`}
            item={item}
            pinned={isDashboardOverviewNavItem(item)}
            collapsed={collapsed}
            onLeafClick={handleLeaf}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rnb-nav-list">
      {sections?.map((section, si) => {
        if (section.type === 'standalone') {
          if (isDashboardOverviewNavItem(section.item)) {
            return (
              <NavLeaf
                key={`standalone-${section.item.code || section.item.name}-${si}`}
                item={section.item}
                pinned
                collapsed={collapsed}
                onLeafClick={handleLeaf}
              />
            );
          }

          const accent = resolveGroupAccent(
            groupAccentColor(section.code),
            section.code || section.item.name,
          );
          return (
            <NavLeaf
              key={`standalone-${section.item.code || section.item.name}-${si}`}
              item={section.item}
              featured
              groupAccent={accent}
              collapsed={collapsed}
              onLeafClick={handleLeaf}
            />
          );
        }

        const groupKey = section.code || String(si);
        const isOpen = openStates[groupKey] ?? false;
        const accent = resolveGroupAccent(
          groupAccentColor(section.code),
          section.code || groupKey,
        );

        return (
          <Fragment key={groupKey}>
            <button
              type="button"
              className={`rnb-nav-group${isOpen ? ' is-open' : ''} has-accent`}
              style={{ '--group-accent': accent }}
              onClick={() => toggleGroup(groupKey)}
              title={collapsed ? section.name : undefined}
            >
              <span className="rnb-nav-group-icon">{section.icon}</span>
              {!collapsed && (
                <>
                  <span className="rnb-nav-group-label">{section.name}</span>
                  {isOpen ? (
                    <ChevronDown size={16} className="rnb-nav-chevron" />
                  ) : (
                    <ChevronRight size={16} className="rnb-nav-chevron" />
                  )}
                </>
              )}
            </button>
            {!collapsed && isOpen && (
              <div
                className="rnb-nav-sublist"
                style={accent ? { '--group-accent': accent } : undefined}
              >
                {section.items?.map((item, idx) => (
                  <NavLeaf
                    key={`${groupKey}-${idx}`}
                    item={item}
                    nested
                    pinned={isDashboardOverviewNavItem(item)}
                    collapsed={collapsed}
                    onLeafClick={handleLeaf}
                  />
                ))}
              </div>
            )}
          </Fragment>
        );
      })}
      {!sections?.length &&
        groups?.map((group, gi) => {
          const key = group.code || String(gi);
          const isOpen = openStates[key] ?? false;
          const accent = resolveGroupAccent(groupAccentColor(group.code), group.code || key);

          return (
            <Fragment key={key}>
              <button
                type="button"
                className={`rnb-nav-group${isOpen ? ' is-open' : ''} has-accent`}
                style={{ '--group-accent': accent }}
                onClick={() => toggleGroup(key)}
                title={collapsed ? group.name : undefined}
              >
                <span className="rnb-nav-group-icon">{group.icon}</span>
                {!collapsed && (
                  <>
                    <span className="rnb-nav-group-label">{group.name}</span>
                    {isOpen ? (
                      <ChevronDown size={16} className="rnb-nav-chevron" />
                    ) : (
                      <ChevronRight size={16} className="rnb-nav-chevron" />
                    )}
                  </>
                )}
              </button>
              {!collapsed && isOpen && (
                <div
                  className="rnb-nav-sublist"
                  style={{ '--group-accent': accent }}
                >
                  {group.items?.map((item, si) => (
                    <NavLeaf
                      key={`${key}-${si}`}
                      item={item}
                      nested
                      pinned={isDashboardOverviewNavItem(item)}
                      collapsed={collapsed}
                      onLeafClick={handleLeaf}
                    />
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
    </div>
  );
}
