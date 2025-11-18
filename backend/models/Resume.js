const mongoose = require('mongoose');

const workExperienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  startDate: String,
  endDate: String,
  duties: [String],
});

const resumeSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      ref: 'User' 
    },
    fullName: { type: String, required: true },
    professionalTitle: { type: String, required: true }, // e.g., "Certified Welder", "Commercial Driver"
    contact: {
      phone: String,
      email: String,
    },
    template: {
      type: String,
      default: 'skills-first',
    },
    summary: String,
    workExperience: [workExperienceSchema],
    skills: [String], // e.g., "Forklift Operation", "Blueprint Reading"
    certifications: [String], // e.g., "OSHA 10", "CDL Class A"
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
