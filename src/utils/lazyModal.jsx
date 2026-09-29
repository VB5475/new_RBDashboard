import { lazy, Suspense } from 'react';

/**
 * Lazy-load a heavy modal only while it is open (or loading open).
 * Keeps leaflet/recharts/grid out of the initial login bundle.
 */
export function lazyModal(importer) {
  const Comp = lazy(importer);
  return function LazyModalHost(props) {
    const { open, loading } = props;
    if (!open && !loading) return null;
    return (
      <Suspense fallback={null}>
        <Comp {...props} />
      </Suspense>
    );
  };
}
