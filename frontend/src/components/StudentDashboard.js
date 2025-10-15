import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';

const StudentDashboard = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password) {
      setMessage('Please enter a new password.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      
      setMessage('Password changed successfully!');
    } catch (err) {
      setMessage('Error changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Student Dashboard</h2>
        <form onSubmit={handleChangePassword} className="auth-form">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {message && <div className="info">{message}</div>}
          <div className="auth-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/')}>Logout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentDashboard;
