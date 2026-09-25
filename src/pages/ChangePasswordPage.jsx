import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Home, Lock, Check, X as XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import AccountConfirmDialog from '../components/AccountConfirmDialog';
import RnbLoader from '../components/RnbLoader';
import AccountSettingsShell from '../components/AccountSettingsShell';
import {
  changePassword,
  fetchPasswordPolicy,
  passwordSatisfiesPolicy,
  policyRulesForDisplay,
  validatePasswordAgainstPolicy,
  toastApiRow,
} from '../services/account';
import { isInputSafe, sanitizeInput } from '../utils/sanitizeInput';
import { globalLogout } from '../utils/session';
import './AccountSettingsPage.css';

const DEFAULT_POLICY = {
  regex:
    /^(?=(?:.*[A-Z]){1,})(?=(?:.*[a-z]){1,})(?=(?:.*\d){1,})(?=(?:.*[!@#$%^&*()_+\-=\[\]{}|:,.?]){1,})[a-zA-Z\d!@#$%^&*()_+\-=\[\]{}|:,.?]{8,16}$/,
  constraints: {
    minLen: 8,
    maxLen: 16,
    minUppercase: 1,
    minLowercase: 1,
    minNumber: 1,
    minSpecial: 1,
  },
};

function PasswordField({ label, value, onChange, show, onToggleShow }) {
  return (
    <label className="rnb-account-field">
      <span>{label}</span>
      <div className="rnb-account-password-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          required
        />
        <button
          type="button"
          className="rnb-account-password-toggle"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPolicyLoading(true);
      try {
        const fetched = await fetchPasswordPolicy(user?.Ref_DivisionID);
        if (!cancelled && fetched) setPolicy(fetched);
      } finally {
        if (!cancelled) setPolicyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.Ref_DivisionID]);

  const rules = useMemo(
    () => policyRulesForDisplay(policy.constraints),
    [policy.constraints],
  );

  const validation = useMemo(() => {
    if (!newPassword) return null;
    return validatePasswordAgainstPolicy(newPassword, policy.constraints);
  }, [newPassword, policy.constraints]);

  const passwordsMatch =
    repeatPassword.length > 0 && newPassword === repeatPassword;

  function resetForm() {
    setOldPassword('');
    setNewPassword('');
    setRepeatPassword('');
  }

  async function submitChange() {
    setSubmitting(true);
    try {
      if (
        !isInputSafe(oldPassword) ||
        !isInputSafe(newPassword) ||
        !isInputSafe(repeatPassword)
      ) {
        toast.error('Invalid input detected');
        return;
      }
      if (oldPassword === newPassword) {
        toast.error('Old and new password cannot be the same');
        return;
      }
      if (newPassword !== repeatPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!passwordSatisfiesPolicy(sanitizeInput(newPassword), policy)) {
        toast.error('Password does not meet all requirements');
        return;
      }

      const row = await changePassword({
        oldPassword: sanitizeInput(oldPassword),
        newPassword: sanitizeInput(newPassword),
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

  const loginId = user?.LoginUserID ?? user?.UserID ?? '';

  return (
    <AccountSettingsShell>
    <div className="rnb-account-page">
      <div className="rnb-account-card glass-card">
        <header className="rnb-account-card-header">
          <span className="rnb-account-card-icon" aria-hidden>
            <Lock size={24} />
          </span>
          <div>
            <h1>Change Password</h1>
            <p>
              {loginId ? `User: ${loginId}` : 'Update your account password.'}
            </p>
          </div>
        </header>

        {policyLoading ? (
          <RnbLoader variant="inline" message="Loading password policy…" />
        ) : (
          <form
            className="rnb-account-card-body"
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <div className="rnb-account-grid rnb-account-grid--split">
              <div>
                <PasswordField
                  label="Old password"
                  value={oldPassword}
                  onChange={setOldPassword}
                  show={showOld}
                  onToggleShow={() => setShowOld((v) => !v)}
                />
                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNew}
                  onToggleShow={() => setShowNew((v) => !v)}
                />
                <PasswordField
                  label="Confirm new password"
                  value={repeatPassword}
                  onChange={setRepeatPassword}
                  show={showRepeat}
                  onToggleShow={() => setShowRepeat((v) => !v)}
                />

                <div className="rnb-account-actions">
                  <Link to="/home" className="rnb-account-btn rnb-account-btn--danger">
                    <Home size={16} />
                    Home
                  </Link>
                  <button
                    type="button"
                    className="rnb-account-btn"
                    onClick={resetForm}
                  >
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
              </div>

              <aside className="rnb-account-policy">
                <h2>Password requirements</h2>
                <p className="rnb-account-policy-hint">
                  Requirements apply to your <strong>new password</strong> as you
                  type.
                </p>
                <ul>
                  {rules.map((rule) => {
                    const ok = validation ? validation[rule.key] : null;
                    const stateClass =
                      ok === true
                        ? 'is-ok'
                        : ok === false
                          ? 'is-bad'
                          : 'is-neutral';
                    return (
                      <li key={rule.key} className={stateClass}>
                        {ok === true ? (
                          <Check size={16} aria-hidden />
                        ) : ok === false ? (
                          <XIcon size={16} aria-hidden />
                        ) : (
                          <span className="rnb-account-policy-dot" aria-hidden />
                        )}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
                {repeatPassword ? (
                  <p
                    className={`rnb-account-match-hint${
                      passwordsMatch ? ' is-ok' : ' is-bad'
                    }`}
                  >
                    {passwordsMatch
                      ? 'New password and confirmation match.'
                      : 'Confirmation does not match the new password yet.'}
                  </p>
                ) : null}
              </aside>
            </div>
          </form>
        )}
      </div>

      <AccountConfirmDialog
        open={confirmOpen}
        title="Change password"
        message="Are you sure you want to change your password? You will be logged out after a successful change."
        confirmLabel="Change password"
        onConfirm={submitChange}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
    </AccountSettingsShell>
  );
}
