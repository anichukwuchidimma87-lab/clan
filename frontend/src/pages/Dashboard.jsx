import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [parishes, setParishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend on load
  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/parishes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setParishes(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching ledger:", err);
        alert("Could not load ledger data.");
        setLoading(false);
      }
    };
    fetchParishes();
  }, []);

  const handlePaymentChange = async (parishId, field, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    
    // Optimistic UI update
    setParishes(prev =>
      prev.map(p => (p.id === parishId ? { ...p, [field]: numericValue } : p))
    );

    // Persist to backend
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/parishes/${parishId}`, 
        { [field]: numericValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save update to database.");
    }
  };

  const getStatusBadge = (paid, target) => {
    if (paid === 0) return <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">Outstanding</span>;
    if (paid < target) return <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>;
    return <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Fully Paid</span>;
  };

  const totalDues = parishes.reduce((sum, p) => sum + (p.duesPaid || 0), 0);
  const totalSeminar = parishes.reduce((sum, p) => sum + (p.seminarPaid || 0), 0);
  const totalCompetition = parishes.reduce((sum, p) => sum + (p.competitionPaid || 0), 0);
  const grandTotal = totalDues + totalSeminar + totalCompetition;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) return <div className="p-10 text-center">Loading Financial Data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Ledger Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md transition">Sign Out</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
          <p className="text-xs text-gray-500 uppercase">Total Dues</p>
          <p className="text-xl font-bold">₦{totalDues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase">Total Seminar</p>
          <p className="text-xl font-bold">₦{totalSeminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-pink-500">
          <p className="text-xs text-gray-500 uppercase">Total Competition</p>
          <p className="text-xl font-bold">₦{totalCompetition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-900 text-white p-4 rounded-lg shadow-sm">
          <p className="text-xs text-indigo-200 uppercase">Grand Total</p>
          <p className="text-2xl font-black">₦{grandTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Parish</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Dues (5k)</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Seminar (2k)</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Comp (3k)</th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parishes.map((parish) => (
              <tr key={parish.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-bold">{parish.name}</div>
                  <div className="text-xs text-gray-500">{parish.zone}</div>
                </td>
                <td className="px-6 py-4">
                  <input type="number" className="w-20 border rounded p-1" value={parish.duesPaid} onChange={(e) => handlePaymentChange(parish.id, 'duesPaid', e.target.value)} />
                  {getStatusBadge(parish.duesPaid, 5000)}
                </td>
                <td className="px-6 py-4">
                  <input type="number" className="w-20 border rounded p-1" value={parish.seminarPaid} onChange={(e) => handlePaymentChange(parish.id, 'seminarPaid', e.target.value)} />
                  {getStatusBadge(parish.seminarPaid, 2000)}
                </td>
                <td className="px-6 py-4">
                  <input type="number" className="w-20 border rounded p-1" value={parish.competitionPaid} onChange={(e) => handlePaymentChange(parish.id, 'competitionPaid', e.target.value)} />
                  {getStatusBadge(parish.competitionPaid, 3000)}
                </td>
                <td className="px-6 py-4 font-bold text-indigo-600">
                  ₦{(parish.duesPaid + parish.seminarPaid + parish.competitionPaid).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}