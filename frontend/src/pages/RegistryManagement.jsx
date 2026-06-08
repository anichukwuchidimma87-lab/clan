import React, { useState, useEffect } from 'react';

export default function RegistryManagement() {
  const [activeTab, setActiveTab] = useState('lectors');
  const [members, setMembers] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'Male',
    ageBracket: '21–30',
    yearCommissioned: new Date().getFullYear(),
    employmentStatus: 'Employed',
    parishId: '',
    roleInParish: 'Active Member'
  });
  const [newParishName, setNewParishName] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editingParish, setEditingParish] = useState(null);
  const [parishMembers, setParishMembers] = useState([]);
  const [selectedParishId, setSelectedParishId] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);

  const token = localStorage.getItem('clan_token');
  const parseJwt = (value) => {
    try { return JSON.parse(atob(value.split('.')[1])); } catch { return null; }
  };
  const payload = token ? parseJwt(token) : null;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, parishesRes] = await Promise.all([
        fetch('https://clan-3slh.onrender.com/api/lectors/registry', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://clan-3slh.onrender.com/api/v1/parishes', { headers })
      ]);

      const membersJson = await membersRes.json();
      const parishesJson = await parishesRes.json();

      if (membersJson.success) {
        const allMembers = membersJson.scope === 'all' ? membersJson.data : membersJson.ownParish;
        setMembers(allMembers);
      }

      if (parishesJson.success) {
        setParishes(parishesJson.data);
        if (!formState.parishId && parishesJson.data.length > 0) {
          setFormState(prev => ({ ...prev, parishId: parishesJson.data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Registry fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formState.firstName || !formState.lastName || !formState.parishId) {
      setAlertMessage({ type: 'error', text: 'Please fill all required member fields.' });
      return;
    }

    try {
      const body = {
        ...formState,
        parishId: formState.parishId,
        deanery: 'Benin'
      };
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: 'success', text: 'Lector added to the unified registry.' });
        setFormState({
          firstName: '',
          lastName: '',
          phone: '',
          gender: 'Male',
          ageBracket: '21–30',
          yearCommissioned: new Date().getFullYear(),
          employmentStatus: 'Employed',
          parishId: parishes.length > 0 ? parishes[0]._id : '',
          roleInParish: 'Active Member'
        });
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: data.message || 'Unable to save member.' });
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: 'Network error while adding member.' });
      console.error(error);
    }
  };

  const handleCreateParish = async (e) => {
    e.preventDefault();
    if (!newParishName.trim()) {
      setAlertMessage({ type: 'error', text: 'Parish name is required.' });
      return;
    }

    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/v1/parishes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newParishName.trim(), zone: 'Benin' })
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: 'success', text: 'Parish added to the master directory.' });
        setNewParishName('');
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: data.message || 'Failed to create parish.' });
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: 'Unable to create parish.' });
      console.error(error);
    }
  };

  const handleSelectParish = async (parishId) => {
    setSelectedParishId(parishId);
    if (!parishId) {
      setParishMembers([]);
      return;
    }
    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/v1/parishes/${parishId}/members`, { headers });
      const json = await res.json();
      if (json.success) {
        setParishMembers(json.data);
      }
    } catch (error) {
      console.error('Failed to load parish members:', error);
    }
  };

  const handleDeleteParish = async (id) => {
    if (!window.confirm('Delete this parish only if it has no assigned members.')) return;
    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/v1/parishes/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: 'success', text: 'Parish removed from master registry.' });
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: data.message || 'Unable to delete parish.' });
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: 'Error deleting parish.' });
      console.error(error);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Delete this lector from the registry?')) return;
    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAlertMessage({ type: 'success', text: 'Member removed from registry.' });
        fetchData();
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: 'Failed to delete member.' });
      console.error(error);
    }
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const parish = (member.parishName || (member.parish && member.parish.name) || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || parish.includes(searchQuery.toLowerCase());
  });

  const filteredParishes = parishes.filter(parish => parish.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-sm text-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Unified Registry Hub</h1>
              <p className="mt-2 text-slate-500 max-w-2xl">
                One source of truth for all parishes and lectors. Add, edit, transfer, and archive records from a single centralized interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-4 py-2 font-semibold">{payload?.role || 'Guest'}</span>
              <button onClick={() => setActiveTab('lectors')} className={`px-4 py-2 rounded-2xl ${activeTab === 'lectors' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Lector Roster</button>
              <button onClick={() => setActiveTab('parishes')} className={`px-4 py-2 rounded-2xl ${activeTab === 'parishes' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Parish Directory</button>
            </div>
          </div>
        </div>

        {alertMessage && (
          <div className={`rounded-2xl p-4 mb-5 ${alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
            {alertMessage.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{activeTab === 'lectors' ? 'Lector Roster' : 'Master Parish Directory'}</h2>
                  <p className="text-xs text-slate-500 mt-1">Manage your registry data centrally, with every parish feeding into the same source of truth.</p>
                </div>
                <div className="flex gap-2">
                  {activeTab === 'lectors' ? (
                    <button onClick={() => setEditingMember({})} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold">Add New Lector</button>
                  ) : (
                    <button onClick={() => setEditingParish({})} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold">Add New Parish</button>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'lectors' ? 'Search by member name or parish...' : 'Search parishes...'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
                />
              </div>
            </div>

            {activeTab === 'lectors' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-[0.2em]">
                      <tr>
                        <th className="px-4 py-4">Member</th>
                        <th className="px-4 py-4">Parish</th>
                        <th className="px-4 py-4">Role</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map(member => (
                        <tr key={member._id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <strong>{member.firstName} {member.lastName}</strong>
                            <div className="text-[11px] text-slate-500">{member.phone}</div>
                          </td>
                          <td className="px-4 py-4">
                            {(member.parish && member.parish.name) || member.parishName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-4">{member.roleInParish}</td>
                          <td className="px-4 py-4">{member.status || 'Active'}</td>
                          <td className="px-4 py-4 space-x-2">
                            <button onClick={() => setEditingMember(member)} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Edit</button>
                            <button onClick={() => handleDeleteMember(member._id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {!filteredMembers.length && (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No members found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-[0.2em]">
                      <tr>
                        <th className="px-4 py-4">Parish</th>
                        <th className="px-4 py-4">Zone</th>
                        <th className="px-4 py-4">Active Members</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParishes.map(parish => {
                        const memberCount = members.filter(m => (m.parish && m.parish._id === parish._id) || m.parishName === parish.name).length;
                        return (
                          <tr key={parish._id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-4">{parish.name}</td>
                            <td className="px-4 py-4">{parish.zone}</td>
                            <td className="px-4 py-4">{memberCount}</td>
                            <td className="px-4 py-4 space-x-2">
                              <button onClick={() => { setEditingParish(parish); setSelectedParishId(parish._id); handleSelectParish(parish._id); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
                              <button onClick={() => setEditingParish(parish)} className="rounded-2xl bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-700 hover:bg-amber-200">Edit</button>
                              <button onClick={() => handleDeleteParish(parish._id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                      {!filteredParishes.length && (
                        <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No parishes found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {activeTab === 'lectors' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Add / Edit Lector</h2>
                <form onSubmit={editingMember ? handleAddMember : handleAddMember} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">First Name</label>
                    <input type="text" value={formState.firstName} onChange={e => setFormState(prev => ({ ...prev, firstName: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Last Name</label>
                    <input type="text" value={formState.lastName} onChange={e => setFormState(prev => ({ ...prev, lastName: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Phone</label>
                    <input type="tel" value={formState.phone} onChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Parish</label>
                    <select value={formState.parishId} onChange={e => setFormState(prev => ({ ...prev, parishId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required>
                      {parishes.map(parish => (
                        <option key={parish._id} value={parish._id}>{parish.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-semibold">Save Lector</button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Create Parish</h2>
                <form onSubmit={handleCreateParish} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Parish Name</label>
                    <input type="text" value={newParishName} onChange={e => setNewParishName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
                  </div>
                  <button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-semibold">Add Parish</button>
                </form>
              </div>
            )}

            {activeTab === 'parishes' && selectedParishId && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Parish Members</h2>
                {parishMembers.length > 0 ? (
                  <ul className="space-y-3 text-xs text-slate-600">
                    {parishMembers.map(member => (
                      <li key={member._id} className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
                        <p className="font-semibold text-slate-900">{member.firstName} {member.lastName}</p>
                        <p>{member.roleInParish}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-xs">Select a parish row to view its active members.</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
