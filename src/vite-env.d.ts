/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_APPCHECK_RECAPTCHA_V3_SITE_KEY: string;
  readonly VITE_GOOGLE_AI_API_KEY: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Chrome Built-in AI / Gemini Nano window.ai API types
 * Part of the window.LanguageModel experimental API
 */
interface LanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface LanguageModel {
  availability(): Promise<'readily' | 'after-download' | 'no'>;
  capabilities(): Promise<LanguageModelCapabilities>;
}

interface Window {
  LanguageModel?: LanguageModel;
}

declare const self: Window & typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean };
