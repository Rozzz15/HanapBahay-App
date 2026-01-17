/**
 * Cloud-based Property Media Cache Utility
 * This is a drop-in replacement for property-media-cache.ts that uses Supabase instead of AsyncStorage
 */

import {
  cacheCloudPropertyMedia,
  getCachedCloudPropertyMedia,
  removeCachedCloudPropertyMedia,
  clearAllCachedCloudPropertyMedia,
  clearExpiredCachedCloudPropertyMedia,
  CloudPropertyMedia
} from './cloud-storage';

export interface PropertyMedia {
  coverPhoto: string | null;
  photos: string[];
  videos: string[];
}

export interface CachedPropertyMedia {
  listingId: string;
  media: PropertyMedia;
  timestamp: number;
  userId?: string;
}

/**
 * Cache property media data in Supabase (replaces AsyncStorage)
 */
export const cachePropertyMedia = async (
  listingId: string,
  media: PropertyMedia,
  userId?: string
): Promise<void> => {
  try {
    console.log('💾 Caching property media in cloud for listing:', listingId);
    
    await cacheCloudPropertyMedia(listingId, media, userId);
    
    console.log('✅ Property media cached successfully in cloud for listing:', listingId);
  } catch (error) {
    console.error('❌ Error caching property media in cloud:', error);
    throw error;
  }
};

/**
 * Get cached property media data from Supabase (replaces AsyncStorage)
 */
export const getCachedPropertyMedia = async (listingId: string): Promise<PropertyMedia | null> => {
  try {
    console.log('📸 Getting cached property media from cloud for listing:', listingId);
    
    const result = await getCachedCloudPropertyMedia(listingId);
    
    if (result) {
      console.log('✅ Found valid cached property media in cloud for listing:', listingId);
    } else {
      console.log('📸 No cached data found in cloud for listing:', listingId);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error getting cached property media from cloud:', error);
    return null;
  }
};

/**
 * Get all cached property media data from Supabase
 * Note: This returns only the current user's cache in cloud storage
 */
export const getAllCachedPropertyMedia = async (): Promise<CachedPropertyMedia[]> => {
  try {
    console.log('📸 Getting all cached property media from cloud (not fully implemented for cloud)');
    
    // For cloud storage, we don't typically need to get ALL cached media at once
    // This is mainly used for migration purposes
    // Return empty array as we access cache per-listing in cloud storage
    return [];
  } catch (error) {
    console.error('❌ Error getting all cached property media from cloud:', error);
    return [];
  }
};

/**
 * Remove cached property media for a specific listing from Supabase
 */
export const removeCachedPropertyMedia = async (listingId: string): Promise<void> => {
  try {
    console.log('🗑️ Removing cached property media from cloud for listing:', listingId);
    
    await removeCachedCloudPropertyMedia(listingId);
    
    console.log('✅ Cached property media removed from cloud for listing:', listingId);
  } catch (error) {
    console.error('❌ Error removing cached property media from cloud:', error);
    throw error;
  }
};

/**
 * Clear all cached property media data from Supabase
 */
export const clearAllCachedPropertyMedia = async (): Promise<void> => {
  try {
    console.log('🗑️ Clearing all cached property media from cloud');
    
    await clearAllCachedCloudPropertyMedia();
    
    console.log('✅ All cached property media cleared from cloud');
  } catch (error) {
    console.error('❌ Error clearing cached property media from cloud:', error);
    throw error;
  }
};

/**
 * Clear expired cached property media from Supabase
 */
export const clearExpiredCachedPropertyMedia = async (): Promise<void> => {
  try {
    console.log('🗑️ Clearing expired cached property media from cloud');
    
    await clearExpiredCachedCloudPropertyMedia();
    
    console.log('✅ Expired cached property media cleared from cloud');
  } catch (error) {
    console.error('❌ Error clearing expired cached property media from cloud:', error);
    throw error;
  }
};
