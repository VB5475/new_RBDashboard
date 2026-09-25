import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import { fetchGrievanceModules, registerGrievance } from '../services/grievance';
import './RnbModal.css';

export default function RegisterGrievanceModal({ open, onClose }) {
  const { user } = useUser();
  const [modules, setModules] = useState([]);
  const [operatorName, setOperatorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [forModule, setForModule] = useState([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchGrievanceModules()
      .then(setModules)
      .catch(() => toast.error('Could not load modules'));
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await registerGrievance({
        operatorName: operatorName.trim(),
        mobile: mobile.trim(),
        officerName: user?.UserName ?? '',
        description: description.trim(),
        modules: forModule,
      });
      if (result.ok) {
        toast.success(result.message);
        setOperatorName('');
        setMobile('');
        setForModule([]);
        setDescription('');
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

  function toggleModule(code) {
    setForModule((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  return (
    <div className="rnb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="rnb-modal"
        role="dialog"
        aria-labelledby="grievance-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="rnb-modal-header">
          <h2 id="grievance-title">Register Grievance</h2>
          <button type="button" className="rnb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="rnb-modal-body" onSubmit={handleSubmit}>
          <label className="rnb-field">
            <span>Login User ID</span>
            <input readOnly value={user?.LoginUserID ?? ''} />
          </label>
          <label className="rnb-field">
            <span>Officer Name</span>
            <input readOnly value={user?.UserName ?? ''} />
          </label>
          <label className="rnb-field">
            <span>User/Operator Name</span>
            <input
              required
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
            />
          </label>
          <label className="rnb-field">
            <span>Mobile Number</span>
            <input
              required
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </label>
          <fieldset className="rnb-field">
            <legend>For Module</legend>
            <div className="rnb-module-list">
              {modules.map((m) => (
                <label key={m.CODE} className="rnb-module-chip">
                  <input
                    type="checkbox"
                    checked={forModule.includes(m.CODE)}
                    onChange={() => toggleModule(m.CODE)}
                  />
                  {m.DESCRIPTION}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="rnb-field">
            <span>Complaint Description</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <footer className="rnb-modal-footer">
            <button type="button" className="rnb-btn rnb-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rnb-btn rnb-btn--primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
