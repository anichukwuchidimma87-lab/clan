import React, { useEffect, useMemo, useState } from 'react';
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

const getSessionRange = (user) => {
  const defaultYear = new Date().getFullYear();
  const sessionStart = Number(user.executiveSessionStart ?? user.yearCommissioned ?? defaultYear);
  const sessionEnd = Number(user.executiveSessionEnd ?? (sessionStart || defaultYear));
  return { sessionStart, sessionEnd };
};

const emptyForm = () => ({
  name: '',
  position: 'Executive Member',
  profileTitle: '',
  email: '',
  phone: '',
  executiveSessionStart: new Date().getFullYear(),
  executiveSessionEnd: new Date().getFullYear(),
  isCurrentExecutiveSession: true,
  isFeaturedOnHomepage: false,
  homepageOrder: 0,
});

export default function ExecutiveManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [creating, setCreating] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

  const sessionGroups = useMemo(() => {
    const grouped = new Map();

    users.forEach((user) => {
      const { sessionStart, sessionEnd } = getSessionRange(user);
      const key = `${sessionStart}-${sessionEnd}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(user);
    });

    return [...grouped.entries()].sort(([, groupA], [, groupB]) => {
      const endA = Number(groupA[0].executiveSessionEnd ?? groupA[0].executiveSessionStart ?? 0);
      const endB = Number(groupB[0].executiveSessionEnd ?? groupB[0].executiveSessionStart ?? 0);
      return endB - endA;
    });
  }, [users]);

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
    const { sessionStart, sessionEnd } = getSessionRange(user);
    setEditingId(user._id);
    setCreating(false);
    setFormData({
      name: user.name || '',
      position: normalizePosition(user.position),
      profileTitle: user.profileTitle || '',
      email: user.email || '',
      phone: user.phone || '',
      executiveSessionStart: user.executiveSessionStart ?? sessionStart,
      executiveSessionEnd: user.executiveSessionEnd ?? sessionEnd,
      isCurrentExecutiveSession: user.isCurrentExecutiveSession ?? true,
      isFeaturedOnHomepage: Boolean(user.isFeaturedOnHomepage),
      homepageOrder: Number(user.homepageOrder || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setFormData(emptyForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('clan_token');

    try {
      const payload = {
        ...formData,
        executiveSessionStart: Number(formData.executiveSessionStart),
        executiveSessionEnd: Number(formData.executiveSessionEnd),
        homepageOrder: Number(formData.homepageOrder),
      };

      let response;
      let data;

      if (creating) {
        response = await fetch(`${apiBase}/api/v1/users/executive`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create executive');
        }

        setMessage({
          text: `${data.user?.name || 'Executive'} added to the council successfully.`,
          isError: false,
        });
      } else {
        response = await fetch(`${apiBase}/api/v1/users/profile/${editingId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Update failed');
        }

        setMessage({
          text: `${data.user?.name || 'Executive'} profile updated successfully.`,
          isError: false,
        });
      }

      cancelEdit();
      fetchApprovedUsers();
    } catch (error) {
      setMessage({
        text: error.message || 'Unable to save executive details.',
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
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCreating(true);
                setEditingId(null);
                setFormData(emptyForm());
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Add Executive
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800"
            >
              Back to Dashboard
            </button>
          </div>
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
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h2 className="font-bold text-slate-900">Sessions & Council Members</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  {users.length} records
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {sessionGroups.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No approved executive profiles found yet.
                  </div>
                ) : (
                  sessionGroups.map(([sessionKey, group]) => {
                    const firstMember = group[0];
                    const { sessionStart, sessionEnd } = getSessionRange(firstMember);
                    const isCurrentSession = group.some((member) => member.isCurrentExecutiveSession) || (sessionStart <= new Date().getFullYear() && sessionEnd >= new Date().getFullYear());

                    return (
                      <div key={sessionKey} className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.24em] text-slate-500">
                              {isCurrentSession ? 'Current session' : 'Archived session'}
                            </p>
                            <h3 className="text-lg font-black text-slate-900">{sessionStart} - {sessionEnd}</h3>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                            {group.length} members
                          </span>
                        </div>

                        <div className="space-y-3">
                          {group.map((user) => (
                            <div key={user._id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shadow-sm">
                                  {user.name?.charAt(0)?.toUpperCase() || 'E'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900">{user.name}</h4>
                                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-600 font-bold">{user.position || 'Executive Member'}</p>
                                  <p className="text-sm text-slate-500">{user.profileTitle || 'Deanery Executive'}</p>
                                  {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                                  {user.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
                                  {user.isFeaturedOnHomepage && (
                                    <span className="inline-flex items-center mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                      Homepage leader
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => startEdit(user)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {creating ? 'Add Executive' : editingId ? 'Update Executive' : 'Select a member to edit'}
              </h2>

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
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Session start</label>
                    <input
                      type="number"
                      value={formData.executiveSessionStart}
                      onChange={(e) => setFormData({ ...formData, executiveSessionStart: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Session end</label>
                    <input
                      type="number"
                      value={formData.executiveSessionEnd}
                      onChange={(e) => setFormData({ ...formData, executiveSessionEnd: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isCurrentExecutiveSession}
                      onChange={(e) => setFormData({ ...formData, isCurrentExecutiveSession: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mark as current executive session
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isFeaturedOnHomepage}
                      onChange={(e) => setFormData({ ...formData, isFeaturedOnHomepage: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Show on homepage contact leaders
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Homepage order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.homepageOrder}
                    onChange={(e) => setFormData({ ...formData, homepageOrder: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700"
                  >
                    {creating ? 'Create Executive' : 'Save Changes'}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
