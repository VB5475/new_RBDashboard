import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { activeTabCodeFromPath } from '../utils/activeTabCode';
import {
  fetchHomeWidgets,
  chartDatasetsFromTable,
  fetchObjectDataset,
} from '../services/dashboard';
import { fetchChartClickRows, fetchDrilldownTables } from '../services/drilldown';
import {
  getFilterStringsForMenu,
  setFilterStringsForMenu,
  getSessionIdsForMenu,
} from '../utils/chartSessionStorage';
import { getUserToken } from '../utils/session';
import RnbStatusSection from '../components/RnbStatusSection';
import RnbChartPanel from '../components/RnbChartPanel';
import FilterDrawer from '../components/FilterDrawer';
import RnbChartClickPanel from '../components/RnbChartClickPanel';
import RnbDrilldownModal from '../components/RnbDrilldownModal';
import RnbChartExpandModal from '../components/RnbChartExpandModal';
import { hasDrilldownGridData } from '../utils/drilldownGrid';
import RnbLoader from '../components/RnbLoader';
import './RnbHomePage.css';

export default function RnbHomePage() {
  const location = useLocation();
  const menuCode = activeTabCodeFromPath(location.pathname);
  const queryClient = useQueryClient();

  const [charts, setCharts] = useState([]);
  const [cards, setCards] = useState([]);
  const [filterWidget, setFilterWidget] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [appliedFiltersByWidget, setAppliedFiltersByWidget] = useState({});
  /** Per-widget drawer UI state (legacy chartWiseFilterStates + filter Values after cascade). */
  const [filterDraftByWidget, setFilterDraftByWidget] = useState({});
  const [chartClickView, setChartClickView] = useState(null);
  const [drilldown, setDrilldown] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['rnb-home', menuCode],
    queryFn: () => fetchHomeWidgets(menuCode),
    enabled: Boolean(menuCode),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setCharts(data.charts ?? []);
      setCards(data.cards ?? []);
      setAppliedFiltersByWidget({});
    }
  }, [data]);

  const openFilters = useCallback((widget) => {
    setFilterWidget(widget);
    setFilterDrawerOpen(true);
  }, []);

  const handleFilterApplied = useCallback(
    async (
      widgetId,
      objectType,
      filterString,
      payload,
      isReset,
      appliedFilters = [],
      draft = null,
    ) => {
      if (isReset) {
        const stored = getFilterStringsForMenu(menuCode) || {};
        stored[widgetId] = filterString ?? filterWidget?.filterString;
        setFilterStringsForMenu(menuCode, stored);
        setAppliedFiltersByWidget((prev) => ({ ...prev, [widgetId]: [] }));
        setFilterDraftByWidget((prev) => {
          const next = { ...prev };
          delete next[widgetId];
          return next;
        });

        const fresh = await fetchObjectDataset(widgetId);
        if (objectType === 'CHART') {
          setCharts((prev) =>
            prev.map((c) => {
              if (c.id !== widgetId) return c;
              const { labels, datasets } = chartDatasetsFromTable(
                fresh,
                c.type.toUpperCase(),
              );
              return { ...c, labels, datasets, filterString: c.filterString };
            }),
          );
        } else if (objectType === 'CARD') {
          setCards((prev) =>
            prev.map((c) =>
              c.id === widgetId ? { ...c, rows: fresh?.Table1 ?? [] } : c,
            ),
          );
        }
        return;
      }

      const stored = getFilterStringsForMenu(menuCode) || {};
      stored[widgetId] = filterString;
      setFilterStringsForMenu(menuCode, stored);
      setAppliedFiltersByWidget((prev) => ({
        ...prev,
        [widgetId]: appliedFilters,
      }));
      if (draft) {
        setFilterDraftByWidget((prev) => ({ ...prev, [widgetId]: draft }));
      }

      if (!payload?.Table1?.length) {
        toast.error('No data for selected filters');
        return;
      }

      if (objectType === 'CHART') {
        setCharts((prev) =>
          prev.map((c) => {
            if (c.id !== widgetId) return c;
            const { labels, datasets } = chartDatasetsFromTable(
              payload,
              c.type.toUpperCase(),
            );
            return { ...c, labels, datasets, filterString };
          }),
        );
      } else if (objectType === 'CARD') {
        setCards((prev) =>
          prev.map((c) =>
            c.id === widgetId ? { ...c, rows: payload.Table1, filterString } : c,
          ),
        );
      }
    },
    [menuCode, filterWidget],
  );

  const clearWidgetFilters = useCallback(
    (widget) => {
      if (!widget) return;
      handleFilterApplied(
        widget.id,
        widget.objectType,
        widget.filterString,
        null,
        true,
        [],
      );
    },
    [handleFilterApplied],
  );

  const handleChartClick = useCallback(
    async (chart, clickedValue1, clickedValue2) => {
      const sessionMap = getSessionIdsForMenu(menuCode) || {};
      const filterMap = getFilterStringsForMenu(menuCode) || {};
      const rows = await fetchChartClickRows({
        menuCode,
        sessionId: sessionMap[chart.id] ?? chart.sessionId,
        objectId: chart.id,
        filterString: filterMap[chart.id] ?? chart.filterString,
        clickedValue1,
        clickedValue2,
        loginId: getUserToken(),
      });
      if (!rows?.length) {
        toast.error('No data available');
        return;
      }
      const subtitle = clickedValue2
        ? `${clickedValue1} — ${clickedValue2}`
        : clickedValue1;
      setExpandedChart(null);
      setChartClickView({
        title: chart.title,
        subtitle,
        rows,
      });
    },
    [menuCode],
  );

  const handleDrilldown = useCallback(
    async (widget) => {
      const filterMap = getFilterStringsForMenu(menuCode) || {};
      const level0FilterString =
        filterMap[widget.id] ?? widget.filterString ?? '';
      setDrilldownLoading(true);
      try {
        const result = await fetchDrilldownTables({
          level: 1,
          objectId: widget.id,
          filterString: level0FilterString,
          loginId: getUserToken(),
        });
        if (!hasDrilldownGridData(result?.mainTable, result?.refTable)) {
          toast.error('No drilldown data');
          return;
        }
        setDrilldown({
          title: widget.title,
          objectId: widget.id,
          mainTable: result.mainTable,
          refTable: result.refTable,
          level0FilterString,
        });
      } finally {
        setDrilldownLoading(false);
      }
    },
    [menuCode],
  );

  if (!menuCode) {
    return (
      <div className="rnb-home-message">
        No menu code for this route. Check user rights for{' '}
        <code>{location.pathname}</code>.
      </div>
    );
  }

  if (isLoading) {
    return (
      <RnbLoader variant="page" message="Loading dashboard widgets" />
    );
  }

  if (isError) {
    return (
      <div className="rnb-home-message rnb-home-error">
        Failed to load dashboard: {error?.message || 'Unknown error'}
        <button
          type="button"
          className="rnb-retry-btn"
          onClick={() => queryClient.invalidateQueries(['rnb-home', menuCode])}
        >
          Retry
        </button>
      </div>
    );
  }

  if (chartClickView?.rows?.length) {
    return (
      <div className="rnb-home-page rnb-home-page--chart-click">
        <RnbChartClickPanel
          menuCode={menuCode}
          title={chartClickView.title}
          subtitle={chartClickView.subtitle}
          rows={chartClickView.rows}
          onBack={() => setChartClickView(null)}
        />
      </div>
    );
  }

  return (
    <div className="rnb-home-page">
      {cards.length > 0 &&
        cards.map((card, cardIdx) => (
          <RnbStatusSection
            key={card.id}
            title={card.title}
            rows={card.rows}
            showFilter={card.filters?.length > 0}
            onFilter={() => openFilters(card)}
            appliedFilters={appliedFiltersByWidget[card.id] ?? []}
            onClearFilters={() => clearWidgetFilters(card)}
            animationOffset={cardIdx * 80}
            showDrilldown={card.isDrillDown}
            onDrilldownClick={() => handleDrilldown(card)}
            onCardClick={(row) =>
              handleChartClick(card, String(row.Label ?? '').trim(), '')
            }
          />
        ))}

      {charts.length > 0 && (
        <section className="rnb-home-section">
          <h2 className="rnb-section-title">Charts</h2>
          <div className="rnb-chart-grid">
            {charts.map((chart, i) => (
              <RnbChartPanel
                key={chart.id}
                chart={chart}
                delay={i * 100}
                appliedFilters={appliedFiltersByWidget[chart.id] ?? []}
                onClearFilters={() => clearWidgetFilters(chart)}
                onFilterClick={() => openFilters(chart)}
                onExpandClick={() => setExpandedChart(chart)}
                onDrilldownClick={() => handleDrilldown(chart)}
                onChartClick={(v1, v2) => handleChartClick(chart, v1, v2)}
              />
            ))}
          </div>
        </section>
      )}

      {cards.length === 0 && charts.length === 0 && (
        <div className="rnb-home-message">No widgets returned for this menu.</div>
      )}

      <FilterDrawer
        open={filterDrawerOpen}
        widget={filterWidget}
        savedDraft={
          filterWidget ? filterDraftByWidget[filterWidget.id] : null
        }
        onDraftPersist={(widgetId, draft) =>
          setFilterDraftByWidget((prev) => ({ ...prev, [widgetId]: draft }))
        }
        onClose={() => setFilterDrawerOpen(false)}
        onApplied={handleFilterApplied}
      />

      {drilldownLoading ? (
        <RnbLoader variant="fullscreen" message="Loading drilldown…" />
      ) : null}

      <RnbDrilldownModal
        open={Boolean(drilldown)}
        title={drilldown?.title}
        objectId={drilldown?.objectId}
        initialMainTable={drilldown?.mainTable}
        initialRefTable={drilldown?.refTable}
        level0FilterString={drilldown?.level0FilterString}
        onClose={() => setDrilldown(null)}
      />

      {expandedChart ? (
        <RnbChartExpandModal
          chart={
            charts.find((c) => c.id === expandedChart.id) ?? expandedChart
          }
          appliedFilters={appliedFiltersByWidget[expandedChart.id] ?? []}
          onClose={() => setExpandedChart(null)}
          onDrilldownClick={
            expandedChart.isDrillDown
              ? () => {
                  handleDrilldown(expandedChart);
                  setExpandedChart(null);
                }
              : undefined
          }
          onChartClick={(v1, v2) => handleChartClick(expandedChart, v1, v2)}
        />
      ) : null}
    </div>
  );
}
