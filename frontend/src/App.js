import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import AdminSignIn from './components/AdminSignIn';
import AdminSignUp from './components/AdminSignUp';
import AdminForgotPassword from './components/AdminForgotPassword';
import AdminDashboard from './components/AdminDashboard';
import StudentSignIn from './components/StudentSignIn';
import StudentSignUp from './components/StudentSignUp';
import StudentForgotPassword from './components/StudentForgotPassword';
import StudentDashboard from './components/StudentDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminSignIn />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/student" element={<StudentSignIn />} />
        <Route path="/student/signup" element={<StudentSignUp />} />
        <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;