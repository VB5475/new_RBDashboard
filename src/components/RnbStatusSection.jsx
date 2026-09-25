import { LayoutGrid } from 'lucide-react';
import RnbStatCard from './RnbStatCard';
import RnbAppliedFilters from './RnbAppliedFilters';
import './RnbStatusSection.css';

function isTotalRow(row) {
  const label = String(row?.Label ?? '').trim().toLowerCase();
  return label === 'total' || label.startsWith('total ');
}

export default function RnbStatusSection({
  title,
  rows = [],
  showFilter,
  onFilter,
  onClearFilters,
  appliedFilters = [],
  onCardClick,
  showDrilldown = false,
  onDrilldownClick,
  animationOffset = 0,
}) {
  const hasAppliedFilters = appliedFilters.length > 0;
  const statusRows = rows.filter((r) => !isTotalRow(r));
  const totalRow = rows.find(isTotalRow);

  return (
    <section className="rnb-status-section glass-card fade-in-up">
      <header className="rnb-status-section-header">
        <div className="rnb-status-section-heading">
          {title && <h2>{title}</h2>}
          <span className="rnb-status-section-count">
            {statusRows.length} statuses
          </span>
        </div>
        <div className="rnb-status-section-actions">
          {showDrilldown && onDrilldownClick ? (
            <button
              type="button"
              className="rnb-status-drilldown-btn"
              onClick={onDrilldownClick}
              title="Drill down"
              aria-label="Open drill down grid"
            >
              <LayoutGrid size={18} aria-hidden />
            </button>
          ) : null}
          {showFilter ? (
            <button
              type="button"
              className={`rnb-status-filter-btn${hasAppliedFilters ? ' has-active-filters' : ''}`}
              onClick={onFilter}
            >
              <span className="rnb-status-filter-icon" aria-hidden>
                ◇
              </span>
              Filter
              {hasAppliedFilters && (
                <span className="rnb-status-filter-count">
                  {appliedFilters.length > 9 ? '9+' : appliedFilters.length}
                </span>
              )}
            </button>
          ) : null}
        </div>
      </header>

      <RnbAppliedFilters filters={appliedFilters} onClearAll={onClearFilters} />

      <div className="rnb-status-grid">
        {statusRows.map((row, i) => (
          <RnbStatCard
            key={`${row.Label}-${i}`}
            row={row}
            delay={animationOffset + i * 35}
            onClick={() => onCardClick?.(row)}
          />
        ))}
      </div>

      {totalRow && (
        <RnbStatCard
          row={totalRow}
          variant="summary"
          delay={animationOffset + statusRows.length * 35}
          onClick={() => onCardClick?.(totalRow)}
        />
      )}
    </section>
  );
}
