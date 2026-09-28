import { Link } from 'react-router-dom';
import RnbStatCard from './RnbStatCard';
import RnbLoader from './RnbLoader';
import './SubmoduleOverviewCard.css';

function isTotalRow(row) {
  const label = String(row?.Label ?? '').trim().toLowerCase();
  return label === 'total' || label.startsWith('total ');
}

export default function SubmoduleOverviewCard({ module, delay = 0, accent }) {
  const { title, path, cardSections, loading, error } = module;
  const cardStyle = {
    animationDelay: `${delay}ms`,
    ...(accent ? { '--card-accent': accent } : {}),
  };
  const flatRows = cardSections.flatMap((s) => s.rows).filter(Boolean);
  const statusRows = flatRows.filter((r) => !isTotalRow(r));

  const cardClass =
    'submodule-overview glass-card fade-in-up rnb-overview-card-shine' +
    (path ? ' submodule-overview--clickable' : '');

  const body = (
    <>
      <header className="submodule-overview-header">
        <h3 className="submodule-overview-title">{title}</h3>
        {!loading && !error && statusRows.length > 0 && (
          <span className="submodule-overview-count">{statusRows.length}</span>
        )}
      </header>

      {loading && (
        <RnbLoader variant="inline" message="Loading status" />
      )}

      {!loading && error && (
        <p className="submodule-overview-error">{error}</p>
      )}

      {!loading && !error && statusRows.length === 0 && (
        <p className="submodule-overview-empty">No status cards for this module.</p>
      )}

      {!loading && !error && statusRows.length > 0 && (
        <div className="submodule-overview-grid">
          {statusRows.map((row, i) => (
            <RnbStatCard
              key={`${row.Label}-${i}`}
              row={row}
              delay={delay + i * 20}
              colorKey={`${title}-${row.Label}-${i}`}
              static
            />
          ))}
        </div>
      )}
    </>
  );

  if (path) {
    return (
      <Link
        to={path}
        className={cardClass}
        style={cardStyle}
      >
        {body}
      </Link>
    );
  }

  return (
    <article
      className={cardClass}
      style={cardStyle}
    >
      {body}
    </article>
  );
}
