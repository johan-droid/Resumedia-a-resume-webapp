import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

function ResumeForm() {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState('skills-first');

  // Typst Templates Configuration - Simplified to 2 options
  const templates = [
    {
      id: 'skills-first',
      name: t('resume.templates.skillsFirst', 'Skills-First'),
      color: '#6366f1',
      desc: t(
        'resume.templates.skillsFirstDesc',
        'Skills and certifications at the top. Perfect for trades, manufacturing, and logistics.'
      ),
    },
    {
      id: 'chronological',
      name: t('resume.templates.chronological', 'Chronological'),
      color: '#10b981',
      desc: t(
        'resume.templates.chronologicalDesc',
        'Traditional work history focused layout. Clear timeline of your experience.'
      ),
    },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert(t('auth.unauthorized', 'Please log in to create a resume'));
        return;
      }

      const payload = { template: selectedTemplate };
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post('http://localhost:5001/api/resumes', payload, config);
      console.log('Resume Created:', res.data);

      const newResumeId = res.data?._id;
      if (newResumeId) {
        window.location.href = `/editor/${newResumeId}`;
      }
    } catch (err) {
      console.error('Error creating resume:', err);
      const errorMessage = err.response?.data?.message || t('resume.error', 'Error creating resume');
      alert(errorMessage);

      // If token is invalid/expired, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '1rem',
        color: 'var(--accent-primary)',
        fontSize: '2.2rem'
      }}>
        {t('resume.createTitle', 'Create Your Resume')}
      </h1>
      <p style={{
        textAlign: 'center',
        color: 'var(--text-secondary)',
        marginBottom: '3rem',
        fontSize: '1.1rem'
      }}>
        {t('resume.subtitle', 'Enter your details and choose a high-performance Typst template.')}
      </p>

      <form onSubmit={onSubmit}>
        {/* TEMPLATE SELECTION ONLY */}
        <div className="glass-panel" style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-lg)'
        }}>
          <h3 style={{
            marginBottom: '1.5rem',
            color: '#fff',
            fontSize: '1.3rem',
            fontWeight: 600
          }}>
            1. {t('resume.chooseTemplate', 'Choose Typst Template')}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                style={{
                  cursor: 'pointer',
                  border: selectedTemplate === tmpl.id
                    ? `2px solid ${tmpl.color}`
                    : '1px solid var(--glass-border)',
                  backgroundColor: selectedTemplate === tmpl.id
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: tmpl.color,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '1.2rem'
                }}>
                  {tmpl.name.charAt(0)}
                </div>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  color: '#fff',
                  fontSize: '1.1rem'
                }}>
                  {tmpl.name}
                </h4>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {tmpl.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          {t('resume.createButton', 'Create & Open Editor')}
        </button>
      </form>
    </div>
  );
}

export default ResumeForm;
