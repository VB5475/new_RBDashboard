import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import './BroadcastBanner.css';

export default function BroadcastBanner({ messages = [], embedded = false }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [messages]);

  useEffect(() => {
    if (messages.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!messages.length) return null;

  const current = messages[index];
  const text = current?.Message ?? current?.message ?? '';

  return (
    <div
      className={`broadcast-banner${embedded ? ' broadcast-banner--embedded' : ''}`}
      role="status"
    >
      <span className="broadcast-banner-icon" aria-hidden>
        <Megaphone size={16} strokeWidth={2.25} />
      </span>
      <p className="broadcast-banner-text">{text}</p>
      {messages.length > 1 && (
        <div className="broadcast-banner-nav">
          <button
            type="button"
            onClick={() => setIndex((i) => (i === 0 ? messages.length - 1 : i - 1))}
            aria-label="Previous message"
          >
            ‹
          </button>
          <span>
            {index + 1}/{messages.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % messages.length)}
            aria-label="Next message"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
