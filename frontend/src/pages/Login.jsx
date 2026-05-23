import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/login`, formData);
      // Store the token and user info securely
      localStorage.setItem('clanUser', JSON.stringify(response.data));
      alert('Login Successful! Welcome, ' + response.data.name);
      window.location.href = '/dashboard';
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
      <button className="bg-blue-600 text-white p-2 w-full">Login</button>
    </form>
  );
};

export default Login;