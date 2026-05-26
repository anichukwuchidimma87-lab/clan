import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Form input states
  const [newParishName, setNewParishName] = useState('');
  const [newParishZone, setNewParishZone] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLedgerData = async (year) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setLedger(result.data);
        setTotals(result.totals);
      }
    } catch (err) {
      console.error("Error connecting to live ledger API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  const handleAddParish = async (e) => {
    e.preventDefault();
    if (!newParishName.trim()) return;

    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch('https://clan-3slh.onrender.com/api/finance/parish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          parishName: newParishName, 
          zone: newParishZone,
          year: formYear,
          duesPrice: formDues,
          seminarPrice: formSeminar,
          competitionPrice: formComp
        })
      });

      const result = await res.json();
      if (result.success) {
        setNewParishName('');
        setNewParishZone('');
        // If we added a parish for the year we are currently viewing, refresh view
        if (Number(formYear) === Number(currentYear)) {
          fetchLedgerData(currentYear);
        } else {
          setCurrentYear(Number(formYear));
        }
      } else {
        alert(result.message || "Failed to add parish record");
      }
    } catch (err) {
      console.error("Error adding new parish:", err);
    }
  };

  const handleToggle = async (id, field, currentValue) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) return;

      const record = ledger.find(item => item._id === id);
      
      const updatedPayload = {
        duesPaid: record.duesPaid,
        seminarPaid: record.seminarPaid,
        competitionPaid: record.competitionPaid,
        [field]: !currentValue
      };

      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });
      
      if (res.ok) {
        fetchLedgerData(currentYear); 
      }
    } catch (err) {
      console.error("Failed to update record on live database:", err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Live Historical Ledger Systems...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* View Switcher Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dynamic Financial Ledger</h1>
          <p className="text-xs text-gray-500">Currently viewing ledger sheet matrix records for the target fiscal year cycle</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Select Operating Year:</label>
          <input 
            type="number" 
            className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL DUES COLLECTED</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL SEMINARS</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL COMPETITIONS</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm">
          <p className="text-sm opacity-80 font-medium">YEAR GRAND TOTAL ({currentYear})</p>
          <p className="text-2xl font-bold">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Entry Panel Form Configuration */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-md font-bold text-gray-800 mb-4">Initialize Ledger Record Entry</h3>
        <form onSubmit={handleAddParish} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Parish Name</label>
            <input type="text" placeholder="e.g. St. Maria Goretti" className="border p-2 rounded-lg text-sm w-full" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Zone (Optional)</label>
            <input type="text" placeholder="Abudu" className="border p-2 rounded-lg text-sm w-full" value={newParishZone} onChange={(e) => setNewParishZone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Record Year</label>
            <input type="number" className="border p-2 rounded-lg text-sm w-full font-semibold" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dues Fee (₦)</label>
            <input type="number" className="border p-2 rounded-lg text-sm w-full text-blue-700 font-semibold" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Seminar Fee (₦)</label>
            <input type="number" className="border p-2 rounded-lg text-sm w-full text-purple-700 font-semibold" value={formSeminar} onChange={(e) => setFormSeminar(Number(e.target.value))} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Competition Fee (₦)</label>
            <input type="number" className="border p-2 rounded-lg text-sm w-full text-pink-700 font-semibold" value={formComp} onChange={(e) => setFormComp(Number(e.target.value))} required />
          </div>
          <div className="md:col-span-4 flex items-end">
            <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm h-[38px]">
              + Save Parish Year Profile Sheet
            </button>
          </div>
        </form>
      </div>

      {/* Main Financial Data Table Sheet */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Name</th>
              <th className="p-4">Zone Information</th>
              <th className="p-4 text-center">Dues Amt</th>
              <th className="p-4 text-center">Seminar Amt</th>
              <th className="p-4 text-center">Competition Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {ledger.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400 italic">No historical parish listings or price models initialized for the fiscal year {currentYear} yet.</td>
              </tr>
            ) : (
              ledger.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50/70 transition">
                  <td className="p-4 font-semibold text-gray-900">{row.parishName}</td>
                  <td className="p-4 text-gray-500 italic text-xs">{row.zone || 'Unassigned'}</td>
                  
                  {/* Dynamic Dues Processing */}
                  <td className="p-4 text-center bg-blue-50/20">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-blue-700">₦{row.duesPrice.toLocaleString()}</span>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded"
                        checked={row.duesPaid} 
                        onChange={() => handleToggle(row._id, 'duesPaid', row.duesPaid)}
                      />
                    </label>
                  </td>

                  {/* Dynamic Seminar Processing */}
                  <td className="p-4 text-center bg-purple-50/20">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-purple-700">₦{row.seminarPrice.toLocaleString()}</span>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-purple-600 rounded"
                        checked={row.seminarPaid} 
                        onChange={() => handleToggle(row._id, 'seminarPaid', row.seminarPaid)}
                      />
                    </label>
                  </td>

                  {/* Dynamic Competition Processing */}
                  <td className="p-4 text-center bg-pink-50/20">
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <span className="text-xs font-bold text-pink-700">₦{row.competitionPrice.toLocaleString()}</span>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-pink-600 rounded"
                        checked={row.competitionPaid} 
                        onChange={() => handleToggle(row._id, 'competitionPaid', row.competitionPaid)}
                      />
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}