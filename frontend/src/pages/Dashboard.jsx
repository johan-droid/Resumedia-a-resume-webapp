import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import './Dashboard.css';

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hoveredResumeId, setHoveredResumeId] = useState(null);

  const templates = [
    {
      id: 'skills-first',
      name: 'Skills First',
      description: 'Highlight your core competencies upfront',
      icon: '⭐',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 'chronological',
      name: 'Chronological',
      description: 'Traditional timeline of your experience',
      icon: '📅',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean and contemporary design',
      icon: '✨',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Stand out with unique formatting',
      icon: '🎨',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  ];

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

  // Handle Create New Resume with template selection
  const handleCreateResume = async (templateId) => {
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert(t('auth.unauthorized', 'Please log in to create a resume'));
        return;
      }

      const payload = { template: templateId };
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('http://localhost:5001/api/resumes', payload, config);
      const newResumeId = res.data?._id;

      if (newResumeId) {
        setShowTemplateModal(false);
        setTimeout(() => {
          navigate(`/editor/${newResumeId}`);
        }, 300);
      }
    } catch (err) {
      console.error('Error creating resume:', err);
      const errorMessage = err.response?.data?.message || t('resume.error', 'Error creating resume');
      alert(errorMessage);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const getResumeIcon = (index) => {
    const icons = ['⭐', '📋', '📑'];
    return icons[index % icons.length];
  };

  if (isLoading) {
    return (
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh'
      }}>
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout showNav={true}>
      <div className="dashboard-container fade-in">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="header-title">Dashboard</h1>
            <p className="header-subtitle">
              {t('dashboard.subtitle', 'Manage your projects and explore AI features.')}
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{resumes.length}</span>
              <span className="stat-label">Resumes Created</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Create New Resume Card - Enhanced */}
          <div
            onClick={() => setShowTemplateModal(true)}
            className="create-resume-card glass-panel"
          >
            <div className="card-glow"></div>
            <div className="card-content">
              <div className="create-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h2 className="create-title">{t('dashboard.newResume', 'Create New Resume')}</h2>
              <p className="create-subtitle">
                {t('dashboard.newResumeDesc', 'Choose from modern templates and let AI help you')}
              </p>
              <div className="create-footer">
                <span className="badge">AI-Powered</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-column">
            {/* Total Resumes */}
            <div className="stat-card glass-panel">
              <div className="stat-card-icon">📄</div>
              <div className="stat-card-content">
                <div className="stat-card-value">{resumes.length}</div>
                <div className="stat-card-label">Total Resumes</div>
              </div>
              <div className="stat-card-arrow">→</div>
            </div>

            {/* Quick Stats */}
            <div className="stat-card glass-panel accent">
              <div className="stat-card-icon">⚡</div>
              <div className="stat-card-content">
                <div className="stat-card-value">Ready</div>
                <div className="stat-card-label">To Download</div>
              </div>
              <div className="stat-card-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Recent Resumes Section */}
        {resumes.length > 0 && (
          <div className="recent-section">
            <h3 className="section-title">Your Resumes</h3>
            <div className="resumes-list">
              {resumes.slice(0, 3).map((resume, index) => (
                <div
                  key={resume._id}
                  className="resume-item glass-panel"
                  onClick={() => navigate(`/editor/${resume._id}`)}
                  onMouseEnter={() => setHoveredResumeId(resume._id)}
                  onMouseLeave={() => setHoveredResumeId(null)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="resume-item-icon">{getResumeIcon(index)}</div>
                  <div className="resume-item-content">
                    <h4 className="resume-item-name">{resume.title || 'Untitled Resume'}</h4>
                    <p className="resume-item-date">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="resume-item-actions">
                    {hoveredResumeId === resume._id && (
                      <>
                        <button className="action-btn edit-btn" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editor/${resume._id}`);
                        }} title="Edit">
                          ✎
                        </button>
                        <button className="action-btn download-btn" title="Download">
                          ⬇
                        </button>
                      </>
                    )}
                    <div className="resume-item-arrow">→</div>
                  </div>
                </div>
              ))}
            </div>
            {resumes.length > 3 && (
              <button 
                className="view-all-btn"
                onClick={() => navigate('/myresumes')}
              >
                View All Resumes →
              </button>
            )}
          </div>
        )}

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
              <button 
                className="modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ✕
              </button>

              <div className="modal-header">
                <h2>Choose Your Template</h2>
                <p>Select a design that matches your style</p>
              </div>

              <div className="templates-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div
                      className="template-preview"
                      style={{ background: template.color }}
                    >
                      <span className="template-emoji">{template.icon}</span>
                    </div>
                    <div className="template-info">
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="template-check">✓</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowTemplateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleCreateResume(selectedTemplate || 'skills-first')}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Resume'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;