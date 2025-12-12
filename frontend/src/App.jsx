import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import Navbar from './components/Navbar';

// Import Pages
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import ATSScore from './pages/ATSScore';
import Profile from './pages/Profile';
import MyResumes from './pages/MyResumes';

function Home() {
  const { t } = useTranslation();

  return (
    <div className="container" style={{ textAlign: 'center', height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Background Glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          zIndex: -1, pointerEvents: 'none'
        }}></div>

        {/* Big Title */}
        <h1 style={{
          fontSize: '5rem',
          marginBottom: '1rem',
          background: '-webkit-linear-gradient(0deg, #fff, #a5b4fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t('appName', { defaultValue: 'Resumedia' })}
        </h1>

        {/* Slogan */}
        <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          {t('appSlogan', { defaultValue: 'The Resume Builder for Blue-Collar Professionals' })}
        </p>

        {/* CENTERED LANGUAGE OPTIONS */}
        <div style={{ marginBottom: '3rem' }}>
          <LanguageSwitcher />
        </div>

        {/* --- NEW: ACCOUNT ACTIONS SECTION --- */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          marginTop: '1rem'
        }}>
          {/* Register Link (Highlighted) */}
          <Link to="/register" style={{ color: 'var(--text-secondary)', fontSize: '1rem', textDecoration: 'none' }}>
            New here? <span style={{ color: '#a5b4fc', fontWeight: 'bold', textDecoration: 'underline' }}>Create Account</span>
          </Link>

          {/* Vertical Divider */}
          <div style={{ width: '1px', height: '15px', background: 'var(--text-secondary)', opacity: 0.3 }}></div>

          {/* Login Link */}
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '1rem', textDecoration: 'none' }}>
            Existing user? <span style={{ color: 'white', fontWeight: 'bold', textDecoration: 'underline' }}>Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: '800', fontSize: '1.5rem', color: 'white', textDecoration: 'none', letterSpacing: '-1px' }}>
            Resume<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </Link>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resumes" element={<MyResumes />} />
            <Route path="/ats-score" element={<ATSScore />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
