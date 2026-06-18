import React from 'react';

function FinancialSummary({ summary }) {
  if (!summary) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-slate-500">Loading financial summary...</p>
      </div>
    );
  }

  const total = summary.totalParishes || 0;
  const compliant = summary.compliantParishes || 0;
  const outstanding = summary.outstandingParishes || 0;
  const compliantPercent = total ? Math.round((compliant / total) * 100) : 0;
  const outstandingPercent = total ? Math.round((outstanding / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Parishes</p>
          <p className="mt-4 text-4xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Compliant Parishes</p>
          <p className="mt-4 text-4xl font-bold text-emerald-600">{compliant}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Outstanding Parishes</p>
          <p className="mt-4 text-4xl font-bold text-amber-600">{outstanding}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span>Compliant</span>
          <span>{compliantPercent}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${compliantPercent}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span>Outstanding</span>
          <span>{outstandingPercent}%</span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${outstandingPercent}%` }} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Public financial status</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This public-facing dashboard shows the parish compliance picture for the current financial year. It is designed to present the data clearly without showing sensitive ledger details.
        </p>
      </div>
    </div>
  );
}

export default FinancialSummary;
