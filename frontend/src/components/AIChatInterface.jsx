import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

// Structure to define the initial conversational steps
const conversationalFlow = [
  // Step 0: Start conversation
  { step: 'start', role: 'ai', content: "Welcome! I'm your AI Resume Assistant. Let's start building your resume. What is your **full name** and **professional title** (e.g., 'Certified Welder')? Please separate them with a comma." },
  // Step 1: Ask for contact
  { step: 'ask_contact', role: 'ai', content: "Great! Now, please provide your **email address** and **phone number** so employers can contact you. Please use a comma to separate them (e.g., email@example.com, 555-123-4567)." },
  // Step 2: Ask for summary
  { step: 'ask_summary', role: 'ai', content: "Next, tell me about your career goals and key strengths. Please provide a **short professional summary** (2-3 sentences)." },
  // Step 3: Ask for skills
  { step: 'ask_skills', role: 'ai', content: "Perfect. What are your **top 5-10 job-related skills** and any **certifications** you hold? Please list them all, separated by commas (e.g., MIG Welding, Forklift Certified, OSHA 10)." },
  // Step 4: Complete
  { step: 'complete', role: 'ai', content: "Awesome! We have your foundation data. Feel free to use the editor to refine your content, or ask me for suggestions. I'm ready to help you with your work experience!" },
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
      return false;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 1. Save data to the database using the new PUT route
      await axios.put(`http://localhost:5001/api/resumes/${id}`, data, config);

      // 2. Fetch the newly generated Typst code based on the updated data
      const typstRes = await axios.get(`http://localhost:5001/api/resumes/${id}/typst`, config);

      // 3. Update the editor state in the parent component
      onTypstCodeUpdate(typstRes.data);

      return true; // Success
    } catch (err) {
      console.error('Error saving resume data and updating Typst:', err);
      return false; // Failure
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
    let saveSuccessful = true;

    // 1. Process User Input based on the current step
    switch (stepInfo.step) {
      case 'start':
        // Expecting: Full Name, Professional Title
        const parts = message.split(',').map(p => p.trim());
        dataToSave = {
          fullName: parts[0] || '',
          professionalTitle: parts[1] || ''
        };
        nextStepIndex = 1;
        break;

      case 'ask_contact':
        // Expecting: Email, Phone Number
        const contactParts = message.split(',').map(p => p.trim());
        dataToSave = {
          contact: {
            email: contactParts[0] || '',
            phone: contactParts[1] || ''
          }
        };
        nextStepIndex = 2;
        break;

      case 'ask_summary':
        // Expecting: Professional Summary
        dataToSave = { summary: message };
        nextStepIndex = 3;
        break;

      case 'ask_skills':
        // Expecting: Skills and Certifications
        const skillsList = message.split(',').map(s => s.trim()).filter(s => s.length > 0);
        dataToSave = {
          skills: skillsList,
          certifications: skillsList // Simplified: use the same input for both for now
        };
        nextStepIndex = 4;
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
          saveSuccessful = false;
        }
        nextStepIndex = 4; // Stay on the complete step
        break;
    }

    // 3. Save data and update history if it's a foundation step (0-3)
    if (currentStep <= 3) {
      saveSuccessful = await saveResumeData(dataToSave);
      if (saveSuccessful) {
        aiResponseText = conversationalFlow[nextStepIndex].content;
      } else {
        aiResponseText = t('chat.saveError', 'I failed to save that data. Please try again.');
        nextStepIndex = currentStep; // Stay on the same step
      }
    }

    // 4. Update state
    setChatHistory((prev) => [...prev, { role: 'ai', content: aiResponseText }]);
    setCurrentStep(nextStepIndex);
    setIsAiTyping(false);
  };

  return (
    <div className="glass-panel" style={{
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      height: '100%',
      maxHeight: 'calc(100vh - 200px)'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.2rem',
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}>
        🤖 {t('editor.aiChat', 'AI Resume Assistant')}
      </h3>

      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        marginBottom: '1rem',
        padding: '10px',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '200px'
      }}>
        {/* Chat History */}
        {chatHistory.map((message, index) => (
          <div
            key={index}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: '15px',
              background: message.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: '1.4'
            }}
          >
            {message.content}
          </div>
        ))}
        {isAiTyping && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '8px 12px',
            borderRadius: '15px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={handleChatSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          flexShrink: 0
        }}
      >
        <div style={{ position: 'relative' }}>
          <textarea
            rows="2"
            name="chatInput"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit(e);
              }
            }}
            disabled={isAiTyping}
            style={{
              width: '100%',
              padding: '10px 40px 10px 10px',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              overflowY: 'auto',
              paddingRight: '40px'
            }}
            placeholder={t('editor.chatPlaceholder', 'Type your message here...')}
          />
          <button
            type="submit"
            disabled={isAiTyping || !chatInput.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              background: 'transparent',
              border: 'none',
              color: chatInput.trim() ? 'var(--accent-primary)' : '#666',
              cursor: chatInput.trim() && !isAiTyping ? 'pointer' : 'default',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: chatInput.trim() ? 1 : 0.6
            }}
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

export default AIChatInterface;
