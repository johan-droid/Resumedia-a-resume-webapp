import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ResumePreview = ({ resumeId, refreshKey }) => {
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPDF = async () => {
            if (!resumeId) {
                setError('No resume ID provided');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to view preview');
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                };

                // Fetch the PDF from backend
                const response = await axios.get(`http://localhost:5001/api/resumes/${resumeId}/pdf`, config);

                // Revoke old URL if exists
                if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                }

                // Create blob URL for preview
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
            } catch (err) {
                console.error("PDF fetch error:", err);
                setError("Failed to load resume preview.");
            } finally {
                setLoading(false);
            }
        };

        fetchPDF();

        // Cleanup blob URL on unmount
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [resumeId, refreshKey]); // Refresh when resumeId or refreshKey changes

    const handleDownload = async () => {
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
            link.download = 'resume.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Download failed", e);
            alert("PDF download failed. Please try again.");
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)'
            }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Live Preview</h3>
                <button
                    onClick={handleDownload}
                    disabled={loading || !pdfUrl}
                    className="btn-primary"
                    style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem',
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Loading...' : 'Download PDF'}
                </button>
            </div>

            <div style={{
                flexGrow: 1,
                overflow: 'auto',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                background: '#525659'
            }}>
                {loading && !pdfUrl && (
                    <div style={{ color: 'white', padding: '2rem' }}>Generating preview...</div>
                )}

                {error && (
                    <div style={{ color: '#ff6b6b', padding: '2rem' }}>{error}</div>
                )}

                {!error && pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '4px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}
                        title="Resume Preview"
                    />
                )}
            </div>
        </div>
    );
};

export default ResumePreview;
