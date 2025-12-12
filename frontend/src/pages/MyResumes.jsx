import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/DashboardLayout';

function MyResumes() {
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
            <div className="fade-in">
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Resumes</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Manage and edit your created resumes.
                    </p>
                </div>

                {resumes.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No resumes found. Go to Dashboard to create one!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {resumes.map(resume => (
                            <div key={resume._id} className="glass-panel" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'transform 0.2s',
                                ':hover': { transform: 'translateX(5px)' }
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                                        {resume.fullName || 'Untitled Resume'}
                                    </h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {resume.professionalTitle || 'Standard Resume'} • {new Date(resume.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn-secondary" onClick={() => handleEdit(resume._id)}>
                                        Edit
                                    </button>
                                    <button className="btn-secondary" onClick={() => handleDownload(resume._id, resume.fullName)}>
                                        PDF
                                    </button>
                                    <button className="btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(resume._id, resume.fullName)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default MyResumes;
