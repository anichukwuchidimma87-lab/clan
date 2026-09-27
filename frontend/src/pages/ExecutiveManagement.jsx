import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EXECUTIVE_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Financial Secretary',
  'Assistant Financial Secretary',
  'PRO',
  'Welfare Officer',
  'Provost',
  'Executive Member',
  'Patron',
  'Patroness'
];

const normalizePosition = (position) => position || 'Executive Member';

export default function ExecutiveManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: 'Executive Member',
    profileTitle: '',
    email: '',
  });

  const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

  const fetchApprovedUsers = async () => {
    try {
      const token = localStorage.getItem('clan_token');
      const response = await fetch(`${apiBase}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load executives');
      }

      const leadershipUsers = (data.data || []).filter((user) =>
        EXECUTIVE_POSITIONS.includes(normalizePosition(user.position))
      );

      setUsers(leadershipUsers);
      setMessage({ text: '', isError: false });
    } catch (error) {
      setMessage({
        text: error.message || 'Unable to load executive records.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedUsers();
  }, []);

  const startEdit = (user) => {
    setEditingId(user._id);
    setFormData({
      name: user.name || '',
      position: normalizePosition(user.position),
      profileTitle: user.profileTitle || '',
      email: user.email || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      position: 'Executive Member',
      profileTitle: '',
      email: '',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('clan_token');

    try {
      const response = await fetch(`${apiBase}/api/v1/users/profile/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      setMessage({
        text: `${data.user?.name || 'Executive'} profile updated successfully.`,
        isError: false,
      });
      cancelEdit();
      fetchApprovedUsers();
    } catch (error) {
      setMessage({
        text: error.message || 'Unable to update this executive.',
        isError: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-600 font-bold">Leadership Management</p>
            <h1 className="text-3xl font-black text-slate-900 mt-2">Executive Council</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800"
          >
            Back to Dashboard
          </button>
        </div>

        {message.text && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              message.isError
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            Loading executive list...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-900">Current Council Members</h2>
              </div>

              <div className="divide-y divide-slate-200">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No approved executive profiles found yet.
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{user.name}</h3>
                          <p className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-bold">{user.position || 'Executive Member'}</p>
                          <p className="text-sm text-slate-500">{user.profileTitle || 'Deanery Executive'}</p>
                          {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                        </div>
                      </div>

                      <button
                        onClick={() => startEdit(user)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {editingId ? 'Update Executive' : 'Select a member to edit'}
              </h2>

              {editingId ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Full name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Position</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      {EXECUTIVE_POSITIONS.map((position) => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Role title</label>
                    <input
                      type="text"
                      value={formData.profileTitle}
                      onChange={(e) => setFormData({ ...formData, profileTitle: e.target.value })}
                      placeholder="e.g. Deanery Secretary"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-slate-500 leading-7">
                  Choose a member from the list to update the executive name, position, title, or contact email. This will update the public leadership section automatically.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
