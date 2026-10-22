import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, CheckCheck, Sparkles, Mic } from 'lucide-react';
import { MOCK_DRIVER } from '../../data/mockData';

export default function DriverChatDrawer({
  isOpen = false,
  onClose,
  onOpenCall,
  driver = MOCK_DRIVER,
}) {
  const passengerName = (() => {
    try {
      const stored = localStorage.getItem('fgdrivo_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.greetingName && u.greetingName !== 'Ashfar') return u.greetingName;
        if (u.name && u.name !== 'Ashfar Khan') return u.name.split(' ')[0];
      }
    } catch (e) {}
    return 'there';
  })();

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'driver',
      text: `Hello ${passengerName}! I have accepted your ride and am on my way in my ${driver.vehicle?.model || 'White Swift Dzire'}.`,
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickChips = [
    'I am at the main pickup gate',
    'Please turn on AC ❄️',
    'I have luggage with me 🧳',
    'Please call when you reach 📞',
    'Take Palani Road bypass',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Simulate driver typing and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let reply = 'Got it sir, I will follow your instructions!';
      const lower = text.toLowerCase();
      if (lower.includes('ac')) {
        reply = 'AC is already turned on at 22°C sir, see you shortly!';
      } else if (lower.includes('gate') || lower.includes('pickup') || lower.includes('at')) {
        reply = 'Understood! I will pull up right in front of the gate with hazard lights on.';
      } else if (lower.includes('luggage') || lower.includes('bag')) {
        reply = 'No problem at all! The car boot is empty and ready for your bags.';
      } else if (lower.includes('call')) {
        reply = 'Yes sir, I will ring you as soon as I reach the pin.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'driver',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1400);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(24, 15, 43, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '85%',
          height: '560px',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 30px rgba(36, 21, 63, 0.25)',
          borderTop: '2px solid #5427A8',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#5427A8',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundImage: `url(${driver.avatar})`,
                  backgroundSize: 'cover',
                  border: '2px solid #F5C400',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                  border: '2px solid #5427A8',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>{driver.name}</div>
              <div style={{ fontSize: '11px', color: '#E8DFF5' }}>
                {driver.vehicle?.model || 'Swift Dzire'} • {driver.vehicle?.licensePlate || 'TN-57-AB-1234'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenCall && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCall();
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#F5C400',
                  color: '#24153F',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(245, 196, 0, 0.4)',
                }}
                title="Call Driver"
              >
                <Phone size={17} strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#F8F6FD',
            borderBottom: '1px solid #E5DFF0',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
                backgroundColor: '#FFFFFF',
                border: '1px solid #D8CDF3',
                color: '#5427A8',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(84,39,168,0.06)',
                transition: 'all 0.15s ease',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Messages Feed */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#FBF9FE',
          }}
        >
          <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: '#ECE5F8',
                color: '#5427A8',
                padding: '3px 10px',
                borderRadius: '10px',
              }}
            >
              🔒 Messages are masked & encrypted for your safety
            </span>
          </div>

          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: isUser ? '16px' : '4px',
                    backgroundColor: isUser ? '#5427A8' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#24153F',
                    fontSize: '13.5px',
                    lineHeight: '1.45',
                    fontWeight: 500,
                    boxShadow: isUser
                      ? '0 3px 10px rgba(84, 39, 168, 0.25)'
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                    border: isUser ? 'none' : '1px solid #E5DFF0',
                  }}
                >
                  {m.text}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: '#8A7A9E',
                    marginTop: '3px',
                    padding: '0 4px',
                  }}
                >
                  <span>{m.time}</span>
                  {isUser && <CheckCheck size={13} color="#5427A8" />}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#FFFFFF', borderRadius: '14px', alignSelf: 'flex-start', border: '1px solid #E5DFF0' }}>
              <span style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>{driver.name} is typing</span>
              <span style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#5427A8' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#5427A8' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#5427A8' }} />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#FFFFFF',
            borderTop: '1.5px solid #E5DFF0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8F6FD',
              borderRadius: '24px',
              padding: '0 14px',
              border: '1.5px solid #E5DFF0',
            }}
          >
            <input
              type="text"
              placeholder={`Message ${driver.name.split(' ')[0]}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                height: '42px',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '13.5px',
                color: '#24153F',
                fontWeight: 600,
              }}
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: inputText.trim() ? '#F5C400' : '#ECE5F8',
              color: inputText.trim() ? '#24153F' : '#8A7A9E',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'default',
              boxShadow: inputText.trim() ? '0 3px 10px rgba(245, 196, 0, 0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
