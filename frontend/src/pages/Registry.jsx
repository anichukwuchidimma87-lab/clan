import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Registry() {
  const [ownParishList, setOwnParishList] = useState([]);
  const [otherExecsList, setOtherExecsList] = useState([]);
  const [userRole, setUserRole] = useState('member');
  const [userParish, setUserParish] = useState('');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const parseJwt = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
  };

  const fetchRegistry = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const payload = parseJwt(token);
      if (payload) {
        setUserRole(payload.role);
        setUserParish(payload.parish || '');
      }

      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/registry', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        if (result.scope === 'all') {
          setOwnParishList(result.data); // Admins see everything in one master list
        } else {
          setOwnParishList(result.ownParish);
          setOtherExecsList(result.otherExecutives);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRegistry(); }, []);

  // Action Modifier Handler: Status Modification Toggles (Active <-> Suspended)
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('clan_token');
      const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchRegistry();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this lector record?")) return;
    try {
      const token = localStorage.getItem('clan_token');
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRegistry();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Parsing Membership Files...</div>;

  const isExecutiveOrHigher = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen text-xs">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-800">Archdiocesan Roster Registry Portal</h1>
          <p className="text-gray-400 mt-0.5">
            Role Clearances: <span className="uppercase font-bold text-indigo-600">{userRole === 'admin' ? 'Executive' : userRole === 'member' ? 'Parish President' : userRole}</span> 
            {userParish && ` | Parish Base: ${userParish}`}
          </p>
        </div>
      </div>

      {/* Roster Management Group Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-indigo-950 p-3 text-white font-bold text-sm">
          {isExecutiveOrHigher ? "🌍 Master Membership Directory (All Parishes)" : `⛪ Local Branch Directory Roster Sheet (${userParish})`}
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b font-bold text-gray-700 uppercase tracking-wide">
              <th className="p-3">Full Legal Name</th>
              <th className="p-3">Parish Branch Location</th>
              <th className="p-3">Designation Role</th>
              <th className="p-3 text-center">Status Flag</th>
              <th className="p-3 text-center">Administrative Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
            {ownParishList.map((lector) => (
              <tr key={lector._id} className="hover:bg-gray-50/50">
                <td className="p-3 font-bold text-gray-900 text-sm">{lector.lastName}, {lector.firstName}</td>
                <td className="p-3">{lector.parishName} ({lector.deanery})</td>
                <td className="p-3 font-semibold text-indigo-700">{lector.roleInParish}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${lector.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {lector.status}
                  </span>
                </td>
                <td className="p-3 flex items-center justify-center gap-2">
                  <button onClick={() => handleToggleStatus(lector._id, lector.status)} className="bg-gray-800 hover:bg-black text-white px-2 py-1 rounded font-bold transition">
                    {lector.status === 'Active' ? '⚠️ Suspend' : '✓ Activate'}
                  </button>
                  <button onClick={() => handleDelete(lector._id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-bold transition">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Neighboring Parish Information Deck (Visible only to local Parish Presidents) */}
      {!isExecutiveOrHigher && otherExecsList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="bg-gray-800 p-3 text-white font-bold text-sm">
            👥 External Branch Directory (View Only Parish Executives)
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b font-bold text-gray-700 uppercase">
                <th className="p-3">Executive Name</th>
                <th className="p-3">Parish Branch</th>
                <th className="p-3">Official Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-500 font-medium">
              {otherExecsList.map((exec) => (
                <tr key={exec._id} className="bg-gray-50/30">
                  <td className="p-3 font-bold text-gray-800">{exec.lastName}, {exec.firstName}</td>
                  <td className="p-3">{exec.parishName}</td>
                  <td className="p-3 text-indigo-600 font-semibold">{exec.roleInParish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}