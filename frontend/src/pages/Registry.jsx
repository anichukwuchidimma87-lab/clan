import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function Registry() {
  const [activeTab, setActiveTab] = useState('lectors'); // 'lectors' or 'parishes'
  const [membersList, setMembersList] = useState([]);
  const [parishesList, setParishesList] = useState([]); // Master parishes dataset
  const [externalExecs, setExternalExecs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('member');
  const [userParish, setUserParish] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingParishes, setUploadingParishes] = useState(false);

  // Quick Stats State Metrics
  const [metrics, setMetrics] = useState({ total: 0, males: 0, females: 0 });

  const navigate = useNavigate();
  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const fetchRegistryFiles = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const payload = parseJwt(token);
      if (payload) {
        setUserRole(payload.role);
        setUserParish(payload.parish || '');
      }

      // 1. Fetch Lectors data
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/registry', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        let activeScopeSet = [];
        if (result.scope === 'all') {
          activeScopeSet = result.data;
          setMembersList(result.data);
        } else {
          activeScopeSet = result.ownParish;
          setMembersList(result.ownParish);
          setExternalExecs(result.otherExecutives);
        }

        const males = activeScopeSet.filter(l => l.gender === 'Male').length;
        setMetrics({
          total: activeScopeSet.length,
          males: males,
          females: activeScopeSet.length - males
        });
      }

      // 2. Fetch Master Parishes list to keep UI synchronized
      const parishRes = await fetch('https://clan-3slh.onrender.com/api/lectors/parishes-list');
      const parishResult = await parishRes.json();
      if (parishResult.success) {
        setParishesList(parishResult.data);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegistryFiles(); }, []);

  // EXCEL BULK UPLOAD HANDLER FOR THE 42 MASTER PARISHES
  const handleParishExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingParishes(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const records = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue; 

          records.push({
            parishName: String(row[0]).trim(),
            deanery: 'Benin'
          });
        }

        if (records.length === 0) {
          alert("Failed: Unable to parse valid parish titles from your file's first column.");
          setUploadingParishes(false);
          return;
        }

        const token = localStorage.getItem('clan_token');
        const res = await fetch('https://clan-3slh.onrender.com/api/lectors/parishes/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ records })
        });

        const result = await res.json();
        if (result.success) {
          alert(`✓ Success! ${result.message}`);
          e.target.value = ''; 
          setActiveTab('parishes'); // Automatically switch view to parishes list to check results
          fetchRegistryFiles(); 
        } else {
          alert(`Server Error: ${result.message}`);
        }
      } catch (err) {
        console.error(err);
        alert(`Parsing Crash Error: ${err.message}`);
      } finally {
        setUploadingParishes(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleToggleSuspension = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('clan_token');
      const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchRegistryFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvictRecord = async (id) => {
    if (!window.confirm("Permanently wipe this lector profile out of database files?")) return;
    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRegistryFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = membersList.filter(l => 
    `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.parishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParishes = parishesList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-400">Compiling Benin Deanery Registry...</div>;

  const isAdminOrHigher = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 bg-gray-50 min-h-screen text-xs font-semibold text-gray-600">
      
      {/* Upper Title Header Control Grid */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Benin City Deanery Membership Registry Hub</h1>
          <p className="text-gray-400 text-[11px] mt-0.5">
            Jurisdiction Scope: <span className="text-indigo-600 uppercase font-bold">{isAdminOrHigher ? 'Executive Administration Office' : 'Local Parish President'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrHigher && (
            <div className="flex items-center border bg-amber-50 border-amber-200 p-1.5 rounded-lg gap-2 text-[11px]">
              <span className="text-amber-800 font-bold ml-1">📋 Import Master Parishes:</span>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                disabled={uploadingParishes}
                onChange={handleParishExcelUpload}
                className="text-xs max-w-[180px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 file:cursor-pointer"
              />
              {uploadingParishes && <span className="text-amber-600 animate-pulse font-bold">Syncing ledgers...</span>}
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="border px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">← Dashboard Home</button>
        </div>
      </div>

      {/* Navigation View Segment Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        <button 
          onClick={() => setActiveTab('lectors')}
          className={`px-4 py-2 font-bold rounded-t-lg border-t border-x transition text-xs ${activeTab === 'lectors' ? 'bg-white border-gray-200 text-indigo-600' : 'bg-gray-100/70 border-transparent text-gray-400 hover:bg-gray-100'}`}
        >
          👤 Lector Profiles ({filteredMembers.length})
        </button>
        <button 
          onClick={() => setActiveTab('parishes')}
          className={`px-4 py-2 font-bold rounded-t-lg border-t border-x transition text-xs ${activeTab === 'parishes' ? 'bg-white border-gray-200 text-indigo-600' : 'bg-gray-100/70 border-transparent text-gray-400 hover:bg-gray-100'}`}
        >
          ⛪ Master Parishes Directory ({filteredParishes.length})
        </button>
      </div>

      {/* Roster Live Stat Counters Blocks */}
      {activeTab === 'lectors' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 uppercase tracking-wider text-[10px]">Total Tracked Footprint Strength</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{metrics.total} <span className="text-xs font-normal text-gray-400">Registered Lectors</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-blue-500">
            <p className="text-blue-500 uppercase tracking-wider text-[10px]">Male Roster Cohort Split</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{metrics.males} <span className="text-xs font-normal text-gray-400">Lectors</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-pink-500">
            <p className="text-pink-500 uppercase tracking-wider text-[10px]">Female Roster Cohort Split</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{metrics.females} <span className="text-xs font-normal text-gray-400">Lectors</span></p>
          </div>
        </div>
      )}

      {/* Interactive Search Tool Filter block */}
      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <input 
          type="text" 
          placeholder={activeTab === 'lectors' ? "🔍 Type a lector name or parish church name to query real time directory records instantly..." : "🔍 Search parish names..."} 
          className="border w-full p-2.5 rounded-xl bg-gray-50 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* DYNAMIC CONTENT SWITCH ROUTER */}
      {activeTab === 'lectors' ? (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden border-gray-200">
          <div className="bg-indigo-950 px-4 py-3 text-white font-bold text-sm tracking-wide">
            {isAdminOrHigher ? "🌍 Benin City Deanery Roster Matrix Base (All Parishes)" : `⛪ Local Parish Roster Catalog Block (${userParish})`}
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-[11px] uppercase tracking-wider">
                <th className="p-3">Full Member Name</th>
                <th className="p-3">Parish Location</th>
                <th className="p-3">Gender / Age</th>
                <th className="p-3 text-center">Commissioned</th>
                <th className="p-3">Designation Status</th>
                <th className="p-3 text-center">Status Flags</th>
                <th className="p-3 text-center">Administrative Command Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600 font-medium text-xs">
              {filteredMembers.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center italic text-gray-400">No active directory database items matching parameters. Use public check-in page to add members.</td></tr>
              ) : (
                filteredMembers.map((lector) => (
                  <tr key={lector._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-bold text-gray-900 text-sm">{lector.lastName}, {lector.firstName}</td>
                    <td className="p-3">{lector.parishName} <span className="text-[10px] text-gray-400 block font-mono font-bold uppercase">{lector.deanery} Deanery</span></td>
                    <td className="p-3"><span className="capitalize">{lector.gender}</span> <span className="text-gray-400">({lector.ageBracket})</span></td>
                    <td className="p-3 text-center font-mono font-bold text-gray-700">{lector.yearCommissioned}</td>
                    <td className="p-3 text-indigo-700 font-bold">{lector.roleInParish}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${lector.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {lector.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3 flex items-center justify-center gap-1.5">
                      <button onClick={() => handleToggleSuspension(lector._id, lector.status)} className="bg-gray-800 hover:bg-black text-white font-bold px-2.5 py-1 rounded transition">
                        {lector.status === 'Active' ? '⚠️ Suspend' : '✓ Lift Ban'}
                      </button>
                      <button onClick={() => handleEvictRecord(lector._id)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded transition">
                        🗑️ Wipe File
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* PARISH VIEWER COMPONENT INTERFACE BLOCK */
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden border-gray-200 animate-fadeIn">
          <div className="bg-emerald-900 px-4 py-3 text-white font-bold text-sm tracking-wide">
            ⛪ Active Master Archdiocesan Registry Branches (Benin Jurisdiction)
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-[11px] uppercase tracking-wider">
                <th className="p-3">S/N</th>
                <th className="p-3">Parish Name Identifier</th>
                <th className="p-3">Administrative Zone / Deanery</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600 font-medium text-xs">
              {filteredParishes.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center italic text-gray-400">No parishes loaded yet. Use the Excel upload button above to map your sheet.</td></tr>
              ) : (
                filteredParishes.map((parish, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition">
                    <td className="p-3 font-mono text-gray-400 w-12">{index + 1}</td>
                    <td className="p-3 font-bold text-gray-900 text-sm">{parish.name}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-gray-100 font-bold uppercase font-mono text-gray-500">{parish.deanery || 'Benin'}</span></td>
                    <td className="p-3"><span className="text-emerald-600 font-bold">● Synchronized</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* External Executive Indexing Roster Deck */}
      {activeTab === 'lectors' && !isAdminOrHigher && externalExecs.length > 0 && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden border-gray-200 animate-fadeIn">
          <div className="bg-gray-800 px-4 py-2.5 text-white font-bold text-sm">
            👥 External Sister Parish Cabinet Executives Contact Roll (Benin Deanery)
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-[10px] uppercase">
                <th className="p-3">Officer Name</th>
                <th className="p-3">Parish Branch Site</th>
                <th className="p-3">Cabinet Position Title</th>
                <th className="p-3">Mobile Contact Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-500 font-medium">
              {externalExecs.map((exec) => (
                <tr key={exec._id} className="bg-gray-50/20">
                  <td className="p-3 font-bold text-gray-800">{exec.lastName}, {exec.firstName}</td>
                  <td className="p-3 font-semibold text-gray-600">{exec.parishName}</td>
                  <td className="p-3 text-indigo-600 font-bold">{exec.roleInParish}</td>
                  <td className="p-3 font-mono font-bold text-gray-700">{exec.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}