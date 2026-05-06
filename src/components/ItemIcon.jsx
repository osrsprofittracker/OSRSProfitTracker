import { useState } from 'react';

export default function ItemIcon({
  src,
  alt = '',
  className = '',
  fallbackText = '?',
  loading = 'lazy',
  title,
}) {
  const [failed, setFailed] = useState(false);
  const label = String(fallbackText || '?').trim().charAt(0).toUpperCase() || '?';

  if (!src || failed) {
    return (
      <span
        className={`item-icon-fallback ${className}`.trim()}
        aria-hidden={alt === '' ? 'true' : undefined}
        title={title}
      >
        {label}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      title={title}
      onError={() => setFailed(true)}
    />
  );
}
