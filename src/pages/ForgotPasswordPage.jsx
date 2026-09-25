import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, KeyRound } from 'lucide-react';
import {
  DASHBOARD_URL,
  FORGOT_PASSWORD,
  BASIC_TOKEN_HEADER,
} from '../config/api.config';
import { LOGIN_ASSETS } from './login/loginDepartments';
import './ForgotAuthPage.css';

export default function ForgotPasswordPage() {
  const [userID, setUserID] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const code = userID.trim();
    if (!code) return;

    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        UserCode: code,
        IPAddress: '1',
        MACAddress: '1',
      });
      const result = await axios.get(`${DASHBOARD_URL}/${FORGOT_PASSWORD}?${params}`, {
        headers: BASIC_TOKEN_HEADER,
      });
      const row = result?.data?.ErrMsg?.[0];
      if (row?.ErrCode === '1') toast.success(row.ErrMsg);
      else if (row?.ErrMsg) toast.error(row.ErrMsg);
    } catch {
      toast.error('Could not reach the server. Try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="forgot-auth-page"
      style={{ '--forgot-bg': `url(${LOGIN_ASSETS.heroBg})` }}
    >
      <form className="forgot-auth-card" onSubmit={handleSubmit}>
        <div className="forgot-auth-icon">
          <KeyRound size={32} />
        </div>
        <h1>Forgot password</h1>
        <p>Enter your User ID. If eligible, reset instructions will be sent per department policy.</p>
        <label className="forgot-auth-field">
          <span>User ID</span>
          <input
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <button type="submit" className="forgot-auth-submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Request reset'}
        </button>
        <Link to="/login" className="forgot-auth-back">
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </form>
    </div>
  );
}
