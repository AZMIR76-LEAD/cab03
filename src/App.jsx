// FG DRIVO Android Native App Entrypoint
// Pure Full-Screen Android Application (No Desktop Frames / No Web Bezels)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ALL_MOBILE_SCREENS,
  Screen01Splash,
  Screen02Onboarding,
  Screen03Login,
  Screen04OTP,
  Screen05LocationPermission,
  Screen06NotificationPermission,
  Screen07Home,
  Screen08Pickup,
  Screen09DestinationSearch,
  Screen10ChooseRide,
  Screen11RoutePreview,
  Screen12BookingConfirm,
  Screen13FareEstimate,
  Screen14FindingDriver,
  Screen15DriverAssigned,
  Screen16DriverArriving,
  Screen17DriverArrived,
  Screen18TripStarted,
  Screen19TripInProgress,
  Screen20TripCompleted,
  Screen21ConfirmPayment,
  Screen22Rating,
  Screen23Receipt,
  Screen23RideHistory,
  Screen24RideDetails,
  Screen25SavedPlaces,
  Screen26PaymentMethods,
  Screen27AddCard,
  Screen28Wallet,
  Screen29Profile,
  Screen30EditProfile,
  Screen31Safety,
  Screen32EmergencyContacts,
  Screen33Notifications,
  Screen34Help,
  Screen35Settings,
  DriverCockpit,
} from './screens/mobile/ScreenRegistry';

function getInitialScreen() {
  try {
    if (typeof window !== 'undefined') {
      // 1. Check URL hash (e.g. #driver, #s28_wallet, #s07_home, #s23_ride_history)
      const hash = window.location.hash.replace('#', '').trim();
      if (hash === 'driver' || hash === 'captain' || hash === 'driver_cockpit') {
        return 'driver_cockpit';
      }
      if (hash && ALL_MOBILE_SCREENS.some((s) => s.id === hash)) {
        return hash;
      }

      const token = localStorage.getItem('fg_auth_token');
      const user = localStorage.getItem('fg_user');
      const savedScreen = localStorage.getItem('fg_active_screen');

      // 2. If logged in, stay on saved screen or go to home (never splash/onboarding)
      if (token || user) {
        const authScreens = ['s01_splash', 's02_onboarding', 's03_login', 's04_otp'];
        if (savedScreen && !authScreens.includes(savedScreen) && ALL_MOBILE_SCREENS.some((s) => s.id === savedScreen)) {
          return savedScreen;
        }
        return 's07_home';
      }

      // 3. If not logged in, but was on onboarding or login
      if (savedScreen && ['s02_onboarding', 's03_login', 's04_otp'].includes(savedScreen)) {
        return savedScreen;
      }
    }
  } catch (e) {}
  return 's01_splash';
}

