import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const resumeRes = await axios.get('http://localhost:5001/api/resumes/myresumes', config);
        setResumes(resumeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Handle Create New Resume - Direct creation with default template
  const createNewResume = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(t('auth.unauthorized', 'Please log in to create a resume'));
        return;
      }

      // Default to skills-first
      const payload = { template: 'skills-first' };
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('http://localhost:5001/api/resumes', payload, config);

      const newResumeId = res.data?._id;
      if (newResumeId) {
        navigate(`/editor/${newResumeId}`);
      }
    } catch (err) {
      console.error('Error creating resume:', err);
      const errorMessage = err.response?.data?.message || t('resume.error', 'Error creating resume');
      alert(errorMessage);

      // If token is invalid/expired, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  if (isLoading) {
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
    <DashboardLayout showNav={true}>
      <div className="fade-in">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.subtitle', 'Manage your projects and explore AI features.')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '4rem'
        }}>
          {/* Create New Resume Card */}
          <div
            onClick={createNewResume}
            className="glass-panel"
            style={{
              gridColumn: 'span 2',
              minHeight: '250px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '3rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
                + {t('dashboard.newResume', 'New Resume')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                {t('dashboard.newResumeDesc', 'Start a blank canvas or let our AI guide you.')}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              right: '-50px',
              bottom: '-50px',
              width: '200px',
              height: '200px',
              background: 'var(--accent-primary)',
              filter: 'blur(80px)',
              opacity: 0.3,
              zIndex: 1
            }}></div>
          </div>

          <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '0' }}>
              {resumes.length}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('dashboard.totalResumes', 'Total Resumes')}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
