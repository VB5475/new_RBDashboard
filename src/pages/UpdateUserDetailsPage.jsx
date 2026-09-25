import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import AccountSettingsShell from '../components/AccountSettingsShell';
import AccountConfirmDialog from '../components/AccountConfirmDialog';
import RnbLoader from '../components/RnbLoader';
import {
  fetchUserDetails,
  updateUserDetails,
  toastApiRow,
} from '../services/account';
import { isInputSafe, sanitizeInput } from '../utils/sanitizeInput';
import { globalLogout } from '../utils/session';
import './AccountSettingsPage.css';

export default function UpdateUserDetailsPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [existingUserName, setExistingUserName] = useState('');
  const [existingMobile, setExistingMobile] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const details = await fetchUserDetails();
        if (cancelled) return;
        if (!details) {
          toast.error('Could not load user details');
          return;
        }
        setCode(details.code);
        setExistingUserName(details.userName);
        setExistingMobile(details.mobileNo);
      } catch {
        toast.error('Could not load user details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setNewUserName('');
    setNewMobile('');
  }

  async function submitUpdate() {
    setSubmitting(true);
    try {
      if (!isInputSafe(newUserName) || !isInputSafe(newMobile)) {
        toast.error('Invalid input detected');
        return;
      }
      if (newUserName === existingUserName) {
        toast.error('New username must differ from the current username');
        return;
      }
      if (newMobile === existingMobile) {
        toast.error('New mobile number must differ from the current number');
        return;
      }

      const row = await updateUserDetails({
        newUserName: sanitizeInput(newUserName),
        newMobileNo: sanitizeInput(newMobile),
      });
      if (toastApiRow(row)) {
        await globalLogout();
        setUser(null);
        navigate('/login', { replace: true });
      }
    } catch {
      toast.error('Server error');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <AccountSettingsShell>
    <div className="rnb-account-page">
      <div className="rnb-account-card glass-card">
        <header className="rnb-account-card-header">
          <span className="rnb-account-card-icon" aria-hidden>
            <UserCircle2 size={26} />
          </span>
          <div>
            <h1>Update Profile</h1>
            <p>Enter new user details to update your account.</p>
          </div>
        </header>

        {loading ? (
          <RnbLoader variant="inline" message="Loading profile…" />
        ) : code ? (
          <form
            className="rnb-account-card-body"
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <label className="rnb-account-field">
              <span>Code</span>
              <input value={code} disabled readOnly />
            </label>
            <label className="rnb-account-field">
              <span>Existing user name</span>
              <input value={existingUserName} disabled readOnly />
            </label>
            <label className="rnb-account-field">
              <span>Existing mobile number</span>
              <input value={existingMobile} disabled readOnly />
            </label>
            <label className="rnb-account-field">
              <span>Update user name</span>
              <input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label className="rnb-account-field">
              <span>Update mobile number</span>
              <input
                type="tel"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                required
                autoComplete="tel"
              />
            </label>

            <div className="rnb-account-actions">
              <Link to="/home" className="rnb-account-btn rnb-account-btn--danger">
                <Home size={16} />
                Home
              </Link>
              <button type="button" className="rnb-account-btn" onClick={resetForm}>
                Reset
              </button>
              <button
                type="submit"
                className="rnb-account-btn rnb-account-btn--success"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </form>
        ) : (
          <p className="rnb-account-loading">Profile details unavailable.</p>
        )}
      </div>

      <AccountConfirmDialog
        open={confirmOpen}
        title="Update profile"
        message="Are you sure you want to update your user details? You will be logged out after a successful update."
        confirmLabel="Update"
        onConfirm={submitUpdate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
    </AccountSettingsShell>
  );
}
