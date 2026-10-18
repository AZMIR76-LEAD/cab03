// FG DRIVO Firebase Authentication Engine
// Handles Google Firebase Phone Authentication & Recaptcha Verification

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

// Initialize Firebase App instance singleton
let firebaseApp = null;
let firebaseAuth = null;

if (isFirebaseConfigured()) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firebaseAuth = getAuth(firebaseApp);
    firebaseAuth.useDeviceLanguage();
  } catch (err) {
    console.warn('[Firebase Auth] Initialization warning:', err.message);
  }
}

export class FirebaseAuthService {
  static getAuth() {
    if (!firebaseAuth && isFirebaseConfigured()) {
      firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      firebaseAuth = getAuth(firebaseApp);
    }
    return firebaseAuth;
  }

  /**
   * Initialize invisible or visible reCAPTCHA on the specified element ID
   * @param {string} containerId - DOM ID where reCAPTCHA will render
   * @param {function} onSolved - Callback when captcha passes
   */
  static initRecaptcha(containerId = 'recaptcha-container', onSolved = () => {}) {
    const auth = this.getAuth();
    if (!auth) return null;

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          if (onSolved) onSolved();
        },
        'expired-callback': () => {
          console.warn('[Firebase Auth] Recaptcha expired. Re-verifying...');
        },
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.error('[Firebase Auth] Recaptcha init error:', err);
      return null;
    }
  }

  /**
   * Dispatch real SMS OTP via Firebase to mobile phone
   * @param {string} e164PhoneNumber - Phone with country code (e.g. "+919876543210")
   * @param {string} containerId - Element ID for reCAPTCHA
   * @returns {Promise<ConfirmationResult>}
   */
  static async sendOtp(e164PhoneNumber, containerId = 'recaptcha-container') {
    const auth = this.getAuth();
    if (!auth) {
      throw new Error('Firebase credentials not configured.');
    }

    const appVerifier = this.initRecaptcha(containerId);
    if (!appVerifier) {
      throw new Error('Could not initialize verification safety check.');
    }

    console.log(`[Firebase Auth] Requesting real SMS OTP for ${e164PhoneNumber}...`);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase verification timed out. Falling back to backend SMS.')), 8000)
    );
    const confirmationResult = await Promise.race([
      signInWithPhoneNumber(auth, e164PhoneNumber, appVerifier),
      timeoutPromise,
    ]);
    return confirmationResult;
  }

  /**
   * Verify the received 6-digit code with Firebase
   * @param {ConfirmationResult} confirmationResult
   * @param {string} code - 6-digit OTP code
   */
  static async verifyCode(confirmationResult, code) {
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error('Invalid or missing confirmation session.');
    }
    const result = await confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken,
    };
  }
}
