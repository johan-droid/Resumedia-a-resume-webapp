import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import AIChatInterface from '../components/AIChatInterface';

function Editor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [typstCode, setTypstCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTypstCode = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const config = { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain'
          } 
        };
        
        const res = await axios.get(`http://localhost:5001/api/resumes/${id}/typst`, config);
        setTypstCode(res.data);
      } catch (err) {
        console.error('Error fetching Typst code:', err);
        setError(err.response?.data?.message || t('editor.fetchError', 'Failed to load resume data.'));
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTypstCode();
  }, [id, navigate, t]);

  // Function to save the Typst code directly from the editor
  const handleSaveCode = async () => {
    // NOTE: This PUT endpoint needs to be created in resumeRoutes.js 
    // to update the Typst code field on the Resume model.
    alert(t('editor.saveAlert', 'Typst code changes saved! (Backend PUT route required)'));
    // Future: const res = await axios.put(`http://localhost:5001/api/resumes/${id}`, { typstCode }, config);
  };
  
  // Update Typst code state from the AIChatInterface
  const handleTypstCodeUpdate = (newCode) => {
    setTypstCode(newCode);
  };

  // --- 1. Fetch Typst Code (Modified to use handleTypstCodeUpdate) ---
  useEffect(() => {
    const fetchTypstCode = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const config = { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/plain' 
          } 
        };
        
        const res = await axios.get(`http://localhost:5001/api/resumes/${id}/typst`, config);
        handleTypstCodeUpdate(res.data);
      } catch (err) {
        console.error('Error fetching Typst code:', err);
        setError(err.response?.data?.message || t('editor.fetchError', 'Failed to load resume data.'));
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTypstCode();
  }, [id, navigate, t]);

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <p>{t('editor.loading', 'Loading Editor...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          {t('common.retry', 'Try Again')}
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1600px', marginTop: '1rem', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--accent-primary)', fontSize: '2rem' }}>
        {t('editor.title', 'Resume Editor (Typst)')}
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.5fr 1.5fr', 
        gap: '20px', 
        marginTop: '2rem',
        minHeight: '70vh'
      }}>
        
        {/* Left Panel: Gemini Chat - Using the dedicated component */}
        <AIChatInterface onTypstCodeUpdate={handleTypstCodeUpdate} />
        
        {/* Middle Panel: Typst Code Editor */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff' }}>
            {t('editor.typstCode', 'Typst Code')}
          </h3>
          <textarea 
            style={{ 
              flexGrow: 1, 
              width: '100%', 
              minHeight: '400px',
              fontFamily: 'monospace', 
              fontSize: '0.9rem',
              padding: '10px',
              background: 'rgba(0,0,0,0.1)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            value={typstCode}
            onChange={(e) => setTypstCode(e.target.value)}
            placeholder="// Your Typst code will load here"
          />
          <button onClick={handleSaveCode} className="btn-primary" style={{ marginTop: '1rem' }}>
            {t('editor.saveCode', 'Save Changes')}
          </button>
        </div>
        
        {/* Right Panel: Live PDF Preview */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#fff' }}>
            {t('editor.pdfPreview', 'PDF Preview')}
          </h3>
          <div style={{ 
            flexGrow: 1, 
            background: '#fff', 
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            fontSize: '1.2rem',
            padding: '2rem',
            textAlign: 'center',
            backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, #ffffff 25%, #ffffff 50%, #f5f5f5 50%, #f5f5f5 75%, #ffffff 75%, #ffffff 100%)',
            backgroundSize: '20px 20px'
          }}>
            {t('editor.previewPlaceholder', 'Conceptual PDF Render Area. Typst compilation logic would go here.')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
