import './RnbWidgetHeader.css';

/**
 * Chart / widget chrome header (legacy CustomCard + Modal title bar, weatherapp tokens).
 */
export default function RnbWidgetHeader({
  title,
  subtitle,
  actions,
  variant = 'card',
  titleId,
}) {
  const TitleTag = variant === 'modal' ? 'h2' : 'h3';

  return (
    <header
      className={`rnb-widget-header rnb-widget-header--${variant}`}
    >
      <div className="rnb-widget-header-main">
        <span className="rnb-widget-header-accent" aria-hidden />
        <div className="rnb-widget-header-text">
          <TitleTag
            id={titleId}
            className="rnb-widget-header-title"
          >
            {title}
          </TitleTag>
          {subtitle ? (
            <p className="rnb-widget-header-subtitle">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="rnb-widget-header-actions">{actions}</div>
      ) : null}
    </header>
  );
}
