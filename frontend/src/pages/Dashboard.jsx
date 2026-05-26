import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [selectedZone, setSelectedZone] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLedgerData = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      
      // Safety Check: If no token exists, send them back to login page
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch('https://clan-3slh.onrender.com/api/finance/ledger', {
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
    fetchLedgerData();
  }, []);

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
        fetchLedgerData(); 
      }
    } catch (err) {
      console.error("Failed to update record on live database:", err);
    }
  };

  const filteredLedger = selectedZone === 'All' 
    ? ledger 
    : ledger.filter(item => item.zone === selectedZone);

  if (loading) return <div className="p-8 text-center">Loading Live Financial Records...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Financial Ledger Dashboard</h1>
        <select 
          className="border p-2 rounded-lg bg-gray-50"
          value={selectedZone} 
          onChange={(e) => setSelectedZone(e.target.value)}
        >
          <option value="All">All Zones</option>
          <option value="Benin City">Benin City</option>
          <option value="Abudu">Abudu</option>
          <option value="Iguobazuwa">Iguobazuwa</option>
        </select>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL DUES (5K)</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL SEMINAR (2K)</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-600">
          <p className="text-sm text-gray-500 font-medium">TOTAL COMPETITION (3K)</p>
          <p className="text-xl font-bold text-gray-900">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm">
          <p className="text-sm opacity-80 font-medium">GRAND TOTAL COLLECTED</p>
          <p className="text-2xl font-bold">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Interactive Matrix Data Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-semibold text-sm">
              <th className="p-4">Parish Name</th>
              <th className="p-4">Zone</th>
              <th className="p-4 text-center">Dues (5k)</th>
              <th className="p-4 text-center">Seminar (2k)</th>
              <th className="p-4 text-center">Comp (3k)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
            {filteredLedger.map((row) => {
              return (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{row.parishName}</td>
                  <td className="p-4">{row.zone}</td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded"
                      checked={row.duesPaid} 
                      onChange={() => handleToggle(row._id, 'duesPaid', row.duesPaid)}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 rounded"
                      checked={row.seminarPaid} 
                      onChange={() => handleToggle(row._id, 'seminarPaid', row.seminarPaid)}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-pink-600 rounded"
                      checked={row.competitionPaid} 
                      onChange={() => handleToggle(row._id, 'competitionPaid', row.competitionPaid)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}