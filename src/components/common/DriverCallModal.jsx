import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, User, Car } from 'lucide-react';
import { MOCK_DRIVER } from '../../data/mockData';

export default function DriverCallModal({
  isOpen = false,
  onClose,
  driver = MOCK_DRIVER,
}) {
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('connecting');
      setSeconds(0);
      setIsMuted(false);
      return;
    }

    // Connect after 1.8 seconds
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 1800);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isOpen && callStatus === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callStatus]);

  if (!isOpen) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(15, 8, 28, 0.96)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 24px 36px',
        color: '#FFFFFF',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Top Security & Masking Pill */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            color: '#F5C400',
            fontWeight: 700,
            border: '1px solid rgba(245, 196, 0, 0.3)',
          }}
        >
          <Shield size={12} />
          <span>Number Masked • 256-Bit VoIP Encrypted</span>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          FG DRIVO Direct Connect
        </div>
      </div>

      {/* Center Driver Identity & Pulsing Audio Waves */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
          {/* Animated audio rings */}
          {callStatus === 'connected' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  borderRadius: '50%',
                  border: '2px solid rgba(245, 196, 0, 0.4)',
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-24px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(84, 39, 168, 0.5)',
                  animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s',
                }}
              />
            </>
          )}

          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundImage: `url(${driver.avatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '3px solid #F5C400',
              boxShadow: '0 8px 30px rgba(245, 196, 0, 0.35)',
              position: 'relative',
              zIndex: 2,
            }}
          />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.3px' }}>
          {driver.name}
        </h2>
        <div style={{ fontSize: '13px', color: '#D8CDF3', marginBottom: '8px', fontWeight: 600 }}>
          {driver.vehicle?.model || 'White Swift Dzire'} • {driver.vehicle?.licensePlate || 'TN-57-AB-1234'}
        </div>

        <div
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: callStatus === 'connected' ? '#22C55E' : callStatus === 'ended' ? '#EF4444' : '#F5C400',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 16px',
            borderRadius: '14px',
            display: 'inline-block',
          }}
        >
          {callStatus === 'connecting'
            ? 'Calling Driver...'
            : callStatus === 'connected'
            ? `${formatTimer(seconds)}`
            : 'Call Ended'}
        </div>
      </div>

      {/* In-Call Controls & End Call Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
        {/* Secondary Toggles */}
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isSpeaker ? '#5427A8' : 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              border: isSpeaker ? '2px solid #F5C400' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>
        </div>

        {/* Big Red End Call Button */}
        <button
          onClick={handleEndCall}
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5)',
            transform: 'scale(1)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <PhoneOff size={30} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
