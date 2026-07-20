import React, { useEffect, useRef } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/helpers';

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size];
  return <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 ${s} ${className}`} />;
}

// ── Page loader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
}

// ── Status badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return <span className={STATUS_COLORS[status] || 'badge-gray'}>{STATUS_LABELS[status] || status}</span>;
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 py-2"
      />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit = 20, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
      <span className="text-gray-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs font-medium">
          ← Prev
        </button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = page <= 4 ? i + 1 : page - 3 + i;
          if (p < 1 || p > pages) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${p === page ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page >= pages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs font-medium">
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const ref = useRef();
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  const widths = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={ref} className={`relative bg-white rounded-xl shadow-2xl w-full ${widths[size]} animate-fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}

// ── Stats card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, sub, icon, color = 'brand', trend }) {
  const colors = {
    brand:'bg-brand-50 text-brand-600', blue:'bg-blue-50 text-blue-600',
    green:'bg-green-50 text-green-600', purple:'bg-purple-50 text-purple-600',
    orange:'bg-orange-50 text-orange-600', red:'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Image upload preview ──────────────────────────────────────────────────────
export function ImageUpload({ label, name, onChange, preview, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <div className="flex items-center gap-3">
        {preview && <img src={preview} alt="" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />}
        <label className="cursor-pointer btn-secondary text-xs px-3 py-2">
          Choose file
          <input type="file" name={name} accept="image/*" onChange={onChange} className="sr-only" />
        </label>
      </div>
    </div>
  );
}

// ── Select input ──────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, required, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="input-field bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
