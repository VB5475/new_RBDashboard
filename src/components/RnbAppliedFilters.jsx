import { Filter, X } from 'lucide-react';
import './RnbAppliedFilters.css';

/**
 * @param {{ label: string, value: string }[]} filters
 */
export default function RnbAppliedFilters({
  filters = [],
  onClearAll,
  /** Chart cards: one row, horizontal scroll — keeps chart height stable */
  variant = 'default',
}) {
  if (!filters?.length) return null;

  const compact = variant === 'compact';
  const visible = compact ? filters : filters.slice(0, 4);
  const extra = compact ? 0 : filters.length - visible.length;

  return (
    <div
      className={`rnb-applied-filters${compact ? ' rnb-applied-filters--compact' : ''}`}
      role="region"
      aria-label="Applied filters"
    >
      <div className="rnb-applied-filters-lead">
        <Filter size={14} strokeWidth={2.25} aria-hidden />
        <span className="rnb-applied-filters-caption">
          {compact ? `${filters.length} active` : 'Applied filters'}
        </span>
      </div>
      <div className="rnb-applied-filters-chips">
        {visible.map((f, i) => (
          <span key={`${f.label}-${i}`} className="rnb-applied-filter-chip">
            <span className="rnb-applied-filter-chip-label">{f.label}</span>
            <span className="rnb-applied-filter-chip-sep" aria-hidden>
              ·
            </span>
            <span className="rnb-applied-filter-chip-value">{f.value}</span>
          </span>
        ))}
        {extra > 0 && (
          <span className="rnb-applied-filter-more">+{extra} more</span>
        )}
      </div>
      {onClearAll && (
        <button
          type="button"
          className="rnb-applied-filters-clear"
          onClick={onClearAll}
          aria-label="Clear all filters"
          title="Clear all filters"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
