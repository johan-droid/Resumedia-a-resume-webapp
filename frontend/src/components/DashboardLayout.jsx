import React from 'react';
import Sidebar from './Sidebar';

function DashboardLayout({ title, subtitle, children, showNav = true }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Render Sidebar on the left */}
      {showNav && <Sidebar />}

      {/* Main Content Area */}
      {/* The class 'dashboard-content' will handle the margin-left to match Sidebar width */}
      <div className={showNav ? "dashboard-content" : ""} style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ maxWidth: '1400px', padding: '2rem 3rem' }}>
          {/* Header Section (Title only now, since Nav is on the side) */}
          {(title || subtitle) && (
            <div style={{ marginBottom: '2.5rem' }}>
              {title && (
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', lineHeight: 1.1 }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Page Content */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
