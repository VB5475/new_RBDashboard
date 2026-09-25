import { QRCodeSVG } from 'qrcode.react';
import { Download, X } from 'lucide-react';
import { MOBILEAPP_LINK } from '../../config/api.config';

export default function LoginQrModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="login-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="login-modal"
        role="dialog"
        aria-labelledby="login-qr-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="login-modal-header">
          <h2 id="login-qr-title">RNB Dashboard Mobile App</h2>
          <button type="button" className="login-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <p className="login-modal-lead">
          Scan with your phone camera or Google Lens to download the official mobile app.
        </p>
        <div className="login-qr-wrap">
          {MOBILEAPP_LINK ? (
            <QRCodeSVG value={MOBILEAPP_LINK} size={220} level="H" includeMargin />
          ) : (
            <p>App link not configured.</p>
          )}
        </div>
        {MOBILEAPP_LINK ? (
          <a
            className="login-modal-action"
            href={MOBILEAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={18} />
            Open download link
          </a>
        ) : null}
      </div>
    </div>
  );
}
