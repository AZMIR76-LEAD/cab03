import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Search, MapPin, Navigation, Clock, Shield, Star, Phone, MessageSquare,
  Share2, AlertTriangle, Check, CheckCircle2, ChevronRight, Plus, Minus, Trash2, Edit3,
  CreditCard, Smartphone, Wallet as WalletIcon, Banknote, Bell, HelpCircle, Settings as SettingsIcon,
  User, Car, Heart, Briefcase, Home, ShieldAlert, Award, FileText, Download,
  ExternalLink, RotateCcw, Compass, Eye, EyeOff, Radio, Lock, LogOut, Sliders, Zap, Sparkles,
  Calendar, ChevronDown, ArrowRight, ShieldCheck, SlidersHorizontal, Mic, Tag, Headphones, Crosshair, Bus,
  LogIn, UserPlus
} from 'lucide-react';
import RideXLogo from '../../components/common/RideXLogo';
import FGDrivoIntroSplash from '../../components/splash/FGDrivoIntroSplash';
import FGDrivoOnboarding from '../../components/onboarding/FGDrivoOnboarding';
import MapCanvas from '../../components/common/MapCanvas';
import DriverChatDrawer from '../../components/common/DriverChatDrawer';
import DriverCallModal from '../../components/common/DriverCallModal';
import {
  BRAND, VEHICLE_CATEGORIES, CURRENT_USER, MOCK_DRIVER, SAVED_LOCATIONS,
  POPULAR_DESTINATIONS, RIDE_HISTORY, WALLET_DATA, NOTIFICATIONS_DATA,
  EMERGENCY_CONTACTS, FAQ_ITEMS
} from '../../data/mockData';
import { RideXAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { sounds } from '../../utils/soundEffects';
import { DeviceLocation, DEFAULT_FALLBACK_LOCATION } from '../../services/deviceLocation';
import { FirebaseAuthService, isFirebaseConfigured } from '../../services/firebase';

// Global Bargaining State & Location Coordinates
export let GLOBAL_BARGAIN_FARE = 198;
export let GLOBAL_SELECTED_PAYMENT = 'pm-upi';
export let GLOBAL_PICKUP_LOCATION = 'Dindigul Junction';
export let GLOBAL_PICKUP_COORDS = [10.3644, 77.9702];
export let GLOBAL_USER_GPS_COORDS = null;
export let GLOBAL_DESTINATION_LOCATION = 'Palani Road, Dindigul';
export let GLOBAL_PAYMENT_RETURN_SCREEN = 's13_fare_estimate';
export let GLOBAL_USER_PHONE = '';
export let GLOBAL_USER_NAME = '';
export let GLOBAL_USER_EMAIL = '';
export let GLOBAL_FIREBASE_CONFIRMATION = null;
export let GLOBAL_LATEST_OTP = '';

export function getStoredUser() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('fg_user') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.name || parsed.phone)) return { ...CURRENT_USER, ...parsed };
    }
  } catch (e) {}
  const phone = GLOBAL_USER_PHONE || '+91 ••••• •••••';
  const name = GLOBAL_USER_NAME || 'Customer';
  const greetingName = name.split(' ')[0] || 'Customer';
  return {
    ...CURRENT_USER,
    name,
    greetingName,
    phone,
    email: GLOBAL_USER_EMAIL || 'customer@fgdrivo.com',
  };
}

export function saveStoredUser(partial) {
  try {
    const prev = getStoredUser();
    const updated = { ...prev, ...partial };
    if (updated.name) {
      updated.greetingName = updated.name.split(' ')[0];
      GLOBAL_USER_NAME = updated.name;
    }
    if (updated.phone) GLOBAL_USER_PHONE = updated.phone;
    if (updated.email) GLOBAL_USER_EMAIL = updated.email;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fg_user', JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    return partial;
  }
}

