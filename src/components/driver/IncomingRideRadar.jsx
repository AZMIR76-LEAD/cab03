// FG DRIVO 15-Second Incoming Ride Radar Alert Modal
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Shield, Check, X, Phone, DollarSign, AlertCircle } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';

export default function IncomingRideRadar({ trip, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(trip?.timerSec || 15);
  const totalTime = trip?.timerSec || 15;

  useEffect(() => {
    // Start audible pulsing radar chime
    sounds.playIncomingRideRadar();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sounds.stopIncomingRideRadar();
          if (onDecline) onDecline('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      sounds.stopIncomingRideRadar();
    };
  }, [onDecline]);

  const handleAcceptClick = () => {
    sounds.stopIncomingRideRadar();
    sounds.playTick();
    if (onAccept) onAccept(trip);
  };

  const handleDeclineClick = () => {
    sounds.stopIncomingRideRadar();
    sounds.playTick();
    if (onDecline) onDecline('declined_by_driver');
  };

  const progressPct = ((timeLeft / totalTime) * 100);
  const circumference = 2 * Math.PI * 46; // r=46
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 10, 30, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Outer Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          padding: '24px 20px 32px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Top Handle */}
        <div style={{ width: '44px', height: '5px', backgroundColor: '#CBD5E1', borderRadius: '4px', marginBottom: '18px' }} />

        {/* 15-Second Radial Timer Badge */}
        <div style={{ position: 'relative', width: '104px', height: '104px', marginBottom: '16px' }}>
          <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="52"
              cy="52"
              r="46"
              stroke="#E2E8F0"
              strokeWidth="7"
              fill="none"
            />
            <circle
              cx="52"
              cy="52"
              r="46"
              stroke={timeLeft > 5 ? '#5427A8' : '#EF4444'}
              strokeWidth="7"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px', fontWeight: 900, color: timeLeft > 5 ? '#24153F' : '#EF4444' }}>
              {timeLeft}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px' }}>SEC</span>
          </div>
        </div>

        {/* Fare & Vehicle Category Banner */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'inline-block', backgroundColor: '#F1EAFA', color: '#5427A8', fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', marginBottom: '6px' }}>
            {trip?.category || 'FG DRIVO Sedan'} • INCOMING REQUEST
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>
            ₹ {trip?.fare ? Number(trip.fare).toFixed(2) : '198.00'}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
            {trip?.paymentMethod === 'pm-cash' ? '💵 Cash Collection' : '💳 Prepaid via UPI'} • {trip?.distanceKm || '5.2'} km ({trip?.durationMin || '16'} mins)
          </div>
        </div>

        {/* Route Details Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#F8FAFC',
            borderRadius: '18px',
            border: '1.5px solid #E2E8F0',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Pickup */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', marginTop: '4px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PICKUP POINT (1.2 km away)</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                {trip?.pickup || 'Dindigul Railway Junction (Main Gate)'}
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '2px dashed #CBD5E1', marginLeft: '5px', height: '10px' }} />

          {/* Drop */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444', marginTop: '4px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>DESTINATION</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                {trip?.destination || 'Palani Road Bypass, Near Velu Vidyalaya'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Green Accept & Red Decline */}
        <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDeclineClick}
            style={{
              flex: 1,
              height: '54px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <X size={18} />
            <span>Decline</span>
          </button>

          <button
            onClick={handleAcceptClick}
            style={{
              flex: 2,
              height: '54px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Check size={20} strokeWidth={3} />
            <span>ACCEPT RIDE ({timeLeft}s)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
