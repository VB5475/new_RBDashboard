import './RnbStatCard.css';
import { resolveStatAccent } from '../theme/overviewColors';

/** Single status tile — only API `Label` + `Value`. */
export default function RnbStatCard({
  row,
  delay = 0,
  onClick,
  variant = 'tile',
  colorKey,
  static: isStatic = false,
}) {
  if (row?.Label == null && row?.Value == null) return null;

  const accent = resolveStatAccent(row?.Colour, colorKey ?? row?.Label);
  const isSummary = variant === 'summary';
  const className = `rnb-stat-card${isSummary ? ' rnb-stat-card--summary' : ''}${
    isStatic ? ' rnb-stat-card--static' : ''
  }`;
  const style = { animationDelay: `${delay}ms`, '--stat-accent': accent };

  if (isStatic) {
    return (
      <div className={className} style={style}>
        <span className="rnb-stat-label">{row.Label}</span>
        <span className="rnb-stat-value">{row.Value}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
    >
      <span className="rnb-stat-label">{row.Label}</span>
      <span className="rnb-stat-value">{row.Value}</span>
    </button>
  );
}
