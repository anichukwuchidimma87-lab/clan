import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Users() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Function to fetch pending users
  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
      
      const res = await axios.get(`${apiBase}/api/v1/users/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data);
    } catch (err) {
      setMessage({ text: "Failed to load pending requests.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Function to approve a user
  const approveUser = async (id) => {
    try {
      const token = localStorage.getItem('clan_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
      
      await axios.patch(`${apiBase}/api/v1/users/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove approved user from local state immediately
      setPendingUsers(pendingUsers.filter(user => user._id !== id));
      setMessage({ text: "User approved successfully.", isError: false });
    } catch (err) {
      setMessage({ text: "Approval failed. Check permissions.", isError: true });
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-gray-900 mb-6">User Access Management</h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-xl font-bold text-xs ${message.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading pending accounts...</p>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold">No pending registrations found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <div key={user._id} className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <div>
                <p className="font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400 font-medium">{user.email}</p>
              </div>
              <button 
                onClick={() => approveUser(user._id)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition"
              >
                Approve Access
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}