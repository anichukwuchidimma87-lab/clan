import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FinancialSummary from '../components/public/FinancialSummary';
import StatusNotice from '../components/StatusNotice';

function Financials() {
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const apiRoot = import.meta.env.VITE_API_URL || '';
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${apiRoot}/api/public/stats?year=${selectedYear}`);
        if (!response.data?.success || !response.data.data) {
          throw new Error('Public financial summary response was not successful.');
        }
        if (active) setSummary(response.data.data);
      } catch (error) {
        console.error('Could not fetch financial summary:', error);
        if (active) {
          setSummary(null);
          setError('The public financial summary is unavailable right now.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSummary();
    return () => { active = false; };
  }, [selectedYear, retryCount]);

  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-800 to-blue-700 p-6 text-white shadow-xl sm:mb-10 sm:p-10">
          <h1 className="text-3xl font-bold sm:text-4xl">Public Financial Snapshot</h1>
          <p className="mt-4 max-w-3xl text-base text-slate-200 sm:text-lg">
            A clear, public-friendly view of parish compliance and outstanding status for the selected financial year.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Financial year performance</h2>
            <p className="mt-2 text-sm text-slate-600">
              Updated in real time from the parish compliance data.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="year" className="text-sm font-semibold text-slate-700">
              Year:
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading public summary...</p>
          </div>
        ) : error ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <StatusNotice type="error">{error}</StatusNotice>
            <button type="button" onClick={() => setRetryCount((current) => current + 1)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200">
              Retry
            </button>
          </section>
        ) : (
          <FinancialSummary summary={summary} year={selectedYear} />
        )}
      </div>
    </main>
  );
}

export default Financials;
