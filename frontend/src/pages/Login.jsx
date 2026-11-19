import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
      const response = await axios.post(`${apiBase}/api/v1/auth/login`, {
        email: formData.email.trim(),
        password: formData.password
      });
      localStorage.setItem('clan_token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/dashboard');
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Unable to sign in right now.',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] grid bg-slate-50 lg:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
      <section className="hidden min-h-[calc(100vh-80px)] flex-col justify-between overflow-hidden bg-indigo-950 p-10 text-white lg:flex xl:p-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-indigo-300">CLAN Benin City Deanery</p>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-[1.05] tracking-tight">
            Welcome back to your deanery workspace.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
            Review parish records, administration updates, and community information from one secure account.
          </p>
        </div>
        <p className="text-xs font-semibold text-indigo-300">Catholic Lectors Association of Nigeria</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Secure sign in</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use the email and password connected to your approved account.</p>
          </div>

          {message.text && (
            <div role="alert" className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              Email address
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                autoComplete="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <div className="mt-2 flex rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="current-password"
                  required
                  className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="px-4 text-xs font-bold text-indigo-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need access?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Request an account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
