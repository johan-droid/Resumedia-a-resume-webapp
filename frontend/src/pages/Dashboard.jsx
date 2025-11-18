import React, { useEffect, useState } from 'react';
import ResumeForm from '../components/ResumeForm';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
        // navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

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
    <div className="container" style={{ maxWidth: '1200px', marginTop: '2rem', paddingBottom: '4rem' }}>
      {showForm ? (
        // Form View
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
        // Dashboard View
        <div className="fade-in">
          {/* Header */}
          <div style={{ 
            marginBottom: '2.5rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'end' 
          }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {t('dashboard.subtitle', 'Manage your projects and explore AI features.')}
              </p>
            </div>
            <span style={{ 
              padding: '0.5rem 1rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              color: '#a5b4fc' 
            }}>
              {t('dashboard.plan', 'Basic Plan')}
            </span>
          </div>

          {/* Bento Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px', 
            marginBottom: '4rem' 
          }}>
            {/* Main Action Card */}
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

            {/* Stats Card */}
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

          {/* Resumes List */}
          <h3 style={{ 
            marginBottom: '1.5rem', 
            borderBottom: '1px solid var(--glass-border)', 
            paddingBottom: '1rem' 
          }}>
            {t('dashboard.yourDocuments', 'Your Documents')}
          </h3>
          
          {resumes.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '20px' 
            }}>
              {resumes.map((resume) => (
                <div 
                  key={resume._id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    ':hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>
                    {resume.fullName || t('dashboard.untitled', 'Untitled Resume')}
                  </h4>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--accent-secondary)',
                    marginBottom: '1rem'
                  }}>
                    {resume.professionalTitle || t('dashboard.noTitle', 'No title')}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    <button 
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        flex: 1
                      }}
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                    <button 
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        flex: 1
                      }}
                    >
                      {t('common.download', 'Download')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '3rem 0'
            }}>
              {t('dashboard.noResumes', 'No resumes found. Click the big card above to create your first one!')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
