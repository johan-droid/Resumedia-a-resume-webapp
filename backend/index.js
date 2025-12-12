require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resumeRoutes = require('./routes/resumeRoutes');
const authRoutes = require('./routes/authRoutes');
const atsRoutes = require('./routes/atsRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allows cross-origin requests
app.use(express.json()); // Parses incoming JSON payloads

// Routes
app.get('/', (req, res) => {
  res.send('Resumedia API is running...');
});

app.use('/api/users', authRoutes);
app.use('/api/resumes', resumeRoutes); // All resume routes will be prefixed
app.use('/api/ats', atsRoutes); // ATS routes

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
