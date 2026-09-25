import './WelcomePage.css';

const WELCOME_KEY = 'rnb_welcome_dismissed';

export function isWelcomeDismissed() {
  return sessionStorage.getItem(WELCOME_KEY) === '1';
}

export function dismissWelcome() {
  sessionStorage.setItem(WELCOME_KEY, '1');
}

export default function WelcomePage({ onContinue }) {
  return (
    <div className="welcome-page">
      <div className="welcome-card glass-card fade-in-up">
        <div className="welcome-emblem">🇮🇳</div>
        <span className="welcome-badge">Government of Gujarat · R&amp;B Department</span>
        <h1>Welcome to Roads and Buildings Dashboard</h1>
        <p>Integrated monitoring for roads, bridges, and department programs.</p>
        <div className="welcome-divider" />
        <button type="button" className="welcome-continue" onClick={onContinue}>
          Enter dashboard
        </button>
      </div>
    </div>
  );
}
