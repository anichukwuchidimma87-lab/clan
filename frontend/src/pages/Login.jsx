import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/login`, formData);
      
      // 1. Store the user data
      localStorage.setItem('clanUser', JSON.stringify(response.data));
      
      // 2. CRITICAL: Set the flag your ProtectedRoute is looking for
      localStorage.setItem('isLoggedIn', 'true'); 
      
      alert('Login Successful! Welcome, ' + response.data.name);
      
      // 3. Navigate to dashboard
      navigate('/dashboard'); 
      
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl mb-4 font-bold">Admin Login</h2>
      <input 
        type="email" placeholder="Email" className="block w-full p-2 mb-2 border"
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
      />
      <input 
        type="password" placeholder="Password" className="block w-full p-2 mb-4 border"
        onChange={(e) => setFormData({...formData, password: e.target.value})} 
      />
      <button type="submit" className="bg-blue-600 text-white p-2 w-full">Login</button>
    </form>
  );
};

export default Login;