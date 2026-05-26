import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  // FIXED: Changed default role to 'member' to match your system design rules
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const apiBase = import.meta.env.VITE_API_URL || 'https://clan-3slh.onrender.com';
    const url = `${apiBase}/api/v1/auth/register`;

    try {
      const response = await axios.post(url, formData);
      if (response.data.success || response.status === 201) {
        alert('Registration successful! You can now log in.');
        navigate('/login');
      }
    } catch (err) {
      console.error("Registration Error:", err);
      alert('Registration failed: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="p-6 max-w-sm w-full bg-white shadow-md rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Register to manage your deanery ledger</p>
        
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input 
          type="text" 
          placeholder="John Doe" 
          className="block w-full p-2.5 mb-4 border rounded-lg bg-gray-50 text-sm"
          required
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input 
          type="email" 
          placeholder="member@example.com" 
          className="block w-full p-2.5 mb-4 border rounded-lg bg-gray-50 text-sm"
          required
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          className="block w-full p-2.5 mb-6 border rounded-lg bg-gray-50 text-sm"
          required
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />

        <button 
          type="submit" 
          disabled={loading}
          className={`p-2.5 w-full rounded-lg font-semibold text-sm text-white transition ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;