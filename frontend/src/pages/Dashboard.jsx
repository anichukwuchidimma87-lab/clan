import React, { useState } from 'react';

// Mock initial data based on the Parish structure and the 3 specific annual levies
const initialParishes = [
  { id: '1', name: 'Parish A', zone: 'Zone 1', duesPaid: 5000, duesTarget: 5000, seminarPaid: 2000, seminarTarget: 2000, competitionPaid: 0, competitionTarget: 3000 },
  { id: '2', name: 'Parish B', zone: 'Zone 1', duesPaid: 0, duesTarget: 5000, seminarPaid: 2000, seminarTarget: 2000, competitionPaid: 1500, competitionTarget: 3000 },
  { id: '3', name: 'Parish C', zone: 'Zone 2', duesPaid: 5000, duesTarget: 5000, seminarPaid: 0, seminarTarget: 2000, competitionPaid: 0, competitionTarget: 3000 },
];

export default function Dashboard() {
  const [parishes, setParishes] = useState(initialParishes);

  // Handle inline numeric updates from the Financial Secretary
  const handlePaymentChange = (parishId, field, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    setParishes(prev =>
      prev.map(p => (p.id === parishId ? { ...p, [field]: numericValue } : p))
    );
  };

  // Status Badge Logic (Red / Yellow / Green)
  const getStatusBadge = (paid, target) => {
    if (paid === 0) return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Outstanding</span>;
    if (paid < target) return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Partial</span>;
    return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Fully Paid</span>;
  };

  // Global Financial Calculations using .reduce()
  const totalDues = parishes.reduce((sum, p) => sum + p.duesPaid, 0);
  const totalSeminar = parishes.reduce((sum, p) => sum + p.seminarPaid, 0);
  const totalCompetition = parishes.reduce((sum, p) => sum + p.competitionPaid, 0);
  const grandTotalCollected = totalDues + totalSeminar + totalCompetition;

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Ledger Dashboard</h1>
          <p className="text-sm text-gray-500">Parish-Level Annual Fee Tracking</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Sign Out
        </button>
      </div>

      {/* Real-Time Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Monthly Dues</p>
          <p className="text-xl font-bold text-gray-900 mt-1">₦{totalDues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Seminar Levies</p>
          <p className="text-xl font-bold text-gray-900 mt-1">₦{totalSeminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-pink-500">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Competition Levies</p>
          <p className="text-xl font-bold text-gray-900 mt-1">₦{totalCompetition.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm bg-indigo-900 text-white">
          <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Grand Total Revenue</p>
          <p className="text-2xl font-black mt-1">₦{grandTotalCollected.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Ledger Spreadsheet UI */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Parish Accounts Matrix</h3>
          <span className="text-xs text-gray-500">* Double-click or select amounts to type updates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parish Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Dues (Target: ₦5k)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seminar Levy (Target: ₦2k)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition Levy (Target: ₦3k)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Contribution</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parishes.map((parish) => {
                const totalParishPaid = parish.duesPaid + parish.seminarPaid + parish.competitionPaid;
                return (
                  <tr key={parish.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{parish.name}</div>
                      <div className="text-xs text-gray-500">{parish.zone}</div>
                    </td>
                    
                    {/* Monthly Dues Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                          value={parish.duesPaid}
                          onChange={(e) => handlePaymentChange(parish.id, 'duesPaid', e.target.value)}
                        />
                        {getStatusBadge(parish.duesPaid, parish.duesTarget)}
                      </div>
                    </td>

                    {/* Seminar Levy Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                          value={parish.seminarPaid}
                          onChange={(e) => handlePaymentChange(parish.id, 'seminarPaid', e.target.value)}
                        />
                        {getStatusBadge(parish.seminarPaid, parish.seminarTarget)}
                      </div>
                    </td>

                    {/* Competition Levy Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                          value={parish.competitionPaid}
                          onChange={(e) => handlePaymentChange(parish.id, 'competitionPaid', e.target.value)}
                        />
                        {getStatusBadge(parish.competitionPaid, parish.competitionTarget)}
                      </div>
                    </td>

                    {/* Net Total Output Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                      ₦{totalParishPaid.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}