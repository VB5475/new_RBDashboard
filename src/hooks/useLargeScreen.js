import { useEffect, useState } from 'react';

/** Legacy AppSidebar uses MUI `md` and up (~900px). */
const QUERY = '(min-width: 900px)';

export function useLargeScreen() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsLg(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isLg;
}
