import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalElectors: 0, activeParishes: 0, collectionsThisYear: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    // Quick look setup to pull numbers for dashboard metrics summaries
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('clan_token');
        if (!token) { navigate('/login'); return; }
        
        // Pull financial records data directly to extract quick statistics summaries
        const res = await fetch(`https://clan-3slh.onrender.com/api/finance/ledger?year=${new Date().getFullYear()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
          setStats({
            totalElectors: 0, // Hook up to checkin.jsx model metrics once backend route updates
            activeParishes: result.data.length,
            collectionsThisYear: result.totals.grandTotal
          });
        }
      } catch (err) {
        console.error("Dashboard core statistics connect error:", err);
      }
    };
    fetchDashboardStats();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-6xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-800 p-6 rounded-2xl text-white shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Management Hub</h1>
          <p className="text-indigo-200 text-sm mt-1">Benin City Archdiocesan Council Operations Engine</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('clan_token'); navigate('/login'); }}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide border border-white/20 transition"
        >
          Sign Out Terminal
        </button>
      </div>

      {/* Snapshot Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Tracked Parishes</p>
          <p className="text-2xl font-black text-gray-800 mt-1">{stats.activeParishes}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Year Collections</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">₦{stats.collectionsThisYear.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Registered Electors</p>
          <p className="text-2xl font-black text-blue-600 mt-1">Pulling from Registry...</p>
        </div>
      </div>

      {/* Central Portal Navigation Options */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Available Management Systems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Link to Ledger */}
          <div 
            onClick={() => navigate('/ledger')}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-500 transition cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl font-bold mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                ₦
              </div>
              <h3 className="text-xl font-bold text-gray-800">Financial Ledger Engine</h3>
              <p className="text-gray-500 text-sm mt-1">
                Access variable multi-year ledger sheets. Process bulk Excel data uploads, configure annual levy prices, and toggle parish transaction markers directly.
              </p>
            </div>
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition inline-block">
              Open Ledger Modules →
            </span>
          </div>

          {/* Card 2: Link to Registry */}
          <div 
            onClick={() => navigate('/registry')}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-500 transition cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl font-bold mb-3 group-hover:bg-purple-600 group-hover:text-white transition">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-800">Deanery Electors Registry</h3>
              <p className="text-gray-500 text-sm mt-1">
                Monitor and verify public check-in forms filled out by parish presidents. Analyze elector totals, filter rosters by Benin, Abudu, and Eguabazua, and record meeting attendances.
              </p>
            </div>
            <span className="text-purple-600 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition inline-block">
              Open Registry Database →
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}