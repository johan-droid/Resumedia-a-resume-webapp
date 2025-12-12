import React, { useEffect, useState } from 'react';
import ResumeForm from '../components/ResumeForm';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  // Handle Edit - Navigate to editor
  const handleEdit = (resumeId) => {
    navigate(`/editor/${resumeId}`);
  };

  // Handle Download - Fetch PDF from backend
  const handleDownload = async (resumeId, resumeName) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to download');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      };

      const response = await axios.get(`http://localhost:5001/api/resumes/${resumeId}/pdf`, config);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeName || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  // Handle Delete - Delete resume from database
  const handleDelete = async (resumeId, resumeName) => {
    if (!window.confirm(`Are you sure you want to delete "${resumeName || 'this resume'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5001/api/resumes/${resumeId}`, config);

      setResumes(resumes.filter(resume => resume._id !== resumeId));
      alert('Resume deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete resume. Please try again.');
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
      {showForm ? (
        <div className="fade-in">
          <button
            className="btn-secondary"
            onClick={() => setShowForm(false)}
            style={{
              marginBottom: '2rem',
              fontSize: '0.9rem',
              border: 'none',
              paddingLeft: 0,
              color: 'var(--text-secondary)',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
          <ResumeForm />
        </div>
      ) : (
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
            <div
              onClick={() => setShowForm(true)}
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
      )}
    </DashboardLayout>
  );
}

export default Dashboard;
