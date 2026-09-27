import React, { useEffect, useState } from 'react';
import axios from 'axios';

const roleOptions = ['member', 'president', 'executive', 'superadmin'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

      const res = await axios.get(`${apiBase}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userList = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setUsers(userList);
    } catch (err) {
      const errorMsg = err.response?.status === 403
        ? 'Access Denied: only executives and superadmins can manage access.'
        : 'Failed to load user records.';
      setMessage({ text: errorMsg, isError: true });
    } finally {
      setLoading(false);
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
      ) : users.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold">No user records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
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
          ))}
        </div>
      )}
    </div>
  );
}