import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const AdminSignUp = () => {
  const [form, setForm] = useState({
    adminId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!form.adminId || !form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }

    
    if (form.adminId.length < 4) {
      setError('Admin ID must be at least 4 characters long.');
      return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      
      const { confirmPassword, ...payload } = form;
      const res = await fetch('http://localhost:5000/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/admin/login');
      } else {
        setError(data.message || 'Sign up failed.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Sign-Up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            name="adminId" 
            placeholder="Admin ID (minimum 4 characters)" 
            value={form.adminId} 
            onChange={handleChange}
            minLength="4"
          />
          <input 
            type="text" 
            name="name" 
            placeholder="Name" 
            value={form.name} 
            onChange={handleChange} 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={handleChange}
          />
          <input 
            type="text" 
            name="phone" 
            placeholder="Phone" 
            value={form.phone} 
            onChange={handleChange} 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
          />
          <input 
            type="password" 
            name="confirmPassword" 
            placeholder="Confirm Password" 
            value={form.confirmPassword} 
            onChange={handleChange} 
          />
          {error && <div className="error">{error}</div>}
          <div className="auth-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
            <button 
              type="button" 
              className="secondary" 
              onClick={() => navigate('/admin/login')}
              disabled={loading}
            >
              Already have an account? Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSignUp;
