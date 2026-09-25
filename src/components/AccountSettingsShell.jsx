import './AccountSettingsShell.css';

/** Ambient backdrop for account settings routes (matches dashboard loader tone). */
export default function AccountSettingsShell({ children }) {
  return (
    <div className="rnb-account-shell">
      <div className="rnb-account-shell-ambient" aria-hidden>
        <span className="rnb-account-shell-orb rnb-account-shell-orb--1" />
        <span className="rnb-account-shell-orb rnb-account-shell-orb--2" />
        <span className="rnb-account-shell-orb rnb-account-shell-orb--3" />
      </div>
      <div className="rnb-account-shell-inner">{children}</div>
    </div>
  );
}
