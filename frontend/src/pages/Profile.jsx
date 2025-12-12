import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const { data } = await axios.get('http://localhost:5001/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [navigate]);

  if (isLoading || !user) {
    return (
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh'
      }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={t('profile.title', 'Profile')}
    >
      <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {user.username?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{user.username}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Blue-collar account</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', rowGap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
            <span>{user.email || '-'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
            <span>{user.phoneNumber || '-'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
