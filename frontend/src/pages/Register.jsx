import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',        // Added Email
    phoneNumber: '',  // Added Phone
    password: '',
    confirmPassword: ''
  });

  const { username, email, phoneNumber, password, confirmPassword } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // Sending all data including email and phone
      const res = await axios.post('http://localhost:5001/api/users/register', {
        username,
        email,
        phoneNumber,
        password
      });

      console.log(res.data);
      alert('Registration successful! Please log in.');
      navigate('/login'); // Redirect to login after success
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '5rem' }}>
      <div className="glass-panel" style={{ padding: '3rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#fff' }}>Create Account</h2>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Username */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Username</label>
            <input
              className="glass-input"
              type="text"
              name="username"
              value={username}
              onChange={onChange}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Email (CRITICAL FIX: Backend requires this) */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Email Address</label>
            <input
              className="glass-input"
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Phone Number</label>
            <input
              className="glass-input"
              type="text"
              name="phoneNumber"
              value={phoneNumber}
              onChange={onChange}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Password</label>
            <input
              className="glass-input"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Confirm Password</label>
            <input
              className="glass-input"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            Sign Up
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
