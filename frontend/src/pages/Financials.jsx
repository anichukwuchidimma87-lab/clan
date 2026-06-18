import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FinancialSummary from '../components/public/FinancialSummary';

function Financials() {
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiRoot = import.meta.env.VITE_API_URL || '';
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiRoot}/api/public/stats?year=${selectedYear}`);
        setSummary(response.data.data || null);
      } catch (error) {
        console.error('Could not fetch financial summary:', error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedYear]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-800 to-blue-700 p-10 text-white shadow-xl">
          <h1 className="text-4xl font-bold">Public Financial Snapshot</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-200">
            A clear, public-friendly view of parish compliance and outstanding status for the current year.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Current year performance</h2>
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
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-600"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading public summary...</p>
          </div>
        ) : (
          <FinancialSummary summary={summary} />
        )}
      </div>
    </main>
  );
}

export default Financials;
