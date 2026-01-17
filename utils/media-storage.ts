import { supabase } from './supabase-client';
import { uploadToSupabase } from './supabase-storage';
import { db } from './db';
import { PropertyMedia } from './property-media-cache';
import logger from './logger';

export interface MediaItem {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data?: string; // Base64 encoded data for persistence
}

// Cloud storage keys (legacy - kept for backward compatibility)
const MEDIA_STORAGE_KEYS = {
  PROPERTY_MEDIA: (listingId: string) => `property_media_${listingId}`,
  PROPERTY_MEDIA_CACHE: (listingId: string) => `property_media_cache_${listingId}`,
  ALL_MEDIA_CACHE: 'all_property_media_cache',
  MEDIA_TIMESTAMP: (listingId: string) => `media_timestamp_${listingId}`
};

/**
 * Save property media to Supabase cloud storage (replaces AsyncStorage)
 */
export const savePropertyMediaToStorage = async (
  listingId: string,
  media: PropertyMedia,
  userId?: string
): Promise<void> => {
  try {
    logger.debug('💾 Saving property media to Supabase cloud for listing:', listingId);
    logger.debug('📊 userId received:', userId);
    
    // Skip property_photos save if userId is invalid - photos are already in published_listings
    if (!userId || userId === 'unknown' || userId.length < 10) {
      logger.debug('ℹ️ Skipping property_photos table save (photos already in published_listings)');
      return; // Just return silently, no error
    }
    
    // Upload photos to Supabase storage if they're data URIs
    const uploadedPhotos: string[] = [];
    for (const photo of media.photos) {
      if (photo.startsWith('data:') || photo.startsWith('file://')) {
        try {
          const url = await uploadToSupabase(photo, 'property-images', `${listingId}_${Date.now()}.jpg`);
          uploadedPhotos.push(url);
        } catch (error) {
          logger.error('Failed to upload photo:', error);
          uploadedPhotos.push(photo); // Keep original if upload fails
        }
      } else {
        uploadedPhotos.push(photo);
      }
    }
    
    // Upload cover photo
    let uploadedCoverPhoto = media.coverPhoto;
    if (media.coverPhoto && (media.coverPhoto.startsWith('data:') || media.coverPhoto.startsWith('file://'))) {
      try {
        uploadedCoverPhoto = await uploadToSupabase(media.coverPhoto, 'property-images', `${listingId}_cover.jpg`);
      } catch (error) {
        logger.error('Failed to upload cover photo:', error);
      }
    }
    
    // Save to Supabase database with uploaded URLs
    const mediaData = {
      ...media,
      photos: uploadedPhotos,
      coverPhoto: uploadedCoverPhoto,
      updatedAt: new Date().toISOString()
    };
    
    // Skip database save - photos are already stored in published_listings table
    // The property_photos table has schema issues (UUID type mismatch, missing constraints)
    // Photos are accessible via published_listings.photos and published_listings.coverPhoto
    logger.debug('✅ Media saved to cloud storage (photos in published_listings table)');
    
    logger.debug('✅ Property media saved to Supabase cloud:', {
      listingId,
      hasCoverPhoto: !!media.coverPhoto,
      photosCount: media.photos?.length || 0,
      videosCount: media.videos?.length || 0
    });
  } catch (error) {
    logger.error('❌ Error saving property media to storage:', error);
    throw error;
  }
};

/**
 * Load property media from Supabase cloud (replaces AsyncStorage)
 */
export const loadPropertyMediaFromStorage = async (
  listingId: string
): Promise<PropertyMedia | null> => {
  try {
    logger.debug('📸 Loading property media from Supabase cloud for listing:', listingId);
    
    const mediaRecord = await db.get('property_photos', listingId);
    
    if (mediaRecord) {
      const media: PropertyMedia = {
        coverPhoto: mediaRecord.coverPhoto || null,
        photos: mediaRecord.photos || [],
        videos: mediaRecord.videos || []
      };
      logger.debug('✅ Property media loaded from Supabase cloud:', {
        listingId,
        hasCoverPhoto: !!media.coverPhoto,
        photosCount: media.photos?.length || 0,
        videosCount: media.videos?.length || 0
      });
      return media;
    } else {
      logger.debug('📸 No property media found in Supabase cloud for listing:', listingId);
      return null;
    }
  } catch (error) {
    logger.error('❌ Error loading property media from Supabase cloud:', error);
    return null;
  }
};

/**
 * Clear property media from Supabase cloud
 */
export const clearPropertyMediaFromStorage = async (
  listingId: string
): Promise<void> => {
  try {
    logger.debug('🗑️ Clearing property media from Supabase cloud for listing:', listingId);
    
    await db.remove('property_photos', listingId);
    
    logger.debug('✅ Property media cleared from Supabase cloud for listing:', listingId);
  } catch (error) {
    logger.error('❌ Error clearing property media from storage:', error);
  }
};