export default function App() {
  const initialScreen = getInitialScreen();
  const [currentMobileScreen, setCurrentMobileScreen] = useState(initialScreen);
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [historyStack, setHistoryStack] = useState([initialScreen]);
  const historyStackRef = useRef([initialScreen]);

  historyStackRef.current = historyStack;

  // Sync active screen to localStorage and URL hash
  useEffect(() => {
    if (typeof window !== 'undefined' && currentMobileScreen) {
      try {
        localStorage.setItem('fg_active_screen', currentMobileScreen);
        if (window.location.hash !== `#${currentMobileScreen}`) {
          window.history.replaceState({ screen: currentMobileScreen }, '', `#${currentMobileScreen}`);
        }
      } catch (e) {}
    }
  }, [currentMobileScreen]);

  // Screen Navigation with History Support
  const handleNavigate = useCallback((screenId) => {
    setCurrentMobileScreen(screenId);
    setHistoryStack((prev) => [...prev, screenId]);

    // Push browser history state for back button sync and refresh preservation
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fg_active_screen', screenId);
      }
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ screen: screenId }, '', `#${screenId}`);
      }
    } catch (e) {}
  }, []);

  const handleBack = useCallback(() => {
    if (historyStackRef.current.length > 1) {
      const nextStack = [...historyStackRef.current];
      nextStack.pop();
      const prevScreen = nextStack[nextStack.length - 1];
      setHistoryStack(nextStack);
      setCurrentMobileScreen(prevScreen);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fg_active_screen', prevScreen);
        }
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState({ screen: prevScreen }, '', `#${prevScreen}`);
        }
      } catch (e) {}
    } else if (currentMobileScreen !== 's07_home' && currentMobileScreen !== 's01_splash') {
      setCurrentMobileScreen('s07_home');
      setHistoryStack(['s07_home']);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fg_active_screen', 's07_home');
        }
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState({ screen: 's07_home' }, '', '#s07_home');
        }
      } catch (e) {}
    }
  }, [currentMobileScreen]);

  // Android Native Hardware Back Button & Popstate Hook
  useEffect(() => {
    // 1. Hook Capacitor Native Android Hardware Back Button
    let backListener;
    try {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
          if (historyStackRef.current.length > 1) {
            handleBack();
          } else if (currentMobileScreen !== 's07_home' && currentMobileScreen !== 's01_splash') {
            handleNavigate('s07_home');
          } else {
            CapApp.exitApp();
          }
        }).then((l) => { backListener = l; });
      }).catch(() => {});
    } catch {
      // Running outside Capacitor
    }

    // 2. Hook Browser Popstate for Web / PWA back navigation
    const handlePopState = (e) => {
      const targetScreen = e.state?.screen || (window.location.hash ? window.location.hash.replace('#', '') : null);
      if (targetScreen && ALL_MOBILE_SCREENS.some((s) => s.id === targetScreen)) {
        setCurrentMobileScreen(targetScreen);
        try {
          localStorage.setItem('fg_active_screen', targetScreen);
        } catch (err) {}
      } else {
        handleBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (backListener && backListener.remove) backListener.remove();
    };
  }, [handleBack, handleNavigate, currentMobileScreen]);

  // Native Android Status Bar Coloring
  useEffect(() => {
    try {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        const darkScreens = ['s01_splash', 's14_finding_driver'];
        if (darkScreens.includes(currentMobileScreen)) {
          StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
          StatusBar.setBackgroundColor({ color: '#1E1236' }).catch(() => {});
        } else {
          StatusBar.setStyle({ style: Style.Light }).catch(() => {});
          StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {});
        }
      }).catch(() => {});
    } catch {
      // Running outside Capacitor
    }
  }, [currentMobileScreen]);

  // Render the current mobile screen component
  const renderMobileScreen = () => {
    const props = {
      onNavigate: handleNavigate,
      onBack: handleBack,
      selectedVehicle,
      setSelectedVehicle,
    };

    switch (currentMobileScreen) {
      case 's01_splash': return <Screen01Splash {...props} />;
      case 's02_onboarding': return <Screen02Onboarding {...props} />;
      case 's03_login': return <Screen03Login {...props} />;
      case 's04_otp': return <Screen04OTP {...props} />;
      case 's05_location_permission': return <Screen05LocationPermission {...props} />;
      case 's06_notification_permission': return <Screen06NotificationPermission {...props} />;
      case 's07_home': return <Screen07Home {...props} />;
      case 's08_pickup': return <Screen08Pickup {...props} />;
      case 's09_destination_search': return <Screen09DestinationSearch {...props} />;
      case 's10_choose_ride': return <Screen10ChooseRide {...props} />;
      case 's11_route_preview': return <Screen11RoutePreview {...props} />;
      case 's12_booking_confirm':
      case 's13_booking_confirm': return <Screen12BookingConfirm {...props} />;
      case 's13_fare_estimate':
      case 's12_fare_estimate': return <Screen13FareEstimate {...props} />;
      case 's14_finding_driver': return <Screen14FindingDriver {...props} />;
      case 's15_driver_assigned': return <Screen15DriverAssigned {...props} />;
      case 's16_driver_arriving': return <Screen16DriverArriving {...props} />;
      case 's17_driver_arrived': return <Screen17DriverArrived {...props} />;
      case 's18_trip_started': return <Screen18TripStarted {...props} />;
      case 's19_trip_in_progress': return <Screen19TripInProgress {...props} />;
      case 's20_trip_completed': return <Screen20TripCompleted {...props} />;
      case 's21_confirm_payment': return <Screen21ConfirmPayment {...props} />;
      case 's22_rating':
      case 's21_rating': return <Screen22Rating {...props} />;
      case 's23_receipt':
      case 's22_receipt': return <Screen23Receipt {...props} />;
      case 's24_ride_history':
      case 's23_ride_history': return <Screen23RideHistory {...props} />;
      case 's25_ride_details':
      case 's24_ride_details': return <Screen24RideDetails {...props} />;
      case 's25_saved_places': return <Screen25SavedPlaces {...props} />;
      case 's26_payment_methods': return <Screen26PaymentMethods {...props} />;
      case 's27_add_card': return <Screen27AddCard {...props} />;
      case 's28_wallet': return <Screen28Wallet {...props} />;
      case 's29_profile': return <Screen29Profile {...props} />;
      case 's30_edit_profile': return <Screen30EditProfile {...props} />;
      case 's31_safety': return <Screen31Safety {...props} />;
      case 's32_emergency_contacts': return <Screen32EmergencyContacts {...props} />;
      case 's33_notifications': return <Screen33Notifications {...props} />;
      case 's34_help': return <Screen34Help {...props} />;
      case 's35_settings': return <Screen35Settings {...props} />;
      case 'driver_cockpit': return <DriverCockpit onNavigateToPassenger={() => handleNavigate('s07_home')} {...props} />;
      default: return <Screen07Home {...props} />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        height: '100dvh',
        backgroundColor: '#0F081D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Native Edge-to-Edge Android Screen Container */}
      <div
        className="fg-drivo-android-viewport"
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.45)',
        }}
      >
        {renderMobileScreen()}
      </div>
    </div>
  );
}
