import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_MODULES_PATH } from '../constants/routes';

export default function RnbHeaderBreadcrumbs({
  parentTitle,
  childTitle,
  homePath = '/home',
}) {
  const navigate = useNavigate();

  if (!parentTitle && !childTitle) return null;

  function goParent() {
    navigate(homePath || ALL_MODULES_PATH);
  }

  return (
    <nav className="rnb-header-crumb" aria-label="Breadcrumb">
      {parentTitle ? (
        <button
          type="button"
          className="rnb-header-crumb-parent"
          onClick={goParent}
          title={`Go to ${homePath}`}
        >
          {parentTitle}
        </button>
      ) : null}
      {parentTitle && childTitle ? (
        <ChevronRight size={16} className="rnb-header-crumb-sep" aria-hidden />
      ) : null}
      {childTitle ? (
        <span className="rnb-header-crumb-current">{childTitle}</span>
      ) : null}
    </nav>
  );
}
