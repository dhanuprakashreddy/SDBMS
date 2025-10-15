import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const AdminForgotPassword = () => {
  const [adminId, setAdminId] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminId || !email) {
      setMessage('Please enter Admin ID and Email.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'If the details are correct, you will receive password reset instructions.');
      } else {
        const detail = data.detail ? ` (${data.detail})` : '';
        setMessage((data.message || 'Unable to process request.') + detail);
      }
    } catch (err) {
      console.error('Forgot password request failed:', err);
      setMessage('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" name="adminId" placeholder="Admin ID" value={adminId} onChange={e => setAdminId(e.target.value)} />
          <input type="email" name="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            {message && <div className="info">{message}</div>}
            <div className="auth-buttons">
              <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Reset Password'}</button>
              <button type="button" className="secondary" onClick={() => navigate('/admin/login')}>Back to Sign In</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
