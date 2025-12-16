import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiChevronDown, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';
import './EnhancedResumeEditor.css';

const EnhancedResumeEditor = () => {
  const [resume, setResume] = useState({
    fullName: '',
    professionalTitle: '',
    contact: { phone: '', email: '' },
    summary: '',
    workExperience: [{ jobTitle: '', company: '', location: '', startDate: '', endDate: '', duties: [] }],
    education: '',
    skills: [],
    certifications: [],
    template: 'modern'
  });

  const [activeSection, setActiveSection] = useState('personal');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fields = [
      resume.fullName,
      resume.professionalTitle,
      resume.contact.email,
      resume.summary,
      resume.workExperience.some(w => w.company),
      resume.education,
      resume.skills.length > 0
    ];
    const completed = fields.filter(Boolean).length;
    setCompletionPercentage(Math.round((completed / fields.length) * 100));
  }, [resume]);

  const handleInputChange = (e, section, field) => {
    const { value } = e.target;
    setResume(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleWorkExperienceChange = (index, field, value) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addWorkExperience = () => {
    setResume(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        { jobTitle: '', company: '', location: '', startDate: '', endDate: '', duties: [] }
      ]
    }));
  };

  const removeWorkExperience = (index) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResume(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setResume(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCert.trim()) {
      setResume(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()]
      }));
      setNewCert('');
    }
  };

  const removeCertification = (index) => {
    setResume(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'summary', label: 'Professional Summary', icon: '📋' },
    { id: 'experience', label: 'Work Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'certifications', label: 'Certifications', icon: '🏆' }
  ];

  return (
    <div className="enhanced-editor">
      <motion.div className="editor-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header-left">
          <h1>Resume Builder</h1>
          <p>Create a professional resume with real-time preview</p>
        </div>
        <div className="header-actions">
          <motion.button
            className="btn-preview"
            onClick={() => setPreviewMode(!previewMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {previewMode ? '✏️ Edit' : '👁️ Preview'}
          </motion.button>
          <motion.button className="btn-save" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            💾 Save
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="completion-tracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="progress-info">
          <span className="progress-label">Profile Completion</span>
          <span className="progress-percentage">{completionPercentage}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <div className="editor-container">
        <motion.div className="editor-sidebar" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="section-nav">
            {sections.map((section) => (
              <motion.button
                key={section.id}
                className={`section-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-name">{section.label}</span>
                {section.id === activeSection && <div className="active-indicator" />}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="editor-main">
          <AnimatePresence mode="wait">
            {activeSection === 'personal' && (
              <SectionContent key="personal" title="Personal Information">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={resume.fullName}
                    onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label>Professional Title</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={resume.professionalTitle}
                    onChange={(e) => setResume({ ...resume, professionalTitle: e.target.value })}
                    placeholder="e.g., Certified Welder, HVAC Technician"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="glass-input"
                      value={resume.contact.email}
                      onChange={(e) => handleInputChange(e, 'contact', 'email')}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      className="glass-input"
                      value={resume.contact.phone}
                      onChange={(e) => handleInputChange(e, 'contact', 'phone')}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </SectionContent>
            )}

            {activeSection === 'summary' && (
              <SectionContent key="summary" title="Professional Summary">
                <div className="form-group">
                  <label>Summary</label>
                  <textarea
                    className="glass-input textarea"
                    value={resume.summary}
                    onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                    placeholder="Write a brief summary of your professional background and key qualifications..."
                    rows="6"
                  />
                  <div className="char-count">{resume.summary.length} / 500</div>
                </div>
              </SectionContent>
            )}

            {activeSection === 'experience' && (
              <SectionContent key="experience" title="Work Experience">
                <div className="experience-list">
                  {resume.workExperience.map((exp, idx) => (
                    <motion.div
                      key={idx}
                      className="experience-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="experience-header">
                        <h4>Position {idx + 1}</h4>
                        {resume.workExperience.length > 1 && (
                          <motion.button
                            className="btn-remove"
                            onClick={() => removeWorkExperience(idx)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiTrash2 />
                          </motion.button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Job Title</label>
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Job Title"
                            value={exp.jobTitle}
                            onChange={(e) => handleWorkExperienceChange(idx, 'jobTitle', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Company</label>
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Company Name"
                            value={exp.company}
                            onChange={(e) => handleWorkExperienceChange(idx, 'company', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Start Date</label>
                          <input 
                            type="month" 
                            className="glass-input"
                            value={exp.startDate}
                            onChange={(e) => handleWorkExperienceChange(idx, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input 
                            type="month" 
                            className="glass-input"
                            value={exp.endDate}
                            onChange={(e) => handleWorkExperienceChange(idx, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Location</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="City, State"
                          value={exp.location}
                          onChange={(e) => handleWorkExperienceChange(idx, 'location', e.target.value)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  className="btn-add-experience"
                  onClick={addWorkExperience}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiPlus /> Add Experience
                </motion.button>
              </SectionContent>
            )}

            {activeSection === 'education' && (
              <SectionContent key="education" title="Education">
                <div className="form-group">
                  <label>Education Details</label>
                  <textarea
                    className="glass-input textarea"
                    value={resume.education}
                    onChange={(e) => setResume({ ...resume, education: e.target.value })}
                    placeholder="e.g., High School Diploma, Lincoln High School (2018) or Trade School Certificate in Welding, Metro Technical Institute (2020)"
                    rows="4"
                  />
                </div>
              </SectionContent>
            )}

            {activeSection === 'skills' && (
              <SectionContent key="skills" title="Skills & Equipment">
                <div className="skills-input-group">
                  <input
                    type="text"
                    className="glass-input"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="e.g., Forklift Operation, Blueprint Reading, MIG Welding..."
                  />
                  <motion.button
                    className="btn-add-skill"
                    onClick={addSkill}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus />
                  </motion.button>
                </div>

                <div className="skills-grid">
                  {resume.skills.map((skill, idx) => (
                    <motion.div
                      key={idx}
                      className="skill-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <span>{skill}</span>
                      <motion.button
                        className="badge-remove"
                        onClick={() => removeSkill(idx)}
                        whileHover={{ scale: 1.1 }}
                      >
                        ×
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </SectionContent>
            )}

            {activeSection === 'certifications' && (
              <SectionContent key="certifications" title="Licenses & Certifications">
                <div className="skills-input-group">
                  <input
                    type="text"
                    className="glass-input"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                    placeholder="e.g., OSHA 10, CDL Class A, EPA 608 Universal..."
                  />
                  <motion.button
                    className="btn-add-skill"
                    onClick={addCertification}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus />
                  </motion.button>
                </div>

                <div className="skills-grid">
                  {resume.certifications.map((cert, idx) => (
                    <motion.div
                      key={idx}
                      className="skill-badge certification-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <span>{cert}</span>
                      <motion.button
                        className="badge-remove"
                        onClick={() => removeCertification(idx)}
                        whileHover={{ scale: 1.1 }}
                      >
                        ×
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </SectionContent>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className="editor-preview"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="preview-header">
            <h3>📄 Live Preview</h3>
            <span className="preview-badge">Real-time</span>
          </div>

          <motion.div className="preview-content" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {resume.fullName ? (
              <>
                <h2 className="preview-name">{resume.fullName}</h2>
                <p className="preview-title">{resume.professionalTitle}</p>

                {resume.contact.email && (
                  <div className="preview-contact">
                    <span>✉️ {resume.contact.email}</span>
                    {resume.contact.phone && <span>📱 {resume.contact.phone}</span>}
                  </div>
                )}

                {resume.summary && (
                  <div className="preview-section">
                    <p className="preview-text">{resume.summary}</p>
                  </div>
                )}

                {resume.certifications.length > 0 && (
                  <div className="preview-section">
                    <h4>Licenses & Certifications</h4>
                    <div className="preview-skills">
                      {resume.certifications.map((cert, idx) => (
                        <span key={idx} className="preview-cert-tag">{cert}</span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.skills.length > 0 && (
                  <div className="preview-section">
                    <h4>Skills & Equipment</h4>
                    <div className="preview-skills">
                      {resume.skills.map((skill, idx) => (
                        <span key={idx} className="preview-skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.workExperience.some(exp => exp.company) && (
                  <div className="preview-section">
                    <h4>Work Experience</h4>
                    {resume.workExperience.filter(exp => exp.company).map((exp, idx) => (
                      <div key={idx} className="preview-job">
                        <div className="job-header">
                          <strong>{exp.jobTitle}</strong> at {exp.company}
                        </div>
                        <div className="job-details">
                          {exp.location} • {exp.startDate} - {exp.endDate || 'Present'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="preview-empty">
                <BsLightningChargeFill size={40} />
                <p>Start filling your resume to see a preview</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const SectionContent = ({ title, children }) => (
  <motion.div
    className="section-content"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="section-title">{title}</h2>
    {children}
  </motion.div>
);

export default EnhancedResumeEditor;