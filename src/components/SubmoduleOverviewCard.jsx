import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import RnbStatCard from './RnbStatCard';
import RnbLoader from './RnbLoader';
import './SubmoduleOverviewCard.css';

function isTotalRow(row) {
  const label = String(row?.Label ?? '').trim().toLowerCase();
  return label === 'total' || label.startsWith('total ');
}

export default function SubmoduleOverviewCard({ module, delay = 0, accent }) {
  const { title, path, href, cardSections, loading, error } = module;
  const clickable = Boolean(href || path);
  const cardStyle = {
    animationDelay: `${delay}ms`,
    ...(accent ? { '--card-accent': accent } : {}),
  };
  const flatRows = cardSections.flatMap((s) => s.rows).filter(Boolean);
  const statusRows = flatRows.filter((r) => !isTotalRow(r));

  const cardClass =
    'submodule-overview glass-card fade-in-up rnb-overview-card-shine' +
    (clickable ? ' submodule-overview--clickable' : '');

  const body = (
    <>
      <header className="submodule-overview-header">
        <h3 className="submodule-overview-title">{title}</h3>
        <div className="submodule-overview-header-meta">
          {!loading && !error && statusRows.length > 0 && (
            <span className="submodule-overview-count">{statusRows.length}</span>
          )}
          {href ? (
            <ArrowUpRight
              className="submodule-overview-external-icon"
              size={14}
              aria-hidden
            />
          ) : null}
        </div>
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

  // Prefer external SSO href (same as sidebar) over internal route.
  if (href) {
    return (
      <a
        href={href}
        className={cardClass}
        style={cardStyle}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    );
  }

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
