import { useState } from 'react';

/** Image with a plain fallback tile if the URL is missing or fails to load. */
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        {alt?.[0]}
      </div>
    );
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
