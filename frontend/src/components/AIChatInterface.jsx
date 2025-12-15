// frontend/src/components/AIChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AIChatInterface.css';

const conversationalFlow = [
  { step: 'name_role', role: 'ai', content: "Let's get rolling. What's your **full name** and **professional title** (e.g., Welder, Truck Driver)?" },
  { step: 'education', role: 'ai', content: "Great! What's your **education level**? (e.g., High School Diploma, Certificate, Associates Degree)" },
  { step: 'dob', role: 'ai', content: "Got it. What's your **date of birth**? (Month Day, Year is perfect)." },
  { step: 'location', role: 'ai', content: "Where are you based? Please share your **city and state/region**." },
  { step: 'skills', role: 'ai', content: "Excellent! What are your **key skills**? (List them separated by commas. E.g., Welding, Forklift Operation, Safety)" },
  { step: 'certifications', role: 'ai', content: "What **certifications** do you hold? (E.g., OSHA 10, CDL, ASE)" },
  { step: 'experience', role: 'ai', content: "Now tell me about your **work experience**. (Job title, company, dates, and key responsibilities)" },
  { step: 'free_form', role: 'ai', content: "Perfect! I can now help you refine your resume. What else would you like to add or change?" }
];

function AIChatInterface({ onTypstCodeUpdate }) {
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: conversationalFlow[0].content }]);
  const [chatInput, setChatInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeId, setResumeId] = useState(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Initialize resume on mount
  useEffect(() => {
    const initializeResume = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resumes`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResumeId(response.data._id);
        // Add initial timestamp to first message
        setChatHistory(prev => [{ ...prev[0], timestamp: new Date() }]);
      } catch (err) {
        setError('Failed to initialize resume');
        console.error(err);
      }
    };
    initializeResume();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || !resumeId || isAiTyping) return;

    setIsAiTyping(true);
    setError(null);

    try {
      // Add user message to chat
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);
      setChatInput('');

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Call AI Chat endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resumes/${resumeId}/ai/chat`,
        {
          message,
          conversationHistory: updatedHistory.map(({ role, content }) => ({ role, content })) // Send only role/content to backend
        },
        config
      );

      // Backend returns { response: "text", ... } but we were checking .message
      const content = response.data.response || response.data.message || "I'm having trouble connecting right now.";

      const aiResponse = {
        role: 'ai',
        content: content,
        timestamp: new Date()
      };

      // Update chat with AI response
      setChatHistory(prev => [...prev, aiResponse]);

      // Move to next step if not in free-form mode
      if (currentStep < conversationalFlow.length - 1) {
        setCurrentStep(currentStep + 1);
      }

      // Trigger preview update
      if (onTypstCodeUpdate) {
        onTypstCodeUpdate();
      }

    } catch (err) {
      // Handle 429 specifically if it ever bubbles up
      if (err.response && err.response.status === 429) {
        setError("I'm receiving too many messages. Please wait a moment.");
      } else {
        setError(err.response?.data?.message || 'Failed to send message');
      }
      console.error('Chat error:', err);

      // Remove failed user message
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="editor-panel chat-interface">
      {/* Header */}
      <div className="chat-header">
        <div className="avatar-container ai-avatar-header">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ResumediaAI" alt="AI" />
          <div className="status-indicator online"></div>
        </div>
        <div className="header-info">
          <h3 className="chat-title">AI Assistant</h3>
          <span className="chat-status">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-area custom-scroll">
        {chatHistory.map((message, index) => (
          <div key={index} className={`message-wrapper ${message.role}`}>
            {message.role === 'ai' && (
              <div className="message-avatar">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ResumediaAI" alt="AI" />
              </div>
            )}
            <div className="chat-bubble">
              <div
                className="message-content"
                dangerouslySetInnerHTML={{
                  __html: message.role === 'ai'
                    ? (message.content || '').replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')
                    : (message.content || '')
                }}
              />
              <span className="message-time">
                {formatTime(message.timestamp || new Date())}
                {message.role === 'user' && <span className="read-receipt">✓✓</span>}
              </span>
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="message-wrapper ai">
            <div className="message-avatar">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ResumediaAI" alt="AI" />
            </div>
            <div className="chat-bubble typing">
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleChatSubmit} className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your details here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit(e);
              }
            }}
            disabled={isAiTyping}
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