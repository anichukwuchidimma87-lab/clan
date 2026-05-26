import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

// SIDEBAR NAV INTERFACE (Restricted to authorized tiers)
const RestrictedSidebar = ({ isVisible, userRole, navigate }) => {
  if (!isVisible) return null; // Fully hidden until logged in

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <aside className="w-64 bg-indigo-950 p-6 flex flex-col gap-5 text-gray-200 min-h-screen border-r border-indigo-900 shadow-xl">
      <div className="flex flex-col gap-1 items-start mb-4">
        <span className="text-xl font-black tracking-tight text-white">Deanery Base</span>
        <span className="text-[10px] uppercase font-bold text-indigo-400">Executive Administration Hub</span>
      </div>
      
      <nav className="space-y-2 flex-grow">
        <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg font-semibold text-xs ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-indigo-700'}`}>🏠 Welcome Page</NavLink>
        <NavLink to="/registry" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg font-semibold text-xs ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`}>📋 Registry Roster</NavLink>
        <NavLink to="/ledger" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg font-semibold text-xs ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`}>🧾 Financial Ledger Matrix</NavLink>

        {isAdmin && (
          <NavLink to="/admin/control" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg font-semibold text-xs ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-700'}`}>🛠️ Admin Controls</NavLink>
        )}
      </nav>

      <div className="border-t border-indigo-800 pt-4 mt-4 space-y-2">
        <button onClick={() => navigate('/settings')} className="w-full text-left flex items-center gap-3 p-2.5 rounded text-gray-400 text-xs font-semibold hover:bg-indigo-700 hover:text-white transition">⚙️ Local Profile Settings</button>
        <button 
          onClick={() => { localStorage.removeItem('clan_token'); navigate('/login'); }} 
          className="w-full text-left flex items-center gap-3 p-2.5 rounded bg-amber-500/10 text-amber-500 text-xs font-bold hover:bg-amber-500 hover:text-indigo-950 transition"
        >
          🔒 Lock & Sign Out
        </button>
      </div>
    </aside>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState({ name: '', role: '', parish: '', isLoggedIn: false });
  const [registryCount, setRegistryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Static list of Executives mapped directly from your document
  const executives = [
    { name: "Mr. Abatsu Michael", role: "President", parish: "Holy Trinity" },
    { name: "Mrs. Ella Idahosa", role: "Vice President", parish: "St. Mary Obe" },
    { name: "Mr. Osagie Ukhurebor", role: "Secretary", parish: "St. Joseph" },
    { name: "Miss Anichikwu Chidimma", role: "Assistant Secretary", parish: "Assumption Uteh" },
    { name: "Mr. Desmond Osaji", role: "Treasurer", parish: "St. Mathias Ologbo" },
    { name: "Mrs. Augustina Okpara", role: "Financial Secretary", parish: "St. Paul" },
    { name: "Mrs. Vivian Ugorji", role: "Assistant Financial Secretary", parish: "Blessed Tansi" },
    { name: "Mr. CSP Isibor", role: "PRO", parish: "St. Augustine" },
    { name: "Miss Nkeiruka Ifeachor", role: "Welfare Officer", parish: "Holy Cross" },
    { name: "Mr. Onwe Paul", role: "Provost", parish: "Blessed Tansi" }
  ];

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('clan_token');
      if (token) {
        const payload = parseJwt(token);
        if (payload) {
          setUser({ 
            name: `${payload.title || 'Mr.'} ${payload.firstName} ${payload.lastName}`, 
            role: payload.role, 
            parish: payload.parish, 
            isLoggedIn: true 
          });
        }
      }

      try {
        const resCount = await fetch('https://clan-3slh.onrender.com/api/public/stats');
        const countData = await resCount.json();
        if (countData.success) setRegistryCount(countData.data.totalLectors);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    checkStatus();
  }, []);

  const isAdminOrHigher = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50 flex text-xs font-semibold text-gray-600">
      
      <RestrictedSidebar isVisible={user.isLoggedIn} userRole={user.role} navigate={navigate} />

      <main className="flex-grow">
        {/* PUBLIC/PRIVATE DYNAMIC HEADER BAR */}
        <header className="bg-white p-4 border-b border-gray-100 shadow-sm flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">CLAN • Benin City Deanery Hub</h1>
            <p className="text-[11px] text-gray-400">Catholic Lectors Association of Nigeria | Registry Base</p>
          </div>
          
          <div className="flex items-center gap-3">
            {user.isLoggedIn ? (
              <>
                <div className="text-right flex flex-col items-end">
                  <span className="font-bold text-gray-900 text-sm">{user.name}</span>
                  <span className="text-[10px] text-indigo-600 uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">{user.role} clearance • {user.parish}</span>
                </div>
                <button 
                  onClick={() => { localStorage.removeItem('clan_token'); window.location.reload(); }} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-sm transition"
                >
                  🔒 Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate('/login')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                Unlock Ledger & Roster
              </button>
            )}
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

          {/* DYNAMIC WELCOME IMAGE HEADER SECTION */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6 transition-all">
            <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-indigo-100/50 overflow-hidden shrink-0 text-5xl shadow-inner">
              ⛪
            </div>
            <div className="flex-grow space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
                Welcome to CLAN <span className="text-indigo-600 font-black">Benin City Deanery Hub Portal</span>
              </h2>
              <p className="text-sm font-medium text-gray-600 max-w-3xl leading-relaxed">
                Made up of 42 active parishes across Benin City. We serve, we grow, and we proclaim the Word together as the body of the Catholic Lectors Association of Nigeria (CLAN). This secure registry coordinates our structure, deployment tracking, and structural mission.
              </p>
            </div>
          </section>

          {/* METRICS PANEL (Shows when logged in) */}
          {user.isLoggedIn && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <span className="text-3xl p-3 rounded-full bg-blue-50">👥</span>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sync Registry Strength</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{registryCount} <span className="text-sm font-normal text-gray-400">Registered Lectors</span></p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <span className="text-3xl p-3 rounded-full bg-indigo-50">⛪</span>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Structural Deanery Units</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">42 <span className="text-sm font-normal text-gray-400">Active Parishes Indexed</span></p>
                </div>
              </div>
            </section>
          )}

          {/* MEET OUR EXECUTIVES PANEL */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="border-b pb-3">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>👥</span> Benin City Deanery Lectors Executive Council
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">Inaugurated @ Saint Andrew Catholic Church, Ugbighokho</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {executives.map((exec, index) => (
                <div key={index} className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl flex items-center gap-4 hover:shadow-sm transition">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100/80 flex items-center justify-center font-bold text-xs text-indigo-600 tracking-tighter shrink-0">
                    {index + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{exec.name}</p>
                    <p className="text-[10px] text-indigo-600 uppercase font-extrabold tracking-wider">{exec.role}</p>
                    <p className="text-gray-400 text-[11px] font-medium">{exec.parish}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CALL TO ACTION FOOTER */}
          <section className="bg-indigo-950 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between border border-indigo-900 shadow-xl">
            <div className="space-y-1.5 flex-grow text-center md:text-left">
              <h3 className="text-lg font-black tracking-tight">Coordination Command Portal</h3>
              <p className="text-xs font-medium text-indigo-200 max-w-lg leading-relaxed">Ensure your local parish roster details are completely up to date. Reach out to the admin secretariat for credentials.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {user.isLoggedIn ? (
                <button 
                  onClick={() => navigate('/ledger')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
                >
                  🧾 Review Financial Matrix ✓
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="border-2 border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-white hover:text-indigo-950 transition"
                  >
                    🔐 Cabinet Officials Sign In
                  </button>
                  <button 
                    onClick={() => navigate('/checkin')} 
                    className="bg-white text-indigo-950 px-4 py-2.5 rounded-xl font-black text-xs hover:bg-gray-100 transition shadow-lg"
                  >
                    Lector Roster Check-In
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}