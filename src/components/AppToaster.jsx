import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

function readTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

/** App-wide Sonner toaster — follows html[data-theme] for light/dark. */
export default function AppToaster() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(readTheme());
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  return (
    <Toaster
      position="top-right"
      theme={theme}
      richColors
      closeButton
      expand
      visibleToasts={6}
      gap={10}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'rnb-sonner-toast',
          title: 'rnb-sonner-title',
          closeButton: 'rnb-sonner-close',
        },
      }}
    />
  );
}
