import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member' });
  const [commissionedStatus, setCommissionedStatus] = useState('Not Commissioned');
  const [yearCommissioned, setYearCommissioned] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
    try {
      const payload = {
        ...formData,
        yearCommissioned: commissionedStatus === 'Commissioned' && yearCommissioned ? Number(yearCommissioned) : null
      };
      await axios.post(`${apiBase}/api/v1/auth/register`, payload);
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
          <div className="grid gap-3">
            <label className="block text-slate-600 text-xs font-semibold">Commissioned Status</label>
            <select
              value={commissionedStatus}
              className="w-full p-3 border rounded-xl"
              onChange={(e) => {
                setCommissionedStatus(e.target.value);
                if (e.target.value !== 'Commissioned') {
                  setYearCommissioned('');
                }
              }}
            >
              <option value="Commissioned">Commissioned</option>
              <option value="Not Commissioned">Not Commissioned</option>
            </select>
          </div>
          {commissionedStatus === 'Commissioned' && (
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-2">Year Commissioned</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                placeholder="Enter year commissioned"
                className="w-full p-3 border rounded-xl"
                value={yearCommissioned}
                onChange={(e) => setYearCommissioned(e.target.value)}
                required
              />
              <p className="mt-2 text-[11px] text-slate-500">Select the year you were commissioned. Leave this blank if you are not commissioned.</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold">
            {loading ? 'Processing...' : 'Register Account'}
          </button>
          <p className="text-center">Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}