import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const buildName = (user = {}) => {
  const parts = [user.title || '', user.firstName || '', user.middleName || '', user.lastName || ''];
  const combined = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return combined || user.name || 'Member';
};

const titleOptions = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Rev.', 'Fr.', 'Prof.'];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parishes, setParishes] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    parish: '',
    password: '',
    confirmPassword: ''
  });

  const token = useMemo(() => localStorage.getItem('clan_token'), []);

  useEffect(() => {
    const payload = token ? parseJwt(token) : null;
    if (!token || !payload?.id) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to load profile');

        const profile = data.user;
        setUser(profile);
        setForm({
          title: profile.title || '',
          firstName: profile.firstName || '',
          middleName: profile.middleName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          parish: profile.parish || '',
          password: '',
          confirmPassword: ''
        });
      } catch (err) {
        setMessage(err.message || 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, token]);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const res = await fetch(`${apiBase}/api/lectors/parishes-list`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to load parishes');

        const entries = Array.isArray(data.data) ? data.data : [];
        const parishNames = entries
          .map((parish) => parish.name || '')
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        setParishes(parishNames);
      } catch (err) {
        console.error('Failed to load parishes:', err);
      }
    };

    fetchParishes();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?._id) return;

    if (form.password && form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        title: form.title,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        parish: form.parish,
        ...(form.password ? { password: form.password } : {})
      };

      const res = await fetch(`${apiBase}/api/v1/users/profile/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');

      const updatedProfile = data.user;
      const nextName = buildName(updatedProfile);
      setUser(updatedProfile);
      setMessage('Profile saved successfully.');

      const nextToken = data.token || token;
      if (nextToken) {
        localStorage.setItem('clan_token', nextToken);
        localStorage.setItem('role', updatedProfile.role || parseJwt(nextToken)?.role || 'member');
        localStorage.setItem('isLoggedIn', 'true');
      }

      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setMessage(err.message || 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading your profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">My profile</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{user ? buildName(user) : 'Profile'}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back to dashboard
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Title</span>
              <select
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <option value="">Select title</option>
                {titleOptions.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Parish</span>
              <select
                value={form.parish}
                onChange={(e) => handleChange('parish', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <option value="">Select parish</option>
                {parishes.map((parish) => (
                  <option key={parish} value={parish}>{parish}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>First name</span>
              <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Middle name</span>
              <input value={form.middleName} onChange={(e) => handleChange('middleName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Last name</span>
              <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Email address</span>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" required />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Phone number</span>
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" placeholder="Optional" />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Change password</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>New password</span>
                <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="Leave blank to keep current password" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                <span>Confirm password</span>
                <input type="password" value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="Confirm new password" />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
