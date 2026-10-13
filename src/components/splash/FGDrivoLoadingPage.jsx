import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

export default function FGDrivoLoadingPage({
  onFinish,
  autoTransition = true,
  durationMs = 3200
}) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Connecting to FG DRIVO network...');

  useEffect(() => {
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStatusText('Connecting to secure servers...');
      } else if (pct < 65) {
        setStatusText('Locating nearby drivers in Dindigul...');
      } else if (pct < 95) {
        setStatusText('Applying best fare guarantees...');
      } else {
        setStatusText('Ready to Ride!');
      }

      if (pct >= 100) {
        clearInterval(interval);
        if (autoTransition && onFinish) {
          setTimeout(() => {
            onFinish();
          }, 350);
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, autoTransition, onFinish]);

  const handleSkip = (e) => {
    if (e) e.stopPropagation();
    if (onFinish) onFinish();
  };

  const handleRestart = (e) => {
    if (e) e.stopPropagation();
    setProgress(0);
  };

  return (
    <div
      onClick={handleSkip}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background Poster Image */}
      <img
        src="/fg_drivo_loading_page.jpg"
        alt="FG DRIVO Loading Page"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Action Controls on Top */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          right: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 30,
        }}
      >
        <button
          onClick={handleRestart}
          title="Replay Loading"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(84, 39, 168, 0.15)',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#5427A8',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
          }}
        >
          <RotateCcw size={12} />
          <span>Replay</span>
        </button>

        <button
          onClick={handleSkip}
          title="Skip to App"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 12px',
            backgroundColor: 'rgba(84, 39, 168, 0.92)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#FFFFFF',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(84, 39, 168, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Skip</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Animated Glowing Radar Pulse over GPS Pin (Positioned at approx 49% top, 81% left) */}
      <div
        style={{
          position: 'absolute',
          top: '49.2%',
          left: '81.2%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(84, 39, 168, 0.35)',
            animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      </div>

      {/* Animated Headlight Glint / Beam over Car Headlights */}
      <div
        style={{
          position: 'absolute',
          top: '58.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '78%',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 235, 150, 0.8) 0%, rgba(245, 196, 0, 0) 70%)',
            animation: 'pulse 1.4s ease-in-out infinite alternate',
          }}
        />
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 235, 150, 0.8) 0%, rgba(245, 196, 0, 0) 70%)',
            animation: 'pulse 1.4s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Dynamic Animated Progress Bar Overlay (Precision aligned over the image's loading capsule) */}
      <div
        style={{
          position: 'absolute',
          top: '76.8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '64%',
          height: '13px',
          borderRadius: '10px',
          backgroundColor: 'rgba(235, 230, 248, 0.85)',
          padding: '2px',
          overflow: 'hidden',
          zIndex: 20,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12), 0 2px 8px rgba(84, 39, 168, 0.1)',
        }}
      >
        {/* Animated Gradient Fill */}
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #F5C400 0%, #E6B000 45%, #5427A8 100%)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'width 0.12s linear',
            boxShadow: '0 0 10px rgba(245, 196, 0, 0.5)',
          }}
        >
          {/* Moving Gloss Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '30px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)',
              animation: 'loadingShimmer 1.2s infinite linear',
            }}
          />
        </div>
      </div>

      {/* Percentage & Status Feedback */}
      <div
        style={{
          position: 'absolute',
          top: '80%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '2px 10px',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            border: '1px solid rgba(84,39,168,0.1)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8' }}>
            {progress}%
          </span>
          <span style={{ fontSize: '10px', color: '#6B5B7D', fontWeight: 600 }}>
            • {statusText}
          </span>
        </div>
      </div>

      {/* Bottom Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: '#8A7A9E',
            fontWeight: 600,
            letterSpacing: '0.2px',
          }}
        >
          Tap anywhere to continue
        </span>
      </div>

      <style>{`
        @keyframes loadingShimmer {
          0% { transform: translateX(-30px); }
          100% { transform: translateX(260px); }
        }
      `}</style>
    </div>
  );
}
