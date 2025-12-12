import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Resume', key: 'nav.resume' },
    { path: '/ats-score', label: 'ATS Score', key: 'nav.atsScore' },
    { path: '/profile', label: 'Profile', key: 'nav.profile' }
  ];

  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '0.5rem',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.5rem'
    }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            background: isActive(item.path) 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))' 
              : 'transparent',
            color: isActive(item.path) 
              ? '#fff' 
              : 'rgba(255, 255, 255, 0.7)',
            border: isActive(item.path) 
              ? '1px solid rgba(255, 255, 255, 0.2)' 
              : '1px solid transparent',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            if (!isActive(item.path)) {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (!isActive(item.path)) {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          {t(item.key, item.label)}
        </Link>
      ))}
    </nav>
  );
}

export default Navbar;
