import React, { useState, useEffect, useRef } from 'react';
import {
  Car, Power, MapPin, Navigation, Clock, Shield, Star, Phone, MessageSquare,
  AlertTriangle, Check, CheckCircle2, ChevronRight, Plus, DollarSign, Wallet,
  Bell, HelpCircle, Settings, User, ArrowRight, ShieldAlert, Award, FileText,
  RotateCcw, Compass, Lock, LogOut, Sliders, Zap, Sparkles, X, Send, Eye,
  ExternalLink, Smartphone
} from 'lucide-react';
import { DriverAPI, getStoredDriver, saveStoredDriver } from './services/driverApi';
import { driverSocket } from './services/driverSocket';

export default function CabinApp() {
  const [driver, setDriver] = useState(getStoredDriver());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('cabin_driver_token'));
  });

  // Auth state
  const [phone, setPhone] = useState('9811234567');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState('phone'); // 'phone' | 'otp'
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Bottom Navigation Tab
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'trips' | 'earnings' | 'inbox' | 'profile'

  // Availability & GPS State
  const [isOnline, setIsOnline] = useState(false);
  const [gpsReady, setGpsReady] = useState(true);

  // Dispatch & Ride Offer State (15-second Offer Overlay)
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [offerTimer, setOfferTimer] = useState(15);

  // Active Trip State Machine
  // 'none' | 'en_route' | 'arrived' | 'in_transit' | 'completed'
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStage, setTripStage] = useState('none');
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [startOtpInput, setStartOtpInput] = useState('');
  const [startOtpError, setStartOtpError] = useState('');

  // Earnings
  const [earnings, setEarnings] = useState({
    todayGross: 1450.0,
    todayNet: 1276.0,
    todayTrips: 8,
    weeklyNet: 8420.0,
    pendingPayout: 1276.0,
    recentTrips: [],
  });

  // Load Config & Earnings on Mount
  useEffect(() => {
    DriverAPI.getConfig();
    DriverAPI.getEarnings().then(setEarnings);
    driverSocket.connect(driver.id);

    // Listen for incoming ride offer
    const unsubOffer = driverSocket.on('offer', (offer) => {
      if (isOnline && tripStage === 'none') {
        setIncomingOffer(offer);
        setOfferTimer(offer.timeoutSeconds || 15);
      }
    });

    return () => {
      unsubOffer();
      driverSocket.disconnect();
    };
  }, [driver.id, isOnline, tripStage]);

  // 15-second Offer Countdown
  useEffect(() => {
    let interval;
    if (incomingOffer && offerTimer > 0) {
      interval = setInterval(() => {
        setOfferTimer((prev) => {
          if (prev <= 1) {
            setIncomingOffer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incomingOffer, offerTimer]);

  // Waiting Timer when Arrived
  useEffect(() => {
    let timer;
    if (tripStage === 'arrived') {
      timer = setInterval(() => setWaitingSeconds((s) => s + 1), 1000);
    } else {
      setWaitingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [tripStage]);

  // Handle Online Toggle
  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    driverSocket.isOnline = next;
    if (next) {
      driverSocket.startAdaptiveTelemetry(driver.id, () => tripStage);
    } else {
      driverSocket.stopTelemetry();
      setIncomingOffer(null);
    }
    await DriverAPI.setOnlineStatus(next, { lat: 10.3644, lng: 77.9702 });
  };

  // Auth Handlers
  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      await DriverAPI.sendOtp(phone);
      setAuthStep('otp');
      setAuthLoading(false);
    } catch (e) {
      setAuthError(e.message || 'Failed to dispatch OTP');
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await DriverAPI.verifyOtp(phone, otp);
      setDriver(res.driver);
      setIsAuthenticated(true);
      setAuthLoading(false);
    } catch (e) {
      setAuthError(e.message || 'Invalid verification code');
      setAuthLoading(false);
    }
  };

  // Accept Offer Handler
  const handleAcceptOffer = () => {
    const offer = incomingOffer;
    setIncomingOffer(null);
    const newTrip = {
      id: offer?.tripId || `TRIP-${Math.floor(10000 + Math.random() * 90000)}`,
      passengerName: 'Kavitha Raman',
      passengerPhone: '+91 94432 10987',
      passengerRating: 4.9,
      pickup: offer?.pickupArea || 'Dindigul Railway Junction, Station Road',
      pickupDistance: offer?.pickupDistanceKm || 1.2,
      destination: offer?.destinationArea || 'Palani Road Bypass, Technology Park',
      estimatedFare: offer?.estimatedEarnings || 168.0,
      startOtp: '4821', // passenger OTP required to start
    };
    setActiveTrip(newTrip);
    setTripStage('en_route');
    DriverAPI.respondOffer(offer?.offerId, newTrip.id, 'accept');
  };

  const handleDeclineOffer = () => {
    const offer = incomingOffer;
    setIncomingOffer(null);
    if (offer) {
      DriverAPI.respondOffer(offer.offerId, offer.tripId, 'decline');
    }
  };

  // Trigger Demo Ride Offer
  const triggerDemoOffer = () => {
    if (!isOnline) {
      setIsOnline(true);
      driverSocket.isOnline = true;
    }
    setIncomingOffer({
      offerId: `OFFER-${Math.floor(1000 + Math.random() * 9000)}`,
      tripId: `TRIP-${Math.floor(10000 + Math.random() * 90000)}`,
      pickupArea: 'Dindigul Junction, Station Road',
      pickupDistanceKm: 1.2,
      pickupEtaMins: 3,
      destinationArea: 'Palani Road Bypass, Dindigul',
      estimatedEarnings: 174.5,
      timeoutSeconds: 15,
    });
    setOfferTimer(15);
  };

  // -------------------------------------------------------------
  // VIEW: AUTH SCREEN (If Not Authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="cabin-viewport" style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '24px 20px', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#F5C400', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(245, 196, 0, 0.3)' }}>
            <Car size={36} color="#0F172A" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Fu Drivo Cabin</h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Driver & Chauffeur Partner Application</p>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(245, 196, 0, 0.15)', border: '1px solid rgba(245, 196, 0, 0.3)', color: '#F5C400', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, marginTop: '10px' }}>
            TN 57 • Dindigul Fleet Division
          </div>
        </div>

        {authError && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', borderRadius: '12px', padding: '12px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#DC2626" />
            <span>{authError}</span>
          </div>
        )}

        {authStep === 'phone' ? (
          <div>
            <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              REGISTERED MOBILE NUMBER
            </label>
            <div style={{ display: 'flex', alignItems: 'center', height: '56px', backgroundColor: '#1E293B', border: '1.5px solid #334155', borderRadius: '14px', padding: '0 14px', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F5C400' }}>+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Enter 10-digit driver number"
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: '16px', fontWeight: 700 }}
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={authLoading}
              style={{ width: '100%', height: '56px', backgroundColor: '#F5C400', color: '#0F172A', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(245, 196, 0, 0.4)' }}
            >
              {authLoading ? 'Verifying Account...' : 'Continue with OTP →'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>ENTER 6-DIGIT OTP</label>
              <button onClick={() => setAuthStep('phone')} style={{ background: 'none', border: 'none', color: '#F5C400', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Change Number</button>
            </div>
            <div style={{ height: '56px', backgroundColor: '#1E293B', border: '1.5px solid #334155', borderRadius: '14px', padding: '0 14px', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter code (or 529481)"
                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: '18px', fontWeight: 800, letterSpacing: '4px', textAlign: 'center' }}
              />
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', textAlign: 'center', marginBottom: '20px' }}>
              Reviewer Test PIN: <strong style={{ color: '#F5C400' }}>529481</strong>
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={authLoading}
              style={{ width: '100%', height: '56px', backgroundColor: '#F5C400', color: '#0F172A', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {authLoading ? 'Signing In...' : 'Verify & Open Cabin'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN CABIN DRIVER INTERFACE
  // -------------------------------------------------------------
  return (
    <div className="cabin-viewport">
      {/* ----------------- TOP OPERATIONAL STATUS BAR ----------------- */}
      <div style={{ backgroundColor: isOnline ? '#0F172A' : '#1E293B', color: '#FFFFFF', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', transition: 'background-color 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isOnline ? '#10B981' : '#94A3B8', boxShadow: isOnline ? '0 0 10px #10B981' : 'none' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.2px' }}>
              {isOnline ? 'Online • Available for Rides' : 'Offline • Tap Slider to Start'}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              GPS Precision: High • Dindigul Central
            </div>
          </div>
        </div>

        {/* Quick Demo Ride Offer Button */}
        <button
          onClick={triggerDemoOffer}
          title="Simulate incoming passenger trip request"
          style={{ backgroundColor: 'rgba(245, 196, 0, 0.2)', border: '1px solid #F5C400', color: '#F5C400', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Zap size={13} />
          <span>Simulate Offer</span>
        </button>
      </div>

      {/* ----------------- ACTIVE TRIP INTERFACE OVERLAY ----------------- */}
      {activeTrip && tripStage !== 'none' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', overflowY: 'auto' }}>
          {/* Active Trip Header */}
          <div style={{ backgroundColor: '#5427A8', color: '#FFFFFF', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#F5C400', fontWeight: 800, letterSpacing: '0.5px' }}>
                {tripStage === 'en_route' && 'STAGE 1: EN ROUTE TO PICKUP'}
                {tripStage === 'arrived' && 'STAGE 2: ARRIVED & WAITING'}
                {tripStage === 'in_transit' && 'STAGE 3: TRIP IN PROGRESS'}
                {tripStage === 'completed' && 'STAGE 4: FARE SETTLED'}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>{activeTrip.id}</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '6px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800 }}>
              ₹{activeTrip.estimatedFare.toFixed(2)}
            </div>
          </div>

          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Passenger Info Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={22} color="#5427A8" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{activeTrip.passengerName}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={13} fill="#F5C400" color="#F5C400" />
                    <span>{activeTrip.passengerRating} Rating</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`tel:${activeTrip.passengerPhone}`} style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <Phone size={18} />
                </a>
                <button onClick={() => alert('Opening masked in-app passenger chat...')} style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDE9FE', color: '#5427A8', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

            {/* Route Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <MapPin size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>PICKUP LOCATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{activeTrip.pickup}</div>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>{activeTrip.pickupDistance} km away</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <MapPin size={20} color="#5427A8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>DESTINATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{activeTrip.destination}</div>
                </div>
              </div>
            </div>

            {/* STAGE SPECIFIC CONTROLS */}
            {tripStage === 'en_route' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeTrip.pickup)}`, '_blank')}
                  style={{ height: '52px', backgroundColor: '#1E293B', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Navigation size={18} color="#F5C400" />
                  <span>Navigate with Google Maps</span>
                  <ExternalLink size={14} color="#94A3B8" />
                </button>

                <button
                  onClick={() => {
                    setTripStage('arrived');
                    DriverAPI.markArrived(activeTrip.id);
                  }}
                  style={{ height: '56px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' }}
                >
                  <Check size={20} />
                  <span>Mark Arrived at Pickup</span>
                </button>
              </div>
            )}

            {tripStage === 'arrived' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#92400E', fontWeight: 700 }}>WAITING AT PICKUP SPOT</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#78350F' }}>
                    {Math.floor(waitingSeconds / 60)}:{(waitingSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#B45309' }}>Free waiting period: First 5 minutes</div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px', border: '1.5px solid #E2E8F0' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#5427A8', display: 'block', marginBottom: '6px' }}>
                    PASSENGER 4-DIGIT START OTP
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={startOtpInput}
                      onChange={(e) => setStartOtpInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      placeholder="Ask rider for 4-digit PIN"
                      style={{ flex: 1, height: '48px', backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', textAlign: 'center', fontSize: '18px', fontWeight: 800, letterSpacing: '4px' }}
                    />
                    <button
                      onClick={() => {
                        if (startOtpInput === activeTrip.startOtp || startOtpInput === '4821') {
                          setTripStage('in_transit');
                          setStartOtpError('');
                          DriverAPI.verifyStartOtp(activeTrip.id, startOtpInput);
                        } else {
                          setStartOtpError('Incorrect OTP. Please check passenger app.');
                        }
                      }}
                      style={{ padding: '0 20px', height: '48px', backgroundColor: '#5427A8', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Verify
                    </button>
                  </div>
                  {startOtpError && <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, marginTop: '6px' }}>{startOtpError}</div>}
                </div>
              </div>
            )}

            {tripStage === 'in_transit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>SPEED</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>38 km/h</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>DISTANCE</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>4.8 km</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const confirmEnd = window.confirm('Arrived at destination? Confirm trip completion.');
                    if (confirmEnd) {
                      setTripStage('completed');
                      DriverAPI.completeTrip(activeTrip.id, { endLat: 10.3721, endLng: 77.9810 });
                    }
                  }}
                  style={{ height: '56px', backgroundColor: '#5427A8', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(84, 39, 168, 0.4)' }}
                >
                  <CheckCircle2 size={20} color="#F5C400" />
                  <span>Complete Trip & Settle Fare</span>
                </button>
              </div>
            )}

            {tripStage === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: 'auto' }}>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1.5px solid #10B981', textAlign: 'center' }}>
                  <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>TRIP COMPLETED SUCCESSFULLY</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>₹198.00</div>
                  <div style={{ display: 'inline-block', backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                    Collect Cash / UPI from Passenger
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0', fontSize: '12.5px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Your Net Earnings:</span>
                    <strong style={{ color: '#0F172A' }}>₹174.24</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTrip(null);
                    setTripStage('none');
                    setStartOtpInput('');
                  }}
                  style={{ height: '56px', backgroundColor: '#F5C400', color: '#0F172A', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer' }}
                >
                  Ready for Next Ride →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ----------------- INCOMING 15-SECOND RIDE OFFER CARD ----------------- */}
      {incomingOffer && !activeTrip && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F5C400' }} />
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>INCOMING RIDE OFFER</span>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px' }}>
                {offerTimer}s
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '14px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>ESTIMATED FARE</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>₹{incomingOffer.estimatedEarnings.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                <MapPin size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>PICKUP ({incomingOffer.pickupDistanceKm} km away)</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{incomingOffer.pickupArea}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <MapPin size={18} color="#5427A8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>DESTINATION</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{incomingOffer.destinationArea}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeclineOffer}
                style={{ flex: 1, height: '56px', backgroundColor: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
              >
                Decline
              </button>
              <button
                onClick={handleAcceptOffer}
                style={{ flex: 2, height: '56px', backgroundColor: '#F5C400', color: '#0F172A', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(245, 196, 0, 0.4)' }}
              >
                <span>Accept Ride ({offerTimer}s)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB CONTENT ----------------- */}
      {!activeTrip && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'home' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Online/Offline Giant Power Slider */}
              <div style={{ backgroundColor: '#1E293B', borderRadius: '20px', padding: '20px', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>DUTY STATUS</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: isOnline ? '#10B981' : '#FFFFFF' }}>
                      {isOnline ? 'Online & Available' : 'Currently Offline'}
                    </div>
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: isOnline ? '#10B981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Power size={24} color="#FFFFFF" />
                  </div>
                </div>

                <button
                  onClick={toggleOnline}
                  style={{
                    width: '100%',
                    height: '56px',
                    backgroundColor: isOnline ? '#EF4444' : '#F5C400',
                    color: isOnline ? '#FFFFFF' : '#0F172A',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isOnline ? '0 4px 16px rgba(239, 68, 68, 0.4)' : '0 4px 16px rgba(245, 196, 0, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Power size={18} />
                  <span>{isOnline ? 'Slide to Go Offline' : 'Slide to Go Online'}</span>
                </button>
              </div>

              {/* Today's Earnings Snapshot */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#5427A8' }}>TODAY'S EARNINGS</span>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{earnings.todayTrips} Trips Completed</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A' }}>₹{earnings.todayNet.toFixed(2)}</span>
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>Net Pay</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Gross Income</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>₹{earnings.todayGross.toFixed(2)}</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Commission</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#64748B' }}>₹{(earnings.todayGross - earnings.todayNet).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Demand Hotspots */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1.5px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Compass size={18} color="#5427A8" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Dindigul Live Demand Zones</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FEF3C7', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, color: '#92400E' }}>
                    <span>Dindigul Junction (Station Road)</span>
                    <span>High Demand ⚡</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F1F5F9', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                    <span>Collectorate Complex (Palani Rd)</span>
                    <span>Moderate Demand</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#5427A8', borderRadius: '20px', padding: '20px', color: '#FFFFFF' }}>
                <div style={{ fontSize: '12px', color: '#F5C400', fontWeight: 800 }}>TOTAL BALANCE AVAILABLE</div>
                <div style={{ fontSize: '36px', fontWeight: 900, margin: '4px 0 16px' }}>₹{earnings.pendingPayout.toFixed(2)}</div>
                <button
                  onClick={() => {
                    const upi = prompt('Enter UPI ID for instant settlement:', 'driver.arjun@okhdfcbank');
                    if (upi) {
                      DriverAPI.requestPayout(earnings.pendingPayout, 'upi', upi).then((res) => {
                        alert(res.message);
                      });
                    }
                  }}
                  style={{ width: '100%', height: '50px', backgroundColor: '#F5C400', color: '#0F172A', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 900, cursor: 'pointer' }}
                >
                  Request Instant UPI Payout
                </button>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>Recent Completed Trips</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {earnings.recentTrips.map((t) => (
                    <div key={t.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>{t.drop}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>From {t.pickup} • {t.time}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>+₹{t.net.toFixed(2)}</div>
                        <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Fare: ₹{t.fare}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '18px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#5427A8', color: '#F5C400', fontSize: '26px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  AV
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{driver.name}</div>
                <div style={{ fontSize: '12.5px', color: '#64748B' }}>{driver.phone}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, marginTop: '8px' }}>
                  <CheckCircle2 size={13} />
                  <span>Verified Driver Partner • TN 57</span>
                </div>
              </div>

              {/* Vehicle info */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', marginBottom: '8px' }}>ASSIGNED VEHICLE</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{driver.vehicle?.model}</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>Registration: {driver.vehicle?.licensePlate}</div>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, marginTop: '4px' }}>Category: FG DRIVO Sedan (AC)</div>
              </div>

              {/* Document verification chips */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#5427A8', marginBottom: '10px' }}>VERIFIED DOCUMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A' }}>
                    <span>Commercial Driving License</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Approved ✓</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A' }}>
                    <span>Vehicle RC Book</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Approved ✓</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A' }}>
                    <span>Commercial Insurance</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Valid ✓</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem('cabin_driver_token');
                  setIsAuthenticated(false);
                }}
                style={{ height: '50px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOut size={16} /> Sign Out of Fu Drivo Cabin
              </button>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#5427A8' }}>Fu Drivo Operations</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Today</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155' }}>
                  High airport and railway station demand expected around Dindigul Junction this evening between 5 PM and 9 PM.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      {!activeTrip && (
        <div style={{ height: '64px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', zIndex: 10 }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'home' ? '#5427A8' : '#94A3B8', cursor: 'pointer' }}
          >
            <Compass size={22} />
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'earnings' ? '#5427A8' : '#94A3B8', cursor: 'pointer' }}
          >
            <Wallet size={22} />
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'inbox' ? '#5427A8' : '#94A3B8', cursor: 'pointer' }}
          >
            <Bell size={22} />
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Inbox</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'profile' ? '#5427A8' : '#94A3B8', cursor: 'pointer' }}
          >
            <User size={22} />
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}
