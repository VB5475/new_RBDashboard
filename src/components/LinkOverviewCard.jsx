import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navIcon } from '../navigation/buildNav';
import './LinkOverviewCard.css';

export default function LinkOverviewCard({ module, delay = 0, accent }) {
  const { title, href, to, menuCode } = module;

  const className =
    'link-overview-card glass-card fade-in-up link-overview-card--clickable rnb-overview-card-shine';
  const style = {
    animationDelay: `${delay}ms`,
    ...(accent ? { '--link-card-accent': accent } : {}),
  };

  const content = (
    <>
      {menuCode ? (
        <span className="link-overview-card-icon-badge" aria-hidden>
          {navIcon(menuCode, false, 18)}
        </span>
      ) : null}
      <h3 className="link-overview-card-title">{title}</h3>
      {href ? (
        <ArrowUpRight
          className="link-overview-card-external-icon"
          size={16}
          aria-hidden
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        style={style}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={to || '/home'} className={className} style={style}>
      {content}
    </Link>
  );
}
