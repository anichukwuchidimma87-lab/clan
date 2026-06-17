import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://clan-3slh.onrender.com';

export default function FinancialLedger() {
  const [parishes, setParishes] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userRole, setUserRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('All');
  const [loading, setLoading] = useState(true);
  const [editAmounts, setEditAmounts] = useState({});
  const [editTargets, setEditTargets] = useState({});
  const [newFeeType, setNewFeeType] = useState('');
  const [newFeeTarget, setNewFeeTarget] = useState(0);
  const navigate = useNavigate();

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const isExecutiveOrHigher = userRole === 'admin' || userRole === 'superadmin';

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
      if (result.success) {
        setParishes(result.data.parishes || []);
        setFeeTypes(result.data.feeTypes || []);
        setEntries(result.data.entries || []);
        setTotals(result.data.totals || { grandTotal: 0 });
        setEditTargets(
          (result.data.feeTypes || []).reduce((acc, feeType) => {
            acc[feeType._id] = feeType.targetAmount || 0;
            return acc;
          }, {})
        );
      }
    } catch (error) {
      console.error('Error fetching ledger data:', error);
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
      alert('Enter a valid non-negative amount before saving.');
      return;
    }

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
        fetchLedgerData(currentYear);
      } else {
        alert(result.message || 'Failed to save amount.');
      }
    } catch (error) {
      console.error('Save amount failed:', error);
      alert('Unable to save ledger amount right now.');
    }
  };

  const handleSaveTarget = async (feeTypeId) => {
    const amount = Number(editTargets[feeTypeId]);
    if (Number.isNaN(amount) || amount < 0) {
      alert('Enter a valid non-negative target value.');
      return;
    }

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
        fetchLedgerData(currentYear);
      } else {
        alert(result.message || 'Failed to save fee target.');
      }
    } catch (error) {
      console.error('Save target failed:', error);
      alert('Unable to save the fee target right now.');
    }
  };

  const handleAddFeeType = async (e) => {
    e.preventDefault();
    if (!newFeeType.trim()) {
      return;
    }

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
        fetchLedgerData(currentYear);
      } else {
        alert(result.message || 'Failed to add the fee category.');
      }
    } catch (error) {
      console.error('Add fee type failed:', error);
      alert('Unable to create new fee type right now.');
    }
  };

  const handleYearSelection = (year) => {
    setCurrentYear(year);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-gray-400">Loading Dynamic Ledger Matrix...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 bg-gray-50 min-h-screen text-xs font-semibold text-gray-600">
      <button onClick={() => navigate('/dashboard')} className="border px-4 py-2 bg-white rounded-lg hover:bg-gray-100 transition shadow-sm">← Back to Dashboard Hub Portal</button>

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between gap-4 border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Deanery Financial Ledger Matrix</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            The ledger matrix is generated from the centralized parish registry and renders columns from your active fee configuration.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
            <span className="text-gray-500 font-bold">Year:</span>
            <input
              type="number"
              min="2000"
              className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white"
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value) || new Date().getFullYear())}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => handleYearSelection(year)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${currentYear === year ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {year}
              </button>
            ))}
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
        </div>

        {isExecutiveOrHigher && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.24em] mb-3">Fee Category Configuration</h2>
            <div className="space-y-4">
              {feeTypes.map((feeType) => (
                <div key={feeType._id} className="grid grid-cols-[1fr_0.9fr_0.9fr] gap-2 items-center border-b border-gray-100 pb-3 mb-3 last:mb-0 last:border-0">
                  <div>
                    <p className="font-semibold text-slate-900">{feeType.name}</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={editTargets[feeType._id] ?? 0}
                      onChange={(e) => handleTargetInput(feeType._id, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSaveTarget(feeType._id)}
                      className="w-full bg-indigo-600 text-white text-[11px] font-bold rounded-lg px-3 py-2 hover:bg-indigo-700 transition"
                    >
                      Save Target
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
                    value={newFeeType}
                    onChange={(e) => setNewFeeType(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Yearly Target Amount"
                    value={newFeeTarget}
                    onChange={(e) => setNewFeeTarget(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <button type="submit" className="w-full bg-emerald-600 text-white text-[11px] font-bold rounded-lg px-3 py-2 hover:bg-emerald-700 transition">
                    Add Fee Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
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
        <div className="bg-indigo-950 px-4 py-3 text-white font-bold text-sm tracking-wide">🧾 Parish Fee Type Ledger Matrix</div>
        <div className="overflow-x-auto">
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
                    <td className="p-3 font-bold text-gray-900 text-sm">{parish.name}</td>
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
                                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveAmount(parish._id, feeType._id)}
                                  className="w-full bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2 py-1 hover:bg-black transition"
                                >
                                  Save
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
      </div>
    </div>
  );
}
