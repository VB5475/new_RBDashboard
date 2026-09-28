import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  loadCaptchaEnginge,
  LoadCanvasTemplateNoReload,
  validateCaptcha,
} from 'react-simple-captcha';
import {
  Download,
  Eye,
  EyeOff,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { pickDefaultLandingPath } from '../constants/routes';
import { login } from '../services/auth';
import { fetchUserVisitStats } from '../services/loginAnalytics';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { isAuthenticated } from '../utils/session';
import {
  MOBILEAPP_LINK,
  SHOW_TRAFFIC_STATUS,
  USERMANUAL_URL,
} from '../config/api.config';
import LoginCarousel from './login/LoginCarousel';
import LoginDepartmentGrid from './login/LoginDepartmentGrid';
import LoginQrModal from './login/LoginQrModal';
import LoginTrafficPanel from './login/LoginTrafficPanel';
import {
  getLoginDepartments,
  LOGIN_ASSETS,
  LOGIN_CAROUSEL,
} from './login/loginDepartments';
import './LoginPage.css';

export default function LoginPage() {
  const [loginID, setLoginID] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(SHOW_TRAFFIC_STATUS);

  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const reloadCaptcha = useCallback(() => {
    if (isDark) {
      loadCaptchaEnginge(6, '#111a2b', '#e5eef8', 'numbers');
    } else {
      loadCaptchaEnginge(6, '#f8fafc', '#334155', 'numbers');
    }
  }, [isDark]);

  useEffect(() => {
    reloadCaptcha();
  }, [reloadCaptcha]);

  /** Dashboard shell locks body scroll; login is a long page — re-enable vertical scroll. */
  useEffect(() => {
    document.documentElement.classList.add('login-scroll');
    return () => document.documentElement.classList.remove('login-scroll');
  }, []);

  useEffect(() => {
    if (!SHOW_TRAFFIC_STATUS) return;
    let cancelled = false;
    (async () => {
      const stats = await fetchUserVisitStats();
      if (!cancelled) {
        setTraffic(stats);
        setTrafficLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthenticated()) {
    return (
      <Navigate to={pickDefaultLandingPath(user?.AllowedRoutes ?? [])} replace />
    );
  }

  async function performLogin(payload) {
    setSubmitting(true);
    try {
      const user = await login(payload);
      if (user) {
        setUser(user);
        navigate(pickDefaultLandingPath(user.AllowedRoutes ?? []), { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = loginID.trim();
    const pass = password.trim();
    if (!id || !pass) return;

    if (!validateCaptcha(captchaInput)) {
      toast.error('Captcha does not match');
      setCaptchaInput('');
      reloadCaptcha();
      return;
    }

    await performLogin({ loginID: id, password: pass });
    setCaptchaInput('');
  }

  const departments = getLoginDepartments();

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="login-topbar-brand">
          <div className="login-emblem-wrap">
            <img
              src={LOGIN_ASSETS.emblem}
              alt="Government of Gujarat — Roads and Buildings"
              className="login-emblem"
            />
          </div>
          <div className="login-topbar-titles">
            <p className="login-topbar-eyebrow">Government Of Gujarat</p>
            <h1 className="login-topbar-title">Roads And Buildings Department</h1>
            <p className="login-topbar-tagline">Integrated Dashboard And Analytics Portal</p>
          </div>
        </div>
        <div className="login-topbar-actions">
          <button
            type="button"
            className="login-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {MOBILEAPP_LINK ? (
            <button type="button" className="login-app-cta" onClick={() => setQrOpen(true)}>
              <Download size={18} />
              <span>Download RNB Mobile App</span>
            </button>
          ) : null}
        </div>
      </header>

      <LoginQrModal open={qrOpen} onClose={() => setQrOpen(false)} />

      <section
        className="login-hero"
        style={{ '--login-hero-bg': `url(${LOGIN_ASSETS.heroBg})` }}
      >
        <div className="login-hero-overlay" aria-hidden />
        <div className="login-hero-grid">
          {SHOW_TRAFFIC_STATUS ? (
            <LoginTrafficPanel stats={traffic} loading={trafficLoading} />
          ) : (
            <div className="login-hero-tagline" aria-hidden>
              <ShieldCheck size={28} />
              <p>Unified Analytics For Roads, Bridges, And Infrastructure Programs.</p>
            </div>
          )}

          <form className="login-panel" onSubmit={handleSubmit}>
            <header className="login-panel-header">
              <div className="login-panel-badge">
                <img src={LOGIN_ASSETS.roadGif} alt="" className="login-panel-mark" />
              </div>
              <div className="login-panel-heading">
                <p className="login-panel-dept">Roads And Buildings Department</p>
                <h1 className="login-panel-title">Welcome Dashboard Login</h1>
              </div>
            </header>

            <div className="login-panel-body">
            <label className="login-field">
              <span>User Id</span>
              <input
                value={loginID}
                onChange={(e) => setLoginID(e.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-captcha-row">
              <div className="login-captcha-canvas">
                <LoadCanvasTemplateNoReload />
                <button
                  type="button"
                  className="login-captcha-refresh"
                  onClick={reloadCaptcha}
                  aria-label="Refresh captcha"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              <label className="login-field login-captcha-input">
                <span>Captcha</span>
                <input
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter Code"
                  autoComplete="off"
                  required
                />
              </label>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Logging In…' : 'Login'}
            </button>

            <div className="login-links">
              <Link to="/forgotpassword">Forgot Password?</Link>
              {USERMANUAL_URL ? (
                <a href={USERMANUAL_URL} target="_blank" rel="noopener noreferrer">
                  User Manual
                </a>
              ) : null}
            </div>
            </div>
          </form>
        </div>
        <p className="login-hero-scroll-hint" aria-hidden>
          Scroll For Featured Works And Linked Applications
        </p>
      </section>

      <section className="login-showcase" id="login-showcase">
        <header className="login-section-head">
          <span className="login-section-eyebrow">State Infrastructure</span>
          <h2 className="login-section-title">Featured Works Across Gujarat</h2>
          <p className="login-section-lead">
            Roads, Bridges, And Public Assets Monitored Under The R&amp;B Portfolio.
          </p>
        </header>
        <LoginCarousel
          images={LOGIN_CAROUSEL.images}
          captions={LOGIN_CAROUSEL.captions}
        />
      </section>

      <section className="login-ecosystem" id="login-ecosystem">
        <header className="login-section-head login-section-head--compact">
          <span className="login-section-eyebrow">Ecosystem</span>
          <h2 className="login-section-title">Other R&amp;B Applications</h2>
          <p className="login-section-lead">
            Quick Access To Linked Departmental Systems And Monitoring Tools.
          </p>
        </header>
        <LoginDepartmentGrid departments={departments} />
      </section>
    </div>
  );
}
