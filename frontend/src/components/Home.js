import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const handleStudentClick = () => {
        navigate('/student');
    };

    const handleAdminClick = () => {
        navigate('/admin/login');
    };

    return (
        <div className="home-container">
            <h1>Student Database Management System</h1>
            <div className="button-container">
                <button className="home-button" onClick={handleStudentClick}>
                    Student
                </button>
                <button className="home-button" onClick={handleAdminClick}>
                    Admin
                </button>
            </div>
        </div>
    );
};

export default Home;