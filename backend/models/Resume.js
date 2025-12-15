const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  duties: [{ type: String }],
});

const resumeSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'User' 
    },
    fullName: { type: String, required: true },
    professionalTitle: { type: String, required: true }, 
    contact: { 
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    education: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    location: { type: String, default: '' },
    experienceSummary: { type: String, default: '' },
    jobStatus: { type: String, default: '' },
    template: { type: String, default: 'skills-first' },
    summary: { type: String, default: '' },
    workExperience: [workExperienceSchema],
    skills: [{ type: String }],
    certifications: [{ type: String }],
  },
  { timestamps: true }
);

// Validation method
resumeSchema.methods.validateForPDF = function() {
  const errors = [];
  if (!this.fullName || this.fullName.trim() === '') errors.push('Full name is required');
  if (!this.professionalTitle || this.professionalTitle.trim() === '') errors.push('Professional title is required');
  if (!this.contact.email || this.contact.email.trim() === '') errors.push('Email is required');
  return { isValid: errors.length === 0, errors };
};

module.exports = mongoose.model('Resume', resumeSchema);
