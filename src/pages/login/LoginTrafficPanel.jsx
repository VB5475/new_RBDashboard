import { USER_ACTIVITY_METRICS } from '../../services/loginAnalytics';

const PLACEHOLDER_METRICS = USER_ACTIVITY_METRICS.map(({ displayLabel, tone }) => ({
  label: displayLabel,
  tone,
}));

export default function LoginTrafficPanel({ stats, loading }) {
  const metrics = stats?.metrics ?? (loading ? PLACEHOLDER_METRICS : []);

  return (
    <aside className="login-traffic" aria-label="User Activity Count">
      <div className="login-traffic-head">
        <div className="login-traffic-title-row">
          <span className="login-traffic-pulse" aria-hidden />
          <h2>User Activity Count</h2>
        </div>
        <p>Platform Usage Across R&amp;B Dashboards</p>
      </div>
      <div className="login-traffic-grid">
        {metrics.map(({ label, value, tone }, index) => (
          <div
            key={`${label}-${index}`}
            className={`login-traffic-stat login-traffic-stat--${tone}`}
          >
            <span className="login-traffic-stat-label">{label}</span>
            <strong className="login-traffic-stat-value">
              {loading ? '—' : (value ?? 0).toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
