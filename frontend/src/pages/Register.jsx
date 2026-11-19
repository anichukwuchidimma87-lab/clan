import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    requestedRole: 'member',
    requestedParish: ''
  });
  const [parishes, setParishes] = useState([]);
  const [commissionedStatus, setCommissionedStatus] = useState('Not Commissioned');
  const [yearCommissioned, setYearCommissioned] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingParishes, setLoadingParishes] = useState(true);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
    fetch(`${apiBase}/api/lectors/parishes-list`)
      .then((response) => response.json())
      .then((result) => setParishes(result.success ? result.data : []))
      .catch(() => setParishes([]))
      .finally(() => setLoadingParishes(false));
  }, []);

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match.', isError: true });
      return;
    }
    if (formData.password.length < 8) {
      setMessage({ text: 'Use at least 8 characters for the password.', isError: true });
      return;
    }
    if (formData.requestedRole === 'president' && !formData.requestedParish) {
      setMessage({ text: 'Select the parish you are requesting to manage.', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
      await axios.post(`${apiBase}/api/v1/auth/register`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        requestedRole: formData.requestedRole,
        requestedParish: formData.requestedRole === 'president' ? formData.requestedParish : '',
        yearCommissioned: commissionedStatus === 'Commissioned' && yearCommissioned ? Number(yearCommissioned) : null
      });
      setSuccess(true);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Unable to submit the registration.',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">✓</div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Request submitted</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Your account is awaiting approval</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            An administrator will review your request and parish assignment. Sign-in will become available after approval.
          </p>
          <button type="button" onClick={() => navigate('/login')} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700">
            Continue to sign in
          </button>
        </div>
      </main>
    );
  }

  const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100';

  return (
    <main className="min-h-[calc(100vh-80px)] grid bg-slate-50 lg:grid-cols-[minmax(320px,0.9fr)_minmax(480px,1.1fr)]">
      <section className="hidden min-h-[calc(100vh-80px)] flex-col justify-between bg-indigo-950 p-10 text-white lg:flex xl:p-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-300">Join CLAN Benin City Deanery</p>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.05] tracking-tight">Create an account built around your role.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
            Members and parish presidents receive access appropriate to their parish and responsibilities after administrator approval.
          </p>
        </div>
        <p className="text-xs font-semibold text-indigo-300">Catholic Lectors Association of Nigeria</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Account request</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Register</h2>
            <p className="mt-2 text-sm text-slate-500">Provide your details accurately for administrator review.</p>
          </div>

          {message.text && (
            <div role="alert" className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Full name
              <input type="text" value={formData.name} onChange={(event) => handleChange('name', event.target.value)} className={inputClass} required placeholder="Your full name" />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Email address
              <input type="email" value={formData.email} onChange={(event) => handleChange('email', event.target.value)} className={inputClass} required autoComplete="email" placeholder="you@example.com" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Password
              <input type="password" value={formData.password} onChange={(event) => handleChange('password', event.target.value)} className={inputClass} required minLength={8} autoComplete="new-password" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Confirm password
              <input type="password" value={formData.confirmPassword} onChange={(event) => handleChange('confirmPassword', event.target.value)} className={inputClass} required minLength={8} autoComplete="new-password" />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Account request
              <select value={formData.requestedRole} onChange={(event) => handleChange('requestedRole', event.target.value)} className={inputClass}>
                <option value="member">Member</option>
                <option value="president">Parish President</option>
              </select>
            </label>

            {formData.requestedRole === 'president' && (
              <label className="text-sm font-semibold text-slate-700">
                Requested parish
                <select value={formData.requestedParish} onChange={(event) => handleChange('requestedParish', event.target.value)} className={inputClass} required disabled={loadingParishes}>
                  <option value="">{loadingParishes ? 'Loading parishes...' : 'Select parish'}</option>
                  {parishes.map((parish) => <option key={parish._id} value={parish.name}>{parish.name}</option>)}
                </select>
              </label>
            )}

            <label className="text-sm font-semibold text-slate-700">
              Commissioned status
              <select value={commissionedStatus} onChange={(event) => { setCommissionedStatus(event.target.value); if (event.target.value !== 'Commissioned') setYearCommissioned(''); }} className={inputClass}>
                <option value="Not Commissioned">Not Commissioned</option>
                <option value="Commissioned">Commissioned</option>
              </select>
            </label>

            {commissionedStatus === 'Commissioned' && (
              <label className="text-sm font-semibold text-slate-700">
                Year commissioned
                <input type="number" min="1900" max={new Date().getFullYear()} value={yearCommissioned} onChange={(event) => setYearCommissioned(event.target.value)} className={inputClass} required />
              </label>
            )}
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Submitting request...' : 'Submit registration'}
          </button>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an approved account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
