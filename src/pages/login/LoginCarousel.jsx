import { useEffect, useState } from 'react';

export default function LoginCarousel({ images, captions }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images?.length) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [images?.length]);

  if (!images?.length) return null;

  return (
    <div className="login-carousel">
      <div className="login-carousel-frame">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`login-carousel-img${i === index ? ' is-active' : ''}`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
        <div className="login-carousel-vignette" aria-hidden />
      </div>
      <p className="login-carousel-caption">{captions[index]}</p>
      <div className="login-carousel-dots" role="tablist" aria-label="Infrastructure highlights">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`login-carousel-dot${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
