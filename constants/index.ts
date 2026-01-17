// Re-export all constants
export * from './Colors';

// App Constants
export const APP_NAME = 'HanapBahay';
export const APP_VERSION = '1.0.0';

// API Constants
// Production cloud backend URL (always used for APK builds)
// For local development, set EXPO_PUBLIC_API_URL in .env file
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://web-production-e66fb.up.railway.app';

// Log the API URL being used (helpful for debugging in mobile apps)
if (__DEV__) {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  PERMISSIONS: 'permissions',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/(tabs)',
  CHAT: '/(tabs)/chat',
  PROFILE: '/(tabs)/profile',
  FILTER: '/filter',
  CHAT_ROOM: '/chat-room',
} as const;
