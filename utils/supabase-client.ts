
import AsyncStorage from '@react-native-async-storage/async-storage' // Only used for Supabase auth session storage
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// Platform-specific storage
const getStorage = () => {
  if (false) {
    // Use localStorage for web
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key))
        }
        return Promise.resolve(null)
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
        return Promise.resolve()
      },
    }
  }
  return AsyncStorage
}

// Get environment variables with safe fallbacks
// Try multiple sources: process.env first, then Expo Constants
import Constants from 'expo-constants';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl || 
  "https://your-project.supabase.co";

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  "your-anon-key";

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = SUPABASE_URL && 
  SUPABASE_URL !== "https://your-project.supabase.co" &&
  SUPABASE_ANON_KEY && 
  SUPABASE_ANON_KEY !== "your-anon-key";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

if (!hasValidSupabaseConfig) {
  console.warn('⚠️ WARNING: Supabase credentials not properly configured!');
  console.warn('⚠️ Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local');
} else {
  console.log('✅ Supabase client initialized successfully');
}
        