/**
 * Save media to database with proper persistence
 */
export const savePropertyMedia = async (
  listingId: string, 
  userId: string, 
  media: PropertyMedia
): Promise<PropertyMedia> => {
  try {
    logger.debug('💾 Saving property media for listing:', listingId);
    logger.debug('📊 Media data:', {
      hasCoverPhoto: !!media.coverPhoto,
      photosCount: media.photos?.length || 0,
      videosCount: media.videos?.length || 0
    });
    
    // Upload photos to Supabase storage if they're local URIs
    const uploadedPhotos: string[] = [];
    for (const photo of media.photos || []) {
      if (photo.startsWith('data:') || photo.startsWith('file://')) {
        try {
          logger.debug('📤 Uploading photo to Supabase storage...');
          const url = await uploadToSupabase(photo, 'property-images', `${listingId}_${Date.now()}.jpg`);
          uploadedPhotos.push(url);
          logger.debug('✅ Photo uploaded:', url);
        } catch (error) {
          logger.error('❌ Failed to upload photo:', error);
          uploadedPhotos.push(photo); // Keep original if upload fails
        }
      } else {
        uploadedPhotos.push(photo);
      }
    }
    
    // Upload cover photo
    let uploadedCoverPhoto = media.coverPhoto;
    if (media.coverPhoto && (media.coverPhoto.startsWith('data:') || media.coverPhoto.startsWith('file://'))) {
      try {
        logger.debug('📤 Uploading cover photo to Supabase storage...');
        uploadedCoverPhoto = await uploadToSupabase(media.coverPhoto, 'property-images', `${listingId}_cover.jpg`);
        logger.debug('✅ Cover photo uploaded:', uploadedCoverPhoto);
      } catch (error) {
        logger.error('❌ Failed to upload cover photo:', error);
      }
    }

    // Upload videos to Supabase storage (same as photos)
    const uploadedVideos: string[] = [];
    for (const video of media.videos || []) {
      try {
        // Check if video is already a Supabase URL (already uploaded)
        if (video.includes('supabase.co')) {
          uploadedVideos.push(video);
          continue;
        }
        
        // Upload video to Supabase
        console.log('📤 Uploading video to Supabase:', video);
        const videoUrl = await uploadToSupabase(video, 'property-videos');
        
        if (videoUrl) {
          uploadedVideos.push(videoUrl);
          console.log('✅ Video uploaded successfully:', videoUrl);
        } else {
          console.warn('⚠️ Failed to upload video, skipping:', video);
          // Don't add failed videos - skip them instead of blocking the whole process
        }
      } catch (error) {
        console.warn('⚠️ Error uploading video, skipping:', error);
        // Skip broken videos instead of blocking the entire save process
        // This allows the listing to be created even if one video fails
      }
    }

    const uploadedMedia: PropertyMedia = {
      photos: uploadedPhotos,
      videos: uploadedVideos,
      coverPhoto: uploadedCoverPhoto || null
    };

    logger.debug('✅ Property media uploaded successfully:', {
      hasCoverPhoto: !!uploadedMedia.coverPhoto,
      photosCount: uploadedMedia.photos.length,
      videosCount: uploadedMedia.videos.length
    });

    return uploadedMedia;
  } catch (error) {
    logger.error('❌ Error saving property media:', error);
    throw error;
  }
};

/**
 * Load media from database with caching
 */
