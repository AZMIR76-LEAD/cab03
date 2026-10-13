import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, Smartphone } from 'lucide-react';

export default function DeviceFrame({
  children,
  currentScreenId,
  screenTitle = '',
  platform = 'ios', // 'ios' or 'android'
  showBezel = true,
  isEdgeToEdge = false,
}) {
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isLightScreen = ['s01_splash', 's02_onboarding', 's03_login', 's07_home', 's29_profile'].includes(currentScreenId);

  // When rendered in edge-to-edge mobile mode (e.g. mobile device or 375px viewport)
  if (isEdgeToEdge) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: isLightScreen ? '#F0F4FA' : '#1E1236',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Status Bar */}
        <div
          style={{
            height: '38px',
            padding: '6px 16px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
            fontSize: '12px',
            fontWeight: 600,
            color: isLightScreen ? '#0F172A' : '#FFFFFF',
            flexShrink: 0,
            userSelect: 'none',
            backgroundColor: isLightScreen ? 'transparent' : 'rgba(30, 18, 54, 0.95)',
          }}
        >
          <span>{currentTime}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: isLightScreen ? '#0F172A' : '#F5C400' }}>5G</span>
            <Wifi size={13} color={isLightScreen ? '#0F172A' : '#FFFFFF'} />
            <Battery size={14} color={isLightScreen ? '#0F172A' : '#FFFFFF'} />
          </div>
        </div>

        {/* Screen Scrollable Viewport */}
        <div
          id="mobile-screen-scroll-container"
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            height: 'calc(100% - 38px)',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 8px',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Phone Hardware Mockup Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '390px',
          height: 'min(844px, calc(100vh - 140px))',
          minHeight: '600px',
          backgroundColor: isLightScreen ? '#F4F7FC' : '#1E1236',
          borderRadius: showBezel ? '44px' : '20px',
          border: showBezel ? '10px solid #24153F' : '1px solid rgba(84, 39, 168, 0.25)',
          boxShadow: showBezel
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 0 2px rgba(84, 39, 168, 0.5), 0 0 45px rgba(245, 196, 0, 0.15)'
            : 'var(--shadow-lg)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 300ms ease',
        }}
      >
        {/* iOS Dynamic Island / Android Camera Punch hole */}
        {showBezel && platform === 'ios' && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110px',
              height: '28px',
              backgroundColor: '#000000',
              borderRadius: '20px',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              boxShadow: '0 0 2px rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0A121E' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#070B12', border: '1.5px solid #121A26' }} />
          </div>
        )}

        {showBezel && platform === 'android' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#000000',
              borderRadius: '50%',
              zIndex: 50,
              border: '2px solid #182231',
            }}
          />
        )}

        {/* Status Bar */}
        <div
          style={{
            height: '44px',
            padding: '12px 24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
            fontSize: '13px',
            fontWeight: 600,
            color: isLightScreen ? '#0F172A' : '#FFFFFF',
            flexShrink: 0,
            userSelect: 'none',
            backgroundColor: isLightScreen ? '#F4F7FC' : 'transparent',
          }}
        >
          <span>{currentTime}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: isLightScreen ? '#0F172A' : '#F5C400' }}>5G</span>
            <Wifi size={14} color={isLightScreen ? '#0F172A' : '#FFFFFF'} />
            <Battery size={15} color={isLightScreen ? '#0F172A' : '#FFFFFF'} />
          </div>
        </div>

        {/* Screen Scrollable Viewport */}
        <div
          id="mobile-screen-scroll-container"
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>

        {/* Home Swipe Indicator (iOS) */}
        {platform === 'ios' && (
          <div
            style={{
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: isLightScreen ? '#FFFFFF' : '#1E1236',
              zIndex: 40,
            }}
          >
            <div
              style={{
                width: '134px',
                height: '4px',
                backgroundColor: isLightScreen ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.4)',
                borderRadius: '4px',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
