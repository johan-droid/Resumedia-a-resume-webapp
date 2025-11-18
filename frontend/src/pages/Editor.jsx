import React from 'react';
import { useTranslation } from 'react-i18next';
import AIChatInterface from '../components/AIChatInterface';

function Editor() {
  const { t } = useTranslation();

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '1rem', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--accent-primary)', fontSize: '2rem' }}>
        {t('editor.chatOnlyTitle', 'AI Resume Assistant')}
      </h1>

      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
        {t(
          'editor.chatOnlySubtitle',
          'Use the assistant below to build and refine your resume content.'
        )}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          <AIChatInterface onTypstCodeUpdate={() => {}} />
        </div>
      </div>
    </div>
  );
}

export default Editor;