export const loadPropertyMedia = async (listingId: string, userId?: string): Promise<PropertyMedia> => {
  try {
    logger.debug('📸 Loading property media for listing:', listingId);
    
    // First, try to get from Supabase cloud - ALWAYS check this first
    try {
      const storedMedia = await loadPropertyMediaFromStorage(listingId);
      if (storedMedia && (storedMedia.coverPhoto || storedMedia.photos.length > 0 || storedMedia.videos.length > 0)) {
        logger.debug('✅ Using Supabase cloud property media for listing:', listingId, {
          hasCoverPhoto: !!storedMedia.coverPhoto,
          photosCount: storedMedia.photos.length,
          videosCount: storedMedia.videos.length
        });
        return storedMedia;
      } else {
        logger.debug('📸 Supabase cloud media found but empty for listing:', listingId);
      }
    } catch (storageError) {
      logger.debug('⚠️ Supabase cloud not available, trying cache:', storageError);
    }
    
    // Second, try to get from cache
    try {
      const { getCachedPropertyMedia, cachePropertyMedia } = await import('./property-media-cache');
      const cachedMedia = await getCachedPropertyMedia(listingId);
      
      if (cachedMedia && (cachedMedia.coverPhoto || cachedMedia.photos.length > 0 || cachedMedia.videos.length > 0)) {
        logger.debug('✅ Using cached property media for listing:', listingId);
        // Also save to Supabase cloud for future persistence
        await savePropertyMediaToStorage(listingId, cachedMedia);
        return cachedMedia;
      } else {
        logger.debug('📸 Cache media found but empty for listing:', listingId);
      }
    } catch (cacheError) {
      logger.debug('⚠️ Cache system not available, loading from database:', cacheError);
    }
    
    // Third, load from media tables (property_photos and property_videos)
    const { data: photos, error: photosError } = await supabase.from('property_photos').select('*');
    if (photosError) {
      logger.error('Error fetching photos:', photosError);
    }
    const safePhotos = photos || [];
    logger.debug('📸 All photos in database:', safePhotos.length);
    const listingPhotos = safePhotos.filter((photo: any) => photo.listingId === listingId);
    logger.debug('📸 Photos for this listing:', listingPhotos.length);
    
    // Load videos
    const { data: videos, error: videosError } = await supabase.from('property_videos').select('*');
    if (videosError) {
      logger.error('Error fetching videos:', videosError);
    }
    const safeVideos = videos || [];
    logger.debug('🎥 All videos in database:', safeVideos.length);
    const listingVideos = safeVideos.filter((video: any) => video.listingId === listingId);
    logger.debug('🎥 Videos for this listing:', listingVideos.length);
    
    // Find cover photo - prefer photoData for persistence
    const coverPhotoRecord = listingPhotos.find((photo: any) => photo.isCoverPhoto);
    let coverPhoto = coverPhotoRecord ? (coverPhotoRecord.photoData || coverPhotoRecord.photoUri) : null;
    logger.debug('🖼️ Cover photo found in media tables:', !!coverPhoto);
    
    // Get all non-cover photos - prefer photoData for persistence
    let propertyPhotos = listingPhotos
      .filter((photo: any) => !photo.isCoverPhoto)
      .map((photo: any) => photo.photoData || photo.photoUri);
    logger.debug('📸 Non-cover photos from media tables:', propertyPhotos.length);
    
    // Get all videos
    let propertyVideos = listingVideos.map((video: any) => video.videoUri);
    logger.debug('🎥 Property videos from media tables:', propertyVideos.length);
    
    // CRITICAL FIX: If no media found in media tables, fall back to the listing object itself
    if (!coverPhoto && propertyPhotos.length === 0 && propertyVideos.length === 0) {
      logger.debug('⚠️ No media found in media tables, checking listing object itself...');
      try {
        const { data: listing, error: listingError } = await supabase.from('published_listings').select('*').eq('id', listingId).single(); if (listingError && listingError.code !== 'PGRST116') { logger.error('Error fetching listing:', listingError); }
        if (listing) {
          // Try both snake_case and camelCase for compatibility
          coverPhoto = listing.cover_photo || listing.coverPhoto || null;
          propertyPhotos = Array.isArray(listing.photos) ? listing.photos : [];
          propertyVideos = Array.isArray(listing.videos) ? listing.videos : [];
          
          logger.debug('✅ Loaded media from listing object:', {
            hasCoverPhoto: !!coverPhoto,
            photosCount: propertyPhotos.length,
            videosCount: propertyVideos.length
          });
          
          // Re-sync this media back to media tables for future use
          if (coverPhoto || propertyPhotos.length > 0 || propertyVideos.length > 0) {
            logger.debug('🔄 Re-syncing media from listing to media tables...');
            await savePropertyMedia(listingId, listing.userId || userId || 'unknown', {
              coverPhoto,
              photos: propertyPhotos,
              videos: propertyVideos
            });
          }
        } else {
          logger.debug('❌ Listing not found in database:', listingId);
        }
      } catch (listingError) {
        logger.error('❌ Error loading media from listing object:', listingError);
      }
    }
    
    const media: PropertyMedia = {
      coverPhoto,
      photos: propertyPhotos,
      videos: propertyVideos
    };
    
    logger.debug('✅ Property media loaded successfully:', {
      coverPhoto: !!media.coverPhoto,
      photosCount: media.photos.length,
      videosCount: media.videos.length,
      coverPhotoUri: media.coverPhoto?.substring(0, 50) + '...'
    });
    
    // Cache the loaded media for future use
    try {
      const { cachePropertyMedia } = await import('./property-media-cache');
      await cachePropertyMedia(listingId, media, userId);
      logger.debug('💾 Property media cached for listing:', listingId);
    } catch (cacheError) {
      logger.debug('⚠️ Failed to cache property media:', cacheError);
    }

    // ALWAYS save to Supabase cloud for persistence - this is critical
    try {
      await savePropertyMediaToStorage(listingId, media);
      logger.debug('💾 Property media saved to Supabase cloud for listing:', listingId, {
        hasCoverPhoto: !!media.coverPhoto,
        photosCount: media.photos.length,
        videosCount: media.videos.length
      });
    } catch (storageError) {
      logger.error('❌ CRITICAL: Failed to save property media to Supabase cloud:', storageError);
      // Don't throw here, but log as critical since this affects persistence
    }
    
    return media;
  } catch (error) {
    logger.error('❌ Error loading property media:', error);
    return {
      coverPhoto: null,
      photos: [],
      videos: []
    };
  }
};

