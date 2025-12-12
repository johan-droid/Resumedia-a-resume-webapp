import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import AIChatInterface from '../components/AIChatInterface';
import ResumePreview from '../components/ResumePreview';
import DashboardLayout from '../components/DashboardLayout';
import './Editor.css';

function Editor() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleResumeUpdate = () => {
    // Add a small delay to ensure backend has processed the update
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  return (
    <DashboardLayout showNav={true}>
      <div className="editor-container">
        <div className="editor-header">
          <h1 className="editor-title">
            {t('editor.chatOnlyTitle', 'Resume Studio')}
          </h1>
        </div>

        <div className="editor-grid">
          {/* Left Panel: Chat */}
          <AIChatInterface onTypstCodeUpdate={handleResumeUpdate} />

          {/* Right Panel: Preview */}
          <div className="editor-panel">
            <ResumePreview resumeId={id} refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Editor;
