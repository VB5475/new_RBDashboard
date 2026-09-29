import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import RnbStatCard from './RnbStatCard';
import RnbLoader from './RnbLoader';
import './SubmoduleOverviewCard.css';

function isTotalRow(row) {
  const label = String(row?.Label ?? '').trim().toLowerCase();
  return label === 'total' || label.startsWith('total ');
}

export default function SubmoduleOverviewCard({
  module,
  delay = 0,
  accent,
  onStatusClick,
  statusClickLoading = false,
}) {
  const { title, path, href, cardSections, loading, error } = module;
  const canOpen = Boolean(href || path);
  const cardStyle = {
    animationDelay: `${delay}ms`,
    ...(accent ? { '--card-accent': accent } : {}),
  };

  const statusItems = (cardSections ?? []).flatMap((section, sectionIndex) =>
    (section.rows ?? [])
      .filter((row) => !isTotalRow(row))
      .map((row, rowIndex) => ({
        row,
        objectId: section.objectId,
        sectionTitle: section.title,
        key: `${section.objectId ?? sectionIndex}-${row.Label}-${rowIndex}`,
      })),
  );

  const openControl = canOpen ? (
    href ? (
      <a
        href={href}
        className="submodule-overview-open"
        target="_blank"
        rel="noopener noreferrer"
        title={`Open ${title}`}
        aria-label={`Open ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={14} aria-hidden />
      </a>
    ) : (
      <Link
        to={path}
        className="submodule-overview-open"
        title={`Open ${title}`}
        aria-label={`Open ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={14} aria-hidden />
      </Link>
    )
  ) : null;

  return (
    <article className="submodule-overview glass-card fade-in-up rnb-overview-card-shine" style={cardStyle}>
      <header className="submodule-overview-header">
        <h3 className="submodule-overview-title">{title}</h3>
        <div className="submodule-overview-header-meta">
          {!loading && !error && statusItems.length > 0 && (
            <span className="submodule-overview-count">{statusItems.length}</span>
          )}
          {openControl}
        </div>
      </header>

      {loading && <RnbLoader variant="inline" message="Loading status" />}

      {!loading && error && <p className="submodule-overview-error">{error}</p>}

      {!loading && !error && statusItems.length === 0 && (
        <p className="submodule-overview-empty">No status cards for this module.</p>
      )}

      {!loading && !error && statusItems.length > 0 && (
        <div className="submodule-overview-grid">
          {statusItems.map(({ row, objectId, sectionTitle, key }, i) => (
            <RnbStatCard
              key={key}
              row={row}
              delay={delay + i * 20}
              colorKey={`${title}-${row.Label}-${i}`}
              onClick={() => {
                if (statusClickLoading || !onStatusClick) return;
                onStatusClick({
                  label: String(row.Label ?? '').trim(),
                  objectId,
                  sectionTitle,
                  module,
                });
              }}
            />
          ))}
        </div>
      )}
    </article>
  );
}
