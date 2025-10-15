import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const StudentSignUp = () => {
  const [form, setForm] = useState({ studentId: '', name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await fetch('http://localhost:5000/api/student/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/student');
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
        <h2>Student Sign-Up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} />
          <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} />
          {error && <div className="error">{error}</div>}
          <div className="auth-buttons">
            <button type="submit" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
            <button type="button" className="secondary" onClick={() => navigate('/student')}>Already have an account? Sign In</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSignUp;
