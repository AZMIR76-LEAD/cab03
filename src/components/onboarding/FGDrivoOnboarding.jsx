import React, { useState, useEffect } from 'react';
import {
  Car, Shield, CheckCircle2, ChevronRight, ArrowLeft,
  MapPin, Star, Share2, Compass, Radio, Sparkles, Zap,
  Check, Lock, ShieldCheck, Navigation, Clock, Award
} from 'lucide-react';
import RideXLogo from '../common/RideXLogo';

export default function FGDrivoOnboarding({ onNavigate }) {
  const [slide, setSlide] = useState(0);
  const [lang, setLang] = useState('en'); // 'en' or 'ta'
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [isCopied, setIsCopied] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const content = {
    en: [
      {
        step: '01 — MADE FOR YOUR JOURNEY',
        badge: 'Local Rides • District • Outstation',
        headline: 'Your Ride, Right Around Dindigul.',
        desc: 'From daily quick commutes to journeys across the district, find verified and reliable drivers in seconds.',
        highlight: 'Local rides • District travel • Outstation',
        cta: 'Next',
        secondary: 'Skip',
      },
      {
        step: '02 — KNOW BEFORE YOU GO',
        badge: 'Fixed Fares • Live GPS • No Surge',
        headline: 'Your Ride. Your Fare. No Guesswork.',
        desc: 'Choose your vehicle, see locked upfront fares, bargain transparently, and track your driver in real time.',
        highlight: 'Clear fares • Live tracking • Ride updates',
        cta: 'Next',
        secondary: 'Back',
      },
      {
        step: '03 — RIDE WITH CONFIDENCE',
        badge: 'Police Verified • SOS 24/7 • Share Trip',
        headline: 'Every Trip, With Peace of Mind.',
        desc: 'Verified drivers, licensed vehicles, instant emergency SOS support, and live family trip sharing on every ride.',
        highlight: 'Verified details • Trip sharing • Safety support',
        cta: 'Get Started',
        secondary: 'Back',
      },
    ],
    ta: [
      {
        step: '01 — உங்கள் பயணத்திற்கு ஏற்றது',
        badge: 'உள்ளூர் பயணம் • மாவட்டப் பயணம் • வெளியூர்',
        headline: 'திண்டுக்கல்லைச் சுற்றி, உங்கள் பயணம் இனி எளிது.',
        desc: 'திண்டுக்கல் நகரப் பயணங்களிலிருந்து மாவட்டம் முழுவதும், உங்களுக்குத் தேவையான நேரத்தில் நம்பகமான சவாரியைப் பெறுங்கள்.',
        highlight: 'உள்ளூர் பயணம் • மாவட்டப் பயணம் • வெளியூர் பயணம்',
        cta: 'அடுத்து',
        secondary: 'தவிர்',
      },
      {
        step: '02 — கட்டணம் மற்றும் நேரலை',
        badge: 'வெளிப்படையான கட்டணம் • நேரலை ஜிபிஎஸ்',
        headline: 'உங்கள் பயணம். உங்கள் கட்டணம். தெளிவாக.',
        desc: 'வாகனத்தைத் தேர்வு செய்து, வெளிப்படையான கட்டணத்தைப் பார்த்து, உங்கள் ஓட்டுநரை நேரலையில் கண்காணிக்கலாம்.',
        highlight: 'தெளிவான கட்டணம் • நேரலை கண்காணிப்பு • பயணத் தகவல்கள்',
        cta: 'அடுத்து',
        secondary: 'பின்செல்',
      },
      {
        step: '03 — பாதுகாப்பு மற்றும் நம்பிக்கை',
        badge: 'சரிபார்க்கப்பட்ட ஓட்டுநர் • அவசர உதவி 24/7',
        headline: 'ஒவ்வொரு பயணமும் நம்பிக்கையுடன்.',
        desc: 'காவல்துறை சரிபார்க்கப்பட்ட ஓட்டுநர்கள், குடும்பத்துடன் நேரலை பயணப் பகிர்வு மற்றும் 24/7 பாதுகாப்பு ஆதரவு.',
        highlight: 'ஓட்டுநர் விவரம் • பயணப் பகிர்வு • பாதுகாப்பு உதவி',
        cta: 'தொடங்கவும்',
        secondary: 'பின்செல்',
      },
    ],
  };

  const current = content[lang][slide];

  // Touch Swipe Handlers for mobile feel
  const onTouchStartHandler = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && slide < 2) {
      setSlide(s => s + 1);
    } else if (isRightSwipe && slide > 0) {
      setSlide(s => s - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && slide < 2) setSlide(s => s + 1);
      if (e.key === 'ArrowLeft' && slide > 0) setSlide(s => s - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slide]);

  const handleNext = () => {
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      onNavigate('s03_login');
    }
  };

  const handleSecondary = () => {
    if (slide === 0) {
      onNavigate('s03_login');
    } else {
      setSlide(slide - 1);
    }
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const vehicleFares = {
    mini: { name: 'Mini', fare: '₹95', eta: '2 mins', capacity: '4 Seats', popular: false },
    sedan: { name: 'Sedan', fare: '₹140', eta: '3 mins', capacity: '4 Seats', popular: true },
    suv: { name: 'SUV', fare: '₹210', eta: '4 mins', capacity: '6 Seats', popular: false },
  };

  return (
    <div
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#080C15',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(84, 39, 168, 0.3) 0%, rgba(8, 12, 21, 1) 70%)',
        padding: '16px 18px 20px',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* -------------------- INLINE SCOPED CSS KEYFRAMES -------------------- */}
      <style>{`
        @keyframes dashMarch {
          from { stroke-dashoffset: 60; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes radarExpand {
          0% { transform: scale(0.6); opacity: 0.9; }
          50% { opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes cabTravel {
          0% { transform: translate(50px, 150px) rotate(-35deg); }
          50% { transform: translate(155px, 110px) rotate(-22deg); }
          100% { transform: translate(255px, 60px) rotate(-38deg); }
        }
        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 196, 0, 0.25); }
          50% { box-shadow: 0 0 30px rgba(245, 196, 0, 0.6); }
        }
        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shieldHeartbeat {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.4)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 0 24px rgba(34, 197, 94, 0.75)); }
        }
        @keyframes slideContentIn {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .onboarding-btn-hover:active {
          transform: scale(0.97);
        }
      `}</style>

      {/* Ambient background particles / glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: 'rgba(245, 196, 0, 0.12)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          backgroundColor: 'rgba(84, 39, 168, 0.22)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* -------------------- 1. TOP HEADER (LOGO + LANG + SKIP) -------------------- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 15,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RideXLogo size="sm" />

          {/* Dynamic Language Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#121A28',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '3px 9px',
                borderRadius: '16px',
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: lang === 'en' ? '#F5C400' : 'transparent',
                color: lang === 'en' ? '#24153F' : '#94A3B8',
                transition: 'all 0.25s ease',
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ta')}
              style={{
                padding: '3px 9px',
                borderRadius: '16px',
                fontSize: '10.5px',
                fontWeight: 700,
                backgroundColor: lang === 'ta' ? '#F5C400' : 'transparent',
                color: lang === 'ta' ? '#24153F' : '#94A3B8',
                transition: 'all 0.25s ease',
              }}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Secondary / Skip Button */}
        <button
          onClick={handleSecondary}
          className="onboarding-btn-hover"
          style={{
            color: '#94A3B8',
            fontSize: '13px',
            fontWeight: 700,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
        >
          <span>{current.secondary}</span>
          {slide === 0 && <ChevronRight size={14} />}
        </button>
      </div>

      {/* -------------------- 2. INTERACTIVE HERO VISUAL AREA -------------------- */}
      <div
        key={`hero-slide-${slide}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 0',
          minHeight: '260px',
          animation: 'slideContentIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        }}
      >
        {/* ==================== SLIDE 01: ANIMATED DINDIGUL LIVE GPS MAP ==================== */}
        {slide === 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: '330px',
              height: '226px',
              borderRadius: '24px',
              backgroundColor: '#0E1524',
              border: '1.5px solid rgba(245, 196, 0, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 35px rgba(245, 196, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* SVG Interactive Map Vector */}
            <svg
              viewBox="0 0 330 226"
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="50%" stopColor="#F5C400" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>

                <linearGradient id="headlightCone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(253, 224, 71, 0.45)" />
                  <stop offset="100%" stopColor="rgba(253, 224, 71, 0)" />
                </linearGradient>
              </defs>

              {/* City Map Roads Grid */}
              <g stroke="rgba(255, 255, 255, 0.07)" strokeLinecap="round">
                <line x1="0" y1="65" x2="330" y2="65" strokeWidth="4" />
                <line x1="0" y1="150" x2="330" y2="150" strokeWidth="5" />
                <line x1="95" y1="0" x2="95" y2="226" strokeWidth="4" />
                <line x1="235" y1="0" x2="235" y2="226" strokeWidth="4" />
                <line x1="30" y1="226" x2="210" y2="0" strokeWidth="7" stroke="rgba(255, 255, 255, 0.09)" />
              </g>

              {/* Highway Curves */}
              <path
                d="M 20 185 Q 95 125 160 135 T 310 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="8"
                strokeLinecap="round"
              />

              {/* Soft Route Halo */}
              <path
                d="M 50 165 Q 110 115 165 128 T 275 65"
                fill="none"
                stroke="rgba(245, 196, 0, 0.25)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Animated Glowing Marching Dash Trip Route */}
              <path
                d="M 50 165 Q 110 115 165 128 T 275 65"
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 6"
                style={{ animation: 'dashMarch 1.4s linear infinite' }}
              />

              {/* Pickup Point (Junction) with Pulsing Radar Ring */}
              <g transform="translate(48, 165)">
                <circle cx="0" cy="0" r="14" fill="rgba(34, 197, 94, 0.2)" style={{ animation: 'radarExpand 2s infinite ease-out' }} />
                <circle cx="0" cy="0" r="8" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2.5" />
                <g transform="translate(10, -8)">
                  <rect x="0" y="0" width="76" height="18" rx="9" fill="#152132" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="1" />
                  <text x="38" y="12" fill="#22C55E" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                    PICKUP SPOT
                  </text>
                </g>
              </g>

              {/* Destination Point (Palani Road) with Pulsing Radar Ring */}
              <g transform="translate(275, 65)">
                <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.2)" style={{ animation: 'radarExpand 2s 0.6s infinite ease-out' }} />
                <circle cx="0" cy="0" r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.5" />
                <g transform="translate(-72, -10)">
                  <rect x="0" y="0" width="66" height="18" rx="9" fill="#152132" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="1" />
                  <text x="33" y="12" fill="#FCA5A5" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                    PALANI RD
                  </text>
                </g>
              </g>

              {/* Dindigul Rock Fort Landmark Icon */}
              <g transform="translate(152, 60)" style={{ animation: 'floatSubtle 3s ease-in-out infinite' }}>
                <rect x="-10" y="-10" width="80" height="22" rx="11" fill="rgba(84, 39, 168, 0.85)" stroke="rgba(245, 196, 0, 0.5)" strokeWidth="1" />
                <circle cx="0" cy="1" r="5" fill="#F5C400" />
                <text x="32" y="5" fill="#FDE047" fontSize="8.5" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
                  ★ Rock Fort
                </text>
              </g>

              {/* Gliding Animated Cab with Headlight Beam */}
              <g style={{ animation: 'cabTravel 4.2s ease-in-out infinite alternate' }}>
                <polygon points="0,-4 32,-14 32,6" fill="url(#headlightCone)" />
                <ellipse cx="0" cy="4" rx="14" ry="7" fill="rgba(0,0,0,0.5)" />
                <rect x="-14" y="-8" width="28" height="15" rx="5" fill="#F5C400" stroke="#080C15" strokeWidth="1.5" />
                <rect x="-7" y="-6" width="14" height="11" rx="2.5" fill="#1E1B4B" />
                <rect x="-3" y="-3.5" width="6" height="6" rx="1" fill="#F5C400" />
                <circle cx="12" cy="-4" r="2" fill="#FEF08A" />
                <circle cx="12" cy="3" r="2" fill="#FEF08A" />
              </g>
            </svg>

            {/* Top Status Pill Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(8, 12, 21, 0.88)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '5px 12px',
                border: '1.2px solid rgba(245, 196, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#22C55E',
                  boxShadow: '0 0 10px #22C55E',
                }}
              />
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#F5C400', letterSpacing: '0.4px' }}>
                Dindigul Live GPS Hub
              </span>
            </div>

            {/* Bottom Floating Stats Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                right: '12px',
                backgroundColor: 'rgba(18, 26, 40, 0.94)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding: '8px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} color="#60A5FA" />
                <span style={{ fontSize: '11px', color: '#F1F5F9', fontWeight: 700 }}>
                  2.4 km Route
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(245, 196, 0, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 196, 0, 0.3)',
                }}
              >
                <Zap size={12} color="#F5C400" />
                <span style={{ fontSize: '11px', color: '#F5C400', fontWeight: 800 }}>
                  2 min ETA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SLIDE 02: INTERACTIVE VEHICLE SELECTOR & UPFRONT FARE ==================== */}
        {slide === 1 && (
          <div
            style={{
              width: '100%',
              maxWidth: '330px',
              height: '226px',
              borderRadius: '24px',
              backgroundColor: '#0E1524',
              border: '1.5px solid rgba(139, 92, 246, 0.45)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 35px rgba(139, 92, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 14px',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Route Summary Bar */}
            <div
              style={{
                backgroundColor: 'rgba(24, 34, 52, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '8px 12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                  <span style={{ fontSize: '10.5px', color: '#F8FAFC', fontWeight: 700 }}>
                    Dindigul Junction
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={8} color="#EF4444" />
                  <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 600 }}>
                    Palani Road Bypass
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ADE80',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                NO SURGE
              </span>
            </div>

            {/* Interactive Vehicle Switcher Row (Clickable Tabs) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
              {['mini', 'sedan', 'suv'].map((vKey) => {
                const v = vehicleFares[vKey];
                const isSelected = selectedVehicle === vKey;
                return (
                  <button
                    key={vKey}
                    onClick={() => setSelectedVehicle(vKey)}
                    className="onboarding-btn-hover"
                    style={{
                      backgroundColor: isSelected ? 'rgba(245, 196, 0, 0.16)' : 'rgba(18, 26, 40, 0.8)',
                      borderRadius: '12px',
                      padding: '8px 4px',
                      textAlign: 'center',
                      border: isSelected ? '1.8px solid #F5C400' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isSelected ? '0 4px 14px rgba(245, 196, 0, 0.25)' : 'none',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: isSelected ? '#F5C400' : '#94A3B8', fontWeight: 700 }}>
                      {v.name} {v.popular && '★'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: isSelected ? '#FFFFFF' : '#CBD5E1', marginTop: '2px' }}>
                      {v.fare}
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#64748B', marginTop: '1px' }}>
                      {v.eta}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Locked Upfront Fare Hero Badge */}
            <div
              style={{
                background: 'linear-gradient(90deg, #5427A8 0%, #3B1B7A 100%)',
                borderRadius: '12px',
                padding: '9px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(245, 196, 0, 0.35)',
                boxShadow: '0 4px 18px rgba(84, 39, 168, 0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 196, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F5C400',
                  }}
                >
                  <Lock size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 800 }}>
                    Fixed Upfront Meter
                  </div>
                  <div style={{ fontSize: '9px', color: '#D8CDF3' }}>
                    Zero Hidden Tolls or Fees
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#F5C400' }}>
                  {vehicleFares[selectedVehicle].fare}
                </span>
                <div style={{ fontSize: '8.5px', color: '#A78BFA' }}>
                  {vehicleFares[selectedVehicle].eta} ETA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SLIDE 03: VERIFIED DRIVER & 360° SAFETY CENTER ==================== */}
        {slide === 2 && (
          <div
            style={{
              width: '100%',
              maxWidth: '330px',
              height: '226px',
              borderRadius: '24px',
              backgroundColor: '#0E1524',
              border: '1.5px solid rgba(34, 197, 94, 0.45)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 35px rgba(34, 197, 94, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 14px',
              justifyContent: 'space-between',
            }}
          >
            {/* Driver Profile Header */}
            <div
              style={{
                backgroundColor: 'rgba(24, 34, 52, 0.85)',
                borderRadius: '14px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#5427A8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(84, 39, 168, 0.4)',
                  position: 'relative',
                }}
              >
                AV
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    border: '2px solid #0E1524',
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Arjun Verma
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      backgroundColor: 'rgba(245, 196, 0, 0.15)',
                      color: '#F5C400',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Star size={9} fill="#F5C400" /> 4.92
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                  Honda City • TN 57 CE 4819
                </div>
              </div>

              {/* Safety Badge */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1.5px solid #22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22C55E',
                  animation: 'shieldHeartbeat 2.4s infinite ease-in-out',
                }}
              >
                <ShieldCheck size={18} />
              </div>
            </div>

            {/* Safety Feature 2-Column Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(18, 26, 40, 0.85)',
                  borderRadius: '10px',
                  padding: '7px 9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Shield size={15} color="#22C55E" />
                <div>
                  <div style={{ fontSize: '10.5px', color: '#F1F5F9', fontWeight: 700 }}>
                    Police Verified
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748B' }}>
                    Background Checked
                  </div>
                </div>
              </div>

              {/* Interactive Copyable Trip Share Button */}
              <button
                onClick={handleCopyLink}
                className="onboarding-btn-hover"
                style={{
                  backgroundColor: isCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(18, 26, 40, 0.85)',
                  borderRadius: '10px',
                  padding: '7px 9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: isCopied ? '1px solid #22C55E' : '1px solid rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                {isCopied ? <Check size={15} color="#22C55E" /> : <Share2 size={15} color="#60A5FA" />}
                <div>
                  <div style={{ fontSize: '10.5px', color: isCopied ? '#4ADE80' : '#F1F5F9', fontWeight: 700 }}>
                    {isCopied ? 'Link Copied!' : 'Share Live Trip'}
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748B' }}>
                    Family WhatsApp
                  </div>
                </div>
              </button>
            </div>

            {/* Bottom 24/7 SOS & Emergency Hotline Banner */}
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.14)',
                borderRadius: '12px',
                padding: '8px 12px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    boxShadow: '0 0 10px #EF4444',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#FCA5A5', fontWeight: 800 }}>
                  24/7 SOS Center &amp; 112 Hotline
                </span>
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                }}
              >
                STANDBY
              </span>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- 3. TEXT & HEADLINE SECTION -------------------- */}
      <div
        key={`text-slide-${slide}`}
        style={{
          textAlign: 'center',
          padding: '4px 6px',
          animation: 'slideContentIn 0.35s 0.08s ease-out both',
        }}
      >
        {/* Animated Highlight Pill */}
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              color: '#F5C400',
              backgroundColor: 'rgba(245, 196, 0, 0.12)',
              padding: '5px 14px',
              borderRadius: '999px',
              display: 'inline-block',
              border: '1px solid rgba(245, 196, 0, 0.35)',
              boxShadow: '0 2px 10px rgba(245, 196, 0, 0.1)',
            }}
          >
            {current.badge || current.highlight}
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.25,
            marginBottom: '8px',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {current.headline}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '13px',
            color: '#94A3B8',
            lineHeight: 1.55,
            maxWidth: '315px',
            margin: '0 auto',
            fontWeight: 500,
          }}
        >
          {current.desc}
        </p>
      </div>

      {/* -------------------- 4. BOTTOM CONTROLS (EXPANDING DOTS + CTA) -------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
        {/* Elastic Smooth Animated Pagination Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          {[0, 1, 2].map((idx) => {
            const isActive = slide === idx;
            return (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                style={{
                  width: isActive ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? '#F5C400' : 'rgba(255, 255, 255, 0.22)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 350ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  boxShadow: isActive ? '0 0 12px rgba(245, 196, 0, 0.5)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Bottom CTA Button Row */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {slide > 0 && (
            <button
              onClick={handleSecondary}
              className="onboarding-btn-hover"
              style={{
                height: '52px',
                flex: 1,
                backgroundColor: 'rgba(18, 26, 40, 0.9)',
                color: '#CBD5E1',
                fontWeight: 700,
                fontSize: '14px',
                borderRadius: '16px',
                border: '1.2px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ArrowLeft size={16} />
              <span>{current.secondary}</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="onboarding-btn-hover"
            style={{
              height: '52px',
              flex: slide > 0 ? 2 : 1,
              backgroundColor: '#F5C400',
              color: '#24153F',
              fontWeight: 900,
              fontSize: '15px',
              borderRadius: '16px',
              boxShadow: '0 6px 20px rgba(245, 196, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <span>{current.cta}</span>
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
