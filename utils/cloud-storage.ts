/**
 * Cloud Storage Utility
 * Replaces AsyncStorage/localStorage with Supabase cloud storage
 */

import { supabase } from './supabase-client';

// =====================================================
// USER SESSION MANAGEMENT (replaces auth-user.ts AsyncStorage)
// =====================================================

export interface CloudAuthUser {
  id: string;
  roles: string[];
  permissions: string[];
  name?: string;
  email?: string;
}

/**
 * Store user session in Supabase database
 */
export async function storeCloudAuthUser(user: CloudAuthUser): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.warn('⚠️ No active Supabase session, cannot store user');
      return;
    }

    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: user.id,
        session_data: {
          name: user.name,
          email: user.email
        },
        roles: user.roles,
        permissions: user.permissions,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error storing cloud auth user:', error);
      throw error;
    }

    console.log('✅ Cloud auth user stored successfully');
  } catch (error) {
    console.error('❌ Error in storeCloudAuthUser:', error);
    throw error;
  }
}

/**
 * Get user session from Supabase database
 */
export async function getCloudAuthUser(): Promise<CloudAuthUser | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('📖 No active Supabase session');
      return null;
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', session.session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📖 No cloud auth user found');
        return null;
      }
      console.error('❌ Error getting cloud auth user:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.user_id,
      roles: data.roles || [],
      permissions: data.permissions || [],
      name: data.session_data?.name,
      email: data.session_data?.email
    };
  } catch (error) {
    console.error('❌ Error in getCloudAuthUser:', error);
    return null;
  }
}

/**
 * Clear user session from Supabase database
 */
export async function clearCloudAuthSession(): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('🗑️ No active session to clear');
      return;
    }

    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', session.session.user.id);

    if (error) {
      console.error('❌ Error clearing cloud auth session:', error);
      throw error;
    }

    // Also sign out from Supabase auth
    await supabase.auth.signOut();
    
    console.log('✅ Cloud auth session cleared successfully');
  } catch (error) {
    console.error('❌ Error in clearCloudAuthSession:', error);
    throw error;
  }
}

// =====================================================
// PROPERTY MEDIA CACHE (replaces property-media-cache.ts)
// =====================================================

export interface CloudPropertyMedia {
  coverPhoto: string | null;
  photos: string[];
  videos: string[];
}

export interface CloudCachedPropertyMedia {
  listingId: string;
  media: CloudPropertyMedia;
  timestamp: number;
  userId?: string;
}

/**
 * Cache property media in Supabase database
 */
export async function cacheCloudPropertyMedia(
  listingId: string,
  media: CloudPropertyMedia,
  userId?: string
): Promise<void> {
  // Caching disabled - media is already in published_listings table
  // No need for separate cache table with constraint issues
  console.log('✅ Media caching skipped (photos already in published_listings)');
  return;
}

/**
 * Get cached property media from Supabase database
 */
export async function getCachedCloudPropertyMedia(
  listingId: string
): Promise<CloudPropertyMedia | null> {
  // Cache lookup disabled - media is directly in published_listings table
  // No need for separate cache table
  return null;
}

/**
 * Remove cached property media from Supabase database
 */
export async function removeCachedCloudPropertyMedia(listingId: string): Promise<void> {
  // Cache removal disabled - no cache table being used
  return;
}

/**
 * Clear all cached property media for current user
 */
export async function clearAllCachedCloudPropertyMedia(): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      console.warn('⚠️ No user session for cache clearing');
      return;
    }

    const { error } = await supabase
      .from('property_media_cache')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error clearing all cached cloud property media:', error);
      throw error;
    }

    console.log('✅ All cached cloud property media cleared');
  } catch (error) {
    console.error('❌ Error in clearAllCachedCloudPropertyMedia:', error);
    throw error;
  }
}

/**
 * Clear expired cached property media (can be called periodically)
 */
export async function clearExpiredCachedCloudPropertyMedia(): Promise<void> {
  try {
    // Try using the RPC function first (requires migration to be run)
    const { error: rpcError } = await supabase.rpc('cleanup_expired_cache');

    if (rpcError) {
      // If RPC function doesn't exist, fall back to direct delete
      if (rpcError.message?.includes('function') || rpcError.code === '42883') {
        console.warn('⚠️ RPC function not found, using fallback method');
        
        // Fallback: Delete expired entries directly
        const { error: deleteError } = await supabase
          .from('property_media_cache')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (deleteError) {
          console.error('❌ Error clearing expired cache (fallback):', deleteError);
          // Don't throw - this is not critical
          return;
        }
      } else {
        console.error('❌ Error clearing expired cached cloud property media:', rpcError);
        // Don't throw - cache cleanup is not critical
        return;
      }
    }

    console.log('✅ Expired cached cloud property media cleared');
  } catch (error) {
    console.error('❌ Error in clearExpiredCachedCloudPropertyMedia:', error);
    // Don't throw - cache cleanup should not break the app
  }
}

// =====================================================
// USER PREFERENCES (replaces various settings keys)
// =====================================================

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notificationsEnabled?: boolean;
  [key: string]: any;
}

/**
 * Store user preferences in Supabase
 */
export async function storeUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.warn('⚠️ No active session, cannot store preferences');
      return;
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.session.user.id,
        preferences: preferences,
        theme: preferences.theme || 'system',
        notifications_enabled: preferences.notificationsEnabled ?? true
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error storing user preferences:', error);
      throw error;
    }

    console.log('✅ User preferences stored successfully');
  } catch (error) {
    console.error('❌ Error in storeUserPreferences:', error);
    throw error;
  }
}

/**
 * Get user preferences from Supabase
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.log('📖 No active session for preferences');
      return null;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📖 No user preferences found');
        return null;
      }
      console.error('❌ Error getting user preferences:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      ...data.preferences,
      theme: data.theme,
      notificationsEnabled: data.notifications_enabled
    };
  } catch (error) {
    console.error('❌ Error in getUserPreferences:', error);
    return null;
  }
}

// =====================================================
// STORAGE BUCKET UTILITIES
// =====================================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadToCloudStorage(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string,
  fileData: Blob | File | ArrayBuffer,
  contentType?: string
): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('❌ No active session for upload');
      return null;
    }

    const userId = session.session.user.id;
    const fullPath = `${userId}/${filePath}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileData, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('❌ Error uploading to cloud storage:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    console.log('✅ File uploaded to cloud storage:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadToCloudStorage:', error);
    return null;
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromCloudStorage(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string
): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.error('❌ No active session for deletion');
      return false;
    }

    const userId = session.session.user.id;
    const fullPath = `${userId}/${filePath}`;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fullPath]);

    if (error) {
      console.error('❌ Error deleting from cloud storage:', error);
      throw error;
    }

    console.log('✅ File deleted from cloud storage');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteFromCloudStorage:', error);
    return false;
  }
}

/**
 * Get public URL for a file in storage
 */
export function getCloudStorageUrl(
  bucket: 'property-media' | 'profile-photos' | 'media-cache',
  filePath: string
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
