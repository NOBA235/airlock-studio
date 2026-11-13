/**
 * AIRLOCK STUDIO - FIREBASE SUITE INITIALIZATION
 * Integrated: App, App Check, Auth, Firestore, AI Logic, Remote Config
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  getFirestore,
  persistentLocalCache,
  initializeFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getAI, GoogleAIBackend, type AI } from 'firebase/ai';
import {
  getRemoteConfig,
  fetchAndActivate,
  type RemoteConfig,
} from 'firebase/remote-config';

/**
 * Firebase configuration from environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Validate Firebase configuration
 */
function validateFirebaseConfig(): void {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !import.meta.env[key] || import.meta.env[key] === 'your_firebase_api_key_here'
  );

  if (missingKeys.length > 0) {
    console.warn(
      '⚠️ Firebase configuration incomplete. Missing or placeholder values for:',
      missingKeys.map((k) => k.replace('VITE_', ''))
    );
    console.warn('→ Copy .env.example to .env.local and configure your Firebase project credentials');
  }
}

validateFirebaseConfig();

/**
 * Initialize Firebase App
 */
export const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Initialize Firebase App Check (reCAPTCHA v3)
 * Protects backend resources from abuse with automated bot detection
 */
let appCheckInitialized = false;
if (import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_V3_SITE_KEY) {
  try {
    // Enable debug token for localhost development
    if (import.meta.env.VITE_APP_ENV === 'development' || window.location.hostname === 'localhost') {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.log('🔐 App Check: Debug mode enabled for localhost');
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
    console.log('✅ Firebase App Check initialized');
  } catch (error) {
    console.warn('⚠️ Firebase App Check initialization failed:', error);
  }
} else {
  console.warn('⚠️ Firebase App Check disabled: VITE_FIREBASE_APPCHECK_RECAPTCHA_V3_SITE_KEY not configured');
}

export { appCheckInitialized };

/**
 * Initialize Firebase Authentication
 * Uses anonymous sign-in for seamless offline-first experience
 */
export const auth: Auth = getAuth(app);

/**
 * Ensure user is authenticated (anonymous session)
 */
export async function ensureAuthenticated(): Promise<void> {
  if (!auth.currentUser) {
    try {
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous authentication successful:', userCredential.user.uid);
    } catch (error) {
      console.error('❌ Anonymous authentication failed:', error);
      throw error;
    }
  }
}

/**
 * Initialize Cloud Firestore with offline persistence
 * Uses IndexedDB-backed persistent local cache for offline-first operation
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

console.log('✅ Firestore initialized with offline persistence (IndexedDB)');

/**
 * Initialize Firebase AI Logic with Google AI Backend (Gemini)
 * Supports hybrid on-device (Gemini Nano) + cloud (Gemini 2.5 Flash) inference
 */
let ai: AI | null = null;
let aiInitError: Error | null = null;

try {
  const geminiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  
  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error('VITE_GOOGLE_AI_API_KEY not configured. Get your key from https://aistudio.google.com/app/apikey');
  }

  ai = getAI(app, {
    backend: new GoogleAIBackend({
      apiKey: geminiApiKey,
    }),
  });

  console.log('✅ Firebase AI Logic initialized with Google AI Backend (Gemini)');
} catch (error) {
  console.error('❌ Firebase AI Logic initialization failed:', error);
  aiInitError = error as Error;
}

export { ai, aiInitError };

/**
 * Initialize Firebase Remote Config
 * Provides server-side feature flags and configuration
 */
export const remoteConfig: RemoteConfig = getRemoteConfig(app);

// Set default configuration values
remoteConfig.defaultConfig = {
  cloud_compiler_model: 'gemini-2.5-flash',
  airlock_strict_redaction: true,
  enable_benchmark_runner: true,
  max_canvas_elements: 500,
  auto_save_interval_ms: 30000,
};

// Configure fetch settings
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hour
  fetchTimeoutMillis: 10000, // 10 seconds
};

/**
 * Fetch and activate remote configuration
 */
export async function initializeRemoteConfig(): Promise<void> {
  try {
    await fetchAndActivate(remoteConfig);
    console.log('✅ Firebase Remote Config activated');
  } catch (error) {
    console.warn('⚠️ Firebase Remote Config fetch failed (using defaults):', error);
  }
}

/**
 * Firebase initialization status summary
 */
export function getFirebaseStatus() {
  return {
    app: !!app,
    appCheck: appCheckInitialized,
    auth: !!auth,
    firestore: !!db,
    ai: !!ai,
    aiError: aiInitError?.message,
    remoteConfig: !!remoteConfig,
  };
}

// Log initialization summary
console.log('🚀 Airlock Studio - Firebase Suite Status:', getFirebaseStatus());
