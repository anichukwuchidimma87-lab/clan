import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = 'https://clan-3slh.onrender.com';

export default function FinancialLedger() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedYear = Number(searchParams.get('year'));
  const [parishes, setParishes] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ grandTotal: 0 });
  const [summary, setSummary] = useState({ totalParishes: 0, compliantParishes: 0, outstandingParishes: 0 });
  const [currentYear, setCurrentYear] = useState(Number.isInteger(requestedYear) && requestedYear >= 2000 ? requestedYear : new Date().getFullYear());
  const [userRole, setUserRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('All');
  const [loading, setLoading] = useState(true);
  const [editAmounts, setEditAmounts] = useState({});
  const [editTargets, setEditTargets] = useState({});
  const [newFeeType, setNewFeeType] = useState('');
  const [newFeeTarget, setNewFeeTarget] = useState(0);
  const [notification, setNotification] = useState(null);
  const [pendingActions, setPendingActions] = useState({});
  const pendingActionsRef = useRef(new Set());

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const normalizedRole = userRole === 'admin' ? 'executive' : (userRole || 'member');
  const isExecutiveOrHigher = normalizedRole === 'executive' || normalizedRole === 'superadmin';
  const hasPendingWrites = Object.keys(pendingActions).length > 0;

  useEffect(() => {
    if (!notification) return undefined;
    const timeoutId = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const runWithPending = async (key, action) => {
    if (pendingActionsRef.current.has(key)) return;
    pendingActionsRef.current.add(key);
    setPendingActions((current) => ({ ...current, [key]: true }));
    try {
      await action();
    } finally {
      pendingActionsRef.current.delete(key);
      setPendingActions((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const yearOptions = useMemo(() => {
    const base = new Date().getFullYear();
    return [base, base + 1, base + 2, base + 3];
  }, []);

  const fetchLedgerData = async (year) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clan_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const payload = parseJwt(token);
      if (payload && payload.role) {
        setUserRole(payload.role);
      }

      const res = await fetch(`${API_BASE}/api/finance/ledger?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Unable to load the financial ledger.');
      }
      setParishes(result.data.parishes || []);
      setFeeTypes(result.data.feeTypes || []);
      setEntries(result.data.entries || []);
      setTotals(result.data.totals || { grandTotal: 0 });
      setSummary(result.data.summary || { totalParishes: 0, compliantParishes: 0, outstandingParishes: 0 });
      setEditTargets(
        (result.data.feeTypes || []).reduce((acc, feeType) => {
          acc[feeType._id] = feeType.targetAmount || 0;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      setNotification({ type: 'error', text: error.message || 'Unable to load the financial ledger.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  const entryMap = useMemo(() => {
    return new Map(entries.map((entry) => [`${entry.parish}-${entry.feeType}`, entry]));
  }, [entries]);

  const recentChanges = useMemo(() => entries
    .filter((entry) => entry.updatedAt || entry.createdAt)
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
    .slice(0, 6)
    .map((entry) => ({
      ...entry,
      parishName: parishes.find((parish) => parish._id === String(entry.parish))?.name || 'Unknown parish',
      feeName: feeTypes.find((feeType) => feeType._id === String(entry.feeType))?.name || 'Unknown fee'
    })), [entries, feeTypes, parishes]);

  const filteredParishes = useMemo(() => {
    return parishes.filter((parish) => {
      const name = parish.name.toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesDeanery = selectedDeanery === 'All' || parish.zone.toLowerCase() === selectedDeanery.toLowerCase();
      return matchesSearch && matchesDeanery;
    });
  }, [parishes, searchQuery, selectedDeanery]);

  const handleAmountInput = (key, value) => {
    setEditAmounts((prev) => ({ ...prev, [key]: value }));
  };

  const handleTargetInput = (feeTypeId, value) => {
    setEditTargets((prev) => ({ ...prev, [feeTypeId]: value }));
  };

  const handleSaveAmount = async (parishId, feeTypeId) => {
    const key = `${parishId}-${feeTypeId}`;
    const amount = Number(editAmounts[key]);
    if (Number.isNaN(amount) || amount < 0) {
      setNotification({ type: 'error', text: 'Enter a valid non-negative amount before saving.' });
      return;
    }

    await runWithPending(`entry-${key}`, async () => {
      try {
        const token = localStorage.getItem('clan_token');
        const res = await fetch(`${API_BASE}/api/finance/ledger/entry`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            year: currentYear,
            parishId,
            feeTypeId,
            amountPaid: amount
          })
        });
        const result = await res.json();
        if (result.success) {
          setEditAmounts((prev) => ({ ...prev, [key]: '' }));
          setNotification({ type: 'success', text: 'Ledger amount saved.' });
          fetchLedgerData(currentYear);
        } else {
          setNotification({ type: 'error', text: result.message || 'Failed to save amount.' });
        }
      } catch (error) {
        console.error('Save amount failed:', error);
        setNotification({ type: 'error', text: 'Unable to save ledger amount right now.' });
      }
    });
  };

  const handleSaveTarget = async (feeTypeId) => {
    const amount = Number(editTargets[feeTypeId]);
    if (Number.isNaN(amount) || amount < 0) {
      setNotification({ type: 'error', text: 'Enter a valid non-negative target value.' });
      return;
    }

    await runWithPending(`target-${feeTypeId}`, async () => {
      try {
        const token = localStorage.getItem('clan_token');
        const res = await fetch(`${API_BASE}/api/finance/fee-targets`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            feeTypeId,
            year: currentYear,
            amount
          })
        });
        const result = await res.json();
        if (result.success) {
          setNotification({ type: 'success', text: 'Fee target saved.' });
          fetchLedgerData(currentYear);
        } else {
          setNotification({ type: 'error', text: result.message || 'Failed to save fee target.' });
        }
      } catch (error) {
        console.error('Save target failed:', error);
        setNotification({ type: 'error', text: 'Unable to save the fee target right now.' });
      }
    });
  };

  const handleAddFeeType = async (e) => {
    e.preventDefault();
    if (!newFeeType.trim()) {
      setNotification({ type: 'error', text: 'Enter a fee category name.' });
      return;
    }

    await runWithPending('add-fee', async () => {
      try {
        const token = localStorage.getItem('clan_token');
        const res = await fetch(`${API_BASE}/api/finance/fee-types`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newFeeType.trim(),
            targetAmount: Number(newFeeTarget) || 0,
            year: currentYear
          })
        });
        const result = await res.json();
        if (result.success) {
          setNewFeeType('');
          setNewFeeTarget(0);
          setNotification({ type: 'success', text: 'Fee category added.' });
          fetchLedgerData(currentYear);
        } else {
          setNotification({ type: 'error', text: result.message || 'Failed to add the fee category.' });
        }
      } catch (error) {
        console.error('Add fee type failed:', error);
        setNotification({ type: 'error', text: 'Unable to create new fee type right now.' });
      }
    });
  };

  const handleYearSelection = (year) => {
    const parsedYear = Number(year) || new Date().getFullYear();
    setCurrentYear(parsedYear);
    setSearchParams({ year: String(parsedYear) }, { replace: true });
  };

  const exportLedgerCsv = () => {
    const escapeCsv = (value) => {
      const text = String(value ?? '');
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const feeColumns = feeTypes.flatMap((feeType) => [
      `${feeType.name} Paid`,
      `${feeType.name} Target`,
      `${feeType.name} Balance`
    ]);
    const rows = [
      ['Parish', 'Zone', ...feeColumns],
      ...filteredParishes.map((parish) => [
        parish.name,
        parish.zone,
        ...feeTypes.flatMap((feeType) => {
          const entry = entryMap.get(`${parish._id}-${feeType._id}`);
          const paid = Number(entry?.amountPaid || 0);
          const target = Number(feeType.targetAmount || 0);
          return [paid, target, target - paid];
        })
      ])
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-ledger-${currentYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', text: `Ledger export downloaded for ${filteredParishes.length} parish(es).` });
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-gray-400">Loading Dynamic Ledger Matrix...</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-5 bg-gray-50 p-4 text-xs font-semibold text-gray-600 sm:p-6">
      {notification && (
        <div
          role={notification.type === 'error' ? 'alert' : 'status'}
          aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          className={`fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl print:hidden ${
            notification.type === 'success' ? 'border-emerald-200 text-emerald-800' : 'border-rose-200 text-rose-800'
          }`}
        >
          <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} aria-hidden="true" />
          <p className="flex-1 text-sm font-medium">{notification.text}</p>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss notification" className="rounded-lg px-1 text-lg leading-none text-slate-400 hover:bg-slate-100">
            &times;
          </button>
        </div>
      )}

      <button onClick={() => navigate('/dashboard')} className="border px-4 py-2 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm print:hidden">← Back to Dashboard Hub Portal</button>

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between gap-4 border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Deanery Financial Ledger Matrix</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            The ledger matrix is generated from the centralized parish registry and renders columns from your active fee configuration.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
            <label htmlFor="yearSelect" className="text-gray-500 font-bold">Year:</label>
            <select
              id="yearSelect"
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold bg-white"
              value={currentYear}
              disabled={hasPendingWrites}
              onChange={(e) => handleYearSelection(e.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
            <span className="text-gray-500 font-bold">Custom year</span>
            <input
              type="number"
              min="2000"
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
              value={currentYear}
              disabled={hasPendingWrites}
              onChange={(e) => handleYearSelection(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => handleYearSelection(year)}
                disabled={hasPendingWrites}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${currentYear === year ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={exportLedgerCsv} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
              Export CSV
            </button>
            <button type="button" onClick={() => window.print()} className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-black">
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.24em] mb-3">Financial Totals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feeTypes.map((feeType) => (
              <div key={feeType._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-1">{feeType.name}</p>
                <p className="text-xl font-black text-slate-900">₦{(totals[feeType.slug] || 0).toLocaleString()}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-950 p-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.28em] text-indigo-300 mb-1">Grand Year Total</p>
              <p className="text-xl font-black">₦{totals.grandTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-700 mb-1">Total Parishes</p>
              <p className="text-2xl font-black text-emerald-900">{summary.totalParishes}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-emerald-100 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-800 mb-1">Compliant Parishes</p>
              <p className="text-2xl font-black text-emerald-900">{summary.compliantParishes}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-rose-100 p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-rose-700 mb-1">Outstanding Parishes</p>
              <p className="text-2xl font-black text-rose-900">{summary.outstandingParishes}</p>
            </div>
          </div>
        </div>

        {isExecutiveOrHigher && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm print:hidden">
            <div className="mb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">Fee Category Configuration</h2>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Set annual parish targets for {currentYear} or add a new fee category.</p>
            </div>
            <div className="space-y-4">
              {feeTypes.map((feeType) => (
                <div key={feeType._id} className="grid min-w-0 grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{feeType.name}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">Annual target</p>
                  </div>
                  <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Target amount
                    <input
                      type="number"
                      min="0"
                      value={editTargets[feeType._id] ?? 0}
                      onChange={(e) => handleTargetInput(feeType._id, e.target.value)}
                      disabled={Boolean(pendingActions[`target-${feeType._id}`])}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 disabled:bg-gray-100"
                    />
                  </label>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSaveTarget(feeType._id)}
                      disabled={Boolean(pendingActions[`target-${feeType._id}`])}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                    >
                      {pendingActions[`target-${feeType._id}`] ? 'Saving...' : 'Save target'}
                    </button>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddFeeType} className="space-y-3 pt-2 border-t border-gray-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.24em]">Add New Fee</h3>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Fee Category Name"
                    aria-label="Fee category name"
                    value={newFeeType}
                    disabled={Boolean(pendingActions['add-fee'])}
                    onChange={(e) => setNewFeeType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Yearly Target Amount"
                    aria-label="Yearly target amount"
                    value={newFeeTarget}
                    disabled={Boolean(pendingActions['add-fee'])}
                    onChange={(e) => setNewFeeTarget(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <button type="submit" disabled={Boolean(pendingActions['add-fee'])} className="w-full bg-emerald-600 text-white text-[11px] font-bold rounded-lg px-3 py-2 hover:bg-emerald-700 transition disabled:cursor-wait disabled:opacity-60">
                    {pendingActions['add-fee'] ? 'Adding...' : 'Add Fee Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center print:hidden">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Search parish name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border pl-10 pr-3 py-2 rounded-xl text-xs w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-800"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
          {['All', 'Benin', 'Abudu', 'Eguabazua'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedDeanery(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${selectedDeanery === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'}`}
            >
              {tab === 'All' ? 'All Parishes' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-indigo-950 px-4 py-3 text-white font-bold text-sm tracking-wide">Parish fee ledger matrix · {currentYear}</div>
        <div className="hidden overflow-x-auto md:block print:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3">Parish</th>
                <th className="p-3">Zone</th>
                {feeTypes.map((feeType) => (
                  <th key={feeType._id} className="p-3 text-center">
                    {feeType.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredParishes.length === 0 ? (
                <tr>
                  <td colSpan={2 + feeTypes.length} className="p-8 text-center text-gray-400 italic font-semibold">
                    No parish roster matches the current filters for {currentYear}.
                  </td>
                </tr>
              ) : (
                filteredParishes.map((parish) => (
                  <tr key={parish._id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="p-3 font-bold text-gray-900 text-sm">
                      <Link
                        to={`/ledger/parishes/${parish._id}?year=${currentYear}`}
                        className="rounded font-bold text-indigo-700 hover:text-indigo-900 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label={`View ${parish.name} financial details for ${currentYear}`}
                      >
                        {parish.name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-500 font-bold uppercase font-mono"><span className="px-2 py-0.5 rounded bg-gray-100 border text-gray-500">{parish.zone}</span></td>
                    {feeTypes.map((feeType) => {
                      const entryKey = `${parish._id}-${feeType._id}`;
                      const entry = entryMap.get(entryKey);
                      const paidAmount = entry ? entry.amountPaid : 0;
                      const editedAmount = editAmounts[entryKey];
                      const displayAmount = editedAmount !== undefined && editedAmount !== '' ? Number(editedAmount) : paidAmount;
                      const target = feeType.targetAmount || 0;
                      const balance = target - displayAmount;

                      return (
                        <td key={feeType._id} className="p-3 text-center min-w-[180px] align-top">
                          <div className="space-y-2">
                            <div className="font-bold text-gray-900">₦{displayAmount.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400 uppercase">Target: ₦{target.toLocaleString()}</div>
                            {balance > 0 ? (
                              <span className="inline-block bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Owing: ₦{balance.toLocaleString()}</span>
                            ) : (
                              <span className="inline-block bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Cleared ✓</span>
                            )}
                            {isExecutiveOrHigher && (
                              <div className="space-y-2">
                                <input
                                  value={editedAmount !== undefined ? editedAmount : paidAmount}
                                  onChange={(e) => handleAmountInput(entryKey, e.target.value)}
                                  type="number"
                                  min="0"
                                  disabled={Boolean(pendingActions[`entry-${entryKey}`])}
                                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 bg-white disabled:bg-gray-100 print:hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveAmount(parish._id, feeType._id)}
                                  disabled={Boolean(pendingActions[`entry-${entryKey}`])}
                                  className="w-full bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2 py-1 hover:bg-black transition disabled:cursor-wait disabled:opacity-60 print:hidden"
                                >
                                  {pendingActions[`entry-${entryKey}`] ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-gray-100 md:hidden print:hidden">
          {filteredParishes.length === 0 ? (
            <p className="p-8 text-center text-gray-400 italic font-semibold">
              No parish roster matches the current filters for {currentYear}.
            </p>
          ) : (
            filteredParishes.map((parish) => {
              const parishFees = feeTypes.map((feeType) => {
                const entryKey = `${parish._id}-${feeType._id}`;
                const entry = entryMap.get(entryKey);
                const paidAmount = Number(entry?.amountPaid || 0);
                const editedAmount = editAmounts[entryKey];
                const displayAmount = editedAmount !== undefined && editedAmount !== '' ? Number(editedAmount) : paidAmount;
                const target = Number(feeType.targetAmount || 0);
                return { feeType, entryKey, paidAmount, editedAmount, displayAmount, target, balance: target - displayAmount };
              });
              const totalPaid = parishFees.reduce((total, fee) => total + fee.paidAmount, 0);
              const totalTarget = parishFees.reduce((total, fee) => total + fee.target, 0);
              const compliant = parishFees.length > 0 && parishFees.every((fee) => fee.paidAmount >= fee.target);

              return (
                <article key={parish._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/ledger/parishes/${parish._id}?year=${currentYear}`}
                        className="text-sm font-black text-indigo-700 hover:text-indigo-900 hover:underline"
                        aria-label={`View ${parish.name} financial details for ${currentYear}`}
                      >
                        {parish.name}
                      </Link>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{parish.zone}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${compliant ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                      {compliant ? 'Compliant' : 'Outstanding'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total paid</p>
                      <p className="mt-1 text-xs font-black text-slate-800">₦{totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total target</p>
                      <p className="mt-1 text-xs font-black text-slate-800">₦{totalTarget.toLocaleString()}</p>
                    </div>
                  </div>

                  {parishFees.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">No fee categories configured for this year.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {parishFees.map(({ feeType, entryKey, paidAmount, editedAmount, displayAmount, target, balance }) => (
                        <div key={feeType._id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 font-bold text-slate-800">{feeType.name}</p>
                            <span className={`shrink-0 text-[10px] font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {balance > 0 ? `Owing ₦${balance.toLocaleString()}` : 'Cleared'}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                            <p className="text-slate-500">Paid <span className="ml-1 font-bold text-slate-800">₦{displayAmount.toLocaleString()}</span></p>
                            <p className="text-slate-500">Target <span className="ml-1 font-bold text-slate-800">₦{target.toLocaleString()}</span></p>
                          </div>
                          {isExecutiveOrHigher && (
                            <div className="mt-3 flex gap-2 print:hidden">
                              <input
                                aria-label={`Paid amount for ${parish.name}, ${feeType.name}`}
                                value={editedAmount !== undefined ? editedAmount : paidAmount}
                                onChange={(event) => handleAmountInput(entryKey, event.target.value)}
                                type="number"
                                min="0"
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs font-semibold text-gray-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveAmount(parish._id, feeType._id)}
                                disabled={Boolean(pendingActions[`entry-${entryKey}`])}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
                              >
                                {pendingActions[`entry-${entryKey}`] ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to={`/ledger/parishes/${parish._id}?year=${currentYear}`} className="mt-3 inline-flex text-xs font-bold text-indigo-700 hover:underline">
                    View parish details
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">Recent ledger activity</h2>
            <p className="mt-1 text-[10px] font-medium text-slate-500">Latest saved amount and timestamp per entry; prior revisions and editor identity are not available in this ledger API.</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Financial year {currentYear}</span>
        </div>
        {recentChanges.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-500">No timestamped ledger entries are available for this year.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {recentChanges.map((entry) => {
              const changedAt = entry.updatedAt || entry.createdAt;
              return (
                <div key={entry._id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{entry.parishName} · {entry.feeName}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">Current recorded amount: ₦{Number(entry.amountPaid || 0).toLocaleString()}</p>
                  </div>
                  <time className="text-[10px] font-medium text-slate-400" dateTime={changedAt}>
                    Updated {new Date(changedAt).toLocaleString()}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
