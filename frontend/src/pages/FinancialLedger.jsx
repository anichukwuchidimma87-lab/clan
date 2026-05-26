import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function FinancialLedger() {
  const [ledger, setLedger] = useState([]);
  const [totals, setTotals] = useState({ dues: 0, seminar: 0, competition: 0, grandTotal: 0 });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [userRole, setUserRole] = useState('member'); // Safety default
  
  // Custom manual form structures hooks
  const [newParishName, setNewParishName] = useState('');
  const [newParishDeanery, setNewParishDeanery] = useState('');
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formDues, setFormDues] = useState(5000);
  const [formSeminar, setFormSeminar] = useState(2500);
  const [formComp, setFormComp] = useState(5000);

  // Installment inline inputs state dictionary maps
  const [payAmounts, setPayAmounts] = useState({});
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simple token decoder helper script routine
  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const fetchLedgerData = async (year) => {
    try {
      const token = localStorage.getItem('clan_token');
      if (!token) { navigate('/login'); return; }
      
      const userPayload = parseJwt(token);
      if (userPayload && userPayload.role) {
        setUserRole(userPayload.role);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData(currentYear);
  }, [currentYear]);

  const handlePostPayment = async (id, category) => {
    const key = `${id}-${category}`;
    const amount = payAmounts[key];
    if (!amount || amount <= 0) return;

    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger/pay/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ category, amount })
      });
      const result = await res.json();
      if (result.success) {
        setPayAmounts(prev => ({ ...prev, [key]: '' }));
        fetchLedgerData(currentYear);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (loading) return <div className="p-8 text-center text-sm font-semibold text-gray-500">Verifying Ledger Authorization Parameters...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-indigo-600 hover:underline">← Back to Dashboard Hub Portal</button>
      
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Financial Ledger Matrix</h1>
          <p className="text-xs text-gray-400">Security Clearance Level: <span className="font-mono uppercase font-bold text-indigo-600">{userRole}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">Operating Sheet Year:</label>
          <input type="number" className="border p-2 rounded-lg text-sm w-24 font-bold text-center bg-gray-50" value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} />
        </div>
      </div>

      {/* Analytics Metric Blocks Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-600">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dues Deposited</p>
          <p className="text-xl font-extrabold text-gray-900">₦{totals.dues.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-600">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seminar Revenue</p>
          <p className="text-xl font-extrabold text-gray-900">₦{totals.seminar.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-600">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Comp Collections</p>
          <p className="text-xl font-extrabold text-gray-900">₦{totals.competition.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-950 text-white p-4 rounded-xl shadow-sm">
          <p className="text-xs opacity-70 font-bold uppercase tracking-wider">TOTAL BANK ({currentYear})</p>
          <p className="text-2xl font-black">₦{totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* ADMIN CONTROL FORMS PANELS (Invisible to standard members) */}
      {isAdmin && (
        <div className="space-y-4 animate-fadeIn">
          {/* Manual Entry Inputs Form */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">Add Single Parish Setup Profile</h3>
            <form onSubmit={async (e) => { e.preventDefault(); /* standard single record generator logic link placeholder */ }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <input type="text" placeholder="Parish Name" className="border p-2 rounded-lg text-sm md:col-span-2" value={newParishName} onChange={(e) => setNewParishName(e.target.value)} required />
              <select className="border p-2 rounded-lg text-sm bg-white" value={newParishDeanery} onChange={(e) => setNewParishDeanery(e.target.value)}>
                <option value="">Select Deanery</option>
                <option value="Benin">Benin</option>
                <option value="Abudu">Abudu</option>
                <option value="Eguabazua">Eguabazua</option>
              </select>
              <input type="number" className="border p-2 rounded-lg text-sm" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} required />
              <input type="number" className="border p-2 rounded-lg text-sm" value={formDues} onChange={(e) => setFormDues(Number(e.target.value))} required />
              <button type="submit" className="bg-blue-600 text-white text-xs font-bold rounded-lg md:col-span-2 hover:bg-blue-700 transition">Save Roster Line</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Ledger Sheet Output Grid Display */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <th className="p-4">Parish Title Name</th>
              <th className="p-4">Deanery Division</th>
              <th className="p-4 text-center">Dues Ledger</th>
              <th className="p-4 text-center">Seminar Ledger</th>
              <th className="p-4 text-center">Competition Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
            {ledger.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic font-medium">No tracking lists generated or parsed for fiscal year cycle database {currentYear}.</td></tr>
            ) : (
              ledger.map((row) => {
                const renderCellBlock = (category, currentPaid, maxCost, bgColor, textColor) => {
                  const balance = maxCost - currentPaid;
                  const key = `${row._id}-${category}`;
                  return (
                    <td className={`p-4 text-center ${bgColor}/20 min-w-[160px]`}>
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900">Paid: <span className={textColor}>₦{currentPaid.toLocaleString()}</span></div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Target: ₦{maxCost.toLocaleString()}</div>
                        {balance > 0 ? (
                          <span className="inline-block bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Owing: ₦{balance.toLocaleString()}</span>
                        ) : (
                          <span className="inline-block bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Cleared ✓</span>
                        )}
                        
                        {/* Inline Installment Adder Form - Only visible to Admins */}
                        {isAdmin && balance > 0 && (
                          <div className="flex items-center gap-1 mt-2 justify-center">
                            <input 
                              type="number" 
                              placeholder="+ Amount" 
                              className="border p-1 rounded text-[11px] w-16 bg-white font-semibold"
                              value={payAmounts[key] || ''}
                              onChange={(e) => setPayAmounts({ ...payAmounts, [key]: e.target.value })}
                            />
                            <button 
                              onClick={() => handlePostPayment(row._id, category)}
                              className="bg-gray-800 text-white px-1.5 py-1 rounded text-[10px] font-bold hover:bg-black transition"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                };

                return (
                  <tr key={row._id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="p-4 font-bold text-gray-900 text-sm">{row.parishName}</td>
                    <td className="p-4 text-gray-600 font-semibold tracking-wide">{row.deanery || 'General'}</td>
                    {renderCellBlock('dues', row.duesPaidAmount, row.duesPrice, 'bg-blue-50', 'text-blue-700')}
                    {renderCellBlock('seminar', row.seminarPaidAmount, row.seminarPrice, 'bg-purple-50', 'text-purple-700')}
                    {renderCellBlock('competition', row.competitionPaidAmount, row.competitionPrice, 'bg-pink-50', 'text-pink-700')}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}