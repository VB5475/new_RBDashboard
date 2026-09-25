/** Stat colors map to global tokens in index.css (--accent-green, etc.) */
const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Total users', tone: 'green' },
  { key: 'todayActive', label: 'Visits today', tone: 'primary' },
  { key: 'thisWeekActive', label: 'Visits this week', tone: 'amber' },
  { key: 'thisMonthActive', label: 'Visits this month', tone: 'secondary' },
];

export default function LoginTrafficPanel({ stats, loading }) {
  return (
    <aside className="login-traffic" aria-label="User activity count">
      <div className="login-traffic-head">
        <div className="login-traffic-title-row">
          <span className="login-traffic-pulse" aria-hidden />
          <h2>Live activity</h2>
        </div>
        <p>Platform usage across R&amp;B dashboards</p>
      </div>
      <div className="login-traffic-grid">
        {STAT_CONFIG.map(({ key, label, tone }) => (
          <div key={key} className={`login-traffic-stat login-traffic-stat--${tone}`}>
            <span className="login-traffic-stat-label">{label}</span>
            <strong className="login-traffic-stat-value">
              {loading ? '—' : (stats?.[key] ?? 0).toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
