import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import StatusNotice from '../components/StatusNotice';

const roleOptions = ['member', 'president', 'executive', 'superadmin'];
const permissionOptions = ['view', 'export', 'add', 'update', 'suspend', 'delete'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [parishError, setParishError] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [parishes, setParishes] = useState([]);
  const [approvalParishes, setApprovalParishes] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [accountDialog, setAccountDialog] = useState(null);
  const [accountDialogError, setAccountDialogError] = useState('');
  const [updatingAccount, setUpdatingAccount] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
  const token = localStorage.getItem('clan_token');
  const actorId = useMemo(() => {
    try { return JSON.parse(atob(token.split('.')[1])).id; } catch { return ''; }
  }, [token]);

  const fetchUsers = async () => {
    setLoading(true);
    setLoadError('');
    setParishError('');

    try {
      const [usersResult, parishesResult] = await Promise.allSettled([
        axios.get(`${apiBase}/api/v1/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${apiBase}/api/lectors/parishes-list`)
      ]);
      if (usersResult.status === 'rejected') throw usersResult.reason;

      const response = usersResult.value;
      const allUsers = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setPendingUsers(allUsers.filter((user) => user.status === 'pending'));
      setUsers(allUsers.filter((user) => user.status !== 'pending'));

      if (parishesResult.status === 'fulfilled' && parishesResult.value.data?.success) {
        setParishes(parishesResult.value.data.data || []);
      } else {
        setParishes([]);
        setParishError('Parish options could not be loaded. President role assignments may be unavailable.');
      }
    } catch (error) {
      setPendingUsers([]);
      setUsers([]);
      setLoadError(error.response?.status === 403
          ? 'Access denied: only executives and super admins can manage access.'
          : error.response?.data?.message || 'Failed to load user access records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (user, parishOverride) => {
    try {
      const nextRole = user.requestedRole || 'member';
      const parish = parishOverride || user.requestedParish || '';

      if (nextRole === 'president' && !parish) {
        setMessage({ text: 'Select a parish before approving this president request.', isError: true });
        return;
      }

      setApprovingUserId(user._id);
      const permissions = nextRole === 'president'
        ? { view: true, export: true, add: false, update: true, suspend: false, delete: false }
        : {};

      const response = await axios.patch(
        `${apiBase}/api/v1/users/approve/${user._id}`,
        { role: nextRole, parish, permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPendingUsers((current) => current.filter((item) => item._id !== user._id));
      if (response.data?.user) {
        setUsers((current) => [{ ...response.data.user, status: 'approved' }, ...current]);
      }
      setMessage({
        text: nextRole === 'president'
          ? 'President approved and assigned to the selected parish.'
          : 'User approved and added to the access list.',
        isError: false
      });
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Approval failed.', isError: true });
    } finally {
      setApprovingUserId(null);
    }
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    if (!accountDialog || updatingAccount) return;
    setUpdatingAccount(true);
    setAccountDialogError('');
    try {
      const payload = {
        email: accountDialog.email,
        status: accountDialog.status,
        role: accountDialog.role,
        parish: accountDialog.parish,
        permissions: accountDialog.permissions
      };
      if (accountDialog.password) payload.password = accountDialog.password;

      const response = await axios.patch(
        `${apiBase}/api/v1/users/${accountDialog.user._id}/account`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((current) => current.map((user) =>
        user._id === accountDialog.user._id ? response.data.user : user
      ));
      setMessage({ text: 'Account details saved.', isError: false });
      setAccountDialog(null);
    } catch (error) {
      setAccountDialogError(error.response?.data?.message || 'Account update failed.');
    } finally {
      setUpdatingAccount(false);
    }
  };

  const filteredPendingUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingUsers;
    return pendingUsers.filter((user) =>
      [user.name, user.email, user.position, user.requestedRole, user.requestedParish]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [pendingUsers, searchQuery]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.position, user.role, user.parish]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [users, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-600">Access governance</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">User Access Management</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500">Member → President → Executive → Super admin</p>
        </div>

        {message.text && (
          <StatusNotice type={message.isError ? 'error' : 'success'} className="mb-6">
            {message.text}
          </StatusNotice>
        )}

        {parishError && (
          <StatusNotice type="error" className="mb-6">
            {parishError}
          </StatusNotice>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Pending <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{pendingUsers.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`rounded-lg px-4 py-2 text-xs font-bold ${activeTab === 'approved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Approved <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-800">{users.length}</span>
            </button>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, role, or parish..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 sm:max-w-sm"
          />
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading user access records...</div>
        ) : loadError ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <StatusNotice type="error">{loadError}</StatusNotice>
            <button type="button" onClick={fetchUsers} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
              Retry
            </button>
          </div>
        ) : activeTab === 'pending' ? (
          <section className="space-y-4">
            {filteredPendingUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                {searchQuery ? 'No pending requests match your search.' : 'No pending access requests.'}
              </div>
            ) : filteredPendingUsers.map((user) => (
              <article key={user._id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                      {user.position || 'Member'} · Pending
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold uppercase text-amber-800">
                      {user.requestedRole || 'member'}
                    </span>
                    {user.requestedRole === 'president' && (
                      <select
                        value={approvalParishes[user._id] || user.requestedParish || ''}
                        onChange={(event) => setApprovalParishes((current) => ({ ...current, [user._id]: event.target.value }))}
                        className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <option value="">Confirm parish</option>
                        {parishes.map((parish) => (
                          <option key={parish._id} value={parish.name}>{parish.name}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => approveUser(user, approvalParishes[user._id] || user.requestedParish || '')}
                      disabled={Boolean(approvingUserId) || (user.requestedRole === 'president' && !(approvalParishes[user._id] || user.requestedParish))}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {approvingUserId === user._id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                {searchQuery ? 'No approved users match your search.' : 'No approved users found.'}
              </div>
            ) : filteredUsers.map((user) => (
              <article key={user._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {user.role || 'member'}{user.parish ? ` · ${user.parish}` : ''} · {user.status || 'approved'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    {user._id !== actorId && <button
                      type="button"
                      onClick={() => {
                        setAccountDialogError('');
                        setAccountDialog({
                          user,
                          email: user.email || '',
                          password: '',
                          status: user.status || 'approved',
                          role: user.role || 'member',
                          parish: user.parish || '',
                          permissions: { ...(user.permissions || {}) }
                        });
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Manage account
                    </button>}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {accountDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
            <form onSubmit={saveAccount} className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600">Account management</p>
                <h2 id="account-dialog-title" className="mt-2 text-xl font-black text-slate-900">Update {accountDialog.user.name}</h2>
              </div>
              <label className="block text-xs font-bold text-slate-600">
                Email address
                <input
                  type="email"
                  required
                  value={accountDialog.email}
                  onChange={(event) => setAccountDialog((current) => ({ ...current, email: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Access role
                <select
                  value={accountDialog.role}
                  onChange={(event) => setAccountDialog((current) => ({ ...current, role: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium capitalize text-slate-800"
                >
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              {['member', 'president'].includes(accountDialog.role) && (
                <label className="block text-xs font-bold text-slate-600">
                  Parish {accountDialog.role === 'president' ? '(required)' : ''}
                  <select
                    value={accountDialog.parish}
                    required={accountDialog.role === 'president'}
                    onChange={(event) => setAccountDialog((current) => ({ ...current, parish: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="">Select parish</option>
                    {parishes.map((parish) => <option key={parish._id} value={parish.name}>{parish.name}</option>)}
                  </select>
                </label>
              )}
              {accountDialog.role === 'president' && (
                <fieldset className="grid grid-cols-2 gap-2">
                  <legend className="mb-2 text-xs font-bold text-slate-600">Parish permissions</legend>
                  {permissionOptions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-xs capitalize text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(accountDialog.permissions?.[permission])}
                        onChange={(event) => setAccountDialog((current) => ({
                          ...current,
                          permissions: { ...current.permissions, [permission]: event.target.checked }
                        }))}
                      />
                      {permission}
                    </label>
                  ))}
                </fieldset>
              )}
              <label className="block text-xs font-bold text-slate-600">
                Set a new password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={accountDialog.password}
                  onChange={(event) => setAccountDialog((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Leave blank to keep current password"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Account status
                <select
                  value={accountDialog.status}
                  onChange={(event) => setAccountDialog((current) => ({ ...current, status: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                >
                  <option value="approved">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              {accountDialog.status === 'disabled' && accountDialog.user.status !== 'disabled' && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  This user will be signed out on their next request and will not be able to log in.
                </p>
              )}
              {accountDialogError && <StatusNotice type="error">{accountDialogError}</StatusNotice>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAccountDialog(null)} disabled={updatingAccount} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
                  Cancel
                </button>
                <button type="submit" disabled={updatingAccount} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {updatingAccount ? 'Saving...' : 'Save account'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
