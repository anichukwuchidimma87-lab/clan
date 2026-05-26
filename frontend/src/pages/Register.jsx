import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
    try {
      await axios.post(`${apiBase}/api/v1/auth/register`, formData);
      alert('Registration successful!');
      navigate('/login');
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch font-semibold text-xs text-gray-600">
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-950 p-12 flex-col justify-between relative text-white">
        <h2 className="text-4xl font-black text-white leading-none">Join the Administration Hub.</h2>
        <p className="text-indigo-200">Register to coordinate your parish and deanery ledger.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <form onSubmit={handleSubmit} className="max-w-md w-full space-y-4">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Create Account</h2>
          <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">
            {loading ? 'Processing...' : 'Register Account'}
          </button>
          <p className="text-center">Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}