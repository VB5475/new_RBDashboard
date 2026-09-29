import { useMemo, useState } from 'react';
import { Bell, Coins, Home, Menu, Moon, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { isOverviewRoutePath, pickDefaultLandingPath } from '../constants/routes';
import { getMotherLinkTarget, getPageHeading } from '../utils/pageHeading';
import { openMotherLogin } from '../services/motherLogin';
import BroadcastBanner from './BroadcastBanner';
import RnbHeaderBreadcrumbs from './RnbHeaderBreadcrumbs';
import RnbHeaderUserMenu from './RnbHeaderUserMenu';
import OverviewServerTime from './OverviewServerTime';
import './RnbHeader.css';

const EMBLEM_SRC = `${import.meta.env.BASE_URL}rnb-login/emblem.jpg`;
const BANNER_STORAGE_KEY = 'rnb_showBanner';
const DEPARTMENT_NAME = 'Roads and Buildings Department';
const DEPARTMENT_NAME_SHORT = 'R&BD';

function readBannerVisible(defaultVisible = true) {
  try {
    const stored = localStorage.getItem(BANNER_STORAGE_KEY);
    if (stored == null) return defaultVisible;
    return stored === 'true';
  } catch {
    return defaultVisible;
  }
}

export default function RnbHeader({
  isLg = true,
  sidebarExpanded,
  onMenuToggle,
  messages = [],
}) {
  const [bannerVisible, setBannerVisible] = useState(() => readBannerVisible(true));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const hasMessages = messages.length > 0;

  const heading = useMemo(
    () => getPageHeading(user?.UserRights, location.pathname),
    [user?.UserRights, location.pathname],
  );

  const motherTarget = useMemo(
    () => getMotherLinkTarget(heading.childTitle),
    [heading.childTitle],
  );

  const homePath = useMemo(
    () => pickDefaultLandingPath(user?.AllowedRoutes ?? []),
    [user?.AllowedRoutes],
  );

  function toggleBanner() {
    setBannerVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BANNER_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleMotherLogin() {
    try {
      await openMotherLogin(motherTarget, user?.LoginUserID);
    } catch {
      toast.error('Could not open mother login');
    }
  }

  const showHome = location.pathname !== homePath;
  const showServerTime = isOverviewRoutePath(location.pathname);

  return (
    <header className="rnb-page-header">
      <div className="rnb-page-header-bar">
        {!isLg ? (
          <button
            type="button"
            className="rnb-page-header-menu"
            onClick={onMenuToggle}
            aria-label={sidebarExpanded ? 'Close menu' : 'Open menu'}
          >
            <Menu size={20} />
          </button>
        ) : null}

        <div className="rnb-page-header-nav">
          <div className="rnb-header-dept">
            <img
              src={EMBLEM_SRC}
              alt=""
              className="rnb-page-header-emblem"
              width={30}
              height={30}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="rnb-header-dept-name rnb-header-dept-name--full">
              {DEPARTMENT_NAME}
            </span>
            <span className="rnb-header-dept-name rnb-header-dept-name--short">
              {DEPARTMENT_NAME_SHORT}
            </span>
          </div>
          <RnbHeaderBreadcrumbs
            parentTitle={heading.parentTitle}
            childTitle={heading.childTitle}
            homePath={homePath}
          />
          {motherTarget ? (
            <button
              type="button"
              className="rnb-header-mother-btn"
              onClick={handleMotherLogin}
              title={`Open ${motherTarget}`}
            >
              <span className="rnb-header-mother-label">
                <span className="rnb-header-mother-label-long">
                  Click Here For Mother Login
                </span>
                <span className="rnb-header-mother-label-short">Mother Login</span>
              </span>
              <Coins size={15} className="rnb-header-mother-icon" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="rnb-page-header-actions">
          {showServerTime ? <OverviewServerTime variant="header" /> : null}

          <button
            type="button"
            className="rnb-header-icon-btn rnb-header-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLg && showHome ? (
            <button
              type="button"
              className="rnb-header-icon-btn"
              onClick={() => navigate(homePath)}
              aria-label="Go to home"
              title="Home"
            >
              <Home size={18} />
            </button>
          ) : null}

          {hasMessages ? (
            <button
              type="button"
              className="rnb-header-icon-btn rnb-header-bell"
              onClick={toggleBanner}
              aria-label={bannerVisible ? 'Hide announcements' : 'Show announcements'}
              title="Notifications"
            >
              <Bell size={18} />
              {!bannerVisible ? (
                <span className="rnb-header-bell-badge" aria-hidden />
              ) : null}
            </button>
          ) : null}

          <RnbHeaderUserMenu />
        </div>
      </div>

      {hasMessages && bannerVisible ? (
        <BroadcastBanner messages={messages} embedded />
      ) : null}
    </header>
  );
}
