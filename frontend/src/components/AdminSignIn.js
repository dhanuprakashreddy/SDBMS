import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const AdminSignIn = () => {
  const [form, setForm] = useState({
    adminId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.adminId || !form.password) {
      setError('Both fields are required.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/admin/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Sign in failed.');
      }
    } catch (err) {
      setError('Server error.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Sign-In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" name="adminId" placeholder="Admin ID" value={form.adminId} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          {error && <div className="error">{error}</div>}
          <div className="auth-buttons">
            <button type="submit">Sign In</button>
            <button type="button" className="secondary" onClick={() => navigate('/admin/forgot-password')}>Forgot Password?</button>
            <button type="button" className="secondary" onClick={() => navigate('/admin/signup')}>Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSignIn;
