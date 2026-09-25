import './RnbLoader.css';

const EMBLEM_SRC = `${import.meta.env.BASE_URL}rnb-login/emblem.jpg`;

/**
 * @param {'fullscreen' | 'page' | 'inline' | 'overlay'} variant
 */
export default function RnbLoader({
  message = 'Loading',
  variant = 'page',
  className = '',
}) {
  return (
    <div
      className={`rnb-loader rnb-loader--${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rnb-loader-ambient" aria-hidden>
        <span className="rnb-loader-ambient-orb rnb-loader-ambient-orb--1" />
        <span className="rnb-loader-ambient-orb rnb-loader-ambient-orb--2" />
        <span className="rnb-loader-ambient-orb rnb-loader-ambient-orb--3" />
      </div>

      {variant === 'fullscreen' || variant === 'overlay' ? (
        <div className="rnb-loader-backdrop" aria-hidden />
      ) : null}

      <div className="rnb-loader-stage">
        <div className="rnb-loader-card">
          <div className="rnb-loader-visual" aria-hidden>
            <span className="rnb-loader-orbit rnb-loader-orbit--a" />
            <span className="rnb-loader-orbit rnb-loader-orbit--b" />
            <span className="rnb-loader-orbit rnb-loader-orbit--c" />
            <span className="rnb-loader-glow" />
            <span className="rnb-loader-emblem-wrap">
              <img
                src={EMBLEM_SRC}
                alt=""
                className="rnb-loader-emblem"
                width={28}
                height={28}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('is-fallback');
                }}
              />
              <span className="rnb-loader-emblem-fallback">R&B</span>
            </span>
          </div>

          <p className="rnb-loader-message" title={message}>
            <span className="rnb-loader-message-text">{message}</span>
            <span className="rnb-loader-dots" aria-hidden />
          </p>

        </div>
      </div>
    </div>
  );
}
