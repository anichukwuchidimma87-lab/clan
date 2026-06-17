import React, { useState, useEffect } from 'react';

export default function RegistryManagement() {
  const [activeTab, setActiveTab] = useState('lectors');
  const [members, setMembers] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [newParishZone, setNewParishZone] = useState('Benin');
  const [editingMember, setEditingMember] = useState(null);
  const [editingParish, setEditingParish] = useState(null);
  const [editingParishName, setEditingParishName] = useState('');
  const [editingParishZone, setEditingParishZone] = useState('Benin');
  const [parishMembers, setParishMembers] = useState([]);
  const [selectedParishId, setSelectedParishId] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const token = localStorage.getItem('clan_token');
  const parseJwt = (value) => {
    try { return JSON.parse(atob(value.split('.')[1])); } catch { return null; }
  };

  const handleUpdateParish = async (e) => {
    e.preventDefault();
    if (!editingParish || !editingParish._id) {
      setAlertMessage({ type: 'error', text: 'No parish selected for update.' });
      return;
    }
    if (!editingParishName.trim()) {
      setAlertMessage({ type: 'error', text: 'Parish name cannot be empty.' });
      return;
    }

    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/v1/parishes/${editingParish._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: editingParishName.trim(), zone: editingParishZone })
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: 'success', text: 'Parish updated.' });
        setEditingParish(null);
        setEditingParishName('');
        setEditingParishZone('Benin');
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: data.message || 'Failed to update parish.' });
      }
    } catch (err) {
      console.error('Update parish failed:', err);
      setAlertMessage({ type: 'error', text: 'Network error while updating parish.' });
    }
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
        fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=20&page=1&search=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://clan-3slh.onrender.com/api/v1/parishes/with-counts', { headers })
      ]);

      const membersJson = await membersRes.json();
      const parishesJson = await parishesRes.json();

      if (membersJson.success) {
        if (membersJson.scope === 'all') {
          setMembers(membersJson.data || []);
          setPage(membersJson.page || 1);
          setTotalPages(membersJson.totalPages || 1);
        } else {
          const allMembers = membersJson.ownParish || membersJson.data || [];
          setMembers(allMembers);
          setPage(1);
          setTotalPages(1);
        }
      }

      if (parishesJson.success) {
        // backend now returns lectorCount on each parish
        setParishes(parishesJson.data.map(p => ({ ...p, lectorCount: p.lectorCount || 0 })));
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

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      // reset to first page for new searches
      handleSearch();
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=20&page=1&search=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        if (json.scope === 'all') {
          setMembers(json.data || []);
          setPage(json.page || 1);
          setTotalPages(json.totalPages || 1);
        } else {
          setMembers(json.ownParish || json.data || []);
          setPage(1);
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (page >= totalPages) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=20&page=${next}&search=${encodeURIComponent(searchQuery)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && json.scope === 'all') {
        setMembers(prev => [...prev, ...(json.data || [])]);
        setPage(json.page || next);
        setTotalPages(json.totalPages || totalPages);
      }
    } catch (err) {
      console.error('Load more failed', err);
    } finally {
      setLoadingMore(false);
    }
  };

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
        body: JSON.stringify({ name: newParishName.trim(), zone: newParishZone || 'Benin' })
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

  const filteredMembers = members; // server-driven filtering/pagination

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
                    <button onClick={() => { setEditingParish(null); setNewParishName(''); setNewParishZone('Benin'); }} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold">Add New Parish</button>
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
                {page < totalPages && (
                  <div className="p-4 text-center">
                    <button onClick={loadMore} disabled={loadingMore} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-[12px] font-semibold">
                      {loadingMore ? 'Loading…' : 'Load More'}
                    </button>
                  </div>
                )}
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
                        const memberCount = parish.lectorCount || 0;
                        return (
                          <tr key={parish._id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-4">{parish.name}</td>
                            <td className="px-4 py-4">{parish.zone}</td>
                            <td className="px-4 py-4">{memberCount}</td>
                            <td className="px-4 py-4 space-x-2">
                              <button onClick={() => { setEditingParish(parish); setSelectedParishId(parish._id); handleSelectParish(parish._id); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
                              <button onClick={() => { setEditingParish(parish); setEditingParishName(parish.name); setEditingParishZone(parish.zone || 'Benin'); }} className="rounded-2xl bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-700 hover:bg-amber-200">Edit</button>
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
                <h2 className="font-semibold text-slate-900 mb-3">{editingParish && editingParish._id ? 'Edit Parish' : 'Create Parish'}</h2>
                <form onSubmit={editingParish && editingParish._id ? handleUpdateParish : handleCreateParish} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Parish Name</label>
                    <input type="text" value={editingParish && editingParish._id ? editingParishName : newParishName} onChange={e => (editingParish && editingParish._id) ? setEditingParishName(e.target.value) : setNewParishName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Zone</label>
                    <select
                      value={editingParish && editingParish._id ? editingParishZone : newParishZone}
                      onChange={e => {
                        if (editingParish && editingParish._id) setEditingParishZone(e.target.value);
                        else setNewParishZone(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <option value="Benin">Benin</option>
                      <option value="Abudu">Abudu</option>
                      <option value="Iguobazuwa">Iguobazuwa</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full rounded-2xl bg-indigo-600 text-white py-3 font-semibold">{editingParish && editingParish._id ? 'Save Changes' : 'Add Parish'}</button>
                  {editingParish && editingParish._id && (
                    <button type="button" onClick={() => { setEditingParish(null); setEditingParishName(''); setEditingParishZone('Benin'); }} className="w-full mt-2 rounded-2xl bg-slate-100 text-slate-700 py-3 font-semibold">Cancel Edit</button>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'parishes' && selectedParishId && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Parish Members</h2>
                {parishMembers.length > 0 ? (
                  (() => {
                    const rolesOrder = ['Parish President', 'Parish Vice President', 'Parish Secretary', 'Parish Executive', 'Active Member'];
                    const grouped = parishMembers.reduce((acc, m) => {
                      const role = m.roleInParish || 'Active Member';
                      if (!acc[role]) acc[role] = [];
                      if ((m.status || 'Active') === 'Active') acc[role].push(m);
                      return acc;
                    }, {});

                    return (
                      <div className="space-y-3 text-xs text-slate-600">
                        {rolesOrder.map(roleKey => (
                          grouped[roleKey] && grouped[roleKey].length > 0 ? (
                            <div key={roleKey}>
                              <h3 className="text-sm font-semibold text-slate-800 mt-2">{roleKey}</h3>
                              <ul className="mt-2 space-y-2">
                                {grouped[roleKey].map(member => (
                                  <li key={member._id} className="rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
                                    <button onClick={() => setSelectedMember(member)} className="text-left">
                                      <p className="font-semibold text-slate-900">{member.firstName} {member.lastName}</p>
                                      <p className="text-[11px] text-slate-500">{member.phone}</p>
                                    </button>
                                    <div className="flex gap-2">
                                      <button onClick={() => { setEditingMember(member); setFormState(prev => ({ ...prev, firstName: member.firstName, lastName: member.lastName, phone: member.phone, parishId: member.parish?._id || member.parishId || '' })); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Edit</button>
                                      <button onClick={() => handleDeleteMember(member._id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null
                        ))}

                        {Object.keys(grouped).filter(k => !rolesOrder.includes(k)).map(k => (
                          <div key={k}>
                            <h3 className="text-sm font-semibold text-slate-800 mt-2">{k}</h3>
                            <ul className="mt-2 space-y-2">
                              {grouped[k].map(member => (
                                <li key={member._id} className="rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
                                  <button onClick={() => setSelectedMember(member)} className="text-left">
                                    <p className="font-semibold text-slate-900">{member.firstName} {member.lastName}</p>
                                    <p className="text-[11px] text-slate-500">{member.phone}</p>
                                  </button>
                                  <div className="flex gap-2">
                                    <button onClick={() => { setEditingMember(member); setFormState(prev => ({ ...prev, firstName: member.firstName, lastName: member.lastName, phone: member.phone, parishId: member.parish?._id || member.parishId || '' })); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Edit</button>
                                    <button onClick={() => handleDeleteMember(member._id)} className="rounded-2xl bg-rose-100 px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-slate-500 text-xs">Select a parish row to view its active members.</p>
                )}

                {selectedMember && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold">{selectedMember.firstName} {selectedMember.lastName}</h3>
                        <button onClick={() => setSelectedMember(null)} className="text-slate-500">Close</button>
                      </div>
                      <div className="mt-4 text-sm text-slate-700">
                        <p><strong>Phone:</strong> {selectedMember.phone || 'N/A'}</p>
                        <p><strong>Role:</strong> {selectedMember.roleInParish || 'Member'}</p>
                        <p><strong>Parish:</strong> {(selectedMember.parish && selectedMember.parish.name) || selectedMember.parishName || 'Unassigned'}</p>
                        <p><strong>Gender:</strong> {selectedMember.gender || 'N/A'}</p>
                        <p><strong>Age Bracket:</strong> {selectedMember.ageBracket || 'N/A'}</p>
                        <p><strong>Year Commissioned:</strong> {selectedMember.yearCommissioned || 'N/A'}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => setSelectedMember(null)} className="rounded-2xl bg-indigo-600 text-white px-4 py-2">Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
