import React, { useState, useEffect, useMemo } from 'react';

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
  const [parishFilter, setParishFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('lector');
  const [selectedRows, setSelectedRows] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembersCount, setTotalMembersCount] = useState(null);

  const token = localStorage.getItem('clan_token');
  const parseJwt = (value) => {
    try { return JSON.parse(atob(value.split('.')[1])); } catch { return null; }
  };
  const payload = token ? parseJwt(token) : null;
  const userRole = payload?.role === 'admin' ? 'executive' : (payload?.role || 'member');
  const canEditRegistry = ['superadmin', 'executive'].includes(userRole);

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
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter === 'all' ? 'all' : statusFilter;
      const [membersRes, parishesRes] = await Promise.all([
        fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=1000&page=1&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusParam)}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://clan-3slh.onrender.com/api/v1/parishes/with-counts', { headers })
      ]);

      const membersJson = await membersRes.json();
      const parishesJson = await parishesRes.json();

      if (membersJson.success) {
        // capture authoritative total from backend when available
        const potentialTotal = membersJson.total || membersJson.totalLectors || membersJson.count || membersJson.totalCount || (membersJson.meta && membersJson.meta.total) || null;
        if (potentialTotal != null) setTotalMembersCount(Number(potentialTotal));

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

  useEffect(() => {
    if (activeTab === 'lectors') {
      handleSearch();
    }
  }, [statusFilter]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter === 'all' ? 'all' : statusFilter;
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=1000&page=1&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusParam)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        const potentialTotal = json.total || json.totalLectors || json.count || json.totalCount || (json.meta && json.meta.total) || null;
        if (potentialTotal != null) setTotalMembersCount(Number(potentialTotal));

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
    const statusParam = statusFilter === 'all' ? 'all' : statusFilter;
    setLoadingMore(true);
    try {
      const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=1000&page=${next}&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusParam)}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success && json.scope === 'all') {
        const potentialTotal = json.total || json.totalLectors || json.count || json.totalCount || (json.meta && json.meta.total) || null;
        if (potentialTotal != null) setTotalMembersCount(Number(potentialTotal));
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

  const openLectorDrawer = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormState({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        phone: member.phone || '',
        gender: member.gender || 'Male',
        ageBracket: member.ageBracket || '21–30',
        yearCommissioned: member.yearCommissioned || new Date().getFullYear(),
        employmentStatus: member.employmentStatus || 'Employed',
        parishId: member.parish?._id || member.parishId || parishes[0]?._id || '',
        roleInParish: member.roleInParish || 'Active Member'
      });
    } else {
      setEditingMember(null);
      setFormState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: 'Male',
        ageBracket: '21–30',
        yearCommissioned: new Date().getFullYear(),
        employmentStatus: 'Employed',
        parishId: parishes[0]?._id || '',
        roleInParish: 'Active Member'
      });
    }
    setDrawerType('lector');
    setDrawerOpen(true);
  };

  const openParishDrawer = (parish = null) => {
    if (parish) {
      setEditingParish(parish);
      setEditingParishName(parish.name || '');
      setEditingParishZone(parish.zone || 'Benin');
    } else {
      setEditingParish(null);
      setEditingParishName('');
      setEditingParishZone('Benin');
    }
    setDrawerType('parish');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerType('lector');
  };

  const toggleRowSelection = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedRows([]);

  const exportSelectedCsv = () => {
    const rows = activeTab === 'lectors'
      ? members.filter(member => selectedRows.includes(member._id))
      : parishes.filter(parish => selectedRows.includes(parish._id));

    if (!rows.length) {
      setAlertMessage({ type: 'error', text: 'Select at least one row before exporting.' });
      return;
    }

    const keys = activeTab === 'lectors'
      ? ['firstName', 'lastName', 'phone', 'parishName', 'roleInParish', 'status']
      : ['name', 'zone', 'lectorCount'];

    const csvRows = [keys.join(',')];
    rows.forEach(row => {
      const values = keys.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeTab === 'lectors' ? 'selected-lector-roster.csv' : 'selected-parish-directory.csv';
    link.click();
    URL.revokeObjectURL(url);
    setAlertMessage({ type: 'success', text: 'Selected rows exported successfully.' });
  };

  const bulkUnsuspendSelected = async () => {
    if (!selectedRows.length) {
      setAlertMessage({ type: 'error', text: 'Select at least one suspended member to unsuspend.' });
      return;
    }

    if (!window.confirm(`Unsuspend ${selectedRows.length} selected member(s)? This will set their status to Active.`)) return;

    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/bulk-unsuspend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRows })
      });
      const json = await res.json();
      if (json.success) {
        setAlertMessage({ type: 'success', text: `Unsuspended ${json.modifiedCount || 0} member(s).` });
        clearSelection();
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: json.message || 'Unable to unsuspend selected members.' });
      }
    } catch (err) {
      console.error('Bulk unsuspend failed', err);
      setAlertMessage({ type: 'error', text: 'Network error while unsuspending members.' });
    }
  };

  const unsuspendAllSuspended = async () => {
    const confirmText = window.prompt('Type UNSUSPEND to confirm unsuspending ALL suspended records. This action is irreversible.');
    if (confirmText !== 'UNSUSPEND') {
      setAlertMessage({ type: 'error', text: 'Confirmation phrase not matched. Action cancelled.' });
      return;
    }

    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/lectors/bulk-unsuspend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ allSuspended: true })
      });
      const json = await res.json();
      if (json.success) {
        setAlertMessage({ type: 'success', text: `Unsuspended ${json.modifiedCount || 0} member(s).` });
        clearSelection();
        fetchData();
      } else {
        setAlertMessage({ type: 'error', text: json.message || 'Unable to unsuspend all members.' });
      }
    } catch (err) {
      console.error('Unsuspend all failed', err);
      setAlertMessage({ type: 'error', text: 'Network error while unsuspending all members.' });
    }
  };

  const selectSuspendedInView = () => {
    const suspended = members.filter(m => (m.status || 'Active') === 'Suspended');
    if (!suspended.length) {
      setAlertMessage({ type: 'error', text: 'There are no suspended members in the current dataset.' });
      return;
    }
    setSelectedRows(suspended.map(m => m._id));
    setAlertMessage({ type: 'success', text: `Selected ${suspended.length} suspended member(s).` });
  };

  const viewSuspended = () => {
    setStatusFilter('Suspended');
    setCurrentPage(1);
    setAlertMessage({ type: 'info', text: 'Filtered to Suspended members for review.' });
  };

  const exportCsv = () => {
    const rows = activeTab === 'lectors' ? filteredMembers : filteredParishes;
    if (!rows.length) {
      setAlertMessage({ type: 'error', text: 'There is no data to export.' });
      return;
    }

    const keys = activeTab === 'lectors'
      ? ['firstName', 'lastName', 'phone', 'parishName', 'roleInParish', 'status']
      : ['name', 'zone', 'lectorCount'];

    const csvRows = [keys.join(',')];
    rows.forEach(row => {
      const values = keys.map(key => {
        const val = row[key];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeTab === 'lectors' ? 'lector-roster.csv' : 'parish-directory.csv';
    link.click();
    URL.revokeObjectURL(url);
    setAlertMessage({ type: 'success', text: 'CSV export generated successfully.' });
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

  const summaryStats = useMemo(() => {
    const totalLectors = totalMembersCount ?? members.length;
    const activeLectors = members.filter(member => (member.status || 'Active') === 'Active').length;
    const suspendedLectors = totalLectors - activeLectors;
    const totalParishes = parishes.length;
    const activeParishes = parishes.filter(parish => (parish.lectorCount || 0) > 0).length;

    return {
      totalLectors,
      activeLectors,
      suspendedLectors,
      totalParishes,
      activeParishes
    };
  }, [members, parishes, totalMembersCount]);

  const parishOptions = useMemo(() => {
    const selected = new Set();
    members.forEach(member => {
      const parishName = member.parish?.name || member.parishName || '';
      if (parishName) selected.add(parishName);
    });
    return Array.from(selected).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const roleOptions = useMemo(() => {
    const selected = new Set();
    members.forEach(member => {
      const role = member.roleInParish || 'Active Member';
      selected.add(role);
    });
    return Array.from(selected).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filteredMembers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let list = [...members];

    if (search) {
      list = list.filter(member => {
        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
        const parishName = (member.parish?.name || member.parishName || '').toLowerCase();
        return fullName.includes(search) || parishName.includes(search) || (member.phone || '').includes(search);
      });
    }

    if (parishFilter !== 'all') {
      list = list.filter(member => (member.parish?.name || member.parishName) === parishFilter);
    }

    if (roleFilter !== 'all') {
      list = list.filter(member => (member.roleInParish || 'Active Member') === roleFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter(member => (member.status || 'Active') === statusFilter);
    }

    switch (sortBy) {
      case 'parish':
        list.sort((a, b) => (a.parish?.name || a.parishName || '').localeCompare(b.parish?.name || b.parishName || ''));
        break;
      case 'status':
        list.sort((a, b) => ((b.status || 'Active') === 'Active' ? 1 : 0) - ((a.status || 'Active') === 'Active' ? 1 : 0));
        break;
      case 'recent':
        list.sort((a, b) => (Number(b.yearCommissioned || 0) || 0) - (Number(a.yearCommissioned || 0) || 0));
        break;
      case 'lastName':
        list.sort((a, b) => `${a.lastName || ''}`.localeCompare(`${b.lastName || ''}`));
        break;
      case 'name':
      default:
        list.sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));
        break;
    }

    return list;
  }, [members, searchQuery, parishFilter, roleFilter, statusFilter, sortBy]);

  const filteredParishes = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let list = [...parishes];

    if (search) {
      list = list.filter(parish => parish.name.toLowerCase().includes(search));
    }

    switch (sortBy) {
      case 'parish':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'members':
        list.sort((a, b) => (b.lectorCount || 0) - (a.lectorCount || 0));
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [parishes, searchQuery, sortBy]);

  const zoneStats = useMemo(() => {
    const counts = {};
    parishes.forEach(parish => {
      const zone = parish.zone || 'Unassigned';
      counts[zone] = (counts[zone] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
  }, [parishes]);

  const leadershipStats = useMemo(() => {
    const counts = {
      'Parish President': 0,
      'Parish Vice President': 0,
      'Parish Secretary': 0,
      'Parish Executive': 0
    };

    members.forEach(member => {
      const role = member.roleInParish || 'Active Member';
      if (counts[role] !== undefined) {
        counts[role] += 1;
      }
    });

    return Object.entries(counts).filter(([, count]) => count > 0);
  }, [members]);

  const selectedRowsData = useMemo(() => {
    if (activeTab === 'lectors') {
      return members.filter(member => selectedRows.includes(member._id));
    }
    return parishes.filter(parish => selectedRows.includes(parish._id));
  }, [activeTab, members, parishes, selectedRows]);

  const pageSize = 10;
  const pages = activeTab === 'lectors' ? Math.max(1, Math.ceil(filteredMembers.length / pageSize)) : Math.max(1, Math.ceil(filteredParishes.length / pageSize));
  const displayRows = activeTab === 'lectors'
    ? filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredParishes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCompactPageItems = (page, totalPages) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const visible = new Set([1, totalPages, page, page - 1, page + 1, page - 2, page + 2]);
    const ordered = [...visible]
      .filter(value => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);

    const result = [];
    for (let i = 0; i < ordered.length; i += 1) {
      const value = ordered[i];
      const previous = ordered[i - 1];
      if (previous !== undefined && value - previous > 1) {
        result.push('ellipsis');
      }
      result.push(value);
    }

    return result;
  };

  const compactPageItems = useMemo(() => getCompactPageItems(currentPage, pages), [currentPage, pages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, parishFilter, roleFilter, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-sm text-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-indigo-200 font-semibold">Registry command center</p>
              <h1 className="mt-2 text-3xl font-extrabold text-white">Unified Registry Hub</h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm">
                One source of truth for all parishes and lectors. Add, edit, transfer, and archive records from a single centralized interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="rounded-full bg-white/10 text-indigo-100 border border-white/10 px-4 py-2 font-semibold backdrop-blur-sm">{payload?.role || 'Guest'}</span>
              <button onClick={() => setActiveTab('lectors')} className={`px-4 py-2 rounded-2xl ${activeTab === 'lectors' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'}`}>Lector Roster</button>
              <button onClick={() => setActiveTab('parishes')} className={`px-4 py-2 rounded-2xl ${activeTab === 'parishes' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'}`}>Parish Directory</button>
            </div>
          </div>
        </div>

        {alertMessage && (
          <div className={`rounded-2xl p-4 mb-5 ${alertMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
            {alertMessage.text}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Total Lectors</p>
              <span className="rounded-full bg-indigo-100 p-2 text-indigo-700">●</span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900">{summaryStats.totalLectors}</p>
            <p className="mt-1 text-[11px] text-slate-500">{totalMembersCount ? `${totalMembersCount.toLocaleString()} registered` : 'Visible in current roster'}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Active Lectors</p>
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">●</span>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-700">{summaryStats.activeLectors}</p>
            <p className="mt-1 text-[11px] text-emerald-700/80">Currently active</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Suspended</p>
              <span className="rounded-full bg-amber-100 p-2 text-amber-700">●</span>
            </div>
            <p className="mt-3 text-3xl font-black text-amber-700">{summaryStats.suspendedLectors}</p>
            <p className="mt-1 text-[11px] text-amber-700/80">Needs review</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Parishes</p>
              <span className="rounded-full bg-indigo-100 p-2 text-indigo-700">●</span>
            </div>
            <p className="mt-3 text-3xl font-black text-indigo-700">{summaryStats.totalParishes}</p>
            <p className="mt-1 text-[11px] text-indigo-700/80">{summaryStats.activeParishes} active parish entries</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{activeTab === 'lectors' ? 'Lector Roster' : 'Master Parish Directory'}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeTab === 'lectors'
                      ? `Showing ${displayRows.length} of ${totalMembersCount ?? summaryStats.totalLectors} lectors`
                      : `Showing ${filteredParishes.length} of ${summaryStats.totalParishes} parishes`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={exportCsv} className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-200">Export CSV</button>
                  {canEditRegistry ? (
                    activeTab === 'lectors' ? (
                      <button onClick={() => openLectorDrawer()} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold">Add New Lector</button>
                    ) : (
                      <button onClick={() => openParishDrawer()} className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-xs font-semibold">Add New Parish</button>
                    )
                  ) : (
                    <span className="rounded-2xl bg-slate-100 text-slate-500 px-4 py-2 text-xs font-semibold">View Only Access</span>
                  )}
                </div>
              </div>

              {activeTab === 'lectors' && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: 'all', tone: 'bg-slate-900 text-white' },
                    { label: `Active (${summaryStats.activeLectors})`, value: 'Active', tone: 'bg-emerald-100 text-emerald-700' },
                    { label: `Suspended (${summaryStats.suspendedLectors})`, value: 'Suspended', tone: 'bg-amber-100 text-amber-700' }
                  ].map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setStatusFilter(chip.value)}
                      className={`rounded-full px-3 py-2 text-[11px] font-semibold transition-all ${statusFilter === chip.value ? chip.tone : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'lectors' ? 'Search by member name or parish...' : 'Search parishes...'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none"
                />

                {activeTab === 'lectors' && (
                  <select value={parishFilter} onChange={(e) => setParishFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                    <option value="all">All Parishes</option>
                    {parishOptions.map(parish => (
                      <option key={parish} value={parish}>{parish}</option>
                    ))}
                  </select>
                )}

                {activeTab === 'lectors' && (
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                    <option value="all">All Roles</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                )}

                {activeTab === 'lectors' && (
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                )}

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                  <option value="name">Sort: Name</option>
                  <option value="parish">Sort: Parish</option>
                  <option value="lastName">Sort: Last Name</option>
                  <option value="recent">Sort: Recent</option>
                  <option value="status">Sort: Status</option>
                  {activeTab === 'parishes' && <option value="members">Sort: Members</option>}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{selectedRows.length} selected</span>
                  <span className="text-slate-400">|</span>
                  <span>{activeTab === 'lectors' ? `${selectedRowsData.length} lectors` : `${selectedRowsData.length} parishes`}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Clear selection
                  </button>
                  <button
                    type="button"
                    onClick={exportSelectedCsv}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Export selected
                  </button>
                    {activeTab === 'lectors' && canEditRegistry && (
                      <>
                        <button
                          type="button"
                          onClick={viewSuspended}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          View Suspended
                        </button>
                        <button
                          type="button"
                          onClick={selectSuspendedInView}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Select Suspended
                        </button>
                        <button
                          type="button"
                          onClick={bulkUnsuspendSelected}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Bulk Unsuspend Selected
                        </button>
                        <button
                          type="button"
                          onClick={unsuspendAllSuspended}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-rose-700"
                        >
                          Unsuspend All Suspended
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>

            {activeTab === 'lectors' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-[0.2em]">
                      <tr>
                        <th className="px-4 py-4 w-12">
                          <input type="checkbox" checked={filteredMembers.length > 0 && filteredMembers.every(member => selectedRows.includes(member._id))} onChange={() => {
                            if (filteredMembers.every(member => selectedRows.includes(member._id))) {
                              setSelectedRows(prev => prev.filter(id => !filteredMembers.some(member => member._id === id)));
                            } else {
                              setSelectedRows(prev => Array.from(new Set([...prev, ...filteredMembers.map(member => member._id)])));
                            }
                          }} className="h-4 w-4 rounded border-slate-300" />
                        </th>
                        <th className="px-4 py-4">Member</th>
                        <th className="px-4 py-4">Parish</th>
                        <th className="px-4 py-4">Role</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map(member => (
                        <tr key={member._id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <input type="checkbox" checked={selectedRows.includes(member._id)} onChange={() => toggleRowSelection(member._id)} className="h-4 w-4 rounded border-slate-300" />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {(member.firstName || 'A').charAt(0).toUpperCase()}{(member.lastName || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{member.firstName} {member.lastName}</strong>
                                <div className="text-[11px] text-slate-500">{member.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {(member.parish && member.parish.name) || member.parishName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">
                              {member.roleInParish || 'Active Member'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${((member.status || 'Active') === 'Active') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {member.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-4 relative">
                            {canEditRegistry ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openLectorDrawer(member)} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Edit</button>
                                <div className="relative">
                                  <button onClick={() => setMenuOpenId(menuOpenId === member._id ? null : member._id)} className="rounded-2xl bg-slate-100 px-2.5 py-2 text-slate-700 hover:bg-slate-200">⋮</button>
                                  {menuOpenId === member._id && (
                                    <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
                                      <button onClick={() => { openLectorDrawer(member); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Edit Details</button>
                                      <button onClick={() => { setAlertMessage({ type: 'success', text: `${member.firstName} ${member.lastName} has been marked for parish transfer.` }); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Transfer Parish</button>
                                      <button onClick={() => { handleDeleteMember(member._id); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">Archive</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Read only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!filteredMembers.length && (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No members found for the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">Showing {displayRows.length} of {totalMembersCount ?? filteredMembers.length} records</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Prev</button>
                    {compactPageItems.map((pageItem, index) => {
                      if (pageItem === 'ellipsis') {
                        return <span key={`ellipsis-${index}`} className="px-2 text-[11px] text-slate-400">...</span>;
                      }

                      return (
                        <button
                          key={pageItem}
                          onClick={() => setCurrentPage(pageItem)}
                          className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${currentPage === pageItem ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {pageItem}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))} disabled={currentPage === pages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Next</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-[0.2em] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-4 w-12">
                          <input type="checkbox" checked={filteredParishes.length > 0 && filteredParishes.every(parish => selectedRows.includes(parish._id))} onChange={() => {
                            if (filteredParishes.every(parish => selectedRows.includes(parish._id))) {
                              setSelectedRows(prev => prev.filter(id => !filteredParishes.some(parish => parish._id === id)));
                            } else {
                              setSelectedRows(prev => Array.from(new Set([...prev, ...filteredParishes.map(parish => parish._id)])));
                            }
                          }} className="h-4 w-4 rounded border-slate-300" />
                        </th>
                        <th className="px-4 py-4">Parish</th>
                        <th className="px-4 py-4">Zone</th>
                        <th className="px-4 py-4">Active Members</th>
                        <th className="px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map(parish => {
                        const memberCount = parish.lectorCount || 0;
                        return (
                          <tr key={parish._id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-4">
                              <input type="checkbox" checked={selectedRows.includes(parish._id)} onChange={() => toggleRowSelection(parish._id)} className="h-4 w-4 rounded border-slate-300" />
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{parish.name}</td>
                            <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">{parish.zone}</span></td>
                            <td className="px-4 py-4"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{memberCount}</span></td>
                            <td className="px-4 py-4 relative">
                              {canEditRegistry ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => { setEditingParish(parish); setSelectedParishId(parish._id); handleSelectParish(parish._id); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
                                  <div className="relative">
                                    <button onClick={() => setMenuOpenId(menuOpenId === parish._id ? null : parish._id)} className="rounded-2xl bg-slate-100 px-2.5 py-2 text-slate-700 hover:bg-slate-200">⋮</button>
                                    {menuOpenId === parish._id && (
                                      <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
                                        <button onClick={() => { openParishDrawer(parish); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Edit Parish</button>
                                        <button onClick={() => { setAlertMessage({ type: 'success', text: `${parish.name} summary opened.` }); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Open Summary</button>
                                        <button onClick={() => { handleDeleteParish(parish._id); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">Remove</button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end">
                                  <button onClick={() => { setEditingParish(parish); setSelectedParishId(parish._id); handleSelectParish(parish._id); }} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
                                </div>
                              )}
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
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">Showing {displayRows.length} of {filteredParishes.length} records</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Prev</button>
                    {compactPageItems.map((pageItem, index) => {
                      if (pageItem === 'ellipsis') {
                        return <span key={`ellipsis-${index}`} className="px-2 text-[11px] text-slate-400">...</span>;
                      }

                      return (
                        <button
                          key={pageItem}
                          onClick={() => setCurrentPage(pageItem)}
                          className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${currentPage === pageItem ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {pageItem}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))} disabled={currentPage === pages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {activeTab === 'lectors' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-slate-900">Operational snapshot</h2>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">Live</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {zoneStats.map(({ zone, count }) => (
                      <div key={zone} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{zone}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{count} parishes</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{Math.round((count / Math.max(parishes.length, 1)) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-5 text-white shadow-lg">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Leadership coverage</p>
                  <div className="mt-4 space-y-3">
                    {leadershipStats.length ? leadershipStats.map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                        <span className="text-sm text-indigo-50">{role}</span>
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">{count}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-indigo-100">No leadership roles assigned yet.</p>
                    )}
                  </div>
                </div>
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

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl border-l border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Registry action</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{drawerType === 'lector' ? (editingMember ? 'Edit Lector' : 'Add New Lector') : (editingParish && editingParish._id ? 'Edit Parish' : 'Add New Parish')}</h2>
              </div>
              <button onClick={closeDrawer} className="rounded-full bg-slate-100 px-3 py-2 text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            {drawerType === 'lector' ? (
              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
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
                <div>
                  <label className="text-slate-500 block mb-1">Role in Parish</label>
                  <select value={formState.roleInParish} onChange={e => setFormState(prev => ({ ...prev, roleInParish: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <option value="Active Member">Active Member</option>
                    <option value="Parish President">Parish President</option>
                    <option value="Parish Vice President">Parish Vice President</option>
                    <option value="Parish Secretary">Parish Secretary</option>
                    <option value="Parish Executive">Parish Executive</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Gender</label>
                  <select value={formState.gender} onChange={e => setFormState(prev => ({ ...prev, gender: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Year Commissioned</label>
                  <input type="number" value={formState.yearCommissioned} onChange={e => setFormState(prev => ({ ...prev, yearCommissioned: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeDrawer} className="flex-1 rounded-2xl bg-slate-100 text-slate-700 py-3 font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-indigo-600 text-white py-3 font-semibold">Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={editingParish && editingParish._id ? handleUpdateParish : handleCreateParish} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1">Parish Name</label>
                  <input type="text" value={editingParish && editingParish._id ? editingParishName : newParishName} onChange={e => (editingParish && editingParish._id) ? setEditingParishName(e.target.value) : setNewParishName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Zone</label>
                  <select value={editingParish && editingParish._id ? editingParishZone : newParishZone} onChange={e => { if (editingParish && editingParish._id) setEditingParishZone(e.target.value); else setNewParishZone(e.target.value); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <option value="Benin">Benin</option>
                    <option value="Abudu">Abudu</option>
                    <option value="Iguobazuwa">Iguobazuwa</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeDrawer} className="flex-1 rounded-2xl bg-slate-100 text-slate-700 py-3 font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-indigo-600 text-white py-3 font-semibold">{editingParish && editingParish._id ? 'Save Changes' : 'Add Parish'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
