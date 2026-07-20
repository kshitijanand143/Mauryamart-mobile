import React from 'react';

// ── Spinner ───────────────────────────────────────────────────────────────────
export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-12 w-12' };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-500 ${sizes[size]} ${className}`}
    />
  );
}
