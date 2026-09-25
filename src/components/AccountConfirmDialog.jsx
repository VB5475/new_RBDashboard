import { X } from 'lucide-react';
import './AccountConfirmDialog.css';

export default function AccountConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="rnb-account-confirm-root">
      <button
        type="button"
        className="rnb-account-confirm-backdrop"
        onClick={onCancel}
        aria-label="Cancel"
      />
      <div className="rnb-account-confirm-dialog glass-card" role="dialog" aria-modal="true">
        <header className="rnb-account-confirm-header">
          <h2>{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p className="rnb-account-confirm-message">{message}</p>
        <footer className="rnb-account-confirm-footer">
          <button type="button" className="rnb-account-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rnb-account-btn rnb-account-btn--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
