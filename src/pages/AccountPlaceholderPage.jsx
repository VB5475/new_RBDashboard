import { Link } from 'react-router-dom';
import './AccountPlaceholderPage.css';

export default function AccountPlaceholderPage({ title, description }) {
  return (
    <div className="account-placeholder glass-card">
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/home" className="account-placeholder-back">
        Back to dashboard
      </Link>
    </div>
  );
}
