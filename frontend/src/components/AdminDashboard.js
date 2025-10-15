
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAuth.css';


const getToken = () => localStorage.getItem('admin_token');

const fetchWithAuth = (url, options = {}) => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};

const emptyForm = { studentId: '', name: '', email: '', phone: '' };

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [toast, setToast] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

 
  useEffect(() => { fetchStudents(); }, []);


  
  const getToken = () => localStorage.getItem('admin_token');

  
  const fetchWithAuth = (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
  };

  
  const fetchStudents = async () => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      } else if (res.status === 401) {
        setToast('Session expired. Please sign in again.');
        setTimeout(() => window.location.href = '/admin', 1500);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const sendTemp = async (studentId) => {
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/send-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message || 'Temporary password sent or logged.');
        if (data.tempPassword) setToast(`Temp: ${data.tempPassword}`);
      } else if (res.status === 401) {
        setToast('Unauthorized. Please sign in again.');
        setTimeout(() => window.location.href = '/admin', 1200);
      } else {
        setToast((data.message || 'Failed') + (data.detail ? ' - ' + data.detail : ''));
      }
    } catch (err) {
      console.error('Error sending temp password', err);
      setToast('Server error.');
    }
  };

  const refresh = fetchStudents;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('http://localhost:5000/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message || 'Created');
  setForm({ studentId: '', name: '', email: '', phone: '' });
        setCreating(false);
        await refresh();
      } else {
        setToast((data.message || 'Error') + (data.detail ? ' - ' + data.detail : ''));
      }
    } catch (err) {
      console.error(err);
      setToast('Server error');
    }
  };


  
  const startEdit = (s) => setEditingId(s.studentId) || setEditForm({ name: s.name || '', email: s.email || '', phone: s.phone || '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/students/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message || 'Updated');
        setEditingId(null);
        await refresh();
      } else {
        setToast((data.message || 'Error') + (data.detail ? ' - ' + data.detail : ''));
      }
    } catch (err) {
      console.error(err);
      setToast('Server error');
    }
  };

  const handleDelete = async (studentId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:5000/api/admin/students/${studentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setToast(data.message || 'Deleted');
        await refresh();
      } else {
        setToast((data.message || 'Error') + (data.detail ? ' - ' + data.detail : ''));
      }
    } catch (err) {
      console.error(err);
      setToast('Server error');
    }
    setConfirmDeleteId(null);
  };


  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Dashboard</h2>
        <div>
          <h3>Students</h3>
          {students.length === 0 ? (
            <form onSubmit={handleCreate} style={{ marginTop: 8 }}>
              <input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div>
                <button type="submit">Create</button>
              </div>
            </form>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Student ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td>{s.studentId}</td><td>{s.name}</td><td>{s.email}</td><td>{s.phone}</td>
                      <td>
                        <button onClick={() => sendTemp(s.studentId)}>Send Temp Password</button>
                        <button style={{ marginLeft: 8 }} onClick={() => startEdit(s)}>Edit</button>
                        <button style={{ marginLeft: 8 }} onClick={() => setConfirmDeleteId(s.studentId)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {toast && <div className="info" style={{ marginTop: 8 }}>{toast}</div>}
              <div style={{ marginTop: 12 }}>
                {creating ? (
                  <form onSubmit={handleCreate} style={{ marginTop: 8 }}>
                    <input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
                    <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <div>
                      <button type="submit">Create</button>
                      <button type="button" onClick={() => setCreating(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setCreating(true)}>Create Student</button>
                )}
              </div>
            </>
          )}
          {editingId && (
            <div style={{ marginTop: 12 }}>
              <h4>Editing {editingId}</h4>
              <form onSubmit={handleUpdate}>
                <input placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <input placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                <input placeholder="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                <div>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          
          {confirmDeleteId && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 300, boxShadow: '0 2px 8px #0002' }}>
                <div style={{ marginBottom: 16 }}>Delete student <b>{confirmDeleteId}</b>?</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => handleDelete(confirmDeleteId)} style={{ background: '#d9534f', color: '#fff' }}>Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="secondary" onClick={() => navigate('/')}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
