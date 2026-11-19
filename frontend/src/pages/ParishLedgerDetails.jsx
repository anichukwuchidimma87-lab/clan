import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
const formatCurrency = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function ParishLedgerDetails() {
  const { parishId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedYear = Number(searchParams.get('year'));
  const [year, setYear] = useState(Number.isInteger(requestedYear) && requestedYear >= 2000 ? requestedYear : new Date().getFullYear());
  const [parish, setParish] = useState(null);
  const [feeTypes, setFeeTypes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadLedger = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('clan_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/api/finance/ledger?year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load parish ledger details');
        }

        if (!active) return;

        const record = (result.data.parishes || []).find((item) => item._id === parishId);
        if (!record) throw new Error('Parish not found in the financial ledger');

        setParish(record);
        setFeeTypes(result.data.feeTypes || []);
        setEntries(result.data.entries || []);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load parish ledger details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLedger();
    return () => { active = false; };
  }, [navigate, parishId, year]);

  const feeSummary = useMemo(() => feeTypes.map((feeType) => {
    const entry = entries.find((item) =>
      String(item.parish?._id || item.parish) === parishId &&
      String(item.feeType?._id || item.feeType) === String(feeType._id)
    );
    const paid = Number(entry?.amountPaid || 0);
    const target = Number(feeType.targetAmount || 0);
    return { ...feeType, paid, target, balance: Math.max(0, target - paid) };
  }), [entries, feeTypes, parishId]);

  const totals = useMemo(() => feeSummary.reduce((result, fee) => ({
    paid: result.paid + fee.paid,
    target: result.target + fee.target,
    balance: result.balance + fee.balance
  }), { paid: 0, target: 0, balance: 0 }), [feeSummary]);

  const isCompliant = feeSummary.length > 0 && feeSummary.every((fee) => fee.paid >= fee.target);

  const handleYearChange = (nextYear) => {
    const parsedYear = Number(nextYear);
    setYear(parsedYear);
    setSearchParams({ year: String(parsedYear) }, { replace: true });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading parish financial details...
        </div>
      </main>
    );
  }

  if (error || !parish) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-white p-8">
          <p role="alert" className="font-semibold text-rose-700">{error || 'Parish not found'}</p>
          <Link to={`/ledger?year=${year}`} className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Back to ledger
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="text-sm text-slate-500">
          <Link to={`/ledger?year=${year}`} className="font-semibold text-indigo-700">Financial ledger</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{parish.name}</span>
        </nav>

        <header className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-200">Parish financial summary</p>
              <h1 className="mt-2 text-3xl font-black">{parish.name}</h1>
              <p className="mt-2 text-sm text-slate-300">{parish.zone || 'Deanery'} · Financial year {year}</p>
            </div>
            <label className="text-xs font-semibold text-indigo-100">
              Financial year
              <select
                value={year}
                onChange={(event) => handleYearChange(event.target.value)}
                className="ml-2 rounded-lg border border-white/20 bg-white px-3 py-2 text-sm font-bold text-slate-900"
              >
                {Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 3 + index).map((optionYear) => (
                  <option key={optionYear} value={optionYear}>{optionYear}</option>
                ))}
                {!Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 3 + index).includes(year) && (
                  <option value={year}>{year}</option>
                )}
              </select>
            </label>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total paid" value={formatCurrency(totals.paid)} tone="border-slate-200 bg-white text-slate-900" />
          <SummaryCard label="Total target" value={formatCurrency(totals.target)} tone="border-indigo-100 bg-indigo-50 text-indigo-800" />
          <SummaryCard label="Outstanding balance" value={formatCurrency(totals.balance)} tone={totals.balance > 0 ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-emerald-100 bg-emerald-50 text-emerald-800'} />
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fee breakdown</h2>
              <p className="mt-1 text-xs text-slate-500">Targets and recorded payments for {year}.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${feeSummary.length === 0 ? 'bg-slate-100 text-slate-600' : isCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
              {feeSummary.length === 0 ? 'No fee categories' : isCompliant ? 'Compliant' : 'Outstanding'}
            </span>
          </div>

          {feeSummary.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No fee categories are configured for this year.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {feeSummary.map((fee) => (
                <div key={fee._id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:items-center">
                  <p className="font-bold text-slate-900">{fee.name}</p>
                  <Amount label="Target" value={fee.target} />
                  <Amount label="Paid" value={fee.paid} />
                  <div className="text-sm">
                    <span className="text-slate-500 sm:hidden">Balance: </span>
                    <span className={`font-bold ${fee.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatCurrency(fee.balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/ledger?year=${year}`)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to ledger
          </button>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}

function Amount({ label, value }) {
  return (
    <p className="text-sm">
      <span className="text-slate-500 sm:hidden">{label}: </span>
      <span className="hidden text-xs font-medium text-slate-500 sm:block">{label}</span>
      <span className="font-bold text-slate-900">{formatCurrency(value)}</span>
    </p>
  );
}
