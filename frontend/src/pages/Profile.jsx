import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusNotice from '../components/StatusNotice';

const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
const titleOptions = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Rev.', 'Fr.', 'Prof.'];
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

const buildName = (user = {}) => {
  const name = [user.title, user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return name || user.name || 'Member';
};

export default function Profile() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('clan_token'), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [saving, setSaving] = useState(false);
  const [parishes, setParishes] = useState([]);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [activeSection, setActiveSection] = useState('personal');
  const [form, setForm] = useState({
    title: '', firstName: '', middleName: '', lastName: '', email: '', phone: '', parish: '', password: '', confirmPassword: ''
  });

  const loadProfile = useCallback(async () => {
    const payload = token ? parseJwt(token) : null;
    if (!token || !payload?.id) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setProfileError('');
    try {
      const response = await fetch(`${apiBase}/api/v1/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load profile');
      const profile = result.user;
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
    } catch (error) {
      setUser(null);
      setProfileError(error.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const fetchParishes = async () => {
      try {
        const response = await fetch(`${apiBase}/api/lectors/parishes-list`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Unable to load parishes');
        setParishes((result.data || []).map((parish) => parish.name).filter(Boolean).sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        setMessage((current) => current.text ? current : { text: error.message || 'Could not load parishes.', isError: true });
      }
    };
    fetchParishes();
  }, []);

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?._id) return;
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ text: 'Passwords do not match.', isError: true });
      setActiveSection('security');
      return;
    }

    setSaving(true);
    setMessage({ text: '', isError: false });
    try {
      const response = await fetch(`${apiBase}/api/v1/users/profile/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          parish: form.parish,
          ...(form.password ? { password: form.password } : {})
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Profile update failed');

      setUser(result.user);
      setMessage({ text: 'Profile saved successfully.', isError: false });
      const nextToken = result.token || token;
      if (nextToken) {
        localStorage.setItem('clan_token', nextToken);
        localStorage.setItem('role', result.user.role || parseJwt(nextToken)?.role || 'member');
        localStorage.setItem('isLoggedIn', 'true');
      }
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
    } catch (error) {
      setMessage({ text: error.message || 'Unable to save your profile.', isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div role="status" aria-live="polite" className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading your profile...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
        <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <StatusNotice type="error">{profileError || 'Your profile could not be loaded.'}</StatusNotice>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={loadProfile} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
              Retry
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Back to dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  const roleLabel = String(user?.role || 'member').replace(/([a-z])([A-Z])/g, '$1 $2');
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map((part) => part.charAt(0)).join('').toUpperCase() || 'A';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700" />
          <div className="-mt-10 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-indigo-100 text-xl font-black text-indigo-700 shadow-sm">{initials}</div>
              <div className="pb-1">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">My account</p>
                <h1 className="mt-1 text-2xl font-black text-slate-900">{buildName(user)}</h1>
                <p className="mt-1 text-sm text-slate-500">{user?.position || 'Member'} · <span className="capitalize">{roleLabel}</span></p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/dashboard')} className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to dashboard
            </button>
          </div>
        </header>

        {message.text && (
          <StatusNotice type={message.isError ? 'error' : 'success'}>
            {message.text}
          </StatusNotice>
        )}

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="h-fit rounded-2xl border border-slate-200 bg-white p-2" aria-label="Profile sections">
            {[
              ['personal', 'Personal details'],
              ['parish', 'Parish & role'],
              ['security', 'Password & security']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            {activeSection === 'personal' && (
              <section className="space-y-5">
                <div><h2 className="text-lg font-black text-slate-900">Personal details</h2><p className="mt-1 text-sm text-slate-500">Keep your name up to date.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title"><select value={form.title} onChange={(event) => handleChange('title', event.target.value)} className={inputClass}><option value="">Select title</option>{titleOptions.map((title) => <option key={title} value={title}>{title}</option>)}</select></Field>
                  <Field label="First name"><input value={form.firstName} onChange={(event) => handleChange('firstName', event.target.value)} className={inputClass} required /></Field>
                  <Field label="Middle name"><input value={form.middleName} onChange={(event) => handleChange('middleName', event.target.value)} className={inputClass} /></Field>
                  <Field label="Last name"><input value={form.lastName} onChange={(event) => handleChange('lastName', event.target.value)} className={inputClass} required /></Field>
                </div>
              </section>
            )}

            {activeSection === 'parish' && (
              <section className="space-y-5">
                <div><h2 className="text-lg font-black text-slate-900">Parish & role</h2><p className="mt-1 text-sm text-slate-500">Review your community assignment and contact details.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email address"><input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} className={inputClass} required /></Field>
                  <Field label="Phone number"><input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} className={inputClass} placeholder="Optional" /></Field>
                  <Field label="Parish"><select value={form.parish} onChange={(event) => handleChange('parish', event.target.value)} className={inputClass}><option value="">Select parish</option>{parishes.map((parish) => <option key={parish} value={parish}>{parish}</option>)}</select></Field>
                  <Field label="Access role"><input value={roleLabel} className={`${inputClass} bg-slate-100 capitalize`} disabled /></Field>
                </div>
              </section>
            )}

            {activeSection === 'security' && (
              <section className="space-y-5">
                <div><h2 className="text-lg font-black text-slate-900">Password & security</h2><p className="mt-1 text-sm text-slate-500">Leave both fields blank to keep the current password.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password"><input type="password" value={form.password} onChange={(event) => handleChange('password', event.target.value)} className={inputClass} autoComplete="new-password" /></Field>
                  <Field label="Confirm password"><input type="password" value={form.confirmPassword} onChange={(event) => handleChange('confirmPassword', event.target.value)} className={inputClass} autoComplete="new-password" /></Field>
                </div>
              </section>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => navigate('/dashboard')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
