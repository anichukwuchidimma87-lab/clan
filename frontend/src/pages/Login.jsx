import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false); // Added loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Debug: Check if the URL is actually being picked up
    const apiBase = import.meta.env.VITE_API_URL;
    console.log("Connecting to:", `${apiBase}/api/v1/login`);

    try {
      const response = await axios.post(`${apiBase}/api/v1/login`, formData);
      
      // Store data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('isLoggedIn', 'true');
      
      navigate('/dashboard');
    } catch (err) {
      console.error("Login Error:", err);
      alert('Login failed: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl mb-4 font-bold">Admin Login</h2>
      <input 
        type="email" 
        placeholder="Email" 
        className="block w-full p-2 mb-2 border"
        required
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
      />
      <input 
        type="password" 
        placeholder="Password" 
        className="block w-full p-2 mb-4 border"
        required
        onChange={(e) => setFormData({...formData, password: e.target.value})} 
      />
      <button 
        type="submit" 
        disabled={loading}
        className={`p-2 w-full ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default Login;