// Shared Bottom Nav for Mobile (White Background + Indigo Pill Indicator)
export function MobileBottomNav({ activeTab, onTabChange, onNavigate }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, screen: 's07_home' },
    { id: 'rides', label: 'Rides', icon: Car, screen: 's23_ride_history' },
    { id: 'wallet', label: 'Wallet', icon: WalletIcon, screen: 's28_wallet' },
    { id: 'profile', label: 'Profile', icon: User, screen: 's29_profile' },
  ];

  const handleTabClick = (tab) => {
    if (onTabChange) onTabChange(tab.id, tab.screen);
    else if (onNavigate) onNavigate(tab.screen);
  };

  return (
    <div
      style={{
        marginTop: 'auto',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 12px 6px',
        zIndex: 40,
        position: 'sticky',
        bottom: 0,
        width: '100%',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 14px',
                borderRadius: '16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isActive ? (
                <div
                  style={{
                    width: '42px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </div>
              ) : (
                <div
                  style={{
                    width: '42px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                  }}
                >
                  <Icon size={19} strokeWidth={1.8} />
                </div>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#4F46E5' : '#64748B',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS Home Indicator Bar */}
      <div
        style={{
          width: '128px',
          height: '4px',
          backgroundColor: '#CBD5E1',
          borderRadius: '2px',
          marginTop: '6px',
          marginBottom: '2px',
        }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// PHASE A — ENTRY
// -------------------------------------------------------------

// Screen 01 — Splash Screen
export function Screen01Splash({ onNavigate }) {
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      <FGDrivoIntroSplash
        onFinish={() => onNavigate('s02_onboarding')}
        autoTransition={true}
        durationMs={3200}
      />
    </div>
  );
}

// Screen 02 — Onboarding (FG DRIVO 3 Slides)
export function Screen02Onboarding({ onNavigate }) {
  return <FGDrivoOnboarding onNavigate={onNavigate} />;
}

// -------------------------------------------------------------
// PHASE B — AUTHENTICATION
// -------------------------------------------------------------

// Screen 03 — Login & Sign Up
export function Screen03Login({ onNavigate }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceed = async () => {
    const rawNumber = phone.replace(/[^0-9]/g, '');
    if (!useEmail && rawNumber.length < 10) {
      alert('Please enter your 10-digit mobile number.');
      return;
    }
    const cleanPhone = `${countryCode} ${rawNumber}`;
    GLOBAL_USER_PHONE = cleanPhone;
    GLOBAL_LATEST_OTP = '';

    if (name && name.trim()) {
      GLOBAL_USER_NAME = name.trim();
    }
    if (email && email.trim()) {
      GLOBAL_USER_EMAIL = email.trim();
    }

    setIsSubmitting(true);
    try {
      // Directly dispatch random 6-digit OTP via backend SMS engine
      const res = await RideXAPI.sendOtp(cleanPhone);
      if (res && (res.code || res.demoCode)) {
        GLOBAL_LATEST_OTP = res.code || res.demoCode;
      }
    } catch (err) {
      console.warn('[FG DRIVO] sendOtp notice:', err.message);
    } finally {
      setIsSubmitting(false);
      onNavigate('s04_otp');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F0F4FA',
        background: 'linear-gradient(180deg, #E6F0FA 0%, #EEF4FB 18%, #F7F9FC 45%, #F0F4FA 100%)',
        position: 'relative',
        minHeight: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* Invisible Firebase Recaptcha Container (must not be display:none) */}
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }} />

      {/* ----------------- TOP GRAPHIC & CITY CAR ART ----------------- */}
      <div
        style={{
          position: 'relative',
          padding: '16px 16px 4px',
          zIndex: 2,
        }}
      >
        {/* Right side City & Car Background Graphic */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '56%',
            height: '190px',
            zIndex: 1,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <img
            src="/login-city-car.jpg"
            alt="FG DRIVO City Journey"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '80% center',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%), linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 40%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%), linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 40%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'destination-in',
              opacity: 0.95,
            }}
          />
        </div>

        {/* Script Slogan in Top-Right */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '14px',
            zIndex: 3,
            textAlign: 'right',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Caveat', cursive, sans-serif",
              fontSize: '23px',
              fontWeight: 700,
              color: '#1E3A8A',
              lineHeight: 1.05,
              transform: 'rotate(-4deg)',
              letterSpacing: '0.3px',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
            }}
          >
            Your Ride<br />Our Priority
          </div>
          <svg
            width="105"
            height="12"
            viewBox="0 0 105 12"
            fill="none"
            style={{ marginTop: '2px', float: 'right' }}
          >
            <path
              d="M4 8C32 2 74 2 101 7"
              stroke="#F5C400"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Brand Logo */}
        <div style={{ marginBottom: '14px', position: 'relative', zIndex: 3 }}>
          <img
            src="/fg-drivo-logo.png"
            alt="FG DRIVO"
            style={{
              height: '42px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(84, 39, 168, 0.08))',
            }}
          />
        </div>

        {/* Welcome Back & Subtitle */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '240px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#111827',
              margin: '0 0 6px',
              letterSpacing: '-0.5px',
              lineHeight: 1.15,
            }}
          >
            {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p
            style={{
              fontSize: '12.5px',
              color: '#4B5563',
              lineHeight: 1.4,
              margin: 0,
              fontWeight: 500,
            }}
          >
            {authMode === 'login'
              ? 'Log in to your account and get moving with transparent city rides.'
              : 'Join FG DRIVO today for safe, reliable and transparent rides.'}
          </p>
          <div
            style={{
              width: '38px',
              height: '4px',
              backgroundColor: '#F5C400',
              borderRadius: '4px',
              marginTop: '10px',
              marginBottom: '10px',
            }}
          />
        </div>
      </div>

      {/* ----------------- MAIN WHITE FORM CARD ----------------- */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          margin: '0 12px 14px',
          padding: '18px 16px',
          boxShadow: '0 10px 30px rgba(30, 41, 59, 0.08), 0 2px 8px rgba(30, 41, 59, 0.04)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          position: 'relative',
          zIndex: 4,
        }}
      >
        {/* Top Segmented Mode Tabs: Log In vs Sign Up */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '16px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            onClick={() => setAuthMode('login')}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: authMode === 'login' ? '#5427A8' : 'transparent',
              color: authMode === 'login' ? '#FFFFFF' : '#64748B',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: authMode === 'login' ? '0 2px 8px rgba(84, 39, 168, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <LogIn size={15} />
            <span>Log In</span>
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: authMode === 'signup' ? '#5427A8' : 'transparent',
              color: authMode === 'signup' ? '#FFFFFF' : '#64748B',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: authMode === 'signup' ? '0 2px 8px rgba(84, 39, 168, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <UserPlus size={15} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Field 1: Mobile Number or Email */}
        {!useEmail ? (
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              <Smartphone size={16} color="#4338CA" />
              <span>Mobile Number</span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '46px',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0 12px',
                gap: '10px',
                marginBottom: '14px',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                  {countryCode}
                </span>
                <ChevronDown size={14} color="#64748B" />
              </div>
              <div style={{ width: '1px', height: '22px', backgroundColor: '#CBD5E1' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit number"
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1E293B',
                  letterSpacing: '0.5px',
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              <Lock size={16} color="#4338CA" />
              <span>Email Address</span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '46px',
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0 12px',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1E293B',
                }}
              />
            </div>
          </div>
        )}

        {/* Fields for Sign Up Mode: Name & Date of Birth */}
        {authMode === 'signup' && (
          <>
            {/* Field 2: Name */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                <User size={16} color="#4338CA" />
                <span>Full Name</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '46px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '0 12px',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <User size={18} color="#94A3B8" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    color: '#1E293B',
                  }}
                />
              </div>
            </div>

            {/* Field 3: Date of Birth */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                <Calendar size={16} color="#4338CA" />
                <span>Date of Birth</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '46px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '0 12px',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <Calendar size={18} color="#94A3B8" />
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14.5px',
                    fontWeight: 600,
                    color: '#1E293B',
                  }}
                />
                <Calendar size={17} color="#94A3B8" style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </>
        )}

        {/* Link: Use Email / Mobile Instead */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <Lock size={13} color="#4338CA" />
          <button
            onClick={() => setUseEmail(!useEmail)}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#4338CA',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
            }}
          >
            {useEmail ? 'Use Mobile Number Instead' : 'Use Email Instead'}
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleProceed}
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: '48px',
            backgroundColor: isSubmitting ? '#E2E8F0' : '#FFC820',
            color: isSubmitting ? '#64748B' : '#1E1B4B',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(245, 196, 0, 0.45)',
            border: 'none',
            marginBottom: '10px',
            transition: 'transform 0.15s ease',
          }}
        >
          {isSubmitting ? (
            <span>Sending verification code...</span>
          ) : authMode === 'login' ? (
            <>
              <LogIn size={18} strokeWidth={2.4} />
              <span>Log In</span>
            </>
          ) : (
            <>
              <UserPlus size={18} strokeWidth={2.4} />
              <span>Sign Up & Continue</span>
            </>
          )}
          {!isSubmitting && <ArrowRight size={18} strokeWidth={2.4} />}
        </button>

        {/* Individual Secondary Button: Switch or Direct Access */}
        <button
          onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #4338CA',
            color: '#4338CA',
            fontWeight: 700,
            fontSize: '13.5px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          {authMode === 'login' ? (
            <>
              <UserPlus size={16} strokeWidth={2.2} />
              <span>New user? Sign Up here</span>
            </>
          ) : (
            <>
              <LogIn size={16} strokeWidth={2.2} />
              <span>Already have an account? Log In</span>
            </>
          )}
        </button>

        {/* Divider: OR CONTINUE WITH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.8px' }}>
            OR CONTINUE WITH
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Social Buttons: Google & Apple */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={() => onNavigate('s04_otp')}
            style={{
              height: '44px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            onClick={() => onNavigate('s04_otp')}
            style={{
              height: '44px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 170 170" fill="#000000">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.71-11.71-14.01-6.19-9.46-11.08-20.2-14.67-32.22-3.59-12.02-5.39-23.2-5.39-33.56 0-14.58 3.64-26.68 10.92-36.3 7.28-9.62 16.4-14.51 27.36-14.68 4.79 0 10.22 1.25 16.3 3.76 6.08 2.51 10.15 3.82 12.22 3.93 1.96 0 6.13-1.37 12.51-4.1 6.38-2.73 11.97-4.01 16.78-3.85 12.63.65 22.84 5.34 30.64 14.07-11.1 6.74-16.54 16.03-16.32 27.87.22 9.35 3.86 17.18 10.93 23.49 7.07 6.31 15.55 9.89 25.44 10.74-2.18 6.53-4.96 13.52-8.34 20.97zM119.22 33.15c0-7.29 2.67-14.15 8.01-20.59 5.34-6.43 11.92-10.36 19.74-11.78.22 1.3.33 2.5.33 3.59 0 7.18-2.83 14.2-8.49 21.05-5.66 6.86-12.41 10.78-20.26 11.77-.22-1.3-.33-2.65-.33-4.04z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>
      </div>

      {/* ----------------- TERMS & PRIVACY LEGAL ----------------- */}
      <p style={{ fontSize: '10px', color: '#64748B', textAlign: 'center', lineHeight: 1.45, padding: '0 20px 10px', margin: 0 }}>
        By continuing, you agree to FG DRIVO's{' '}
        <span style={{ color: '#4338CA', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
          Terms of Service
        </span>{' '}
        &amp;{' '}
        <span style={{ color: '#4338CA', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
          Privacy Policy
        </span>.
      </p>

      {/* ----------------- BOTTOM WAVE ACCENTS ----------------- */}
      <div style={{ width: '100%', height: '34px', position: 'relative', overflow: 'hidden', flexShrink: 0, marginTop: 'auto' }}>
        <svg viewBox="0 0 375 34" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
          <path d="M0,18 Q120,36 240,14 Q310,0 375,16 L375,34 L0,34 Z" fill="#F5C400" />
          <path d="M0,24 Q140,6 260,26 Q320,34 375,20 L375,34 L0,34 Z" fill="#24153F" />
        </svg>
      </div>
    </div>
  );
}

// Screen 04 — OTP
export function Screen04OTP({ onNavigate }) {
  const currentPhone = GLOBAL_USER_PHONE || '+91 ••••• •••••';
  const maskedPhone = currentPhone.includes('•') ? currentPhone : currentPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1••••$2');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(28);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 4) {
      setHasError(true);
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    setIsVerifying(true);
    setHasError(false);

    const proceedSuccess = (token, user) => {
      setIsVerifying(false);
      const resolvedName = GLOBAL_USER_NAME || (user && user.name && user.name !== 'Ashfar Khan' ? user.name : '') || 'Customer';
      const resolvedPhone = currentPhone || (user && user.phone) || '';
      const resolvedEmail = GLOBAL_USER_EMAIL || (user && user.email && !user.email.includes('ashfar') ? user.email : '') || `${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'customer'}@fgdrivo.com`;
      saveStoredUser({
        ...(user || {}),
        name: resolvedName,
        greetingName: resolvedName.split(' ')[0] || 'Customer',
        phone: resolvedPhone,
        email: resolvedEmail,
      });
      try {
        if (token) localStorage.setItem('fg_auth_token', token);
      } catch (e) {}
      onNavigate('s05_location_permission');
    };

    // Instant master code bypass for reliable testing anytime
    if (code === '529481') {
      proceedSuccess('fg_token_live_demo', { name: GLOBAL_USER_NAME || 'Customer', phone: currentPhone });
      return;
    }

    if (GLOBAL_FIREBASE_CONFIRMATION) {
      FirebaseAuthService.verifyCode(GLOBAL_FIREBASE_CONFIRMATION, code)
        .then((res) => {
          proceedSuccess(res.idToken, res.user);
        })
        .catch((fbErr) => {
          console.warn('[Firebase Auth] verifyCode failed, checking backend fallback:', fbErr.message);
          RideXAPI.verifyOtp(currentPhone, code)
            .then((res) => proceedSuccess(res.token, res.user))
            .catch((err) => {
              setIsVerifying(false);
              setHasError(true);
              setErrorMessage(fbErr.message || err.message || 'Invalid verification code.');
            });
        });
    } else {
      RideXAPI.verifyOtp(currentPhone, code)
        .then((res) => proceedSuccess(res.token, res.user))
        .catch((err) => {
          setIsVerifying(false);
          setHasError(true);
          setErrorMessage(err.message || 'Invalid or expired OTP code.');
        });
    }
  };

  const handleResend = async () => {
    setCountdown(30);
    setHasError(false);
    try {
      const res = await RideXAPI.sendOtp(currentPhone);
      if (res && (res.code || res.demoCode)) {
        GLOBAL_LATEST_OTP = res.code || res.demoCode;
      }
    } catch (err) {
      console.warn('[FG DRIVO] Resend OTP error:', err.message);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: '24px 20px',
      }}
    >
      <div>
        <button
          onClick={() => onNavigate('s03_login')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5427A8', fontWeight: 700, marginBottom: '24px' }}
        >
          <ArrowLeft size={18} />
          <span style={{ fontSize: '13px' }}>Back</span>
        </button>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#24153F', marginBottom: '8px' }}>
          Verify your number
        </h1>
        <p style={{ fontSize: '14px', color: '#6B5B7D', marginBottom: '28px' }}>
          We sent a 6-digit confirmation code to <span style={{ color: '#5427A8', fontWeight: 700 }}>{maskedPhone}</span>
        </p>

        {/* 6-digit OTP Inputs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '20px' }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                const newOtp = [...otp];
                newOtp[i] = val.slice(-1);
                setOtp(newOtp);
                setHasError(false);
                // Auto focus next input
                if (val && e.target.nextElementSibling) {
                  e.target.nextElementSibling.focus();
                }
              }}
              style={{
                width: '46px',
                height: '56px',
                backgroundColor: '#F8F6FD',
                border: hasError ? '2px solid #EF4444' : '2px solid #5427A8',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '22px',
                fontWeight: 800,
                color: '#24153F',
                outline: 'none',
              }}
            />
          ))}
        </div>

        {hasError && (
          <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '16px', fontWeight: 600 }}>
            {errorMessage || 'Incorrect verification code. Please check and try again.'}
          </p>
        )}

        {/* Quick Dynamic OTP Auto-Fill Helper */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => {
              const codeToFill = GLOBAL_LATEST_OTP || '529481';
              setOtp(codeToFill.split(''));
              setHasError(false);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: '#EEF2FF',
              border: '1.5px dashed #6366F1',
              color: '#4338CA',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} color="#4F46E5" />
            <span>Tap to Auto-fill Generated OTP ({GLOBAL_LATEST_OTP || '529481'})</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '13px', color: '#6B5B7D' }}>
            Resend code in {countdown > 0 ? `00:${countdown < 10 ? '0' : ''}${countdown}` : 'Ready'}
          </span>
          <button
            disabled={countdown > 0}
            onClick={handleResend}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: countdown > 0 ? '#8A7A9E' : '#5427A8',
              background: 'none',
              border: 'none',
              cursor: countdown > 0 ? 'default' : 'pointer',
            }}
          >
            Resend Code
          </button>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: '#F5C400',
            color: '#24153F',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setHasError(!hasError)}
          style={{ fontSize: '11px', color: '#8A7A9E' }}
        >
          (Toggle simulated error state)
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE C — PERMISSIONS
// -------------------------------------------------------------

// Screen 05 — Location Permission
export function Screen05LocationPermission({ onNavigate }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowLocation = async () => {
    setIsRequesting(true);
    try {
      await DeviceLocation.requestPermission();
      const pos = await DeviceLocation.getCurrentPosition({ enableHighAccuracy: true });
      if (!pos.isFallback) {
        GLOBAL_USER_GPS_COORDS = [pos.latitude, pos.longitude];
        GLOBAL_PICKUP_COORDS = [pos.latitude, pos.longitude];
        const addr = await DeviceLocation.reverseGeocode(pos.latitude, pos.longitude);
        if (addr) {
          GLOBAL_PICKUP_LOCATION = addr.split(',').slice(0, 2).join(',');
        }
      }
    } catch (err) {
      console.warn('[LocationPermission] Failed to obtain GPS fix:', err);
    } finally {
      setIsRequesting(false);
      onNavigate('s06_notification_permission');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: '32px 20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '28px',
            backgroundColor: '#F6F1FF',
            border: '2px solid #5427A8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(84, 39, 168, 0.15)',
            marginBottom: '32px',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(84, 39, 168, 0.1)', animation: 'pulseGlow 2s infinite' }} />
          <MapPin size={60} color="#5427A8" />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#24153F', textAlign: 'center', marginBottom: '12px' }}>
          Enable Your Location
        </h1>
        <p style={{ fontSize: '14px', color: '#6B5B7D', textAlign: 'center', lineHeight: 1.6, maxWidth: '290px' }}>
          FG DRIVO uses your precise GPS location to locate you on the map, match nearby top-rated drivers, and optimize pickup routes.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={handleAllowLocation}
          disabled={isRequesting}
          style={{
            height: '52px',
            backgroundColor: isRequesting ? '#E2E8F0' : '#F5C400',
            color: '#24153F',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
            cursor: isRequesting ? 'wait' : 'pointer',
          }}
        >
          {isRequesting ? 'Detecting GPS Location...' : 'Allow Location'}
        </button>
        <button
          onClick={() => onNavigate('s06_notification_permission')}
          style={{
            height: '48px',
            color: '#6B5B7D',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}

// Screen 06 — Notification Permission
export function Screen06NotificationPermission({ onNavigate }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: '32px 20px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '28px',
            backgroundColor: '#FFF9E6',
            border: '2px solid #F5C400',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(245, 196, 0, 0.15)',
            marginBottom: '32px',
          }}
        >
          <Bell size={60} color="#D4A000" />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#24153F', textAlign: 'center', marginBottom: '12px' }}>
          Enable Notifications
        </h1>
        <p style={{ fontSize: '14px', color: '#6B5B7D', textAlign: 'center', lineHeight: 1.6, maxWidth: '290px' }}>
          Receive live driver arrival alerts, trip confirmations, receipts, and important ride safety notifications in real time.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => onNavigate('s07_home')}
          style={{
            height: '52px',
            backgroundColor: '#F5C400',
            color: '#24153F',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
          }}
        >
          Enable Notifications
        </button>
        <button
          onClick={() => onNavigate('s07_home')}
          style={{
            height: '48px',
            color: '#6B5B7D',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE D — HOME
// -------------------------------------------------------------

// Screen 07 — Customer Home (Core Hub)
export function Screen07Home({ onNavigate }) {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F7FC',
        position: 'relative',
        minHeight: '100%',
        overflowX: 'hidden',
        paddingBottom: '8px',
      }}
    >
      {/* ----------------- 1. TOP NAVIGATION HEADER ----------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px',
          gap: '8px',
          backgroundColor: '#F4F7FC',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Left: FG DRIVO brand pill */}
        <div
          onClick={() => onNavigate('s01_splash')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '4px 10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <img src="/fg-drivo-logo.png" alt="FG DRIVO" style={{ height: '26px', width: 'auto' }} />
        </div>

        {/* Center: Pickup Point Search Pill */}
        <div
          onClick={() => onNavigate('s08_pickup')}
          title="Search Pickup Point"
          style={{
            flex: 1,
            maxWidth: '210px',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '6px 12px',
            border: '1.5px solid #DBEAFE',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <MapPin size={15} color="#2563EB" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#1E293B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {GLOBAL_PICKUP_LOCATION || 'Search Pickup Point...'}
          </span>
          <ChevronDown size={14} color="#64748B" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </div>

        {/* Right: Notifications & Settings buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onNavigate('s33_notifications')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: '#1E293B',
              cursor: 'pointer',
            }}
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                border: '1.5px solid #FFFFFF',
              }}
            />
          </button>

          <button
            onClick={() => onNavigate('s35_settings')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1E293B',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* ----------------- 2. GREETING & CITY BANNER CARD ----------------- */}
      <div
        style={{
          margin: '2px 14px 10px',
          backgroundColor: '#FFFFFF',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 60%, #EBF4FE 100%)',
          borderRadius: '20px',
          padding: '12px 14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left: User Avatar & Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => onNavigate('s29_profile')}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundImage: `url(${CURRENT_USER.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '2px solid #3B82F6',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
              }}
            />
            {/* Active green status indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Good evening,</div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                lineHeight: 1.2,
              }}
            >
              <span>{getStoredUser().greetingName || getStoredUser().name || 'Customer'}</span>
              <span>👋</span>
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              Where would you like to go today?
            </div>
          </div>
        </div>

        {/* Right: Graphic & Script Slogan */}
        <div
          style={{
            position: 'relative',
            height: '74px',
            width: '150px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            paddingTop: '2px',
          }}
        >
          {/* Faded car/city snippet */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: '-10px',
              width: '100%',
              height: '100%',
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          >
            <img
              src="/login-city-car.jpg"
              alt="City"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '90% 70%',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 98%)',
                borderRadius: '12px',
              }}
            />
          </div>

          <div style={{ position: 'relative', zIndex: 2, textAlign: 'right', marginRight: '4px' }}>
            <div
              style={{
                fontFamily: "'Caveat', cursive, sans-serif",
                fontSize: '16.5px',
                fontWeight: 700,
                color: '#1E3A8A',
                lineHeight: 1.05,
                transform: 'rotate(-4deg)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.95)',
              }}
            >
              Same City<br />New Journeys
            </div>
            <svg width="76" height="8" viewBox="0 0 76 8" fill="none" style={{ float: 'right', marginTop: '1px' }}>
              <path d="M2 5C24 1 56 1 74 5" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ----------------- 3. FLOATING INTERACTIVE MAP CARD ----------------- */}
      <div
        style={{
          margin: '0 14px 10px',
          height: '285px',
          borderRadius: '22px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#EAF1F8',
        }}
      >
        {/* Real Interactive Map Canvas (Google Maps / OpenStreetMap / Vector Mode) */}
        <MapCanvas
          pickup={{ name: GLOBAL_PICKUP_LOCATION || 'Dindigul Junction', lat: 10.3644, lng: 77.9702, x: 38, y: 70 }}
          destination={{ name: GLOBAL_DESTINATION_LOCATION || 'Dindigul Bus Stand', lat: 10.3686, lng: 77.9745, x: 72, y: 32 }}
          tripState="idle"
          showRoute={true}
          interactive={true}
          height="100%"
          onMapClick={() => onNavigate('s09_destination_search')}
        />

        {/* Floating Destination Badge (Top Left of Map) */}
        <div
          onClick={() => onNavigate('s10_choose_ride')}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 450,
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            padding: '5px 8px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            maxWidth: '150px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bus size={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
              <span>{GLOBAL_DESTINATION_LOCATION || 'Dindigul Bus Stand'}</span>
              <ChevronRight size={12} color="#94A3B8" />
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748B', fontWeight: 500 }}>Stand</div>
          </div>
        </div>

        {/* Floating Compass Button (Bottom Left of Map) */}
        <button
          onClick={() => onNavigate('s08_pickup')}
          title="Set Pickup Location"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 450,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5',
            cursor: 'pointer',
          }}
        >
          <Navigation size={17} fill="#4F46E5" />
        </button>

        {/* Floating Distance / ETA Badge (Bottom Right of Map) */}
        <div
          onClick={() => onNavigate('s10_choose_ride')}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 450,
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '5px 10px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0F172A' }}>~ 2.4 km </span>
            <span style={{ fontSize: '9px', color: '#64748B' }}>away from you</span>
          </div>
          <ChevronRight size={12} color="#94A3B8" />
        </div>
      </div>

      {/* ----------------- 4. BOTTOM WHERE DO YOU WANT TO GO SHEET ----------------- */}
      <div
        style={{
          margin: '0 14px 10px',
          backgroundColor: '#FFFFFF',
          borderRadius: '22px',
          padding: '16px 14px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Title Header with Sparkle Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
          <div style={{ color: '#6366F1', marginTop: '2px' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
              Where do you want to go?
            </h2>
            <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0', fontWeight: 500 }}>
              Choose your ride and get there comfortably
            </p>
          </div>
        </div>

        {/* Search Bar Input */}
        <div
          onClick={() => onNavigate('s09_destination_search')}
          style={{
            height: '46px',
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '10px',
            marginBottom: '12px',
            cursor: 'pointer',
          }}
        >
          <Search size={17} color="#64748B" />
          <span style={{ flex: 1, fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
            Search destination...
          </span>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#4F46E5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <Mic size={17} />
          </button>
        </div>

        {/* 3 Quick Destination Cards - Scrollable & Clean */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '2px',
            marginBottom: '12px',
          }}
        >
          {/* Work */}
          <div
            onClick={() => onNavigate('s10_choose_ride')}
            style={{
              flex: '0 0 auto',
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              padding: '8px 12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Briefcase size={15} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                Work
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap', fontWeight: 500 }}>
                22 min
              </div>
            </div>
            <ChevronRight size={13} color="#94A3B8" />
          </div>

          {/* Dindigul Bus Stand */}
          <div
            onClick={() => onNavigate('s10_choose_ride')}
            style={{
              flex: '0 0 auto',
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              padding: '8px 12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={15} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                Dindigul Bus Stand
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', whiteSpace: 'nowrap', fontWeight: 500 }}>
                12 min
              </div>
            </div>
            <ChevronRight size={13} color="#94A3B8" />
          </div>

          {/* Add Favourite */}
          <div
            onClick={() => onNavigate('s25_saved_places')}
            style={{
              flex: '0 0 auto',
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              padding: '8px 12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Plus size={15} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
              Add Favourite
            </div>
          </div>
        </div>

        {/* RIDE NOW Promotional Card */}
        <div
          onClick={() => onNavigate('s09_destination_search')}
          style={{
            background: 'linear-gradient(90deg, #FFFBEB 0%, #F5F3FF 50%, #EDE9FE 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '16px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(139, 92, 246, 0.08)',
          }}
        >
          {/* Left Car Thumbnail */}
          <div style={{ width: '64px', height: '36px', position: 'relative', flexShrink: 0 }}>
            <img
              src="/login-city-car.jpg"
              alt="Sedan"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '55% 70%',
                borderRadius: '8px',
              }}
            />
          </div>

          {/* Center Text */}
          <div style={{ flex: 1, padding: '0 12px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#6D28D9', letterSpacing: '0.8px' }}>
              RIDE NOW
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B' }}>
              Get a ride in minutes
            </div>
          </div>

          {/* Right Action Button */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <ArrowRight size={17} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <MobileBottomNav activeTab="home" onNavigate={onNavigate} />
    </div>
  );
}

// -------------------------------------------------------------
// PHASE E — LOCATION SEARCH & ROUTE
// -------------------------------------------------------------

// Screen 08 — Pickup Location
export function Screen08Pickup({ onNavigate }) {
  const [pickup, setPickup] = useState(GLOBAL_PICKUP_LOCATION || 'Dindigul Junction');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  const popularPickupSpots = [
    { id: 'spot-1', name: 'Dindigul Junction Railway Station', area: 'Station Road, Dindigul', tag: 'High Activity' },
    { id: 'spot-2', name: 'Central Bus Stand', area: 'Bus Stand Road, Dindigul', tag: 'Express Pickup' },
    { id: 'spot-3', name: 'Collectorate Circle', area: 'Trichy Road, Dindigul', tag: 'Fast Match' },
    { id: 'spot-4', name: 'Round Road Pudhur', area: 'Clock Tower Junction, Dindigul', tag: 'Near You' },
    { id: 'spot-5', name: 'Palani Road Bypass', area: 'NH 83, Dindigul', tag: 'Highway' },
  ];

  const filteredSpots = searchQuery.trim()
    ? popularPickupSpots.filter(
        s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             s.area.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularPickupSpots;

  const [isLocating, setIsLocating] = useState(false);

  const handleSelectSpot = (spotName) => {
    setPickup(spotName);
    GLOBAL_PICKUP_LOCATION = spotName;
    setViewMode('map');
  };

  const handleUseGPS = async () => {
    setIsLocating(true);
    try {
      const pos = await DeviceLocation.getCurrentPosition({ enableHighAccuracy: true });
      GLOBAL_USER_GPS_COORDS = [pos.latitude, pos.longitude];
      GLOBAL_PICKUP_COORDS = [pos.latitude, pos.longitude];
      const addr = await DeviceLocation.reverseGeocode(pos.latitude, pos.longitude);
      const name = addr ? addr.split(',').slice(0, 2).join(',') : `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)} (Live GPS)`;
      setPickup(name);
      GLOBAL_PICKUP_LOCATION = name;
    } catch (err) {
      console.warn('[Screen08Pickup] GPS detection error:', err);
      const gpsName = 'Dindigul Junction (Live GPS)';
      setPickup(gpsName);
      GLOBAL_PICKUP_LOCATION = gpsName;
    } finally {
      setIsLocating(false);
      setViewMode('map');
    }
  };

  const handleConfirmPickup = () => {
    GLOBAL_PICKUP_LOCATION = pickup;
    onNavigate('s09_destination_search');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      {/* Top Header */}
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('s07_home')}
            style={{ color: '#FFFFFF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Set Pickup Location</h1>
            <span style={{ fontSize: '11px', color: '#E5DFF0' }}>Dindigul Central Area</span>
          </div>
        </div>

        {/* View Toggle (Map / List) */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '10px', padding: '2px' }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: viewMode === 'map' ? '#F5C400' : 'transparent',
              color: viewMode === 'map' ? '#24153F' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              backgroundColor: viewMode === 'list' ? '#F5C400' : 'transparent',
              color: viewMode === 'list' ? '#24153F' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* Search Input Bar with GPS Button */}
      <div style={{ padding: '12px 16px', backgroundColor: '#F8F6FD', borderBottom: '1px solid #E5DFF0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '0 12px', height: '48px', border: '1.5px solid #5427A8', boxShadow: '0 2px 8px rgba(84,39,168,0.06)' }}>
          <Search size={18} color="#5427A8" />
          <input
            type="text"
            placeholder="Search pickup point in Dindigul..."
            value={searchQuery || (viewMode === 'map' ? pickup : '')}
            onFocus={() => setViewMode('list')}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPickup(e.target.value);
              setViewMode('list');
            }}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#24153F', fontWeight: 600 }}
          />
          <button
            onClick={handleUseGPS}
            title="Use Current GPS"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#F6F1FF',
              color: '#5427A8',
              borderRadius: '10px',
              border: '1px solid #D8CDF3',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Crosshair size={13} />
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Main Content: Map or Suggestions List */}
      {viewMode === 'list' ? (
        <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto' }}>
          {/* Quick GPS Action */}
          <div
            onClick={handleUseGPS}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: '#F4EEFF',
              borderRadius: '14px',
              border: '1.5px solid #D8CDF3',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#5427A8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5C400' }}>
              <Navigation size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#24153F' }}>Use Current GPS Location</div>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Accurate pickup based on your 5G location</div>
            </div>
            <ChevronRight size={16} color="#5427A8" />
          </div>

          <div style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', margin: '14px 4px 8px' }}>
            POPULAR PICKUP HUBS IN DINDIGUL
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredSpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => handleSelectSpot(spot.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#F8F6FD',
                  borderRadius: '14px',
                  border: '1px solid #E5DFF0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
                  <MapPin size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#24153F' }}>{spot.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{spot.area}</div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#ECE5F8', color: '#5427A8', padding: '3px 7px', borderRadius: '6px' }}>
                  {spot.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Interactive Map Viewport */}
          <div style={{ flex: 1, position: 'relative', minHeight: '260px' }}>
            <MapCanvas
              interactive={true}
              tripState="idle"
              showRoute={false}
              height="100%"
              pickup={{ name: pickup, lat: GLOBAL_PICKUP_COORDS[0], lng: GLOBAL_PICKUP_COORDS[1] }}
            />

            {/* Center Floating Target Pin */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 15,
              }}
            >
              <div
                style={{
                  backgroundColor: '#24153F',
                  color: '#F5C400',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(36, 21, 63, 0.4)',
                  border: '1px solid rgba(245, 196, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span>PICKUP SPOT</span>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#F5C400', border: '3px solid #24153F', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}>
                <MapPin size={22} color="#24153F" />
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(36,21,63,0.4)', filter: 'blur(2px)', marginTop: '2px' }} />
            </div>

            {/* Floating Recenter GPS Button */}
            <button
              onClick={handleUseGPS}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                zIndex: 15,
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #5427A8',
                boxShadow: '0 4px 14px rgba(84,39,168,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5427A8',
                cursor: 'pointer',
              }}
            >
              <Crosshair size={20} />
            </button>
          </div>

          {/* Bottom Confirmation Card (Docked Sheet) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px',
              padding: '16px 18px',
              borderTop: '1.5px solid #E5DFF0',
              boxShadow: '0 -8px 24px rgba(36, 21, 63, 0.1)',
              zIndex: 20,
            }}
          >
            {/* Location Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F4EEFF', border: '1.5px solid #D8CDF3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8', flexShrink: 0 }}>
                <MapPin size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Confirmed Pickup Point
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {pickup}
                </div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>
                  Dindigul • Accurate within 5 meters
                </div>
              </div>
              <button
                onClick={() => setViewMode('list')}
                style={{ fontSize: '12px', color: '#5427A8', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                Change
              </button>
            </div>

            {/* Quick Location Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '14px' }}>
              {popularPickupSpots.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSpot(s.name)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: pickup === s.name ? '#5427A8' : '#F8F6FD',
                    color: pickup === s.name ? '#F5C400' : '#5427A8',
                    border: '1px solid #E5DFF0',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.name.split(' ')[0]} {s.name.split(' ')[1] || ''}
                </button>
              ))}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleConfirmPickup}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#F5C400',
                color: '#24153F',
                fontWeight: 800,
                fontSize: '15px',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Confirm Pickup Spot</span>
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Screen 09 — Destination Search
export function Screen09DestinationSearch({ onNavigate }) {
  const [dest, setDest] = useState('');
  const pickupLocation = GLOBAL_PICKUP_LOCATION || 'Dindigul Junction';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button
          onClick={() => onNavigate('s07_home')}
          style={{ color: '#FFFFFF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Where to?</span>
      </div>

      {/* Dual Search Fields (Pickup & Destination) */}
      <div style={{ padding: '14px 18px', backgroundColor: '#F8F6FD', borderBottom: '1.5px solid #E5DFF0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Pickup Row: Clickable to navigate back to s08_pickup */}
        <div
          onClick={() => onNavigate('s08_pickup')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0 12px', height: '44px', border: '1px solid #E5DFF0', cursor: 'pointer' }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
          <span style={{ fontSize: '13px', color: '#24153F', fontWeight: 600, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {pickupLocation}
          </span>
          <span style={{ fontSize: '11px', color: '#5427A8', fontWeight: 700 }}>Change</span>
        </div>

        {/* Destination Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '0 12px', height: '48px', border: '1.5px solid #5427A8', boxShadow: '0 2px 8px rgba(84,39,168,0.08)' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#5427A8' }} />
          <input
            autoFocus
            type="text"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && dest.trim()) {
                GLOBAL_DESTINATION_LOCATION = dest.trim();
                onNavigate('s10_choose_ride');
              }
            }}
            placeholder="Search destination in Dindigul..."
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#24153F', fontWeight: 600 }}
          />
          {dest.trim() && (
            <button
              onClick={() => {
                GLOBAL_DESTINATION_LOCATION = dest.trim();
                onNavigate('s10_choose_ride');
              }}
              style={{
                background: '#5427A8',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Go
            </button>
          )}
        </div>
      </div>

      {/* Recent & Saved Locations List */}
      <div style={{ flex: 1, padding: '14px 20px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '12px' }}>
          SAVED PLACES
        </div>
        {SAVED_LOCATIONS.map((loc) => (
          <div
            key={loc.id}
            onClick={() => {
              GLOBAL_DESTINATION_LOCATION = `${loc.name} (${loc.address.split(',')[0]})`;
              onNavigate('s10_choose_ride');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #F0EAF8', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
              {loc.type === 'home' ? <Home size={18} /> : loc.type === 'work' ? <Briefcase size={18} /> : <Heart size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#24153F' }}>{loc.name}</div>
              <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{loc.address}</div>
            </div>
            <ChevronRight size={16} color="#8A7A9E" />
          </div>
        ))}

        <div style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', margin: '20px 0 12px' }}>
          POPULAR DESTINATIONS
        </div>
        {POPULAR_DESTINATIONS.map((pop) => (
          <div
            key={pop.id}
            onClick={() => {
              GLOBAL_DESTINATION_LOCATION = pop.title;
              onNavigate('s10_choose_ride');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #F0EAF8', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FFF9E6', border: '1px solid #FFE680', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A000' }}>
              <MapPin size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#24153F' }}>{pop.title}</div>
              <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{pop.distance} • {pop.duration}</div>
            </div>
            <ChevronRight size={16} color="#8A7A9E" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Screen 10 — Choose a Ride
export function Screen10ChooseRide({ onNavigate, selectedVehicle, setSelectedVehicle }) {
  const currentSelected = selectedVehicle || 'sedan';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ height: '180px', position: 'relative', flexShrink: 0 }}>
        <MapCanvas tripState="idle" showRoute={true} interactive={false} />
        <button
          onClick={() => onNavigate('s09_destination_search')}
          style={{ position: 'absolute', top: '12px', left: '16px', zIndex: 10, width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(84,39,168,0.3)' }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Vehicle Options Sheet (White 30% Canvas) */}
      <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', marginTop: '-16px', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', zIndex: 10, borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)' }}>
        <div style={{ width: '36px', height: '4px', backgroundColor: '#D8CDF3', borderRadius: '4px', margin: '0 auto 14px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#24153F', marginBottom: '12px' }}>Recommended Rides</h2>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {VEHICLE_CATEGORIES.map((v) => {
            const isSelected = currentSelected === v.id;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: isSelected ? '#F4EEFF' : '#F8F6FD',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: isSelected ? '2px solid #5427A8' : '1px solid #E5DFF0',
                  boxShadow: isSelected ? '0 4px 14px rgba(84,39,168,0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                <div
                  style={{
                    width: '76px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      mixBlendMode: 'multiply',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#24153F' }}>
                      {v.shortName || v.name.replace('FG DRIVO ', '')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>
                      • {v.etaMinutes} min away
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#5427A8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.tagline}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B5B7D', marginTop: '2px', whiteSpace: 'nowrap' }}>
                    Seats {v.capacity} • {v.luggage} Bags
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#24153F' }}>
                    ₹{Math.round(v.baseFare + 7.8 * v.perKm)}
                  </div>
                  <span style={{ fontSize: '10px', color: '#6B5B7D', whiteSpace: 'nowrap' }}>Est. total</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ paddingTop: '14px', borderTop: '1px solid #E5DFF0' }}>
          <button
            onClick={() => onNavigate('s11_route_preview')}
            style={{ width: '100%', height: '52px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)' }}
          >
            Continue with {VEHICLE_CATEGORIES.find(c => c.id === currentSelected)?.name || 'Sedan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 11 — Route Preview with Interactive Sliding Bargaining System
export function Screen11RoutePreview({ onNavigate, selectedVehicle = 'sedan' }) {
  const vehicle = VEHICLE_CATEGORIES.find(v => v.id === selectedVehicle) || VEHICLE_CATEGORIES[1];
  const calculatedFare = Math.round(vehicle.baseFare + 7.8 * vehicle.perKm);
  const recommendedFare = calculatedFare || 198;
  const minFare = Math.round(recommendedFare * 0.65);
  const maxFare = Math.round(recommendedFare * 1.7);
  const [fare, setFare] = useState(GLOBAL_BARGAIN_FARE || recommendedFare);
  const [mode, setMode] = useState('bargain'); // 'bargain' | 'fixed'

  const handleFareChange = (newFare) => {
    const clamped = Math.max(minFare, Math.min(maxFare, Math.round(newFare)));
    setFare(clamped);
    GLOBAL_BARGAIN_FARE = clamped;
  };

  // Match likelihood based on current offered fare
  const getLikelihood = () => {
    const ratio = fare / recommendedFare;
    if (ratio < 0.85) {
      return {
        percent: 45,
        label: 'Low Match Chance (45%)',
        desc: 'Drivers may submit counter-offers',
        color: '#EAB308',
        bg: '#FEFCE8',
        border: '#FDE047',
      };
    }
    if (ratio <= 1.15) {
      return {
        percent: 85,
        label: 'Optimal Offer (85% Match)',
        desc: 'High driver acceptance • 2–3 min ETA',
        color: '#16A34A',
        bg: '#F0FDF4',
        border: '#BBF7D0',
      };
    }
    return {
      percent: 99,
      label: 'Priority Match (99%)',
      desc: 'Immediate pickup guaranteed by nearest driver',
      color: '#5427A8',
      bg: '#F6F1FF',
      border: '#D8CDF3',
    };
  };

  const likelihood = getLikelihood();
  const sliderPercentage = ((fare - minFare) / (maxFare - minFare)) * 100;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      {/* Top Floating Route Bar (Purple 25% + Yellow 25%) */}
      <div style={{ position: 'absolute', top: '12px', left: '16px', right: '16px', zIndex: 20, backgroundColor: '#5427A8', borderRadius: '16px', padding: '12px 14px', border: '1.5px solid rgba(245, 196, 0, 0.35)', boxShadow: '0 8px 24px rgba(84, 39, 168, 0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => onNavigate('s10_choose_ride')} style={{ color: '#FFFFFF' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5C400', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
              {(GLOBAL_PICKUP_LOCATION || 'Dindigul Junction').split(',')[0]} → {(GLOBAL_DESTINATION_LOCATION || 'Palani Road').split(',')[0]}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {GLOBAL_DESTINATION_LOCATION || 'Palani Road, Dindigul'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255,255,255,0.12)', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
            <span style={{ fontSize: '10px', color: '#FFFFFF', fontWeight: 700 }}>{vehicle.name}</span>
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div style={{ flex: 1, minHeight: '190px' }}>
        <MapCanvas tripState="idle" showRoute={true} />
      </div>

      {/* Sliding Bargaining Bottom Sheet (White 30% Canvas) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          padding: '16px 20px 20px',
          borderTop: '1.5px solid #E5DFF0',
          boxShadow: '0 -8px 24px rgba(36,21,63,0.12)',
          zIndex: 20,
        }}
      >
        {/* Pull handle bar */}
        <div style={{ width: '40px', height: '4px', backgroundColor: '#D8CDF3', borderRadius: '4px', margin: '0 auto 12px' }} />

        {/* Route Quick Summary & Mode Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#24153F' }}>7.8 km • 22 min</div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>Fastest route via Palani Rd</div>
          </div>

          {/* Mode Pill Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#F6F1FF', borderRadius: '20px', padding: '3px', border: '1px solid #E5DFF0' }}>
            <button
              onClick={() => setMode('bargain')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: mode === 'bargain' ? '#5427A8' : 'transparent',
                color: mode === 'bargain' ? '#F5C400' : '#6B5B7D',
                transition: 'all 0.2s',
              }}
            >
              💛 Bargain
            </button>
            <button
              onClick={() => setMode('fixed')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: mode === 'fixed' ? '#5427A8' : 'transparent',
                color: mode === 'fixed' ? '#F5C400' : '#6B5B7D',
                transition: 'all 0.2s',
              }}
            >
              ⚡ Fixed
            </button>
          </div>
        </div>

        {mode === 'bargain' ? (
          <div>
            {/* Live Bargained Price Stepper & Display */}
            <div
              style={{
                backgroundColor: '#F8F6FD',
                borderRadius: '18px',
                padding: '12px 16px',
                border: '1.5px solid #E5DFF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => handleFareChange(fare - 10)}
                disabled={fare <= minFare}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: fare <= minFare ? '#EDE8F5' : '#5427A8',
                  color: fare <= minFare ? '#A396BC' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: fare <= minFare ? 'none' : '0 2px 8px rgba(84,39,168,0.25)',
                  cursor: fare <= minFare ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={18} strokeWidth={3} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px' }}>
                  YOUR OFFERED FARE
                </div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#24153F', lineHeight: 1.1 }}>
                  ₹{fare}
                </div>
                <div style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>
                  Recommended: ₹{recommendedFare}
                </div>
              </div>

              <button
                onClick={() => handleFareChange(fare + 10)}
                disabled={fare >= maxFare}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: fare >= maxFare ? '#EDE8F5' : '#F5C400',
                  color: '#24153F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: fare >= maxFare ? 'none' : '0 2px 8px rgba(245,196,0,0.35)',
                  cursor: fare >= maxFare ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>

            {/* Interactive Bargain Slider */}
            <div style={{ marginBottom: '12px', padding: '0 4px' }}>
              <input
                type="range"
                className="bargain-slider"
                min={minFare}
                max={maxFare}
                step="5"
                value={fare}
                onChange={(e) => handleFareChange(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #5427A8 0%, #F5C400 ${sliderPercentage}%, #E5DFF0 ${sliderPercentage}%, #E5DFF0 100%)`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8A7A9E', fontWeight: 700, marginTop: '6px' }}>
                <span>₹{minFare} (Saver)</span>
                <span style={{ color: '#5427A8' }}>₹{recommendedFare} (Rec)</span>
                <span>₹{maxFare} (VIP)</span>
              </div>
            </div>

            {/* Acceptance Likelihood Meter */}
            <div
              style={{
                backgroundColor: likelihood.bg,
                border: `1px solid ${likelihood.border}`,
                borderRadius: '12px',
                padding: '8px 12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: likelihood.color }}>
                  {likelihood.label}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: likelihood.color }}>
                  {likelihood.percent}%
                </span>
              </div>
              <div style={{ height: '5px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ width: `${likelihood.percent}%`, height: '100%', backgroundColor: likelihood.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{likelihood.desc}</div>
            </div>

            {/* Quick Offer Preset Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {[
                { label: '-₹20', val: Math.max(minFare, recommendedFare - 20) },
                { label: `₹${recommendedFare} (Rec)`, val: recommendedFare },
                { label: '+₹20', val: Math.min(maxFare, recommendedFare + 20) },
                { label: '+₹40', val: Math.min(maxFare, recommendedFare + 40) },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleFareChange(chip.val)}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: fare === chip.val ? '#F5C400' : '#F8F6FD',
                    color: fare === chip.val ? '#24153F' : '#5427A8',
                    border: fare === chip.val ? '1.5px solid #F5C400' : '1px solid #E5DFF0',
                    transition: 'all 0.15s',
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>


            {/* Primary Action Button */}
            <button
              onClick={() => onNavigate('s12_booking_confirm')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#F5C400',
                color: '#24153F',
                fontWeight: 900,
                fontSize: '16px',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(245, 196, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <span>Confirm Booking • ₹{fare}</span>
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '16px', border: '1px solid #E5DFF0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>{vehicle.name.toUpperCase()} FIXED FARE</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#5427A8' }}>₹{recommendedFare}</div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>Fixed meter rate • No surge pricing</div>
                </div>
                <div style={{ backgroundColor: '#F6F1FF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E5DFF0', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#6B5B7D' }}>EST. ARRIVAL</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>{vehicle.etaMinutes} min</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('s12_booking_confirm')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#F5C400',
                color: '#24153F',
                fontWeight: 800,
                fontSize: '15px',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <span>Confirm Booking • ₹{recommendedFare}</span>
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Backwards compatibility aliases
export const Screen10RoutePreview = Screen11RoutePreview;
export const Screen11ChooseRide = Screen10ChooseRide;

// -------------------------------------------------------------
// PHASE G — BOOKING CONFIRMATION & MATCHING
// -------------------------------------------------------------

// Screen 12 — Booking Confirmation
export function Screen12BookingConfirm({ onNavigate, selectedVehicle = 'sedan' }) {
  const vehicle = VEHICLE_CATEGORIES.find(v => v.id === selectedVehicle) || VEHICLE_CATEGORIES[1];
  const fare = GLOBAL_BARGAIN_FARE || Math.round(vehicle.baseFare + 7.8 * vehicle.perKm);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ height: '200px', position: 'relative' }}>
        <MapCanvas tripState="idle" showRoute={true} interactive={false} />
        <button
          onClick={() => onNavigate('s11_route_preview')}
          style={{ position: 'absolute', top: '12px', left: '16px', zIndex: 10, width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(84,39,168,0.3)' }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Bottom Sheet Details (White 30% Canvas) */}
      <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', marginTop: '-16px', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10, borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#24153F' }}>Confirm Your Booking</span>
            <button onClick={() => onNavigate('s10_choose_ride')} style={{ fontSize: '12px', color: '#5427A8', fontWeight: 700 }}>
              Edit Ride
            </button>
          </div>

          {/* Vehicle & Bargain Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4EEFF', borderRadius: '14px', padding: '10px 14px', marginBottom: '12px', border: '1.5px solid #D8CDF3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '56px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={vehicle.imageUrl} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>{vehicle.name}</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{vehicle.tagline} • {vehicle.etaMinutes} min away</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#5427A8' }}>₹{fare}</div>
              <div style={{ fontSize: '10px', color: '#16A34A', fontWeight: 700 }}>Fare Agreed</div>
            </div>
          </div>

          {/* Route Points */}
          <div style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '14px', marginBottom: '14px', border: '1px solid #E5DFF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#24153F' }}>{GLOBAL_PICKUP_LOCATION || 'Dindigul Junction'}</div>
            </div>
            <div style={{ width: '2px', height: '14px', backgroundColor: '#D8CDF3', marginLeft: '3px', margin: '-4px 0 -4px 3px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#5427A8' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#24153F' }}>{GLOBAL_DESTINATION_LOCATION || 'Palani Road, Dindigul'}</div>
            </div>
          </div>

          {/* Trip Protection & Transparency Guarantee */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '12px 14px', border: '1px solid #E5DFF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECE5F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#24153F' }}>Zero Hidden Charges</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Payment method selected in final step</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>Guaranteed</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={() => onNavigate('s13_fare_estimate')}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: '#F5C400',
              color: '#24153F',
              fontWeight: 800,
              fontSize: '15px',
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <span>Proceed to Fare & Payment • ₹{fare}</span>
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 13 — Itemized Fare Breakdown & Estimate
export function Screen13FareEstimate({ onNavigate, selectedVehicle = 'sedan' }) {
  const vehicle = VEHICLE_CATEGORIES.find(v => v.id === selectedVehicle) || VEHICLE_CATEGORIES[1];
  const distanceKm = 7.8;
  const timeMin = 22;
  const base = vehicle.baseFare;
  const distFare = Math.round(distanceKm * vehicle.perKm);
  const timeFare = Math.round(timeMin * vehicle.perMin);
  const taxes = 18;
  const discount = 20;
  const calculatedTotal = base + distFare + timeFare + taxes - discount;
  const total = GLOBAL_BARGAIN_FARE || calculatedTotal;
  const payment = WALLET_DATA.paymentMethods.find(m => m.id === GLOBAL_SELECTED_PAYMENT) || WALLET_DATA.paymentMethods[0];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => onNavigate('s12_booking_confirm')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 800 }}>Fare & Payment</span>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ backgroundColor: '#F8F6FD', borderRadius: '18px', padding: '18px', border: '1.5px solid #E5DFF0', marginBottom: '14px', boxShadow: '0 4px 14px rgba(84,39,168,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#24153F' }}>{vehicle.name}</span>
            <span style={{ fontSize: '13px', color: '#5427A8', fontWeight: 700 }}>{distanceKm} km • {timeMin} mins</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#6B5B7D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base Fare</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹{base}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Distance Fare ({distanceKm} km × ₹{vehicle.perKm}/km)</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹{distFare}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time Fare ({timeMin} min × ₹{vehicle.perMin}/min)</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹{timeFare}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Taxes & Municipal Access Fees</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹{taxes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
              <span>FG DRIVO Promo Discount (FGDRIVOFIRST)</span>
              <span>-₹{discount}</span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#E5DFF0', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 800, color: '#24153F' }}>
              <span>Total Fare</span>
              <span style={{ color: '#5427A8', fontSize: '22px', fontWeight: 900 }}>₹{total}</span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: '#6B5B7D', lineHeight: 1.5, marginBottom: '16px' }}>
          Final fare is transparent and regulated. No surge price multipliers during peak hours in Dindigul.
        </div>

        {/* Payment in Last Section */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #D8CDF3', padding: '14px', boxShadow: '0 4px 16px rgba(84,39,168,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={15} color="#5427A8" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Method (Final Step)
              </span>
            </div>
            <button
              onClick={() => {
                GLOBAL_PAYMENT_RETURN_SCREEN = 's13_fare_estimate';
                onNavigate('s26_payment_methods');
              }}
              style={{ fontSize: '12px', color: '#5427A8', fontWeight: 800, background: '#F4EEFF', border: '1px solid #D8CDF3', padding: '3px 10px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Change
            </button>
          </div>

          <div
            onClick={() => {
              GLOBAL_PAYMENT_RETURN_SCREEN = 's13_fare_estimate';
              onNavigate('s26_payment_methods');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8F6FD',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1.5px solid #5427A8',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(84, 39, 168, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ECE5F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
                {payment.type === 'UPI' ? <Smartphone size={19} /> : payment.type === 'CARD' ? <CreditCard size={19} /> : payment.type === 'WALLET' ? <WalletIcon size={19} /> : <Banknote size={19} />}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{payment.title}</span>
                  <span style={{ fontSize: '9px', fontWeight: 800, backgroundColor: '#F5C400', color: '#24153F', padding: '1px 6px', borderRadius: '4px' }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{payment.detail}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#5427A8', fontWeight: 700, fontSize: '12px' }}>
              <span>Switch</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1.5px solid #E5DFF0' }}>
        <button
          onClick={() => {
            sounds.playTick();
            RideXAPI.bookRide({
              category: selectedVehicle,
              pickup: GLOBAL_PICKUP_LOCATION || 'Dindigul Junction',
              destination: GLOBAL_DESTINATION_LOCATION || 'Palani Road, Dindigul',
              paymentMethod: payment.title,
            })
              .then((res) => {
                if (res && res.ride) {
                  socketService.subscribeToRide(res.ride.id);
                }
              })
              .catch((err) => console.warn('Offline fallback booking:', err));
            onNavigate('s14_finding_driver');
          }}
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: '#F5C400',
            color: '#24153F',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <span>Book Ride • ₹{total}</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// Backwards compatibility aliases
export const Screen12FareEstimate = Screen13FareEstimate;
export const Screen13BookingConfirm = Screen12BookingConfirm;

// Screen 14 — Finding Driver (Animated State with Driver Bids)
export function Screen14FindingDriver({ onNavigate }) {
  const [bids, setBids] = useState([]);
  const offeredFare = GLOBAL_BARGAIN_FARE || 198;

  useEffect(() => {
    // Driver 1 accepts the offer after 1.2s
    const t1 = setTimeout(() => {
      setBids([
        {
          id: 'bid-1',
          driverName: 'Ramesh K.',
          rating: 4.9,
          vehicle: 'Maruti Suzuki Dzire (TN 57 BJ 4421)',
          eta: '2 min away',
          fare: offeredFare,
          type: 'accepted',
        }
      ]);
    }, 1200);

    // Driver 2 counter-offers after 2.8s
    const t2 = setTimeout(() => {
      setBids(prev => [
        ...prev,
        {
          id: 'bid-2',
          driverName: 'Murugan V.',
          rating: 4.8,
          vehicle: 'Hyundai Aura (TN 57 AK 8812)',
          eta: '1 min away (Immediate)',
          fare: offeredFare + 15,
          type: 'counter',
        }
      ]);
    }, 2800);

    // Fallback auto-connect to driver after 5.5s
    const t3 = setTimeout(() => {
      onNavigate('s15_driver_assigned');
    }, 5500);

    const unsubSocket = socketService.on('ride:status_changed', (data) => {
      if (data && (data.status === 'driver_assigned' || data.status === 'driver_arriving')) {
        onNavigate('s15_driver_assigned');
      }
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      unsubSocket();
    };
  }, [onNavigate, offeredFare]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas tripState="finding" showRoute={true} />
      </div>

      {/* Floating Offer Badge at Top of Map */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 30, backgroundColor: '#5427A8', borderRadius: '16px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(84,39,168,0.3)', border: '1.5px solid #F5C400' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#E8DFF5', fontWeight: 700 }}>BARGAINED OFFER</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#F5C400' }}>₹{offeredFare}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
          <span>Broadcasting to drivers...</span>
        </div>
      </div>

      {/* Bottom Sheet Details & Incoming Driver Bids */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          padding: '20px 18px',
          borderTop: '1.5px solid #E5DFF0',
          boxShadow: '0 -8px 24px rgba(36, 21, 63, 0.12)',
          zIndex: 20,
          maxHeight: '380px',
          overflowY: 'auto',
        }}
      >
        {bids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#F6F1FF', border: '2px solid #5427A8', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={24} color="#5427A8" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#24153F', marginBottom: '4px' }}>
              Finding drivers for ₹{offeredFare}...
            </h2>
            <p style={{ fontSize: '12px', color: '#6B5B7D', marginBottom: '16px' }}>
              Nearby drivers in Dindigul are reviewing your fare.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>
                Incoming Driver Bids ({bids.length})
              </span>
              <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                Live Negotiation
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {bids.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#F8F6FD',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: b.type === 'accepted' ? '1.5px solid #16A34A' : '1.5px solid #5427A8',
                    boxShadow: '0 2px 8px rgba(36,21,63,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>{b.driverName}</span>
                        <span style={{ fontSize: '11px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>★ {b.rating}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{b.vehicle} • {b.eta}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#5427A8' }}>₹{b.fare}</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: b.type === 'accepted' ? '#16A34A' : '#EAB308' }}>
                        {b.type === 'accepted' ? 'ACCEPTED OFFER' : 'COUNTER-OFFER'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('s15_driver_assigned')}
                    style={{
                      width: '100%',
                      height: '38px',
                      backgroundColor: b.type === 'accepted' ? '#F5C400' : '#5427A8',
                      color: b.type === 'accepted' ? '#24153F' : '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '13px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    Accept Driver • ₹{b.fare}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => onNavigate('s11_route_preview')}
          style={{ width: '100%', height: '42px', backgroundColor: '#FFF0F0', color: '#EF4444', fontWeight: 700, fontSize: '13px', borderRadius: '12px', border: '1px solid #FFD0D0' }}
        >
          Cancel Search / Re-bargain
        </button>
      </div>
    </div>
  );
}

// Screen 15 — Driver Assigned
export function Screen15DriverAssigned({ onNavigate }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas tripState="arriving" showRoute={true} progress={0.12} />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: '26px', borderTopRightRadius: '26px', padding: '20px 20px 16px', borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36, 21, 63, 0.12)', zIndex: 20 }}>
        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', boxShadow: '0 0 8px #16A34A' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#16A34A' }}>Driver Assigned</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#5427A8' }}>Arriving in 3 min</span>
        </div>

        {/* Driver Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#F8F6FD', borderRadius: '16px', padding: '14px', marginBottom: '14px', border: '1px solid #E5DFF0' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundImage: `url(${MOCK_DRIVER.avatar})`, backgroundSize: 'cover', border: '2px solid #5427A8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#24153F' }}>{MOCK_DRIVER.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#D4A000', fontWeight: 700 }}>
              <Star size={13} fill="#F5C400" color="#F5C400" />
              <span>{MOCK_DRIVER.rating}</span>
              <span style={{ color: '#6B5B7D', fontWeight: 500 }}>({MOCK_DRIVER.tripsCount} trips)</span>
            </div>
            <div style={{ fontSize: '12px', color: '#5427A8', fontWeight: 600, marginTop: '2px' }}>
              {MOCK_DRIVER.vehicle.model}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#F5C400', color: '#24153F', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px' }}>
              {MOCK_DRIVER.vehicle.licensePlate}
            </div>
          </div>
        </div>

        {/* Agreed Bargained Fare Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F6FD', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', border: '1px solid #E5DFF0' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#8A7A9E', fontWeight: 800, letterSpacing: '0.5px' }}>AGREED FARE</div>
            <div style={{ fontSize: '12px', color: '#24153F', fontWeight: 600 }}>Pay via UPI or Cash</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#5427A8' }}>
            ₹{GLOBAL_BARGAIN_FARE || 198}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{ height: '42px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: '#24153F', fontWeight: 700 }}
          >
            <Phone size={14} color="#5427A8" /> Call
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            style={{ height: '42px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: '#24153F', fontWeight: 700, position: 'relative' }}
          >
            <MessageSquare size={14} color="#5427A8" /> Chat
            <span style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
          </button>
          <button style={{ height: '42px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: '#24153F', fontWeight: 700 }}>
            <Share2 size={14} color="#5427A8" /> Share
          </button>
          <button
            onClick={() => onNavigate('s31_safety')}
            style={{ height: '42px', backgroundColor: '#FFF0F0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', color: '#EF4444', border: '1px solid #FFD0D0', fontWeight: 700 }}
          >
            <ShieldAlert size={14} /> Safety
          </button>
        </div>

        <button
          onClick={() => onNavigate('s16_driver_arriving')}
          style={{ width: '100%', height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}
        >
          Track Driver Live →
        </button>
      </div>

      {/* In-Ride Chat Drawer */}
      <DriverChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={MOCK_DRIVER}
        onOpenCall={() => { setIsChatOpen(false); setIsCallOpen(true); }}
      />

      {/* Realistic Driver Call Modal */}
      <DriverCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        driver={MOCK_DRIVER}
      />
    </div>
  );
}

// -------------------------------------------------------------
// PHASE H — LIVE RIDE LIFECYCLE
// -------------------------------------------------------------

// Screen 16 — Driver Arriving
export function Screen16DriverArriving({ onNavigate }) {
  // Real-time countdown starting at 2 minutes 45 seconds (165s)
  const [countdown, setCountdown] = useState(165);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const unsub = socketService.on('ride:status_changed', (data) => {
      if (data && data.status === 'driver_arrived') {
        sounds.playDriverArrived();
        onNavigate('s17_driver_arrived');
      } else if (data && (data.status === 'trip_started' || data.status === 'trip_in_progress')) {
        onNavigate('s19_trip_in_progress');
      }
    });

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [onNavigate]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedSecs = seconds < 10 ? `0${seconds}` : seconds;
  // Distance remaining down to pickup (from 450m down to 40m)
  const distMeters = Math.max(40, Math.round(450 * (countdown / 165)));
  // Normalized progress along the approach path (0.05 to 0.95)
  const arrivalProgress = Math.min(0.96, Math.max(0.06, 1 - (countdown / 165)));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas
          tripState="arriving"
          showRoute={true}
          progress={arrivalProgress}
          driverName={MOCK_DRIVER.name}
          carModel={MOCK_DRIVER.vehicle.model}
        />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: '26px', borderTopRightRadius: '26px', padding: '18px 20px 16px', borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)', zIndex: 20 }}>
        {/* Dynamic Countdown Header with Pulsing Radar Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', boxShadow: '0 0 10px #16A34A', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, letterSpacing: '0.5px' }}>LIVE GPS TRACKING</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#5427A8', marginTop: '2px' }}>
              Arriving in {minutes}:{formattedSecs}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#24153F' }}>{distMeters}m away</div>
            <div style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>Dindigul Bypass</div>
          </div>
        </div>

        {/* Live animated progress bar */}
        <div style={{ width: '100%', height: '5px', backgroundColor: '#EFEAFC', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
          <div
            style={{
              width: `${arrivalProgress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #F5C400, #16A34A)',
              borderRadius: '4px',
              transition: 'width 1s linear'
            }}
          />
        </div>

        {/* Driver Card with Quick Chat & Call Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '12px', marginBottom: '14px', border: '1px solid #E5DFF0' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundImage: `url(${MOCK_DRIVER.avatar})`, backgroundSize: 'cover', border: '2px solid #5427A8', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{MOCK_DRIVER.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6B5B7D' }}>
              <span>{MOCK_DRIVER.vehicle.model}</span>
              <span>•</span>
              <span style={{ color: '#D4A000', fontWeight: 700 }}>★ {MOCK_DRIVER.rating}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ backgroundColor: '#F5C400', color: '#24153F', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px' }}>
              {MOCK_DRIVER.vehicle.licensePlate}
            </div>
          </div>
        </div>

        {/* In-Ride Quick Action Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{
              height: '42px',
              backgroundColor: '#F6F1FF',
              border: '1.5px solid #5427A8',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#5427A8',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Phone size={15} color="#5427A8" /> Call Arjun
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            style={{
              height: '42px',
              backgroundColor: '#5427A8',
              border: 'none',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <MessageSquare size={15} color="#FFFFFF" /> Chat
            <span style={{ position: 'absolute', top: '6px', right: '8px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F5C400', border: '1.5px solid #5427A8' }} />
          </button>
          <button
            onClick={() => onNavigate('s31_safety')}
            style={{
              height: '42px',
              backgroundColor: '#FFF0F0',
              border: '1px solid #FFD0D0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              fontSize: '12px',
              color: '#EF4444',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={15} /> Safety
          </button>
        </div>

        <button
          onClick={() => onNavigate('s17_driver_arrived')}
          style={{ width: '100%', height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)', cursor: 'pointer' }}
        >
          Simulate: Driver Has Arrived →
        </button>
      </div>

      {/* In-Ride Chat Drawer */}
      <DriverChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={MOCK_DRIVER}
        onOpenCall={() => { setIsChatOpen(false); setIsCallOpen(true); }}
      />

      {/* Realistic Driver Call Modal */}
      <DriverCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        driver={MOCK_DRIVER}
      />
    </div>
  );
}

// Screen 17 — Driver Arrived
export function Screen17DriverArrived({ onNavigate }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  useEffect(() => {
    sounds.playDriverArrived();
    const unsub = socketService.on('ride:status_changed', (data) => {
      if (data && (data.status === 'trip_started' || data.status === 'trip_in_progress')) {
        onNavigate('s19_trip_in_progress');
      }
    });
    return () => unsub();
  }, [onNavigate]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas
          tripState="arrived"
          showRoute={true}
          progress={1}
          driverName={MOCK_DRIVER.name}
          carModel={MOCK_DRIVER.vehicle.model}
        />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: '26px', borderTopRightRadius: '26px', padding: '22px 20px 16px', borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16A34A', boxShadow: '0 0 10px #16A34A' }} />
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#24153F' }}>Your driver has arrived!</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#6B5B7D', marginBottom: '14px' }}>
          Arjun is waiting at <span style={{ color: '#24153F', fontWeight: 700 }}>Skyline Residency Gate 1</span> with hazard lights on.
        </p>

        {/* OTP + License Plate Card */}
        <div style={{ backgroundColor: '#F8F6FD', border: '1.5px solid #5427A8', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 600 }}>START PIN / OTP</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#5427A8', letterSpacing: '2px' }}>4819</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: '#F5C400', color: '#24153F', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px' }}>
              {MOCK_DRIVER.vehicle.licensePlate}
            </div>
            <div style={{ fontSize: '11px', color: '#6B5B7D', marginTop: '3px' }}>White Dzire</div>
          </div>
        </div>

        {/* Quick Driver Contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{ height: '40px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#24153F', fontWeight: 700, cursor: 'pointer' }}
          >
            <Phone size={14} color="#5427A8" /> Call Arjun
          </button>
          <button
            onClick={() => setIsChatOpen(true)}
            style={{ height: '40px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#24153F', fontWeight: 700, cursor: 'pointer' }}
          >
            <MessageSquare size={14} color="#5427A8" /> Chat ("I'm coming")
          </button>
        </div>

        <button
          onClick={() => onNavigate('s18_trip_started')}
          style={{ width: '100%', height: '50px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)', cursor: 'pointer' }}
        >
          I'm in the Car • Start Trip →
        </button>
      </div>

      <DriverChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={MOCK_DRIVER}
        onOpenCall={() => { setIsChatOpen(false); setIsCallOpen(true); }}
      />
      <DriverCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        driver={MOCK_DRIVER}
      />
    </div>
  );
}

// Screen 18 — Trip Started
export function Screen18TripStarted({ onNavigate }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas
          tripState="in_progress"
          showRoute={true}
          progress={0.15}
          driverName={MOCK_DRIVER.name}
          carModel={MOCK_DRIVER.vehicle.model}
        />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: '26px', borderTopRightRadius: '26px', padding: '20px', borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)', zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800, letterSpacing: '0.5px' }}>TRIP IN PROGRESS</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#24153F' }}>Heading to {(GLOBAL_DESTINATION_LOCATION || 'Palani Road').split(',')[0]}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#5427A8' }}>22 min</div>
            <div style={{ fontSize: '11px', color: '#6B5B7D' }}>7.8 km left</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '6px', backgroundColor: '#E5DFF0', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ width: '15%', height: '100%', backgroundColor: '#F5C400', borderRadius: '4px' }} />
        </div>

        {/* Action Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setIsChatOpen(true)}
            style={{ height: '40px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#5427A8', fontWeight: 700, cursor: 'pointer' }}
          >
            <MessageSquare size={14} color="#5427A8" /> In-Ride Chat
          </button>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{ height: '40px', backgroundColor: '#F6F1FF', border: '1px solid #E5DFF0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#5427A8', fontWeight: 700, cursor: 'pointer' }}
          >
            <Phone size={14} color="#5427A8" /> Call Arjun
          </button>
        </div>

        <button
          onClick={() => onNavigate('s19_trip_in_progress')}
          style={{ width: '100%', height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)', cursor: 'pointer' }}
        >
          View Live GPS Tracking Screen →
        </button>
      </div>

      <DriverChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={MOCK_DRIVER}
        onOpenCall={() => { setIsChatOpen(false); setIsCallOpen(true); }}
      />
      <DriverCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        driver={MOCK_DRIVER}
      />
    </div>
  );
}

// Screen 19 — Trip In Progress (Midway) with Animated GPS, Speedometer & Chat/Call
export function Screen19TripInProgress({ onNavigate }) {
  // Live trip countdown timer: 12 minutes down
  const [tripSeconds, setTripSeconds] = useState(720);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTripSeconds((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const unsub = socketService.on('ride:status_changed', (data) => {
      if (data && data.status === 'completed') {
        sounds.playTripCompleted();
        onNavigate('s20_trip_completed');
      }
    });

    return () => {
      clearInterval(timer);
      unsub();
    };
  }, [onNavigate]);

  const minutes = Math.floor(tripSeconds / 60);
  const seconds = tripSeconds % 60;
  const formattedSecs = seconds < 10 ? `0${seconds}` : seconds;
  // Normalized progress from 0.15 to 0.95
  const tripProgress = Math.min(0.96, Math.max(0.12, 1 - (tripSeconds / 720)));
  // Distance remaining down from 3.8 km
  const distKm = Math.max(0.2, (3.8 * (tripSeconds / 720))).toFixed(1);
  // Live Speedometer variation ~42 to 46 km/h
  const liveSpeed = 42 + Math.floor((tripSeconds % 5) * 1.2);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative' }}>
      <div style={{ flex: 1 }}>
        <MapCanvas
          tripState="in_progress"
          showRoute={true}
          progress={tripProgress}
          driverName={MOCK_DRIVER.name}
          carModel={MOCK_DRIVER.vehicle.model}
        />
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: '26px', borderTopRightRadius: '26px', padding: '18px 20px 16px', borderTop: '1.5px solid #E5DFF0', boxShadow: '0 -8px 24px rgba(36,21,63,0.12)', zIndex: 20 }}>
        {/* Speedometer & Traffic Status HUD Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#24153F', color: '#F5C400', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.3px' }}>
            <Zap size={12} fill="#F5C400" />
            <span>SPEED: {liveSpeed} KM/H</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#16A34A', fontWeight: 800 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
            <span>Optimal Route • Fast Traffic</span>
          </div>
        </div>

        {/* ETA & Distance Remaining */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#6B5B7D', fontWeight: 700 }}>ESTIMATED ARRIVAL</span>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#5427A8', marginTop: '1px' }}>
              {minutes}:{formattedSecs}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#24153F' }}>{distKm} km left</div>
            <div style={{ fontSize: '11px', color: '#5427A8', fontWeight: 700 }}>{(GLOBAL_DESTINATION_LOCATION || 'Palani Road').split(',')[0]}</div>
          </div>
        </div>

        {/* Live Trip Progress Bar */}
        <div style={{ width: '100%', height: '5px', backgroundColor: '#EFEAFC', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
          <div
            style={{
              width: `${tripProgress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #5427A8, #F5C400)',
              borderRadius: '4px',
              transition: 'width 1s linear'
            }}
          />
        </div>

        {/* Quick Driver Contact & Safety Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setIsChatOpen(true)}
            style={{
              height: '42px',
              backgroundColor: '#5427A8',
              border: 'none',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <MessageSquare size={14} color="#FFFFFF" /> Chat
            <span style={{ position: 'absolute', top: '7px', right: '8px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
          </button>
          <button
            onClick={() => setIsCallOpen(true)}
            style={{
              height: '42px',
              backgroundColor: '#F6F1FF',
              border: '1.5px solid #5427A8',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#5427A8',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Phone size={14} color="#5427A8" /> Call
          </button>
          <button
            onClick={() => onNavigate('s31_safety')}
            style={{
              height: '42px',
              backgroundColor: '#FFF0F0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              fontSize: '12px',
              color: '#EF4444',
              border: '1px solid #FFD0D0',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={14} /> Safety
          </button>
        </div>

        <button
          onClick={() => onNavigate('s20_trip_completed')}
          style={{ width: '100%', height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)', cursor: 'pointer' }}
        >
          Simulate: Trip Completed →
        </button>
      </div>

      {/* In-Ride Chat Drawer */}
      <DriverChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driver={MOCK_DRIVER}
        onOpenCall={() => { setIsChatOpen(false); setIsCallOpen(true); }}
      />

      {/* Realistic Driver Call Modal */}
      <DriverCallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        driver={MOCK_DRIVER}
      />
    </div>
  );
}

// -------------------------------------------------------------
// PHASE I — COMPLETION & RATING
// -------------------------------------------------------------

// Screen 20 — Trip Completed
export function Screen20TripCompleted({ onNavigate }) {
  const fare = GLOBAL_BARGAIN_FARE || 284;
  const payment = WALLET_DATA.paymentMethods.find(m => m.id === GLOBAL_SELECTED_PAYMENT) || WALLET_DATA.paymentMethods[0];

  useEffect(() => {
    sounds.playTripCompleted();
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '28px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
        {/* Animated Checkmark Badge */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#EAFDF0', border: '2.5px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 0 24px rgba(22, 163, 74, 0.25)' }}>
          <Check size={42} color="#16A34A" strokeWidth={3} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#24153F', marginBottom: '6px' }}>
          You Have Arrived!
        </h1>
        <p style={{ fontSize: '13px', color: '#6B5B7D', marginBottom: '24px' }}>
          Hope you enjoyed your ride with {MOCK_DRIVER.name}.
        </p>

        {/* Fare Card */}
        <div style={{ width: '100%', backgroundColor: '#F8F6FD', borderRadius: '18px', padding: '20px', border: '1.5px solid #E5DFF0', textAlign: 'center', marginBottom: '16px', boxShadow: '0 4px 14px rgba(84,39,168,0.06)' }}>
          <div style={{ fontSize: '12px', color: '#6B5B7D', fontWeight: 600 }}>TOTAL TRIP FARE</div>
          <div style={{ fontSize: '38px', fontWeight: 900, color: '#5427A8', margin: '4px 0' }}>₹{fare}</div>
          <div style={{ fontSize: '12px', color: '#5427A8', fontWeight: 700 }}>Payment via {payment.title}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #E5DFF0', marginTop: '16px', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>DISTANCE</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>7.8 km</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>DURATION</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>22 mins</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => onNavigate('s21_confirm_payment')}
          style={{ width: '100%', height: '52px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
        >
          <span>Confirm Payment • ₹{fare}</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// Screen 21 — Confirm Payment
export function Screen21ConfirmPayment({ onNavigate }) {
  const fare = GLOBAL_BARGAIN_FARE || 284;
  const payment = WALLET_DATA.paymentMethods.find(m => m.id === GLOBAL_SELECTED_PAYMENT) || WALLET_DATA.paymentMethods[0];
  const [isPaid, setIsPaid] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);

  const tips = [0, 20, 30, 50];
  const totalWithTip = fare + selectedTip;

  const handleConfirmPay = () => {
    setIsPaid(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => onNavigate('s20_trip_completed')} style={{ color: '#FFFFFF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: 800 }}>Confirm Payment</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
          <Lock size={12} />
          <span>Secure</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* Main Status & Amount Card */}
        <div style={{ backgroundColor: isPaid ? '#F0FDF4' : '#F8F6FD', borderRadius: '20px', padding: '22px 18px', border: isPaid ? '2px solid #16A34A' : '1.5px solid #E5DFF0', textAlign: 'center', marginBottom: '16px', boxShadow: '0 4px 16px rgba(84,39,168,0.06)', transition: 'all 0.3s ease' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isPaid ? '#DCFCE7' : '#ECE5F8', color: isPaid ? '#16A34A' : '#5427A8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            {isPaid ? <CheckCircle2 size={32} /> : <CreditCard size={28} />}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: isPaid ? '#16A34A' : '#6B5B7D', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            {isPaid ? 'Payment Confirmed' : 'Total Amount Due'}
          </div>
          <div style={{ fontSize: '38px', fontWeight: 900, color: isPaid ? '#16A34A' : '#5427A8', margin: '4px 0' }}>
            ₹{totalWithTip}
          </div>
          {selectedTip > 0 && (
            <div style={{ fontSize: '12px', color: '#6B5B7D', fontWeight: 600 }}>
              (Fare ₹{fare} + Driver Tip ₹{selectedTip})
            </div>
          )}
          {isPaid && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#16A34A', fontWeight: 700, backgroundColor: '#DCFCE7', display: 'inline-block', padding: '3px 10px', borderRadius: '6px' }}>
              Transaction ID: TXN-FG-{Date.now().toString().slice(-6)}
            </div>
          )}
        </div>

        {/* Selected Payment Method Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E5DFF0', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#6B5B7D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Payment Method
            </span>
            {!isPaid && (
              <button
                onClick={() => {
                  GLOBAL_PAYMENT_RETURN_SCREEN = 's21_confirm_payment';
                  onNavigate('s26_payment_methods');
                }}
                style={{ fontSize: '12px', color: '#5427A8', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Change
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8F6FD', padding: '12px', borderRadius: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ECE5F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
              {payment.type === 'UPI' ? <Smartphone size={20} /> : payment.type === 'CARD' ? <CreditCard size={20} /> : payment.type === 'WALLET' ? <WalletIcon size={20} /> : <Banknote size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>{payment.title}</div>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{payment.detail}</div>
            </div>
            {isPaid ? (
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16A34A', backgroundColor: '#DCFCE7', padding: '3px 8px', borderRadius: '6px' }}>PAID</span>
            ) : (
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', backgroundColor: '#F4EEFF', padding: '3px 8px', borderRadius: '6px' }}>READY</span>
            )}
          </div>
        </div>

        {/* Tip the Driver Section */}
        {!isPaid && (
          <div style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', border: '1px solid #E5DFF0', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#24153F' }}>Tip Your Driver {MOCK_DRIVER.name}?</span>
              <span style={{ fontSize: '11px', color: '#6B5B7D' }}>100% goes to driver</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {tips.map((tipAmount) => {
                const isSelected = selectedTip === tipAmount;
                return (
                  <button
                    key={tipAmount}
                    onClick={() => setSelectedTip(tipAmount)}
                    style={{
                      flex: 1,
                      height: '38px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #5427A8' : '1px solid #D8CDF3',
                      backgroundColor: isSelected ? '#5427A8' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#24153F',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tipAmount === 0 ? 'No Tip' : `+₹${tipAmount}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Trip & Driver Mini Info */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5DFF0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundImage: `url(${MOCK_DRIVER.avatar})`, backgroundSize: 'cover', border: '2px solid #5427A8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#24153F' }}>{MOCK_DRIVER.name}</div>
            <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{MOCK_DRIVER.vehicleModel} • {MOCK_DRIVER.vehicleNumber}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6B5B7D' }}>TRIP DISTANCE</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#24153F' }}>7.8 km (22m)</div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div style={{ padding: '16px 20px', borderTop: '1.5px solid #E5DFF0', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 -4px 16px rgba(36,21,63,0.06)' }}>
        {!isPaid ? (
          <button
            onClick={handleConfirmPay}
            style={{
              width: '100%',
              height: '52px',
              backgroundColor: '#F5C400',
              color: '#24153F',
              fontWeight: 800,
              fontSize: '15px',
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>Confirm & Pay ₹{totalWithTip}</span>
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        ) : (
          <>
            <button
              onClick={() => onNavigate('s22_rating')}
              style={{
                width: '100%',
                height: '52px',
                backgroundColor: '#F5C400',
                color: '#24153F',
                fontWeight: 800,
                fontSize: '15px',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Rate Driver & Feedback</span>
              <ChevronRight size={18} strokeWidth={3} />
            </button>
            <button
              onClick={() => onNavigate('s23_receipt')}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#F6F1FF',
                border: '1.5px solid #5427A8',
                color: '#5427A8',
                fontWeight: 700,
                fontSize: '14px',
                borderRadius: '14px',
                cursor: 'pointer',
              }}
            >
              View Itemized Receipt
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Screen 22 — Rating & Feedback (Shifted from 21)
export function Screen22Rating({ onNavigate }) {
  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Clean vehicle', 'Friendly driver', 'Smooth ride']);
  const tags = ['Clean vehicle', 'Friendly driver', 'Smooth ride', 'On time', 'Safe driving', 'Great music'];

  const toggleTag = (t) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter(item => item !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '24px 20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => onNavigate('s21_confirm_payment')} style={{ color: '#24153F', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundImage: `url(${MOCK_DRIVER.avatar})`, backgroundSize: 'cover', margin: '0 auto 12px', border: '2.5px solid #5427A8', boxShadow: '0 4px 12px rgba(84,39,168,0.2)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#24153F' }}>How was your ride?</h1>
          <p style={{ fontSize: '13px', color: '#6B5B7D' }}>Rate your experience with {MOCK_DRIVER.name}</p>
        </div>

        {/* 5-star selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button key={num} onClick={() => setStars(num)} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
              <Star size={36} color="#F5C400" fill={num <= stars ? '#F5C400' : 'none'} />
            </button>
          ))}
        </div>

        {/* Quick Feedback Chips */}
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '10px' }}>
          WHAT WENT WELL?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {tags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: active ? '#5427A8' : '#F8F6FD',
                  color: active ? '#FFFFFF' : '#24153F',
                  border: active ? '1.5px solid #5427A8' : '1px solid #E5DFF0',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <textarea
          placeholder="Leave an optional tip or feedback for Arjun..."
          rows={3}
          style={{ width: '100%', backgroundColor: '#F8F6FD', border: '1.5px solid #E5DFF0', borderRadius: '12px', padding: '12px', fontSize: '13px', color: '#24153F', outline: 'none', resize: 'none' }}
        />
      </div>

      <button
        onClick={() => {
          RideXAPI.rateRide('RX-99410', {
            stars,
            feedbackTags: selectedTags,
            comment: '',
          }).catch((err) => console.warn('Offline rate fallback:', err));
          onNavigate('s23_receipt');
        }}
        style={{ width: '100%', height: '52px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)', border: 'none', cursor: 'pointer' }}
      >
        Submit Feedback
      </button>
    </div>
  );
}

// Screen 23 — Receipt (Shifted from 22)
export function Screen23Receipt({ onNavigate }) {

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => onNavigate('s07_home')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Trip Receipt</span>
        <button onClick={() => alert('Receipt shared!')} style={{ color: '#F5C400' }}>
          <Share2 size={18} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* Receipt Container (White 30% Canvas) */}
        <div style={{ backgroundColor: '#F8F6FD', borderRadius: '18px', padding: '20px', border: '1.5px solid #E5DFF0', marginBottom: '16px', boxShadow: '0 4px 14px rgba(84,39,168,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #D8CDF3', paddingBottom: '14px', marginBottom: '14px' }}>
            <div>
              <RideXLogo size="sm" />
              <div style={{ fontSize: '11px', color: '#6B5B7D', marginTop: '4px' }}>Trip ID: RX-99410</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#6B5B7D' }}>DATE & TIME</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#24153F' }}>30 Sep 2026, 03:07 PM</div>
            </div>
          </div>

          {/* Route info */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
              <span style={{ color: '#24153F', fontWeight: 600 }}>{GLOBAL_PICKUP_LOCATION || 'Dindigul Junction'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#5427A8' }} />
              <span style={{ color: '#24153F', fontWeight: 600 }}>{GLOBAL_DESTINATION_LOCATION || 'Palani Road, Dindigul'}</span>
            </div>
          </div>

          {/* Table breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#6B5B7D' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base Fare</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹69.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Distance Fare (7.8 km)</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹117.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time Fare (22 mins)</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹44.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GST & Municipal Fee (5%)</span>
              <span style={{ color: '#24153F', fontWeight: 600 }}>₹18.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
              <span>First Ride Promotion</span>
              <span>-₹20.00</span>
            </div>

            <div style={{ height: '1px', backgroundColor: '#E5DFF0', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 900, color: '#24153F' }}>
              <span>Total Paid</span>
              <span style={{ color: '#5427A8', fontSize: '20px' }}>₹284.00</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1.5px solid #E5DFF0', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => alert('Receipt PDF downloaded!')}
          style={{ flex: 1, height: '48px', backgroundColor: '#F8F6FD', border: '1.5px solid #E5DFF0', color: '#24153F', fontWeight: 700, fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Download size={16} color="#5427A8" /> Download PDF
        </button>
        <button
          onClick={() => onNavigate('s07_home')}
          style={{ flex: 1, height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

// Backwards compatibility aliases
export const Screen21Rating = Screen22Rating;
export const Screen22Receipt = Screen23Receipt;

// -------------------------------------------------------------
// PHASE J — RIDES HISTORY & DETAILS
// -------------------------------------------------------------

// Screen 23 — Ride History
export function Screen23RideHistory({ onNavigate }) {
  const [tab, setTab] = useState('completed');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <span style={{ fontSize: '18px', fontWeight: 800 }}>Your Rides</span>
        <span style={{ fontSize: '12px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>142 Total</span>
      </div>

      {/* Tabs (Purple / Yellow / White) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 16px', gap: '8px', backgroundColor: '#F8F6FD', borderBottom: '1px solid #E5DFF0' }}>
        {['upcoming', 'completed', 'cancelled'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: '38px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              textTransform: 'capitalize',
              backgroundColor: tab === t ? '#F5C400' : '#FFFFFF',
              color: tab === t ? '#24153F' : '#6B5B7D',
              border: tab === t ? '1.5px solid #F5C400' : '1px solid #E5DFF0',
              boxShadow: tab === t ? '0 2px 8px rgba(245, 196, 0, 0.3)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tab === 'upcoming' && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B5B7D' }}>
            <Clock size={36} color="#5427A8" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#24153F', marginBottom: '4px' }}>No Upcoming Rides</div>
            <div style={{ fontSize: '13px' }}>Schedule a ride up to 7 days in advance.</div>
          </div>
        )}

        {tab === 'completed' && RIDE_HISTORY.filter(r => r.status === 'Completed').map((ride) => (
          <div
            key={ride.id}
            onClick={() => onNavigate('s24_ride_details')}
            style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', padding: '16px', border: '1.5px solid #E5DFF0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(36,21,63,0.04)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#6B5B7D', fontWeight: 600 }}>{ride.date}</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#5427A8' }}>₹{ride.fare}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
              <span style={{ fontWeight: 700, color: '#24153F' }}>{ride.pickup}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#5427A8' }} />
              <span style={{ fontWeight: 700, color: '#24153F' }}>{ride.destination}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B5B7D', borderTop: '1px solid #E5DFF0', paddingTop: '10px' }}>
              <span style={{ fontWeight: 600 }}>{ride.vehicle}</span>
              <span style={{ color: '#5427A8', fontWeight: 800 }}>Details →</span>
            </div>
          </div>
        ))}

        {tab === 'cancelled' && RIDE_HISTORY.filter(r => r.status === 'Cancelled').map((ride) => (
          <div
            key={ride.id}
            style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', padding: '16px', border: '1.5px solid #E5DFF0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6B5B7D' }}>{ride.date}</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', backgroundColor: '#FFF0F0', padding: '2px 8px', borderRadius: '4px' }}>Cancelled</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#24153F' }}>{ride.pickup} → {ride.destination}</div>
            <div style={{ fontSize: '12px', color: '#6B5B7D', marginTop: '4px' }}>{ride.duration}</div>
          </div>
        ))}
      </div>

      <MobileBottomNav activeTab="rides" onTabChange={(tab, s) => onNavigate(s)} />
    </div>
  );
}

// Screen 24 — Ride Details
export function Screen24RideDetails({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button onClick={() => onNavigate('s23_ride_history')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Ride Details</span>
      </div>

      <div style={{ height: '180px', position: 'relative' }}>
        <MapCanvas interactive={false} tripState="completed" showRoute={true} />
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 800 }}>COMPLETED TRIP</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#24153F' }}>Trip #RX-99410</div>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#5427A8' }}>₹284</span>
        </div>

        {/* Route Info */}
        <div style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '14px', marginBottom: '14px', border: '1.5px solid #E5DFF0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
            <span style={{ fontWeight: 700, color: '#24153F' }}>Dindigul Junction Railway Station</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#5427A8' }} />
            <span style={{ fontWeight: 700, color: '#24153F' }}>Palani Road Bypass, Dindigul</span>
          </div>
        </div>

        {/* Driver Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '12px', marginBottom: '16px', border: '1.5px solid #E5DFF0' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundImage: `url(${MOCK_DRIVER.avatar})`, backgroundSize: 'cover', border: '2px solid #5427A8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>Vikram Rathore</div>
            <div style={{ fontSize: '12px', color: '#6B5B7D' }}>Hyundai Verna (KA 01 MJ 3321)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#24153F', backgroundColor: '#F5C400', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
            <Star size={12} fill="#24153F" /> 5.0
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('s10_choose_ride')}
            style={{ flex: 1, height: '48px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}
          >
            Book Again
          </button>
          <button
            onClick={() => onNavigate('s34_help')}
            style={{ flex: 1, height: '48px', backgroundColor: '#F8F6FD', border: '1.5px solid #5427A8', color: '#5427A8', fontWeight: 800, fontSize: '14px', borderRadius: '12px' }}
          >
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE K — SAVED LOCATIONS
// -------------------------------------------------------------

// Screen 25 — Saved Places
export function Screen25SavedPlaces({ onNavigate }) {
  const [places, setPlaces] = useState(SAVED_LOCATIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');

  useEffect(() => {
    RideXAPI.getSavedPlaces()
      .then((res) => {
        if (res && res.places && res.places.length > 0) {
          setPlaces(res.places);
        }
      })
      .catch((err) => console.warn('Using local places fallback:', err));
  }, []);

  const handleAdd = () => {
    if (!newName) return;
    const newPlace = {
      id: `custom-${Date.now()}`,
      type: 'favorite',
      name: newName,
      address: newAddr || 'Bangalore Central, Karnataka',
      coords: { x: 50, y: 50 },
    };

    RideXAPI.addSavedPlace(newPlace).catch((err) => console.warn('Offline add place:', err));
    setPlaces([...places, newPlace]);
    setShowAddModal(false);
    setNewName('');
    setNewAddr('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => onNavigate('s29_profile')} style={{ color: '#FFFFFF' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: 800 }}>Saved Places</span>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ color: '#24153F', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(245, 196, 0, 0.3)' }}>
          <Plus size={16} /> Add
        </button>
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {places.map((place) => (
          <div
            key={place.id}
            style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px', border: '1.5px solid #E5DFF0', boxShadow: '0 2px 8px rgba(36,21,63,0.04)' }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#F6F1FF', border: '1.5px solid #5427A8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
              {place.type === 'home' ? <Home size={20} /> : place.type === 'work' ? <Briefcase size={20} /> : <Heart size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>{place.name}</div>
              <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{place.address}</div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(36,21,63,0.5)', backdropFilter: 'blur(3px)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', borderTop: '2px solid #5427A8', boxShadow: '0 -8px 24px rgba(36,21,63,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#24153F', marginBottom: '14px' }}>Add New Saved Place</h3>
            <input
              type="text"
              placeholder="Place name (e.g. Gym, Parents' House)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', marginBottom: '10px', outline: 'none', fontSize: '14px', fontWeight: 600 }}
            />
            <input
              type="text"
              placeholder="Address / Landmark"
              value={newAddr}
              onChange={(e) => setNewAddr(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', marginBottom: '16px', outline: 'none', fontSize: '14px', fontWeight: 600 }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', color: '#6B5B7D', fontWeight: 700, border: '1px solid #E5DFF0' }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, height: '48px', backgroundColor: '#F5C400', color: '#24153F', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}>Save Place</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PHASE L — PAYMENT & WALLET
// -------------------------------------------------------------

// Screen 26 — Payment Methods
export function Screen26PaymentMethods({ onNavigate }) {
  const [methods, setMethods] = useState(WALLET_DATA.paymentMethods);
  const [selected, setSelected] = useState(GLOBAL_SELECTED_PAYMENT || 'pm-upi');

  const handleSelect = (id) => {
    setSelected(id);
    GLOBAL_SELECTED_PAYMENT = id;
  };

  const handleContinue = () => {
    GLOBAL_SELECTED_PAYMENT = selected;
    onNavigate(GLOBAL_PAYMENT_RETURN_SCREEN || 's13_fare_estimate');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button
          onClick={() => onNavigate(GLOBAL_PAYMENT_RETURN_SCREEN || 's13_fare_estimate')}
          style={{ color: '#FFFFFF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Payment Methods</span>
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {methods.map((pm) => {
          const isSelected = selected === pm.id;
          return (
            <div
              key={pm.id}
              onClick={() => handleSelect(pm.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                backgroundColor: isSelected ? '#F6F1FF' : '#F8F6FD',
                borderRadius: '16px',
                padding: '16px',
                border: isSelected ? '2px solid #5427A8' : '1.5px solid #E5DFF0',
                boxShadow: isSelected ? '0 4px 12px rgba(84, 39, 168, 0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E5DFF0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5427A8' }}>
                {pm.type === 'UPI' ? <Smartphone size={20} /> : pm.type === 'CARD' ? <CreditCard size={20} /> : pm.type === 'WALLET' ? <WalletIcon size={20} /> : <Banknote size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>{pm.title}</span>
                  {pm.isPrimary && (
                    <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#F5C400', color: '#24153F', padding: '2px 6px', borderRadius: '4px' }}>
                      PRIMARY
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{pm.detail}</div>
              </div>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '5px solid #5427A8' : '2px solid #D8CDF3', backgroundColor: isSelected ? '#FFFFFF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#5427A8' }} />}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => onNavigate('s27_add_card')}
          style={{ height: '50px', backgroundColor: '#F8F6FD', borderRadius: '14px', border: '1.5px dashed #5427A8', color: '#5427A8', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px', cursor: 'pointer' }}
        >
          <Plus size={18} /> Add New Credit / Debit Card
        </button>
      </div>

      {/* Sticky Bottom Action Bar with Continue Button */}
      <div style={{ padding: '16px 20px', borderTop: '1.5px solid #E5DFF0', backgroundColor: '#FFFFFF', boxShadow: '0 -4px 16px rgba(36, 21, 63, 0.06)' }}>
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            height: '52px',
            backgroundColor: '#F5C400',
            color: '#24153F',
            fontWeight: 800,
            fontSize: '15px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span>Continue</span>
          <ChevronRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// Screen 27 — Add Card
export function Screen27AddCard({ onNavigate }) {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4289');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('•••');
  const [name, setName] = useState('ASHFAR KHAN');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => onNavigate('s26_payment_methods')} style={{ color: '#24153F' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800, color: '#24153F' }}>Add Card</span>
      </div>

      <div style={{ flex: 1 }}>
        {/* Visual Card Preview (Purple 25% + Violet 20% Gradient with Yellow 25% text) */}
        <div style={{ height: '175px', borderRadius: '18px', background: 'linear-gradient(135deg, #5427A8 0%, #24153F 100%)', border: '1.5px solid rgba(245, 196, 0, 0.4)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(84, 39, 168, 0.3)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#F5C400' }}>FG DRIVO Pay</span>
            <CreditCard size={24} color="#FFFFFF" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '2px', color: '#FFFFFF' }}>{cardNumber}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#E5DFF0' }}>
            <div>
              <div>CARDHOLDER</div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>{name}</div>
            </div>
            <div>
              <div>EXPIRES</div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>{expiry}</div>
            </div>
          </div>
        </div>

        {/* Input Fields (White 30% + Violet 20% typography) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            style={{ height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              style={{ height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
            />
            <input
              type="password"
              placeholder="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              style={{ height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
            />
          </div>
          <input
            type="text"
            placeholder="Cardholder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      <button
        onClick={() => onNavigate('s26_payment_methods')}
        style={{ width: '100%', height: '52px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)' }}
      >
        Save Card Securely
      </button>
    </div>
  );
}

// Screen 28 — Wallet
export function Screen28Wallet({ onNavigate }) {
  const [balance, setBalance] = useState(WALLET_DATA.balance);
  const [transactions, setTransactions] = useState(WALLET_DATA.transactions);

  useEffect(() => {
    RideXAPI.getWallet()
      .then((w) => {
        if (w && typeof w.balance === 'number') {
          setBalance(w.balance);
          if (w.transactions) setTransactions(w.transactions);
        }
      })
      .catch((err) => console.warn('Using local wallet data:', err));
  }, []);

  const addAmount = (amt) => {
    RideXAPI.topupWallet(amt)
      .then((res) => {
        setBalance(res.newBalance);
        if (res.transaction) {
          setTransactions((prev) => [res.transaction, ...prev]);
        }
      })
      .catch(() => setBalance((prev) => prev + amt));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <span style={{ fontSize: '18px', fontWeight: 800 }}>FG DRIVO Wallet</span>
        <button onClick={() => onNavigate('s26_payment_methods')} style={{ color: '#24153F', backgroundColor: '#F5C400', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px' }}>
          Manage
        </button>
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {/* Balance Card (Purple + Violet Gradient with Yellow 25% Balance) */}
        <div style={{ background: 'linear-gradient(135deg, #24153F 0%, #5427A8 100%)', borderRadius: '20px', padding: '22px', border: '1.5px solid rgba(245, 196, 0, 0.3)', boxShadow: '0 8px 24px rgba(84, 39, 168, 0.25)', marginBottom: '20px', color: '#FFFFFF' }}>
          <div style={{ fontSize: '12px', color: '#E5DFF0', fontWeight: 600 }}>CURRENT BALANCE</div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#F5C400', margin: '4px 0 16px' }}>₹{balance.toFixed(2)}</div>

          {/* Quick Top-up Chips */}
          <div style={{ fontSize: '11px', color: '#E5DFF0', fontWeight: 700, marginBottom: '8px' }}>QUICK TOP UP:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[+500, +1000, +2000].map((amt) => (
              <button
                key={amt}
                onClick={() => addAmount(amt)}
                style={{ height: '38px', backgroundColor: '#FFFFFF', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#5427A8', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '12px' }}>
          RECENT TRANSACTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {transactions.map((txn) => (
            <div
              key={txn.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '12px 14px', border: '1px solid #E5DFF0' }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#24153F' }}>{txn.title}</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>{txn.date}</div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: txn.type === 'credit' ? '#16A34A' : '#24153F' }}>
                {txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MobileBottomNav activeTab="wallet" onTabChange={(tab, s) => onNavigate(s)} />
    </div>
  );
}

// -------------------------------------------------------------
// PHASE M — PROFILE
// -------------------------------------------------------------

// Screen 29 — Profile Hub
export function Screen29Profile({ onNavigate }) {
  const currentUser = getStoredUser();
  const accountMenu = [
    { title: 'Personal Information', icon: User, screen: 's30_edit_profile', desc: 'Name, phone, email & preferences' },
    { title: 'Payment Methods', icon: CreditCard, screen: 's26_payment_methods', desc: 'Cards, UPI & Net Banking' },
    { title: 'Saved Places', icon: MapPin, screen: 's25_saved_places', desc: 'Home, Work & favorites' },
    { title: 'Emergency Contacts', icon: Shield, screen: 's32_emergency_contacts', desc: 'Trusted contacts & SOS' },
    { title: 'Safety Center', icon: ShieldAlert, screen: 's31_safety', desc: 'Ride insurance & safety tools' },
    { title: 'Notifications', icon: Bell, screen: 's33_notifications', desc: 'Alerts, updates & receipts' },
    { title: 'App Settings', icon: SettingsIcon, screen: 's35_settings', desc: 'Language, dark mode & permissions' },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F4F7FC',
        position: 'relative',
        minHeight: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* ----------------- TOP HEADER ----------------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onNavigate('s07_home')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Customer Profile Hub
            </h1>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
              Manage wallet, history & support
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('s30_edit_profile')}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#4F46E5',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
          }}
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>
      </div>

      <div style={{ flex: 1, padding: '14px 14px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* ----------------- USER PROFILE HERO CARD ----------------- */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                backgroundImage: `url(${CURRENT_USER.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid #3B82F6',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '16px' }}>👋</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, marginTop: '1px' }}>
              {currentUser.phone}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                <Star size={11} fill="#F59E0B" color="#F59E0B" />
                <span>{CURRENT_USER.rating} Rating</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>• 142 Safe Rides</span>
            </div>
          </div>
        </div>

        {/* ----------------- 1. WALLET BALANCE CARD (MOVED HERE) ----------------- */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px',
            border: '1.5px solid #DBEAFE',
            boxShadow: '0 4px 18px rgba(37, 99, 235, 0.08)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                }}
              >
                <WalletIcon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Wallet Balance
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>
                  ₹ 250<span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>.00</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('s28_wallet')}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Plus size={15} strokeWidth={2.8} />
              <span>Add Money</span>
            </button>
          </div>

          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#64748B',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#10B981" /> 100% Secure FG DRIVO Pay
            </span>
            <span
              onClick={() => onNavigate('s28_wallet')}
              style={{ color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
            >
              View Statement &rarr;
            </span>
          </div>
        </div>

        {/* ----------------- 2 & 3. HISTORY & SUPPORT QUICK TILES ----------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* History Card (Moved Here) */}
          <div
            onClick={() => onNavigate('s23_ride_history')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              padding: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} strokeWidth={2.2} />
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Ride History</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                Past trips & receipts
              </div>
            </div>
          </div>

          {/* Support Card (Moved Here) */}
          <div
            onClick={() => onNavigate('s34_help')}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              padding: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Headphones size={20} strokeWidth={2.2} />
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Help & Support</div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                24/7 Live chat & FAQ
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- ACCOUNT SETTINGS LIST ----------------- */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '8px 12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ padding: '8px 6px 6px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Account & Preferences
          </div>
          {accountMenu.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(m.screen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  borderBottom: idx === accountMenu.length - 1 ? 'none' : '1px solid #F1F5F9',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{m.title}</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>{m.desc}</div>
                </div>
                <ChevronRight size={15} color="#94A3B8" />
              </div>
            );
          })}
        </div>
      </div>

      <MobileBottomNav activeTab="profile" onNavigate={onNavigate} />
    </div>
  );
}

// Screen 30 — Edit Profile
export function Screen30EditProfile({ onNavigate }) {
  const initialUser = getStoredUser();
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone);
  const [email, setEmail] = useState(initialUser.email);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => onNavigate('s29_profile')} style={{ color: '#24153F' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800, color: '#24153F' }}>Personal Information</span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '74px', height: '74px', borderRadius: '50%', backgroundImage: `url(${CURRENT_USER.avatar})`, backgroundSize: 'cover', border: '2.5px solid #5427A8' }} />
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#F5C400', color: '#24153F', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FFFFFF' }}>
              <Edit3 size={13} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#5427A8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>FULL NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#5427A8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>PHONE NUMBER</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#5427A8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          saveStoredUser({ name, phone, email });
          RideXAPI.updateProfile({ name, phone, email }).catch((err) => console.warn('Offline profile update:', err));
          onNavigate('s29_profile');
        }}
        style={{ width: '100%', height: '52px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '15px', borderRadius: '14px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)' }}
      >
        Save Changes
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE N — SAFETY CENTER & EMERGENCY
// -------------------------------------------------------------

// Screen 31 — Safety Center
export function Screen31Safety({ onNavigate }) {
  const [sosConfirming, setSosConfirming] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => onNavigate('s07_home')} style={{ color: '#24153F' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800, color: '#24153F' }}>Safety Center</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Emergency SOS High-Alert Action with Guard */}
        <div style={{ backgroundColor: '#FFF5F5', border: '1.5px solid #FCA5A5', borderRadius: '18px', padding: '20px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#EF4444', color: '#FFFFFF', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#24153F', marginBottom: '4px' }}>Emergency Assistance</h2>
          <p style={{ fontSize: '12px', color: '#6B5B7D', marginBottom: '16px' }}>
            Instantly alerts police dispatch & your trusted contacts with live GPS coordinates.
          </p>

          {!sosConfirming ? (
            <button
              onClick={() => setSosConfirming(true)}
              style={{ width: '100%', height: '48px', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 800, fontSize: '14px', borderRadius: '12px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
            >
              Trigger Emergency SOS (112)
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSosConfirming(false)}
                style={{ flex: 1, height: '44px', backgroundColor: '#F8F6FD', borderRadius: '10px', color: '#6B5B7D', fontSize: '12px', fontWeight: 700, border: '1px solid #E5DFF0' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  RideXAPI.triggerSOS().catch(console.error);
                  alert('EMERGENCY SOS DISPATCHED: Authorities and trusted contacts notified via FG DRIVO Safety Dispatch API.');
                  setSosConfirming(false);
                }}
                style={{ flex: 1.5, height: '44px', backgroundColor: '#DC2626', borderRadius: '10px', color: '#FFFFFF', fontSize: '12px', fontWeight: 800 }}
              >
                CONFIRM SOS NOW
              </button>
            </div>
          )}
        </div>

        {/* Safety Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            onClick={() => onNavigate('s32_emergency_contacts')}
            style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '16px', border: '1.5px solid #E5DFF0', cursor: 'pointer' }}
          >
            <Shield size={22} color="#5427A8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>Trusted Contacts</div>
            <div style={{ fontSize: '11px', color: '#6B5B7D' }}>2 Contacts Synced</div>
          </div>
          <div
            onClick={() => alert('Live trip sharing active!')}
            style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '16px', border: '1.5px solid #E5DFF0', cursor: 'pointer' }}
          >
            <Share2 size={22} color="#F5C400" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F' }}>Share Live Route</div>
            <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Instant Link</div>
          </div>
        </div>

        {/* FG DRIVO Safety Standards Card */}
        <div style={{ backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '16px', border: '1.5px solid #E5DFF0' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#5427A8', marginBottom: '6px' }}>FG DRIVO Safety Guarantee</div>
          <div style={{ fontSize: '12px', color: '#24153F', lineHeight: 1.6, fontWeight: 500 }}>
            • 100% background-verified commercial drivers<br />
            • 24/7 dedicated safety response team<br />
            • Real-time off-route GPS deviation monitoring<br />
            • Anonymized phone number dialing
          </div>
        </div>
      </div>
    </div>
  );
}

// Screen 32 — Emergency Contacts
export function Screen32EmergencyContacts({ onNavigate }) {
  const [contacts, setContacts] = useState(EMERGENCY_CONTACTS);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Parent');

  const addContact = () => {
    if (!name || !phone) return;
    setContacts([...contacts, { id: `ec-${Date.now()}`, name, phone, relation, shareLive: true }]);
    setShowAdd(false);
    setName('');
    setPhone('');
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => onNavigate('s31_safety')} style={{ color: '#24153F' }}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#24153F' }}>Trusted Contacts</span>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ color: '#24153F', backgroundColor: '#F5C400', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px' }}>
          <Plus size={16} /> Add
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: '#6B5B7D', lineHeight: 1.5 }}>
          Your trusted contacts will automatically receive your trip route link and emergency notifications when activated.
        </p>

        {contacts.map((c) => (
          <div
            key={c.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F6FD', borderRadius: '14px', padding: '14px', border: '1.5px solid #E5DFF0' }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#24153F' }}>{c.name} ({c.relation})</div>
              <div style={{ fontSize: '12px', color: '#6B5B7D' }}>{c.phone}</div>
            </div>
            <button onClick={() => deleteContact(c.id)} style={{ color: '#EF4444' }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(36,21,63,0.5)', backdropFilter: 'blur(3px)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', borderTop: '2px solid #5427A8', boxShadow: '0 -8px 24px rgba(36,21,63,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#24153F', marginBottom: '14px' }}>Add Trusted Contact</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, marginBottom: '10px', outline: 'none' }}
            />
            <input
              type="tel"
              placeholder="Mobile Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', border: '1.5px solid #E5DFF0', padding: '0 14px', color: '#24153F', fontWeight: 600, marginBottom: '16px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, height: '48px', backgroundColor: '#F8F6FD', borderRadius: '12px', color: '#6B5B7D', fontWeight: 700, border: '1px solid #E5DFF0' }}>Cancel</button>
              <button onClick={addContact} style={{ flex: 1, height: '48px', backgroundColor: '#F5C400', color: '#24153F', borderRadius: '12px', fontWeight: 800, boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}>Save Contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PHASE O — NOTIFICATIONS
// -------------------------------------------------------------

// Screen 33 — Notifications
export function Screen33Notifications({ onNavigate }) {
  const [filter, setFilter] = useState('all');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button onClick={() => onNavigate('s07_home')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Notifications</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', backgroundColor: '#F8F6FD', borderBottom: '1px solid #E5DFF0' }}>
        {['all', 'ride', 'payment', 'promo', 'safety'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'capitalize',
              backgroundColor: filter === cat ? '#F5C400' : '#FFFFFF',
              color: filter === cat ? '#24153F' : '#6B5B7D',
              border: filter === cat ? '1px solid #F5C400' : '1px solid #E5DFF0',
              boxShadow: filter === cat ? '0 2px 6px rgba(245, 196, 0, 0.3)' : 'none',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {NOTIFICATIONS_DATA.filter(n => filter === 'all' || n.category === filter).map((notif) => (
          <div
            key={notif.id}
            style={{
              backgroundColor: '#F8F6FD',
              borderRadius: '14px',
              padding: '14px',
              border: notif.unread ? '1.5px solid #5427A8' : '1px solid #E5DFF0',
              position: 'relative',
              boxShadow: '0 2px 6px rgba(36,21,63,0.03)',
            }}
          >
            {notif.unread && (
              <span style={{ position: 'absolute', top: '14px', right: '14px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
            )}
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#24153F', marginBottom: '4px' }}>{notif.title}</div>
            <div style={{ fontSize: '12px', color: '#6B5B7D', lineHeight: 1.4, marginBottom: '6px' }}>{notif.desc}</div>
            <div style={{ fontSize: '10px', color: '#8A7A9E', fontWeight: 600 }}>{notif.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE P — HELP & SUPPORT
// -------------------------------------------------------------

// Screen 34 — Help & Support
export function Screen34Help({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { title: 'Ride issues', icon: Car },
    { title: 'Payment', icon: CreditCard },
    { title: 'Driver behavior', icon: User },
    { title: 'Lost item', icon: HelpCircle },
    { title: 'Account', icon: SettingsIcon },
    { title: 'Safety incident', icon: ShieldAlert },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button onClick={() => onNavigate('s29_profile')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Help & Support</span>
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F8F6FD', borderRadius: '12px', padding: '0 14px', height: '48px', marginBottom: '20px', border: '1.5px solid #E5DFF0' }}>
          <Search size={18} color="#5427A8" />
          <input
            type="text"
            placeholder="How can we help you today?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#24153F', outline: 'none', fontSize: '14px', fontWeight: 600 }}
          />
        </div>

        {/* Categories */}
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '10px' }}>
          ISSUE CATEGORIES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                onClick={() => alert(`Selected help topic: ${c.title}. Support agent connecting...`)}
                style={{ backgroundColor: '#F8F6FD', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1.5px solid #E5DFF0' }}
              >
                <Icon size={18} color="#5427A8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#24153F' }}>{c.title}</span>
              </div>
            );
          })}
        </div>

        {/* FAQ Accordion */}
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '10px' }}>
          FREQUENTLY ASKED QUESTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
              style={{ backgroundColor: '#F8F6FD', borderRadius: '12px', padding: '14px', cursor: 'pointer', border: '1.5px solid #E5DFF0' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700, color: '#24153F' }}>
                <span>{item.q}</span>
                <span style={{ color: '#5427A8', fontWeight: 800, fontSize: '16px' }}>{expandedFaq === idx ? '−' : '+'}</span>
              </div>
              {expandedFaq === idx && (
                <div style={{ fontSize: '12px', color: '#6B5B7D', marginTop: '10px', lineHeight: 1.5, borderTop: '1px solid #E5DFF0', paddingTop: '10px' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => alert('FG DRIVO 24/7 Agent Connected via Live Chat!')}
          style={{ width: '100%', height: '50px', backgroundColor: '#F5C400', color: '#24153F', fontWeight: 800, fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(245, 196, 0, 0.4)' }}
        >
          <MessageSquare size={16} /> Chat With 24/7 Support Agent
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PHASE Q — SETTINGS
// -------------------------------------------------------------

// Screen 35 — Settings
export function Screen35Settings({ onNavigate }) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [locationHighAccuracy, setLocationHighAccuracy] = useState(true);
  const [smsReceipts, setSmsReceipts] = useState(false);
  const [biometrics, setBiometrics] = useState(true);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#5427A8', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(84, 39, 168, 0.2)' }}>
        <button onClick={() => onNavigate('s29_profile')} style={{ color: '#FFFFFF' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '17px', fontWeight: 800 }}>Settings</span>
      </div>

      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '8px' }}>
            PREFERENCES
          </div>
          <div style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #E5DFF0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E5DFF0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#24153F' }}>Push Notifications</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Trip updates & promotions</div>
              </div>
              <input type="checkbox" checked={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} style={{ width: '18px', height: '18px', accentColor: '#5427A8' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #E5DFF0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#24153F' }}>High Accuracy GPS</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Pinpoint pickup spots</div>
              </div>
              <input type="checkbox" checked={locationHighAccuracy} onChange={() => setLocationHighAccuracy(!locationHighAccuracy)} style={{ width: '18px', height: '18px', accentColor: '#5427A8' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#24153F' }}>FaceID / Biometric Login</div>
                <div style={{ fontSize: '11px', color: '#6B5B7D' }}>Quick device authentication</div>
              </div>
              <input type="checkbox" checked={biometrics} onChange={() => setBiometrics(!biometrics)} style={{ width: '18px', height: '18px', accentColor: '#5427A8' }} />
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', letterSpacing: '0.8px', marginBottom: '8px' }}>
            LEGAL & SYSTEM
          </div>
          <div style={{ backgroundColor: '#F8F6FD', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #E5DFF0' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5DFF0', fontSize: '14px', fontWeight: 600, color: '#24153F' }}>Terms of Service</div>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5DFF0', fontSize: '14px', fontWeight: 600, color: '#24153F' }}>Privacy & Data Policy</div>
            <div style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#6B5B7D' }}>App Version: {BRAND.version}</div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('s03_login')}
          style={{ height: '48px', backgroundColor: '#FFF0F0', color: '#EF4444', borderRadius: '12px', fontWeight: 800, fontSize: '14px', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={16} /> Sign Out of FG DRIVO
        </button>
      </div>
    </div>
  );
}

// Master Screens List Metadata for quick switcher
export const ALL_MOBILE_SCREENS = [
  { id: 's01_splash', title: '01 Splash Screen (FG DRIVO)', phase: 'Phase A — Entry' },
  { id: 's02_onboarding', title: '02 Onboarding (3 Slides)', phase: 'Phase A — Entry' },
  { id: 's03_login', title: '03 Login Screen', phase: 'Phase B — Auth' },
  { id: 's04_otp', title: '04 OTP Verification', phase: 'Phase B — Auth' },
  { id: 's05_location_permission', title: '05 Location Permission', phase: 'Phase C — Permissions' },
  { id: 's06_notification_permission', title: '06 Notification Permission', phase: 'Phase C — Permissions' },
  { id: 's07_home', title: '07 Customer Home (Map & Search)', phase: 'Phase D — Home' },
  { id: 's08_pickup', title: '08 Pickup Location Selector', phase: 'Phase E — Location Search' },
  { id: 's09_destination_search', title: '09 Destination Search', phase: 'Phase E — Location Search' },
  { id: 's10_choose_ride', title: '10 Choose a Ride (Mini/Sedan/SUV)', phase: 'Phase F — Ride Selection' },
  { id: 's11_route_preview', title: '11 Route Preview (Fare Bargain)', phase: 'Phase F — Ride Selection' },
  { id: 's12_booking_confirm', title: '12 Booking Confirmation', phase: 'Phase G — Booking' },
  { id: 's13_fare_estimate', title: '13 Fare Breakdown & Estimate', phase: 'Phase G — Booking' },
  { id: 's14_finding_driver', title: '14 Finding Driver (Radar Animation)', phase: 'Phase G — Booking' },
  { id: 's15_driver_assigned', title: '15 Driver Assigned', phase: 'Phase G — Booking' },
  { id: 's16_driver_arriving', title: '16 Driver Arriving (3 min ETA)', phase: 'Phase H — Live Ride' },
  { id: 's17_driver_arrived', title: '17 Driver Arrived ("I\'m Ready")', phase: 'Phase H — Live Ride' },
  { id: 's18_trip_started', title: '18 Trip Started (Live GPS)', phase: 'Phase H — Live Ride' },
  { id: 's19_trip_in_progress', title: '19 Trip In Progress (12 min ETA)', phase: 'Phase H — Live Ride' },
  { id: 's20_trip_completed', title: '20 Trip Completed & Total Fare', phase: 'Phase I — Completion' },
  { id: 's21_confirm_payment', title: '21 Confirm Payment (UPI/Cash)', phase: 'Phase I — Completion' },
  { id: 's22_rating', title: '22 Driver Rating & Feedback', phase: 'Phase I — Completion' },
  { id: 's23_receipt', title: '23 Detailed Itemized Receipt', phase: 'Phase I — Completion' },
  { id: 's23_ride_history', title: '24 Ride History (Upcoming/Done)', phase: 'Phase J — Rides' },
  { id: 's24_ride_details', title: '25 Ride Details & Rebook', phase: 'Phase J — Rides' },
  { id: 's25_saved_places', title: '26 Saved Places (Home/Work)', phase: 'Phase K — Saved Locations' },
  { id: 's26_payment_methods', title: '27 Payment Methods (UPI/Cards)', phase: 'Phase L — Payment' },
  { id: 's27_add_card', title: '28 Add Credit / Debit Card', phase: 'Phase L — Payment' },
  { id: 's28_wallet', title: '29 FG DRIVO Wallet & Top-up', phase: 'Phase L — Payment' },
  { id: 's29_profile', title: '30 Customer Profile Hub', phase: 'Phase M — Profile' },
  { id: 's30_edit_profile', title: '31 Edit Profile Information', phase: 'Phase M — Profile' },
  { id: 's31_safety', title: '32 Dedicated Safety Center', phase: 'Phase N — Safety' },
  { id: 's32_emergency_contacts', title: '33 Emergency Trusted Contacts', phase: 'Phase N — Safety' },
  { id: 's33_notifications', title: '34 Notification Center', phase: 'Phase O — Notifications' },
  { id: 's34_help', title: '35 Help & Support (FAQ & Chat)', phase: 'Phase P — Help' },
  { id: 's35_settings', title: '36 App Settings & Privacy', phase: 'Phase Q — Settings' },
];
