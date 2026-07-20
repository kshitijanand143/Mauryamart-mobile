import React from 'react';

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, max = 5, size = 'sm', interactive = false, onRate }) {
  const s = size === 'sm' ? 'text-sm' : 'text-xl';
  return (
    <div className={`flex gap-0.5 ${s}`} role={interactive ? 'group' : 'img'} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i + 1)}
          className={`${i < rating ? 'text-amber-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-amber-300' : 'cursor-default'} focus:outline-none`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '🍽️', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-5 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-3 ${className}`}>
      <div className="skeleton h-40 w-full rounded-xl mb-3" />
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="flex justify-between">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

// ── ImageWithFallback ─────────────────────────────────────────────────────────
export function ImageWithFallback({ src, alt, className = '', fallback = '/placeholder-food.jpg' }) {
  const [imgSrc, setImgSrc] = React.useState(src || fallback);
  React.useEffect(() => { setImgSrc(src || fallback); }, [src, fallback]);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
      loading="lazy"
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function StatusBadge({ status, label }) {
  const map = {
    placed: 'badge-gray', accepted: 'badge-orange', preparing: 'badge-orange',
    ready: 'badge-orange', picked_up: 'badge-orange', out_for_delivery: 'badge-orange',
    delivered: 'badge-green', cancelled: 'badge-red',
  };
  return <span className={map[status] || 'badge-gray'}>{label || status}</span>;
}
