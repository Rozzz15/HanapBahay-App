/**
 * Cloud-based Auth User Utility
 * This is a drop-in replacement for auth-user.ts that uses Supabase instead of AsyncStorage
 */

import { 
  storeCloudAuthUser, 
  getCloudAuthUser, 
  clearCloudAuthSession,
  CloudAuthUser 
} from './cloud-storage';
import { supabase } from './supabase-client';

export interface AuthUser {
  id: string;
  roles: string[];
  permissions: string[];
  name?: string;
  email?: string;
}

// Cache for auth user to reduce database calls
let authUserCache: AuthUser | null = null;

/**
 * Store auth user in Supabase (replaces AsyncStorage)
 */
export async function storeAuthUser(user: AuthUser): Promise<void> {
  try {
    await storeCloudAuthUser(user);
    
    // Update cache immediately
    authUserCache = user;
    
    console.log('✅ Auth user stored successfully in cloud');
  } catch (error) {
    console.error('❌ Error storing auth user in cloud:', error);
    throw error;
  }
}

/**
 * Get auth user from Supabase (replaces AsyncStorage)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Return cached value if available
    if (authUserCache) {
      console.log('📖 Retrieved auth user from cache: User found');
      return authUserCache;
    }
    
    const result = await getCloudAuthUser();
    
    // Update cache
    authUserCache = result;
    
    console.log('📖 Retrieved auth user from cloud:', result ? 'User found' : 'No user');
    return result;
  } catch (error) {
    console.error('❌ Error getting auth user from cloud:', error);
    return null;
  }
}

/**
 * Clear auth session from Supabase (replaces AsyncStorage)
 */
export async function clearAuthSession(): Promise<void> {
  try {
    // Clear cache first
    authUserCache = null;
    
    await clearCloudAuthSession();
    
    console.log('✅ Auth session cleared successfully from cloud');
  } catch (error) {
    console.error('❌ Error clearing auth session from cloud:', error);
    throw error;
  }
}

/**
 * Clear auth user from cache and Supabase
 */
export async function clearAuthUser(): Promise<void> {
  try {
    // Clear cache
    authUserCache = null;
    
    // Clear from cloud
    await clearCloudAuthSession();
    
    console.log('✅ Auth user cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth user:', error);
    throw error;
  }
}

/**
 * Refresh auth user from Supabase (bypasses cache)
 */
export async function refreshAuthUser(): Promise<AuthUser | null> {
  try {
    authUserCache = null; // Clear cache
    return await getAuthUser();
  } catch (error) {
    console.error('❌ Error refreshing auth user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current user ID from Supabase session
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('❌ Error getting current user ID:', error);
    return null;
  }
}
