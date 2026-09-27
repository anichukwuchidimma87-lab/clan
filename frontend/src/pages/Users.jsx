import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const roleOptions = ['member', 'president', 'executive', 'superadmin'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

      const res = await axios.get(`${apiBase}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allUsers = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      const pending = allUsers.filter((user) => user.status === 'pending');
      const approved = allUsers.filter((user) => user.status !== 'pending');

      setPendingUsers(pending);
      setUsers(approved);
      setMessage({ text: '', isError: false });
    } catch (err) {
      const errorMsg = err.response?.status === 403
        ? 'Access Denied: only executives and superadmins can manage access.'
        : 'Failed to load user access records.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

      const res = await axios.patch(`${apiBase}/api/v1/users/approve/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const approvedUser = res.data?.user || null;
      setPendingUsers((current) => current.filter((user) => user._id !== userId));
      if (approvedUser) {
        setUsers((current) => [{ ...approvedUser, role: 'member', status: 'approved' }, ...current]);
      }
      setMessage({ text: 'User approved as a member and added to the access list.', isError: false });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Approval failed.', isError: true });
    }
  };

  const updateRole = async (userId, nextRole) => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

      await axios.patch(`${apiBase}/api/v1/users/${userId}/role`, { role: nextRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers((current) => current.map((user) => user._id === userId ? { ...user, role: nextRole } : user));
      setMessage({ text: 'User role updated successfully.', isError: false });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Role update failed. You may lack sufficient clearance.', isError: true });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const pendingSection = useMemo(() => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900">Pending approvals</h3>
        <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
          {pendingUsers.length} waiting
        </span>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
          No pending access requests right now.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user._id} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 mt-2">{user.position || 'Member'} • Pending approval</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">Status</div>
                  <span className="rounded-full bg-amber-200 text-amber-900 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em]">Member</span>
                  <button
                    type="button"
                    onClick={() => approveUser(user._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Approve as member
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [pendingUsers]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-600 font-bold">Access governance</p>
          <h2 className="text-2xl font-black text-gray-900">User Access Management</h2>
        </div>
        <div className="text-xs text-gray-500 font-semibold">
          Hierarchy: member → president → executive → superadmin
        </div>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl font-bold text-xs ${message.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading user access records...</p>
      ) : (
        <>
          {pendingSection}

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">Approved users</h3>
              <span className="rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                {users.length} active
              </span>
            </div>

            {users.length === 0 ? (
              <div className="text-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No approved users found.</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">{user.position || 'Member'}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Role</label>
                      <select
                        value={user.role || 'member'}
                        onChange={(e) => updateRole(user._id, e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}