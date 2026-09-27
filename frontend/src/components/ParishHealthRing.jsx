import React from 'react';

export default function ParishHealthRing({ count = 0, target = 50, size = 64, stroke = 8, className = '' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, Math.round((count / (target || 1)) * 100)));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`inline-flex items-center ${className}`} title={`${pct}% health`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6e9ee" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#10b981" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} />
        </g>
      </svg>
      <div className="ml-3 text-xs">
        <div className="text-[11px] font-semibold">{pct}%</div>
        <div className="text-[10px] text-slate-500">{count} / {target}</div>
      </div>
    </div>
  );
}
