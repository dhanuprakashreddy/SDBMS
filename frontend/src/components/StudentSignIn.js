import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const StudentSignIn = () => {
  const [form, setForm] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.password) {
      setError('Both fields are required.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/student/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/student/dashboard');
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
        <h2>Student Sign-In</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} />
          <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
          {error && <div className="error">{error}</div>}
          <div className="auth-buttons">
            <button type="submit">Sign In</button>
            <button type="button" className="secondary" onClick={() => navigate('/student/forgot-password')}>Forgot Password?</button>
            <button type="button" className="secondary" onClick={() => navigate('/student/signup')}>Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSignIn;
