import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navIcon } from '../navigation/buildNav';
import './LinkOverviewCard.css';

function formatRemarks(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  return text.replace(/^\(+/, '').replace(/\)+$/, '').trim() || null;
}

export default function LinkOverviewCard({ module, delay = 0, accent }) {
  const { title, infoRemarks, href, to, menuCode } = module;
  const remarks = formatRemarks(infoRemarks);

  const className = [
    'link-overview-card',
    'glass-card',
    'fade-in-up',
    'link-overview-card--clickable',
    'rnb-overview-card-shine',
    remarks ? 'link-overview-card--has-remarks' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    animationDelay: `${delay}ms`,
    ...(accent ? { '--link-card-accent': accent } : {}),
  };

  const content = (
    <>
      {menuCode ? (
        <span className="link-overview-card-icon-badge" aria-hidden>
          {navIcon(menuCode, false, 15)}
        </span>
      ) : null}
      <div className="link-overview-card-text">
        <h3 className="link-overview-card-title">{title}</h3>
        {remarks ? (
          <p className="link-overview-card-remarks">{remarks}</p>
        ) : null}
      </div>
      {href ? (
        <span className="link-overview-card-external" aria-hidden>
          <ArrowUpRight className="link-overview-card-external-icon" size={13} />
        </span>
      ) : null}
    </>
  );

  const card = href ? (
    <a
      href={href}
      className={className}
      style={style}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </a>
  ) : (
    <Link to={to || '/home'} className={className} style={style}>
      {content}
    </Link>
  );

  return <div className="link-overview-card-slot">{card}</div>;
}
