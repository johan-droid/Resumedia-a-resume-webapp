import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    const location = useLocation();
    const activeHref = location.pathname;

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'My Resumes', href: '/resumes', icon: '📄' },
        { label: 'ATS Score', href: '/ats-score', icon: '📈' },
        { label: 'Profile', href: '/profile', icon: '👤' }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">Resumedia</h2>
            </div>
            <nav className="sidebar-nav">
                <ul className="sidebar-list">
                    {navItems.map((item, index) => (
                        <li key={index} className="sidebar-item">
                            <Link
                                to={item.href}
                                className={`sidebar-link ${activeHref === item.href ? 'active' : ''}`}
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                <span className="sidebar-label">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}

export default Sidebar;
