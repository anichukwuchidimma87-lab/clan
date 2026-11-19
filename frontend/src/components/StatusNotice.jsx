import React from 'react';

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800'
};

export default function StatusNotice({ type = 'info', children, className = '' }) {
  if (!children) return null;

  const tone = styles[type] || styles.info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${tone} ${className}`}
    >
      {children}
    </div>
  );
}
