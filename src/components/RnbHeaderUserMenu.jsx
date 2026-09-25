import { useEffect, useRef, useState } from 'react';
import {
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { globalLogout } from '../utils/session';
import './RnbHeaderUserMenu.css';

export default function RnbHeaderUserMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await globalLogout();
    setUser(null);
    navigate('/login', { replace: true });
  }

  const loginId = user?.LoginUserID ?? 'User';
  const displayName = user?.UserName ?? user?.Designation ?? '';

  return (
    <div className="rnb-header-user" ref={rootRef}>
      <button
        type="button"
        className={`rnb-header-user-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="rnb-header-user-avatar" aria-hidden>
          <UserCircle2 size={22} />
        </span>
        <span className="rnb-header-user-text">
          <span className="rnb-header-user-id">{loginId}</span>
          {displayName ? (
            <span className="rnb-header-user-role">{displayName}</span>
          ) : null}
        </span>
      </button>

      {open ? (
        <ul className="rnb-header-user-menu" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="rnb-header-user-menu-item"
              onClick={() => {
                setOpen(false);
                navigate('/updateuserdetails');
              }}
            >
              <UserCircle2 size={18} aria-hidden />
              Update Profile
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="rnb-header-user-menu-item"
              onClick={() => {
                setOpen(false);
                navigate('/changepassword');
              }}
            >
              <Settings size={18} aria-hidden />
              Change Password
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="rnb-header-user-menu-item is-danger"
              onClick={logout}
            >
              <LogOut size={18} aria-hidden />
              Logout
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
