import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import '../pages/Editor.css';

// Structure to define the initial conversational steps
const conversationalFlow = [
  { step: 'name_role', role: 'ai', content: "Let's get rolling. What's your **full name** and what type of work do you do? (Example: Maria Smith, Certified Welder)" },
  { step: 'education', role: 'ai', content: "Thanks! What's your **education or trade school / certifications**? (Example: High School Diploma, OSHA 10)." },
  { step: 'dob', role: 'ai', content: "Got it. What's your **date of birth**? (Month Day, Year is perfect)." },
  { step: 'location', role: 'ai', content: "Where are you based? Please share your **city and state/region**." },
  { step: 'experience', role: 'ai', content: "Tell me about your **most recent job**. Include the company, your role, key duties, and approximate dates." },
  { step: 'job_status', role: 'ai', content: "Are you **still working there** or when/why did you leave?" },
  { step: 'skills', role: 'ai', content: "Finally, list your **key skills, tools, and licenses**. Separate them with commas (e.g., MIG Welding, Forklift Certified)." },
  { step: 'complete', role: 'ai', content: "Awesome. I have the basics saved. Ask for bullet rewrites, more skills, or anything else you need." },
];

function AIChatInterface({ onTypstCodeUpdate }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  // Start at step 0 to initiate the first question
  const [currentStep, setCurrentStep] = useState(0);
  const chatEndRef = useRef(null);

  // Scroll to bottom on update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Start the initial conversation flow ONLY ONCE
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([conversationalFlow[0]]);
    }
  }, [chatHistory.length]);

  // Function to save resume data and trigger a full Typst update
  const saveResumeData = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return { success: false, error: t('auth.unauthorized', 'Please log in again to continue.') };
    }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Save data to the database using the new PUT route
      await axios.put(`http://localhost:5001/api/resumes/${id}`, data, config);

      // 2. Fetch the newly generated Typst code based on the updated data
      const typstRes = await axios.get(`http://localhost:5001/api/resumes/${id}/typst`, config);

      // 3. Update the editor state in the parent component
      onTypstCodeUpdate(typstRes.data);

      return { success: true };
    } catch (err) {
      console.error('Error saving resume data and updating Typst:', err);
      const backendMessage = err.response?.data?.message;
      return {
        success: false,
        error:
          backendMessage ||
          t('chat.saveError', 'I failed to save that data. Please try again.'),
      };
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || isAiTyping) return;

    const newUserMessage = { role: 'user', content: message };

    // Optimistically add user message
    setChatHistory((prev) => [...prev, newUserMessage]);
    setChatInput('');
    setIsAiTyping(true);

    const stepInfo = conversationalFlow[currentStep];
    let nextStepIndex = currentStep;
    let aiResponseText = '';
    let dataToSave = {};
    let saveResult = { success: true };
    let skipSaveForValidation = false;
    let validationMessage = '';

    // 1. Process User Input based on the current step
    switch (stepInfo.step) {
      case 'name_role':
        const parts = message.split(',').map(p => p.trim()).filter(Boolean);
        const fullName = parts[0] || '';
        const professionalTitle = parts[1] || parts[0]?.split(' ').slice(-1).join(' ') || 'Professional';
        if (!fullName) {
          skipSaveForValidation = true;
          validationMessage = t('chat.fullNameRequired', 'Please share your full name. Example: "Maria Smith, Certified Welder".');
          break;
        }
        dataToSave = { fullName, professionalTitle };
        nextStepIndex = 1;
        break;

      case 'education':
        if (message.length < 2) {
          skipSaveForValidation = true;
          validationMessage = t('chat.educationRequired', 'Please share your schooling, trade program, or certifications.');
          break;
        }
        dataToSave = { education: message };
        nextStepIndex = 2;
        break;

      case 'dob':
        dataToSave = { dateOfBirth: message };
        nextStepIndex = 3;
        break;

      case 'location':
        if (message.length < 2) {
          skipSaveForValidation = true;
          validationMessage = t('chat.locationRequired', 'Please share a city and state so we know where you are based.');
          break;
        }
        dataToSave = { location: message };
        nextStepIndex = 4;
        break;

      case 'experience':
        dataToSave = { experienceSummary: message };
        nextStepIndex = 5;
        break;

      case 'job_status':
        dataToSave = { jobStatus: message };
        nextStepIndex = 6;
        break;

      case 'skills':
        const skillsList = message.split(',').map((s) => s.trim()).filter(Boolean);
        if (!skillsList.length) {
          skipSaveForValidation = true;
          validationMessage = t('chat.skillsRequired', 'Please list at least one skill or tool separated by commas.');
          break;
        }
        dataToSave = { skills: skillsList, certifications: skillsList };
        nextStepIndex = 7;
        break;

      case 'complete':
      default:
        // 2. If flow is complete, use the general AI Chat API for suggestions
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const historyForAPI = chatHistory.map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          content: m.content.replace(/\*+/g, '') // Send clean text to AI
        }));

        try {
          const res = await axios.post(`http://localhost:5001/api/resumes/${id}/ai/chat`, {
            message: message,
            history: historyForAPI
          }, config);
          aiResponseText = res.data.response;
        } catch (err) {
          aiResponseText = t('chat.chatApiError', 'I am having trouble connecting to the AI service. Please check your API key setup.');
          saveResult = { success: false };
        }
        nextStepIndex = conversationalFlow.length - 1; // Stay on the complete step
        break;
    }

    const shouldSave = !skipSaveForValidation && stepInfo.step !== 'complete';

    if (skipSaveForValidation) {
      aiResponseText = validationMessage;
      nextStepIndex = currentStep;
    } else if (shouldSave) {
      saveResult = await saveResumeData(dataToSave);
      if (saveResult.success) {
        aiResponseText = conversationalFlow[nextStepIndex].content;
      } else {
        aiResponseText = saveResult.error;
        nextStepIndex = currentStep; // Stay on the same step
      }
    }

    // 4. Update state
    setChatHistory((prev) => [...prev, { role: 'ai', content: aiResponseText }]);
    setCurrentStep(nextStepIndex);
    setIsAiTyping(false);
  };

  return (
    <div className="editor-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--accent-primary)',
          display: 'grid',
          placeItems: 'center'
        }}>
          🤖
        </div>
        <div>
          <h3 className="panel-title">{t('editor.aiChat', 'AI Assistant')}</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-area custom-scroll">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${message.role === 'user' ? 'user' : 'ai'}`}
          >
            {message.content.replace(/\*\*/g, '')}
          </div>
        ))}
        {isAiTyping && (
          <div className="chat-bubble ai">
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleChatSubmit} className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-textarea custom-scroll"
            placeholder={t('editor.chatPlaceholder', 'Type your details here...')}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit(e);
              }
            }}
            disabled={isAiTyping}
            rows={1}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={isAiTyping || !chatInput.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AIChatInterface;
