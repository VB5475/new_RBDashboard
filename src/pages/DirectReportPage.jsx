import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, FileText, MapPin, Search, X } from 'lucide-react';
import { activeTabCodeFromPath } from '../utils/activeTabCode';
import {
  fetchDirectReportList,
  fetchDrptOptions,
  downloadDirectReport,
} from '../services/directReport';
import RnbLoader from '../components/RnbLoader';
import './DirectReportPage.css';

export default function DirectReportPage() {
  const location = useLocation();
  const menuCode = activeTabCodeFromPath(location.pathname);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wings, setWings] = useState([]);
  const [circles, setCircles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [wingId, setWingId] = useState('');
  const [circleId, setCircleId] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const locationReady = Boolean(wingId && circleId && divisionId);

  useEffect(() => {
    if (!menuCode) return;
    setLoading(true);
    fetchDirectReportList(menuCode)
      .then(setReports)
      .catch((e) => toast.error(e.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [menuCode]);

  useEffect(() => {
    fetchDrptOptions('WING').then(setWings);
  }, []);

  useEffect(() => {
    setCircleId('');
    setDivisionId('');
    setCircles([]);
    setDivisions([]);
    if (wingId) {
      fetchDrptOptions('CIRCLE', { wingId }).then(setCircles);
    }
  }, [wingId]);

  useEffect(() => {
    setDivisionId('');
    setDivisions([]);
    if (wingId && circleId) {
      fetchDrptOptions('DIV', { wingId, circleId }).then(setDivisions);
    }
  }, [wingId, circleId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q),
    );
  }, [reports, search]);

  function clearFilters() {
    setWingId('');
    setCircleId('');
    setDivisionId('');
    setCircles([]);
    setDivisions([]);
  }

  async function handleDownload(report) {
    if (!locationReady) {
      toast.error('Select wing, circle, and division first');
      return;
    }
    setDownloadingId(report.id);
    try {
      const url = await downloadDirectReport({
        objectId: report.objectId,
        wingId,
        circleId,
        divisionId,
      });
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = report.fileName || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error(e.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  }

  if (!menuCode) {
    return <div className="rnb-home-message">No menu code for direct reports.</div>;
  }

  if (loading) {
    return <RnbLoader variant="page" message="Loading reports" />;
  }

  return (
    <div className="direct-report-page">
      <section className="direct-report-toolbar glass-card fade-in-up">
        <div className="direct-report-toolbar-top">
          <div>
            <h1>Direct reports</h1>
            <p className="direct-report-toolbar-hint">
              {filtered.length} report{filtered.length === 1 ? '' : 's'}
              {!locationReady ? ' · Select wing, circle, and division to download' : ''}
            </p>
          </div>
          <span
            className={`direct-report-location badge${
              locationReady ? ' badge-le' : ' badge-nr'
            }`}
            title="Location filters"
          >
            <MapPin size={12} aria-hidden />
            {locationReady ? 'Location set' : 'Location required'}
          </span>
        </div>
        <div className="direct-report-toolbar-controls">
          <label className="direct-report-ddl">
            <span className="direct-report-ddl-label">Wing</span>
            <select value={wingId} onChange={(e) => setWingId(e.target.value)}>
              <option value="">Select wing</option>
              {wings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="direct-report-ddl">
            <span className="direct-report-ddl-label">Circle</span>
            <select
              value={circleId}
              onChange={(e) => setCircleId(e.target.value)}
              disabled={!wingId}
            >
              <option value="">Select circle</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="direct-report-ddl">
            <span className="direct-report-ddl-label">Division</span>
            <select
              value={divisionId}
              onChange={(e) => setDivisionId(e.target.value)}
              disabled={!circleId}
            >
              <option value="">Select division</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="direct-report-clear" onClick={clearFilters}>
            <X size={16} aria-hidden />
            Clear
          </button>
          <label className="direct-report-search-wrap">
            <Search size={16} className="direct-report-search-icon" aria-hidden />
            <input
              className="direct-report-search"
              placeholder="Search reports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="direct-report-empty glass-card fade-in-up">
          <FileText size={36} strokeWidth={1.5} aria-hidden />
          <h2>No reports match your search</h2>
          <p>Try another keyword or clear the search field.</p>
        </div>
      ) : (
        <div className="direct-report-grid">
          {filtered.map((report) => (
            <article key={report.id} className="direct-report-card glass-card">
              <div className="direct-report-card-body">
                <div className="direct-report-card-meta">
                  <span className="direct-report-card-icon" aria-hidden>
                    <FileText size={18} />
                  </span>
                  <span className="badge badge-e">{report.fileType}</span>
                </div>
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <code className="direct-report-file">{report.fileName}</code>
                <button
                  type="button"
                  className={`direct-report-download${
                    locationReady ? '' : ' is-muted'
                  }`}
                  disabled={downloadingId === report.id}
                  onClick={() => handleDownload(report)}
                >
                  <Download size={16} aria-hidden />
                  {downloadingId === report.id ? 'Preparing…' : 'Download'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {downloadingId != null && <RnbLoader variant="overlay" message="Preparing report" />}
    </div>
  );
}
