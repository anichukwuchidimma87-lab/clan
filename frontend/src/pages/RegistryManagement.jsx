import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ParishHealthRing from '../components/ParishHealthRing';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { compareLectorsByRole, formatDateOfBirth } from '../../../shared/registryTools.js';

export default function RegistryManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const initialSort = searchParams.get('sort');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'parishes' ? 'parishes' : 'lectors');
  const [members, setMembers] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'Male',
    ageBracket: '21–30',
    dateOfBirth: '',
    publicBirthdayConsent: false,
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
  const [confirmationDialog, setConfirmationDialog] = useState(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [isSavingRegistry, setIsSavingRegistry] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [parishFilter, setParishFilter] = useState(searchParams.get('parish') || 'all');
  const [parishStatusFilter, setParishStatusFilter] = useState(['all', 'active', 'inactive'].includes(searchParams.get('parishStatus')) ? searchParams.get('parishStatus') : 'all');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState(['all', 'Active', 'Suspended'].includes(searchParams.get('status')) ? searchParams.get('status') : 'all');
  const [sortBy, setSortBy] = useState(['name', 'parish', 'lastName', 'recent', 'status', 'role', 'members', 'inactive'].includes(initialSort) ? initialSort : 'name');
  const [parishReviewOpen, setParishReviewOpen] = useState(false);
  const [parishReviewTarget, setParishReviewTarget] = useState(null);
  const [deaneryTargets, setDeaneryTargets] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('lector');
  const [selectedRows, setSelectedRows] = useState([]);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1);
  const [totalMembersCount, setTotalMembersCount] = useState(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const confirmationInProgressRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const registryFilterSignature = JSON.stringify([activeTab, searchQuery, parishFilter, parishStatusFilter, roleFilter, statusFilter, sortBy]);
  const previousRegistryFilterSignature = useRef(registryFilterSignature);

  const token = localStorage.getItem('clan_token');
  const parseJwt = (value) => {
    try { return JSON.parse(atob(value.split('.')[1])); } catch { return null; }
  };
  const payload = token ? parseJwt(token) : null;
  const userRole = payload?.role === 'admin' ? 'executive' : (payload?.role || 'member');
  const isPresident = userRole === 'president';
  const canEditRegistry = ['superadmin', 'executive'].includes(userRole) || (userRole === 'president' && Boolean(payload?.permissions?.update));
  const canExportRegistry = ['superadmin', 'executive'].includes(userRole) || (userRole === 'president' && Boolean(payload?.permissions?.export));
  const canAddRegistry = ['superadmin', 'executive'].includes(userRole) || (userRole === 'president' && Boolean(payload?.permissions?.add));
  const canSuspendRegistry = ['superadmin', 'executive'].includes(userRole) || (userRole === 'president' && Boolean(payload?.permissions?.suspend));
  const canDeleteRegistry = ['superadmin', 'executive'].includes(userRole) || (userRole === 'president' && Boolean(payload?.permissions?.delete));

  useEffect(() => {
    if (!alertMessage) return undefined;
    const timeoutId = window.setTimeout(() => setAlertMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [alertMessage]);

  const registrySearch = useMemo(() => {
    const nextParams = new URLSearchParams();
    if (activeTab !== 'lectors') nextParams.set('tab', activeTab);
    if (searchQuery) nextParams.set('q', searchQuery);
    if (parishFilter !== 'all') nextParams.set('parish', parishFilter);
    if (parishStatusFilter !== 'all') nextParams.set('parishStatus', parishStatusFilter);
    if (roleFilter !== 'all') nextParams.set('role', roleFilter);
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);
    if (sortBy !== 'name') nextParams.set('sort', sortBy);
    if (currentPage > 1) nextParams.set('page', String(currentPage));
    return nextParams.toString();
  }, [activeTab, searchQuery, parishFilter, parishStatusFilter, roleFilter, statusFilter, sortBy, currentPage]);

  useEffect(() => {
    setSearchParams(new URLSearchParams(registrySearch), { replace: true });
  }, [registrySearch, setSearchParams]);

  const registryUrl = (path) => `${path}${registrySearch ? `?${registrySearch}` : ''}`;

  const openConfirmation = (dialog) => {
    if (confirmationInProgressRef.current) return;
    setConfirmationText('');
    setConfirmationDialog(dialog);
  };

  const closeConfirmation = () => {
    if (confirmationInProgressRef.current) return;
    setConfirmationDialog(null);
    setConfirmationText('');
  };

  const confirmPendingAction = async () => {
    if (!confirmationDialog || confirmationInProgressRef.current) return;
    if (confirmationDialog.requiredText && confirmationText !== confirmationDialog.requiredText) return;

    confirmationInProgressRef.current = true;
    setIsConfirmingAction(true);
    try {
      await confirmationDialog.action();
      setConfirmationDialog(null);
      setConfirmationText('');
    } catch (error) {
      console.error('Confirmed registry action failed:', error);
      setAlertMessage({ type: 'error', text: 'The action could not be completed. Please try again.' });
    } finally {
      confirmationInProgressRef.current = false;
      setIsConfirmingAction(false);
    }
  };

  const handleUpdateParish = async (e) => {
    e.preventDefault();
    if (saveInProgressRef.current) return;
    if (!editingParish || !editingParish._id) {
      setAlertMessage({ type: 'error', text: 'No parish selected for update.' });
      return;
    }
    if (!editingParishName.trim()) {
      setAlertMessage({ type: 'error', text: 'Parish name cannot be empty.' });
      return;
    }

    saveInProgressRef.current = true;
    setIsSavingRegistry(true);
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
    } finally {
      saveInProgressRef.current = false;
      setIsSavingRegistry(false);
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
      const [membersRes, parishesRes, birthdaysRes] = await Promise.all([
        fetch(`https://clan-3slh.onrender.com/api/lectors/registry?limit=1000&page=1&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusParam)}`, { headers: { Authorization: `Bearer ${token}` } }),
        isPresident
          ? Promise.resolve(null)
          : fetch('https://clan-3slh.onrender.com/api/v1/parishes/with-counts', { headers }),
        fetch('https://clan-3slh.onrender.com/api/lectors/birthdays?days=30', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const membersJson = await membersRes.json();
      const parishesJson = parishesRes ? await parishesRes.json() : null;
      const birthdaysJson = await birthdaysRes.json();
      if (birthdaysJson.success) setUpcomingBirthdays(birthdaysJson.data || []);

      if (!membersRes.ok || !membersJson.success) {
        throw new Error(membersJson.message || 'Unable to load the parish roster.');
      }

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
          setPage(membersJson.page || 1);
          setTotalPages(membersJson.totalPages || 1);
        }
      }

      if (parishesJson?.success) {
        // backend now returns lectorCount on each parish
        setParishes(parishesJson.data.map(p => ({ ...p, lectorCount: p.lectorCount || 0 })));
        // fetch deanery-level targets
        try {
          const tRes = await fetch('https://clan-3slh.onrender.com/api/v1/deaneries', { headers });
          const tJson = await tRes.json();
          if (tJson.success) setDeaneryTargets(tJson.data || {});
        } catch (e) {
          // ignore
        }
        if (!formState.parishId && parishesJson.data.length > 0) {
          setFormState(prev => ({ ...prev, parishId: parishesJson.data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Registry fetch failed:', error);
      setAlertMessage({ type: 'error', text: error.message || 'Unable to load the parish roster.' });
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
    if (saveInProgressRef.current) return;
    const editing = Boolean(editingMember?._id);
    if (!formState.firstName || !formState.lastName || (!editing && !formState.parishId)) {
      setAlertMessage({ type: 'error', text: 'Please fill all required member fields.' });
      return;
    }

    saveInProgressRef.current = true;
    setIsSavingRegistry(true);
    try {
      const body = {
        ...formState,
        deanery: 'Benin'
      };
      if (!editing || !isPresident) body.parishId = formState.parishId;
      else {
        delete body.parishId;
        delete body.deanery;
      }
      if (editing && !editingMember.dateOfBirth && !formState.dateOfBirth) {
        delete body.dateOfBirth;
      }
      const res = await fetch(editing
        ? `https://clan-3slh.onrender.com/api/lectors/update/${editingMember._id}`
        : 'https://clan-3slh.onrender.com/api/lectors/registry', {
        method: editing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: 'success', text: editing ? 'Lector record updated.' : 'Lector added to the unified registry.' });
        setFormState({
          firstName: '',
          lastName: '',
          phone: '',
          gender: 'Male',
          ageBracket: '21–30',
          dateOfBirth: '',
          publicBirthdayConsent: false,
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
    } finally {
      saveInProgressRef.current = false;
      setIsSavingRegistry(false);
    }
  };

  const handleCreateParish = async (e) => {
    e.preventDefault();
    if (saveInProgressRef.current) return;
    if (!newParishName.trim()) {
      setAlertMessage({ type: 'error', text: 'Parish name is required.' });
      return;
    }

    saveInProgressRef.current = true;
    setIsSavingRegistry(true);
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
    } finally {
      saveInProgressRef.current = false;
      setIsSavingRegistry(false);
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

  const handleDeleteParish = (id) => {
    const parishName = parishes.find(parish => parish._id === id)?.name || 'this parish';
    openConfirmation({
      title: 'Remove parish?',
      message: `Remove ${parishName} from the master registry? This is only allowed when it has no assigned members.`,
      confirmLabel: 'Remove parish',
      action: async () => {
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
      }
    });
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
        dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : '',
        publicBirthdayConsent: member.publicBirthdayConsent === true,
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
        dateOfBirth: '',
        publicBirthdayConsent: false,
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

  const bulkUnsuspendSelected = () => {
    if (!selectedRows.length) {
      setAlertMessage({ type: 'error', text: 'Select at least one suspended member to unsuspend.' });
      return;
    }

    const selectedIds = [...selectedRows];
    openConfirmation({
      title: `Unsuspend ${selectedIds.length} selected member${selectedIds.length === 1 ? '' : 's'}?`,
      message: 'Their registry status will be changed to Active.',
      confirmLabel: 'Unsuspend members',
      action: async () => {
        try {
          const res = await fetch('https://clan-3slh.onrender.com/api/lectors/bulk-unsuspend', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
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
      }
    });
  };

  const unsuspendAllSuspended = () => {
    openConfirmation({
      title: 'Unsuspend all records?',
      message: 'Every suspended lector will be set to Active. This affects the entire registry and cannot be undone.',
      confirmLabel: 'Unsuspend all',
      requiredText: 'UNSUSPEND',
      action: async () => {
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
      }
    });
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

  const exportInactiveParishesCsv = () => {
    const rows = parishes.filter(p => (p.lectorCount || 0) === 0);
    if (!rows.length) {
      setAlertMessage({ type: 'error', text: 'No inactive parishes to export.' });
      return;
    }

    const keys = ['name', 'zone'];
    const csvRows = [keys.join(',')];
    rows.forEach(row => {
      const values = keys.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inactive-parishes.csv';
    link.click();
    URL.revokeObjectURL(url);
    setAlertMessage({ type: 'success', text: `Exported ${rows.length} inactive parish(es).` });
  };

  const exportFullInactiveReport = async () => {
    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/v1/parishes/inactive-report?download=csv', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setAlertMessage({ type: 'error', text: 'Failed to generate full inactive report.' });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inactive-parishes-full-report.csv';
      link.click();
      URL.revokeObjectURL(url);
      setAlertMessage({ type: 'success', text: 'Full inactive report downloaded.' });
    } catch (error) {
      console.error('Export full inactive failed', error);
      setAlertMessage({ type: 'error', text: 'Network error while exporting full report.' });
    }
  };

  const openParishReview = (parish) => {
    setParishReviewTarget(parish);
    setParishReviewOpen(true);
    setSelectedParishId(parish._id);
    handleSelectParish(parish._id);
  };

  const closeParishReview = () => {
    setParishReviewOpen(false);
    setParishReviewTarget(null);
    setParishMembers([]);
  };

  const addMemberToParish = (parish) => {
    setFormState(prev => ({ ...prev, parishId: parish._id }));
    openLectorDrawer();
  };

  const saveDeaneryTarget = async (deanery, value) => {
    try {
      const res = await fetch('https://clan-3slh.onrender.com/api/v1/deaneries', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ deanery, healthTarget: Number(value) })
      });
      const json = await res.json();
      if (json.success) {
        setDeaneryTargets(prev => ({ ...prev, [deanery]: json.data.healthTarget }));
        setAlertMessage({ type: 'success', text: `Saved target for ${deanery}.` });
      } else {
        setAlertMessage({ type: 'error', text: json.message || 'Failed to save target.' });
      }
    } catch (err) {
      console.error('Save target failed', err);
      setAlertMessage({ type: 'error', text: 'Network error while saving target.' });
    }
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

  const exportExcel = () => {
    const rows = activeTab === 'lectors' ? filteredMembers : filteredParishes;
    if (!rows.length) {
      setAlertMessage({ type: 'error', text: 'There is no data to export.' });
      return;
    }
    const data = activeTab === 'lectors'
      ? rows.map(row => ({
          Name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          Parish: row.parishName || row.parish?.name || '',
          Phone: row.phone || '',
          Gender: row.gender || '',
          'Date of Birth': row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '',
          Role: row.roleInParish || '',
          Status: row.status || 'Active'
        }))
      : rows.map(row => ({
          Parish: row.name || '',
          Deanery: row.zone || 'Benin',
          'Lector Count': row.lectorCount || 0
        }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'lectors' ? 'Lectors' : 'Parishes');
    XLSX.writeFile(workbook, activeTab === 'lectors' ? 'lector-roster.xlsx' : 'parish-directory.xlsx');
    setAlertMessage({ type: 'success', text: 'Excel export generated successfully.' });
  };

  const exportPdf = () => {
    const rows = activeTab === 'lectors' ? filteredMembers : filteredParishes;
    if (!rows.length) {
      setAlertMessage({ type: 'error', text: 'There is no data to export.' });
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text(activeTab === 'lectors' ? 'Benin City Deanery - Lector Roster' : 'Benin City Deanery - Parish Directory', 40, 40);
    doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 58);

    if (activeTab === 'lectors') {
      autoTable(doc, {
        startY: 74,
        head: [['Name', 'Parish', 'Phone', 'Gender', 'Date of Birth', 'Role', 'Status']],
        body: rows.map(row => [
          `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          row.parishName || row.parish?.name || '',
          row.phone || '',
          row.gender || '',
          row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '',
          row.roleInParish || '',
          row.status || 'Active'
        ]),
        styles: { fontSize: 8 }
      });
    } else {
      autoTable(doc, {
        startY: 74,
        head: [['Parish', 'Deanery', 'Lector Count']],
        body: rows.map(row => [row.name || '', row.zone || 'Benin', String(row.lectorCount || 0)]),
        styles: { fontSize: 9 }
      });
    }
    doc.save(activeTab === 'lectors' ? 'lector-roster.pdf' : 'parish-directory.pdf');
    setAlertMessage({ type: 'success', text: 'PDF export generated successfully.' });
  };

  const handleDeleteMember = (id) => {
    const member = members.find(item => item._id === id);
    const memberName = member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'this member';
    openConfirmation({
      title: 'Archive lector?',
      message: `Remove ${memberName} from the registry? This action cannot be undone.`,
      confirmLabel: 'Archive lector',
      action: async () => {
        try {
          const res = await fetch(`https://clan-3slh.onrender.com/api/lectors/delete/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setAlertMessage({ type: 'success', text: 'Member removed from registry.' });
            fetchData();
          } else {
            const data = await res.json();
            setAlertMessage({ type: 'error', text: data.message || 'Failed to delete member.' });
          }
        } catch (error) {
          setAlertMessage({ type: 'error', text: 'Failed to delete member.' });
          console.error(error);
        }
      }
    });
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
      case 'role':
        list.sort(compareLectorsByRole);
        break;
      case 'name':
      default:
        list.sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));
        break;
    }

    return list;
  }, [members, searchQuery, parishFilter, roleFilter, statusFilter, sortBy]);

  const parishSummaryStats = useMemo(() => {
    const totalParishes = parishes.length;
    const activeParishes = parishes.filter(parish => (parish.lectorCount || 0) > 0).length;
    const inactiveParishes = totalParishes - activeParishes;
    const coverage = totalParishes ? Math.round((activeParishes / totalParishes) * 100) : 0;

    return {
      totalParishes,
      activeParishes,
      inactiveParishes,
      coverage
    };
  }, [parishes]);

  const parishPerformanceStats = useMemo(() => {
    return [...parishes]
      .map(parish => ({
        ...parish,
        memberCount: parish.lectorCount || 0
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 5);
  }, [parishes]);

  const inactiveParishQueue = useMemo(() => {
    return [...parishes]
      .filter(parish => (parish.lectorCount || 0) === 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [parishes]);

  const filteredParishes = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let list = [...parishes];

    if (search) {
      list = list.filter(parish => parish.name.toLowerCase().includes(search));
    }

    if (parishStatusFilter !== 'all') {
      list = list.filter(parish => {
        const isActive = (parish.lectorCount || 0) > 0;
        return parishStatusFilter === 'active' ? isActive : !isActive;
      });
    }

    switch (sortBy) {
      case 'parish':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'members':
        list.sort((a, b) => (b.lectorCount || 0) - (a.lectorCount || 0));
        break;
      case 'inactive':
        list.sort((a, b) => ((b.lectorCount || 0) > 0 ? 1 : 0) - ((a.lectorCount || 0) > 0 ? 1 : 0));
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [parishes, searchQuery, sortBy, parishStatusFilter]);

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

  const pageNumbers = useMemo(() => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, index) => index + 1);
    }

    const windowSize = 5;
    const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(pages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);

    const result = [];
    if (adjustedStart > 1) {
      result.push(1, '...');
    }

    for (let pageNum = adjustedStart; pageNum <= end; pageNum += 1) {
      result.push(pageNum);
    }

    if (end < pages) {
      result.push('...', pages);
    }

    return result;
  }, [currentPage, pages]);

  useEffect(() => {
    if (previousRegistryFilterSignature.current !== registryFilterSignature) {
      previousRegistryFilterSignature.current = registryFilterSignature;
      setCurrentPage(1);
    }
  }, [registryFilterSignature]);

  useEffect(() => {
    if (!loading && currentPage > pages) setCurrentPage(pages);
  }, [currentPage, loading, pages]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 text-sm text-slate-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-indigo-200 font-semibold">{isPresident ? 'Parish roster' : 'Registry command center'}</p>
              <h1 className="mt-2 text-3xl font-extrabold text-white">{isPresident ? `${payload?.parish || 'My Parish'} Lector Roster` : 'Unified Registry Hub'}</h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm">
                {isPresident
                  ? 'View and manage lector records for your assigned parish according to the permissions granted to your account.'
                  : 'One source of truth for all parishes and lectors. Add, edit, transfer, and archive records from a single centralized interface.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="rounded-full bg-white/10 text-indigo-100 border border-white/10 px-4 py-2 font-semibold backdrop-blur-sm">{payload?.role || 'Guest'}</span>
              <button onClick={() => setActiveTab('lectors')} className={`px-4 py-2 rounded-2xl ${activeTab === 'lectors' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'}`}>Lector Roster</button>
              {!isPresident && <button onClick={() => setActiveTab('parishes')} className={`px-4 py-2 rounded-2xl ${activeTab === 'parishes' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'}`}>Parish Directory</button>}
              {['superadmin', 'executive'].includes(userRole) && (
                <button onClick={() => window.location.href = '/admin/audit'} className="px-3 py-2 rounded-2xl bg-white/10 text-white/80 border border-white/10">Audit Logs</button>
              )}
            </div>
          </div>
        </div>

        {alertMessage && (
          <div
            role={alertMessage.type === 'error' ? 'alert' : 'status'}
            aria-live={alertMessage.type === 'error' ? 'assertive' : 'polite'}
            className={`fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-2xl border p-4 shadow-xl ${
              alertMessage.type === 'success'
                ? 'border-emerald-200 bg-white text-emerald-800'
                : alertMessage.type === 'info'
                  ? 'border-indigo-200 bg-white text-indigo-800'
                  : 'border-rose-200 bg-white text-rose-800'
            }`}
          >
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              alertMessage.type === 'success' ? 'bg-emerald-500' : alertMessage.type === 'info' ? 'bg-indigo-500' : 'bg-rose-500'
            }`} aria-hidden="true" />
            <p className="flex-1 text-sm font-medium">{alertMessage.text}</p>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
              aria-label="Dismiss notification"
              className="rounded-lg px-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              &times;
            </button>
          </div>
        )}

        {upcomingBirthdays.length > 0 && (
          <div className="mb-6 rounded-3xl border border-pink-100 bg-pink-50 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-600">Upcoming birthdays</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {upcomingBirthdays.slice(0, 8).map((birthday, index) => (
                <span key={`${birthday.name}-${index}`} className="rounded-full border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-pink-700">
                  {birthday.name} - {birthday.month}/{birthday.day} ({birthday.daysUntil === 0 ? 'today' : `${birthday.daysUntil} days`})
                </span>
              ))}
            </div>
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
                      : `Showing ${filteredParishes.length} of ${parishSummaryStats.totalParishes} parishes`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canExportRegistry && (
                    <>
                      <button onClick={exportPdf} className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-200">Export PDF</button>
                      <button onClick={exportExcel} className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-200">Export Excel</button>
                      <button onClick={exportCsv} className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-200">Export CSV</button>
                      <button onClick={() => window.print()} className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-200">Print</button>
                    </>
                  )}
                  {(activeTab === 'lectors' ? canAddRegistry : ['superadmin', 'executive'].includes(userRole)) ? (
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

              {activeTab === 'parishes' && (
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total parishes</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{parishSummaryStats.totalParishes}</p>
                    <p className="mt-1 text-[11px] text-slate-500">All parish entries</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Active parishes</p>
                    <p className="mt-3 text-3xl font-black text-emerald-700">{parishSummaryStats.activeParishes}</p>
                    <p className="mt-1 text-[11px] text-emerald-700/80">With registered lectors</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700">Inactive parishes</p>
                    <p className="mt-3 text-3xl font-black text-amber-700">{parishSummaryStats.inactiveParishes}</p>
                    <p className="mt-1 text-[11px] text-amber-700/80">No registered members</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-700">Coverage</p>
                    <p className="mt-3 text-3xl font-black text-indigo-700">{parishSummaryStats.coverage}%</p>
                    <p className="mt-1 text-[11px] text-indigo-700/80">Active coverage rate</p>
                  </div>
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

                {activeTab === 'lectors' && !isPresident && (
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

                {activeTab === 'parishes' && (
                  <select value={parishStatusFilter} onChange={(e) => setParishStatusFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                    <option value="all">All Parish Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                )}

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-indigo-300 focus:outline-none">
                  <option value="name">Sort: Name</option>
                  <option value="parish">Sort: Parish</option>
                  <option value="lastName">Sort: Last Name</option>
                  <option value="recent">Sort: Recent</option>
                  <option value="status">Sort: Status</option>
                  {activeTab === 'lectors' && <option value="role">Sort: Parish Role</option>}
                  {activeTab === 'parishes' && <option value="members">Sort: Members</option>}
                  {activeTab === 'parishes' && <option value="inactive">Sort: Activity</option>}
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
                  {canExportRegistry && <button
                    type="button"
                    onClick={exportSelectedCsv}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Export selected
                  </button>}
                    {activeTab === 'lectors' && canSuspendRegistry && (
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
                        {userRole === 'superadmin' && (
                          <button
                            type="button"
                            onClick={unsuspendAllSuspended}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-rose-700"
                          >
                            Unsuspend All Suspended
                          </button>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>

            {activeTab === 'lectors' ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="hidden overflow-x-auto md:block">
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
                            <button
                              type="button"
                              onClick={() => navigate(registryUrl(`/registry/lectors/${member._id}`))}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {(member.firstName || 'A').charAt(0).toUpperCase()}{(member.lastName || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{member.firstName} {member.lastName}</strong>
                                <div className="text-[11px] text-slate-500">{member.phone}</div>
                              </div>
                            </button>
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
                                      {canDeleteRegistry && (
                                        <button onClick={() => { handleDeleteMember(member._id); setMenuOpenId(null); }} className="block w-full text-left rounded-xl px-3 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">Archive</button>
                                      )}
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
                <div className="divide-y divide-slate-100 md:hidden">
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered lectors"
                      checked={filteredMembers.length > 0 && filteredMembers.every(member => selectedRows.includes(member._id))}
                      onChange={() => {
                        if (filteredMembers.every(member => selectedRows.includes(member._id))) {
                          setSelectedRows(prev => prev.filter(id => !filteredMembers.some(member => member._id === id)));
                        } else {
                          setSelectedRows(prev => Array.from(new Set([...prev, ...filteredMembers.map(member => member._id)])));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Select all filtered lectors
                  </div>
                  {displayRows.map((member) => (
                    <article key={member._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${member.firstName} ${member.lastName}`}
                          checked={selectedRows.includes(member._id)}
                          onChange={() => toggleRowSelection(member._id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {(member.firstName || 'A').charAt(0).toUpperCase()}{(member.lastName || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => navigate(registryUrl(`/registry/lectors/${member._id}`))}
                                  className="block max-w-full truncate text-left font-bold text-slate-900 hover:text-indigo-700"
                                >
                                  {member.firstName} {member.lastName}
                                </button>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{member.phone || 'No phone recorded'}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${(member.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {member.status || 'Active'}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Parish</p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                                {(member.parish && member.parish.name) || member.parishName || 'Unassigned'}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Role</p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-700">{member.roleInParish || 'Active Member'}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(registryUrl(`/registry/lectors/${member._id}`))}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View details
                            </button>
                            {canEditRegistry ? (
                              <button
                                type="button"
                                onClick={() => openLectorDrawer(member)}
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                Edit
                              </button>
                            ) : (
                              <span className="px-1 text-xs italic text-slate-400">Read only</span>
                            )}
                            {canDeleteRegistry && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(member._id)}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!filteredMembers.length && (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No members found for the current filters.</p>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">Showing {displayRows.length} of {totalMembersCount ?? filteredMembers.length} records</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Prev</button>
                    {pageNumbers.map((pageNum, index) => {
                      if (pageNum === '...') {
                        return <span key={`ellipsis-${index}`} className="px-2 text-[11px] font-semibold text-slate-400">...</span>;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))} disabled={currentPage === pages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Next</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="hidden overflow-x-auto md:block">
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
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              <button
                                type="button"
                                onClick={() => navigate(registryUrl(`/registry/parishes/${parish._id}`))}
                                className="text-left font-semibold text-slate-900 hover:text-indigo-700"
                              >
                                {parish.name}
                              </button>
                            </td>
                            <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">{parish.zone}</span></td>
                            <td className="px-4 py-4"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{memberCount}</span></td>
                            <td className="px-4 py-4 relative">
                              {['superadmin', 'executive'].includes(userRole) ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => navigate(registryUrl(`/registry/parishes/${parish._id}`))} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
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
                                  <button onClick={() => navigate(registryUrl(`/registry/parishes/${parish._id}`))} className="rounded-2xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-200">Details</button>
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
                <div className="divide-y divide-slate-100 md:hidden">
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered parishes"
                      checked={filteredParishes.length > 0 && filteredParishes.every(parish => selectedRows.includes(parish._id))}
                      onChange={() => {
                        if (filteredParishes.every(parish => selectedRows.includes(parish._id))) {
                          setSelectedRows(prev => prev.filter(id => !filteredParishes.some(parish => parish._id === id)));
                        } else {
                          setSelectedRows(prev => Array.from(new Set([...prev, ...filteredParishes.map(parish => parish._id)])));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Select all filtered parishes
                  </div>
                  {displayRows.map((parish) => {
                    const memberCount = parish.lectorCount || 0;
                    const isActive = memberCount > 0;
                    return (
                      <article key={parish._id} className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${parish.name}`}
                            checked={selectedRows.includes(parish._id)}
                            onChange={() => toggleRowSelection(parish._id)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => navigate(registryUrl(`/registry/parishes/${parish._id}`))}
                                className="text-left font-bold text-slate-900 hover:text-indigo-700"
                              >
                                {parish.name}
                              </button>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Zone</p>
                                <p className="mt-1 text-xs font-semibold text-slate-700">{parish.zone || 'Not set'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Active members</p>
                                <p className="mt-1 text-xs font-semibold text-slate-700">{memberCount}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(registryUrl(`/registry/parishes/${parish._id}`))}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                View details
                              </button>
                              {['superadmin', 'executive'].includes(userRole) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openParishDrawer(parish)}
                                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAlertMessage({ type: 'success', text: `${parish.name} summary opened.` })}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Open summary
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteParish(parish._id)}
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {!filteredParishes.length && (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No parishes found.</p>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">Showing {displayRows.length} of {filteredParishes.length} records</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 disabled:opacity-40">Prev</button>
                    {pageNumbers.map((pageNum, index) => {
                      if (pageNum === '...') {
                        return <span key={`ellipsis-${index}`} className="px-2 text-[11px] font-semibold text-slate-400">...</span>;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {pageNum}
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

            {activeTab === 'parishes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-slate-900">Parish activity overview</h2>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">Live</span>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Active parishes</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{parishSummaryStats.activeParishes} recorded</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{parishSummaryStats.coverage}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Inactive parishes</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{parishSummaryStats.inactiveParishes} waiting</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">{100 - parishSummaryStats.coverage}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-5 text-white shadow-lg">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Top coverage</p>
                  <div className="mt-4 space-y-3">
                    {parishPerformanceStats.map((parish, index) => (
                      <div key={parish._id} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white">#{index + 1}</span>
                          <span className="text-sm text-indigo-50 truncate max-w-[150px]">{parish.name}</span>
                        </div>
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white">{parish.memberCount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-slate-900">Inactive parish review queue</h2>
                    <div className="flex gap-2">
                      <button onClick={exportInactiveParishesCsv} className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-700">Export Inactive</button>
                      <button onClick={exportFullInactiveReport} className="rounded-xl bg-indigo-700 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-800">Export Full Report</button>
                      <button onClick={() => { setParishStatusFilter('inactive'); setAlertMessage({ type: 'info', text: 'Filtered to inactive parishes.' }); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Filter Inactive</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {inactiveParishQueue.length ? inactiveParishQueue.map((parish) => (
                      <div key={parish._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{parish.name}</p>
                          <p className="text-[11px] text-slate-500">Awaiting registration</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openParishReview(parish)}
                            className="rounded-xl bg-slate-100 px-2.5 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            Review
                          </button>
                          <button onClick={() => addMemberToParish(parish)} className="rounded-xl bg-emerald-600 px-2.5 py-2 text-[10px] font-semibold text-white hover:bg-emerald-700">Add Member</button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No inactive parishes right now.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
                  <h2 className="font-semibold text-slate-900 mb-3">Zone analysis</h2>
                  <div className="space-y-3">
                    {zoneStats.map(({ zone, count }) => (
                      <div key={zone} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{zone}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{count} parishes</p>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{Math.round((count / Math.max(parishes.length, 1)) * 100)}%</span>
                      </div>
                    ))}
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
                        <p><strong>Date of Birth:</strong> {formatDateOfBirth(selectedMember.dateOfBirth) || 'N/A'}</p>
                        <p><strong>Public birthday display:</strong> {selectedMember.publicBirthdayConsent === true ? 'Consent recorded' : 'Not opted in'}</p>
                        <p><strong>Year Commissioned:</strong> {selectedMember.yearCommissioned || 'N/A'}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => setSelectedMember(null)} className="rounded-2xl bg-indigo-600 text-white px-4 py-2">Close</button>
                      </div>
                    </div>
                  </div>
                )}
                {parishReviewOpen && parishReviewTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{parishReviewTarget.name}</h3>
                          <p className="text-sm text-slate-500">{parishReviewTarget.zone} — {parishReviewTarget.lectorCount || 0} members</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={closeParishReview} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold">Close</button>
                          <button onClick={() => addMemberToParish(parishReviewTarget)} className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white">Add Member</button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-3 flex items-center gap-4">
                          <ParishHealthRing count={parishReviewTarget.lectorCount || 0} target={deaneryTargets[parishReviewTarget.zone] || 50} />
                          <div>
                            <p className="text-sm font-medium">Parish health</p>
                            <p className="text-xs text-slate-500 mt-1">Visual health score based on member coverage (target 50)</p>
                          </div>
                        </div>
                        {canEditRegistry && (
                          <div className="mt-2 flex items-center gap-2">
                            <input defaultValue={deaneryTargets[parishReviewTarget.zone] ?? 50} type="number" min={1} className="rounded-xl border p-2 w-32" id="deaneryTargetInput" />
                            <button onClick={() => {
                              const el = document.getElementById('deaneryTargetInput');
                              const val = el ? Number(el.value) : 50;
                              saveDeaneryTarget(parishReviewTarget.zone, val);
                            }} className="rounded-xl bg-indigo-600 px-3 py-2 text-white">Save Target</button>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Members</h4>
                          {parishMembers.length ? (
                            <ul className="space-y-2">
                              {parishMembers.map(m => (
                                <li key={m._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 bg-slate-50">
                                  <div>
                                    <p className="font-semibold">{m.firstName} {m.lastName}</p>
                                    <p className="text-[11px] text-slate-500">{m.phone}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => setSelectedMember(m)} className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700">Open</button>
                                    <button onClick={() => { setEditingMember(m); openLectorDrawer(m); }} className="rounded-xl bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-700">Edit</button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500">No members yet. You can add a member directly to this parish.</p>
                          )}
                        </div>
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
              <button onClick={closeDrawer} disabled={isSavingRegistry} className="rounded-full bg-slate-100 px-3 py-2 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">✕</button>
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
                  <label className="text-slate-500 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formState.dateOfBirth || ''}
                    onChange={e => setFormState(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  />
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                  <input
                    type="checkbox"
                    checked={formState.publicBirthdayConsent === true}
                    onChange={event => setFormState(prev => ({ ...prev, publicBirthdayConsent: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-700">Member explicitly opted in to public birthday display</span>
                    <span className="mt-1 block text-[11px] leading-5">Only the member’s name and birthday month/day are published. Leave unchecked unless consent has been confirmed.</span>
                  </span>
                </label>
                <div>
                  <label className="text-slate-500 block mb-1">Parish</label>
                  {isPresident && editingMember ? (
                    <input
                      type="text"
                      value={payload?.parish || editingMember.parish?.name || editingMember.parishName || ''}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
                      disabled
                    />
                  ) : (
                    <select value={formState.parishId} onChange={e => setFormState(prev => ({ ...prev, parishId: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required>
                      {parishes.map(parish => (
                        <option key={parish._id} value={parish._id}>{parish.name}</option>
                      ))}
                    </select>
                  )}
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
                  <button type="button" onClick={closeDrawer} disabled={isSavingRegistry} className="flex-1 rounded-2xl bg-slate-100 text-slate-700 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSavingRegistry} className="flex-1 rounded-2xl bg-indigo-600 text-white py-3 font-semibold disabled:cursor-wait disabled:opacity-60">{isSavingRegistry ? 'Saving...' : 'Save'}</button>
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
                  <button type="button" onClick={closeDrawer} disabled={isSavingRegistry} className="flex-1 rounded-2xl bg-slate-100 text-slate-700 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSavingRegistry} className="flex-1 rounded-2xl bg-indigo-600 text-white py-3 font-semibold disabled:cursor-wait disabled:opacity-60">
                    {isSavingRegistry ? 'Saving...' : editingParish && editingParish._id ? 'Save Changes' : 'Add Parish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {confirmationDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="registry-confirmation-title"
            aria-describedby="registry-confirmation-message"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              confirmationDialog.confirmLabel?.toLowerCase().includes('unsuspend') ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`} aria-hidden="true">
              !
            </div>
            <h2 id="registry-confirmation-title" className="mt-4 text-lg font-bold text-slate-900">{confirmationDialog.title}</h2>
            <p id="registry-confirmation-message" className="mt-2 text-sm leading-6 text-slate-600">{confirmationDialog.message}</p>
            {confirmationDialog.requiredText && (
              <div className="mt-4">
                <label htmlFor="registry-confirmation-text" className="block text-xs font-semibold text-slate-700">
                  Type <span className="font-bold">{confirmationDialog.requiredText}</span> to continue
                </label>
                <input
                  id="registry-confirmation-text"
                  type="text"
                  value={confirmationText}
                  onChange={event => setConfirmationText(event.target.value)}
                  disabled={isConfirmingAction}
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={isConfirmingAction}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPendingAction}
                disabled={isConfirmingAction || Boolean(confirmationDialog.requiredText && confirmationText !== confirmationDialog.requiredText)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmationDialog.confirmLabel?.toLowerCase().includes('unsuspend')
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isConfirmingAction ? 'Processing...' : confirmationDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
