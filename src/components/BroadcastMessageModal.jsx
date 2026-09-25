import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { saveBroadcastMessage } from '../services/broadcastAdmin';
import './RnbModal.css';

export default function BroadcastMessageModal({ open, onClose, initialMessage, onSaved }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage(initialMessage ?? '');
    }
  }, [open, initialMessage]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      toast.error('Enter a message');
      return;
    }
    setSubmitting(true);
    try {
      const result = await saveBroadcastMessage(text);
      if (result.ok) {
        toast.success(result.message);
        onSaved?.();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Server error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rnb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="rnb-modal rnb-modal--wide"
        role="dialog"
        aria-labelledby="broadcast-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rnb-modal-header">
          <h2 id="broadcast-title">Broadcast message</h2>
          <button type="button" className="rnb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="rnb-modal-body" onSubmit={handleSubmit}>
          <label className="rnb-field">
            <span>Message</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <footer className="rnb-modal-footer">
            <button type="button" className="rnb-btn rnb-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rnb-btn rnb-btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
