import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';

function ATSScore() {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score counter
  useEffect(() => {
    if (analysis?.analysis?.totalScore || analysis?.analysis?.overallScore) {
      const targetScore = analysis.analysis.totalScore || analysis.analysis.overallScore;
      const duration = 2000;
      const steps = 60;
      const increment = targetScore / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
          setAnimatedScore(targetScore);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [analysis]);

  const handleFileSelect = (file) => {
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
      setError(null);
      handleAnalyze(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleAnalyze = async (file) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setAnimatedScore(0);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to analyze resumes');
        setIsAnalyzing(false);
        return;
      }

      const formData = new FormData();
      formData.append('resume', file);

      const response = await axios.post('http://localhost:5001/api/ats/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });

      setAnalysis(response.data);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreRating = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <DashboardLayout
      title={t('ats.title', 'ATS Score Checker')}
      subtitle={t('ats.subtitle', "Analyze your resume's compatibility with Applicant Tracking Systems")}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Upload Section */}
        {!analysis && (
          <div className="glass-panel" style={{
            padding: '3rem',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              marginBottom: '1rem',
              fontSize: '1.5rem',
              color: '#fff'
            }}>
              Select Resume to Analyze
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              Upload your resume to check its ATS compatibility
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging
                  ? '3px dashed var(--accent-primary)'
                  : '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                background: isDragging
                  ? 'rgba(99, 102, 241, 0.1)'
                  : 'rgba(255, 255, 255, 0.03)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => !isAnalyzing && document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={isAnalyzing}
              />

              {isAnalyzing ? (
                <div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(99, 102, 241, 0.2)',
                    borderTop: '4px solid var(--accent-primary)',
                    borderRadius: '50%',
                    margin: '0 auto 1rem',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                    Analyzing your resume...
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Our AI is validating and scoring your resume
                  </p>
                </div>
              ) : (
                <>
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: '0 auto 1rem' }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p style={{
                    fontSize: '1.2rem',
                    color: '#fff',
                    marginBottom: '0.5rem'
                  }}>
                    {uploadedFile ? uploadedFile.name : 'Drop your resume here or click to browse'}
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Supports PDF and DOCX files (max 10MB)
                  </p>
                </>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && analysis.success && (
          <div>
            {/* Score Display */}
            <div className="glass-panel" style={{
              padding: '3rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                marginBottom: '0.5rem',
                fontSize: '1.5rem',
                color: '#fff'
              }}>
                ATS Score Analysis
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                fontSize: '0.95rem'
              }}>
                {analysis.fileName}
              </p>

              {/* Circular Score Counter */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    ${getScoreColor(animatedScore)} ${animatedScore * 3.6}deg,
                    rgba(255, 255, 255, 0.1) 0deg
                  )`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  boxShadow: `0 0 30px ${getScoreColor(animatedScore)}40`
                }}>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: 'rgba(17, 24, 39, 0.95)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{
                      fontSize: '3.5rem',
                      fontWeight: 'bold',
                      color: getScoreColor(animatedScore)
                    }}>
                      {animatedScore}%
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.5rem'
                    }}>
                      {getScoreRating(animatedScore)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strengths and Improvements */}
              {analysis.analysis && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  textAlign: 'left',
                  marginTop: '2rem'
                }}>
                  {analysis.analysis.strengths && analysis.analysis.strengths.length > 0 && (
                    <div>
                      <h4 style={{
                        color: '#10b981',
                        marginBottom: '1rem',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Strengths
                      </h4>
                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {analysis.analysis.strengths.map((strength, idx) => (
                          <li key={idx} style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            paddingLeft: '1.5rem',
                            position: 'relative'
                          }}>
                            <span style={{
                              position: 'absolute',
                              left: 0,
                              color: '#10b981'
                            }}>•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.analysis.suggestions && analysis.analysis.suggestions.length > 0 && (
                    <div>
                      <h4 style={{
                        color: '#f59e0b',
                        marginBottom: '1rem',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Areas to Improve
                      </h4>
                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {analysis.analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx} style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            paddingLeft: '1.5rem',
                            position: 'relative'
                          }}>
                            <span style={{
                              position: 'absolute',
                              left: 0,
                              color: '#f59e0b'
                            }}>•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setAnalysis(null);
                  setUploadedFile(null);
                  setAnimatedScore(0);
                }}
              >
                Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add spinning animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default ATSScore;
