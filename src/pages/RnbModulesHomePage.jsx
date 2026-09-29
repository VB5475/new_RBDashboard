import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { groupAccentColor, navIcon } from '../navigation/buildNav';
import { resolveGroupAccent } from '../theme/overviewColors';
import SubmoduleOverviewCard from '../components/SubmoduleOverviewCard';
import LinkOverviewCard from '../components/LinkOverviewCard';
import { useUser } from '../context/UserContext';
import {
  fetchAllModulesOverview,
  isImportantLinksGroup,
} from '../services/modulesHome';
import { createFilterSession } from '../services/dashboard';
import { fetchChartClickRows } from '../services/drilldown';
import { getUserToken } from '../utils/session';
import RnbLoader from '../components/RnbLoader';
import { lazyModal } from '../utils/lazyModal';
import './RnbModulesHomePage.css';

const RnbChartClickModal = lazyModal(() => import('../components/RnbChartClickModal'));

export default function RnbModulesHomePage() {
  const { user } = useUser();
  const [chartClick, setChartClick] = useState(null);
  const [chartClickLoading, setChartClickLoading] = useState(false);

  const { data: groups, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rnb-modules-home', user?.UserID],
    queryFn: () => fetchAllModulesOverview(user),
    enabled: Boolean(user?.UserRights?.length),
    staleTime: 5 * 60 * 1000,
  });

  const handleStatusClick = useCallback(async ({ label, objectId, sectionTitle, module }) => {
    if (!label || objectId == null || !module?.menuCode) return;

    setChartClickLoading(true);
    setChartClick({
      open: true,
      menuCode: module.menuCode,
      title: sectionTitle || module.title,
      subtitle: label,
      rows: [],
    });

    try {
      const sessionId = await createFilterSession(objectId);
      const rows = await fetchChartClickRows({
        menuCode: module.menuCode,
        sessionId: sessionId ?? '',
        objectId,
        filterString: '',
        clickedValue1: label,
        clickedValue2: '',
        loginId: getUserToken(),
      });

      if (!rows?.length) {
        toast.error('No data available');
        setChartClick(null);
        return;
      }

      setChartClick({
        open: true,
        menuCode: module.menuCode,
        title: sectionTitle || module.title,
        subtitle: label,
        rows,
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to load grid');
      setChartClick(null);
    } finally {
      setChartClickLoading(false);
    }
  }, []);

  const closeChartClick = useCallback(() => {
    setChartClick(null);
    setChartClickLoading(false);
  }, []);

  if (isLoading) {
    return (
      <RnbLoader variant="page" message="Loading dashboard overview" />
    );
  }

  if (isError) {
    return (
      <div className="rnb-home-message rnb-home-error">
        {error?.message || 'Could not load dashboard overview'}
        <button type="button" className="rnb-retry-btn" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (!groups?.length) {
    return (
      <div className="rnb-home-message">
        No dashboard modules assigned. Contact your administrator for access.
      </div>
    );
  }

  let cardDelay = 0;

  return (
    <div className="rnb-modules-home">
      {groups.map((group) => {
        const accent = resolveGroupAccent(
          groupAccentColor(group.code),
          group.code || group.key,
        );
        const isImportantLinks = isImportantLinksGroup(group);
        return (
          <section
            key={group.key}
            className={`rnb-modules-group fade-in-up${isImportantLinks ? ' rnb-modules-group--important-links' : ''}`}
          >
            <div
              className="rnb-modules-group-head"
              style={{ '--group-accent': accent }}
            >
              {group.code ? (
                <span className="rnb-modules-group-icon" aria-hidden>
                  {navIcon(group.code, false, 20)}
                </span>
              ) : null}
              <div className="rnb-modules-group-head-text">
                <h2>{group.name}</h2>
                <span className="rnb-modules-group-count">
                  {group.modules.every((m) => m.kind === 'link')
                    ? `${group.modules.length} link${group.modules.length === 1 ? '' : 's'}`
                    : `${group.modules.length} submodule${group.modules.length === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
            <div
              className={`rnb-modules-group-grid${isImportantLinks ? ' rnb-modules-group-grid--important-links' : ''}`}
            >
              {group.modules.map((mod) => {
                const delay = cardDelay;
                cardDelay += 60;
                if (mod.kind === 'link') {
                  return (
                    <LinkOverviewCard
                      key={mod.menuCode || mod.title}
                      module={mod}
                      delay={delay}
                      accent={accent}
                    />
                  );
                }
                return (
                  <SubmoduleOverviewCard
                    key={mod.menuCode || mod.path}
                    module={mod}
                    delay={delay}
                    accent={accent}
                    onStatusClick={handleStatusClick}
                    statusClickLoading={chartClickLoading}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <RnbChartClickModal
        open={Boolean(chartClick?.open)}
        menuCode={chartClick?.menuCode}
        title={chartClick?.title}
        subtitle={chartClick?.subtitle}
        rows={chartClick?.rows}
        loading={chartClickLoading}
        onClose={closeChartClick}
      />
    </div>
  );
}