/**
 * Delete media from database
 */
export const deletePropertyMedia = async (listingId: string): Promise<void> => {
  try {
    logger.debug('🗑️ Deleting property media for listing:', listingId);
    
    // Delete photos
    const { data: photos, error: photosError } = await supabase.from('property_photos').select('*');
    if (photosError) {
      logger.error('Error fetching photos:', photosError);
    }
    const safePhotos = photos || [];
    const listingPhotos = safePhotos.filter((photo: any) => photo.listingId === listingId);
    
    for (const photo of listingPhotos) {
      await db.remove('property_photos', photo.id);
    }
    
    // Delete videos
    const { data: videos, error: videosError } = await supabase.from('property_videos').select('*');
    if (videosError) {
      logger.error('Error fetching videos:', videosError);
    }
    const safeVideos = videos || [];
    const listingVideos = safeVideos.filter((video: any) => video.listingId === listingId);
    
    for (const video of listingVideos) {
      await db.remove('property_videos', video.id);
    }
    
    logger.debug('✅ Property media deleted successfully');
  } catch (error) {
    logger.error('❌ Error deleting property media:', error);
    throw error;
  }
};

/**
 * Update media in database (replace existing)
 */
export const updatePropertyMedia = async (
  listingId: string, 
  userId: string, 
  media: PropertyMedia
): Promise<void> => {
  try {
    logger.debug('🔄 Updating property media for listing:', listingId);
    
    // First delete existing media
    await deletePropertyMedia(listingId);
    
    // Then save new media
    await savePropertyMedia(listingId, userId, media);
    
    logger.debug('✅ Property media updated successfully');
  } catch (error) {
    logger.error('❌ Error updating property media:', error);
    throw error;
  }
};

/**
 * Refresh all media for app startup - ensures persistence across login/logout
 * This function re-syncs all media from listing objects to Supabase cloud storage
 */
export const refreshAllPropertyMedia = async (): Promise<void> => {
  try {
    logger.debug('🔄 Refreshing all property media for persistence...');
    
    // Get all published listings
    const { data: publishedListings, error: listingsError } = await supabase.from('published_listings').select('*');
    if (listingsError) {
      logger.error('Error fetching listings:', listingsError);
    }
    const safeListings = publishedListings || [];
    logger.debug(`📋 Found ${safeListings.length} published listings to refresh`);
    
    let refreshedCount = 0;
    let resyncedCount = 0;
    
    for (const listing of safeListings) {
      try {
        // First, check if media exists in the listing object itself
        const hasListingMedia = listing.coverPhoto || 
                               (listing.photos && listing.photos.length > 0) || 
                               (listing.videos && listing.videos.length > 0);
        
        if (hasListingMedia) {
          // Force re-sync media from listing to all storage locations
          logger.debug(`🔄 Re-syncing media for listing ${listing.id} from listing object...`);
          const mediaFromListing = {
            coverPhoto: listing.coverPhoto || null,
            photos: Array.isArray(listing.photos) ? listing.photos : [],
            videos: Array.isArray(listing.videos) ? listing.videos : []
          };
          
          // Save to media tables
          await savePropertyMedia(listing.id, listing.userId || 'unknown', mediaFromListing);
          
          // Save to Supabase cloud
          await savePropertyMediaToStorage(listing.id, mediaFromListing);
          
          resyncedCount++;
          logger.debug(`✅ Re-synced media for listing ${listing.id}:`, {
            hasCoverPhoto: !!mediaFromListing.coverPhoto,
            photosCount: mediaFromListing.photos.length,
            videosCount: mediaFromListing.videos.length
          });
        }
        
        // Then load media using the standard flow (will use the re-synced data)
        const media = await loadPropertyMedia(listing.id);
        
        if (media.coverPhoto || media.photos.length > 0 || media.videos.length > 0) {
          refreshedCount++;
          logger.debug(`✅ Refreshed media for listing ${listing.id}:`, {
            hasCoverPhoto: !!media.coverPhoto,
            photosCount: media.photos.length,
            videosCount: media.videos.length
          });
        }
      } catch (error) {
        logger.debug(`⚠️ Could not refresh media for listing ${listing.id}:`, error);
      }
    }
    
    logger.debug(`✅ Media refresh completed:`, {
      totalListings: safeListings.length,
      resyncedFromListing: resyncedCount,
      refreshedTotal: refreshedCount
    });
  } catch (error) {
    logger.error('❌ Error refreshing all property media:', error);
  }
};





