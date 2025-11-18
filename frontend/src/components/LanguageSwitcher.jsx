import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageSelect = (lng) => {
    i18n.changeLanguage(lng);
    // Optional: Automatically go to register/login after picking language?
    // For now, we just switch the language visually.
  };

  const btnStyle = {
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    margin: '0 10px',
    minWidth: '140px'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <button 
        className={i18n.language === 'en' ? 'btn-primary' : 'btn-secondary'}
        style={btnStyle}
        onClick={() => handleLanguageSelect('en')}
      >
        English
      </button>
      
      <button 
        className={i18n.language === 'hi' ? 'btn-primary' : 'btn-secondary'}
        style={btnStyle}
        onClick={() => handleLanguageSelect('hi')}
      >
        हिंदी
      </button>

      <button 
        className={i18n.language === 'or' ? 'btn-primary' : 'btn-secondary'}
        style={btnStyle}
        onClick={() => handleLanguageSelect('or')}
      >
        ଓଡ଼ିଆ
      </button>
    </div>
  );
}

export default LanguageSwitcher;
