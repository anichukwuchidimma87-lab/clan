import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
    try {
      const response = await axios.post(`${apiBase}/api/v1/auth/login`, formData);
      localStorage.setItem('clan_token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-semibold text-xs text-gray-600">
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-950 p-12 flex-col justify-between relative text-white">
        <div className="space-y-4 max-w-md z-10">
          <h2 className="text-4xl font-black text-white leading-none">Proclaiming the Word with Excellence.</h2>
          <p className="text-indigo-200">Welcome to the Benin City Deanery CLAN administrative gateway.</p>
        </div>
        <p className="z-10 text-indigo-400">© 2026 CLAN Benin City Deanery</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Admin Login</h2>
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">
            {loading ? 'Authenticating...' : 'Authorize Access'}
          </button>
          <p className="text-center">Don't have an account? <Link to="/register" className="text-indigo-600 font-bold">Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}