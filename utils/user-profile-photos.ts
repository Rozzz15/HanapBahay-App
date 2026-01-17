import { db } from './db';
import { UserProfilePhotoRecord } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Helper function to safely get userId from a photo record
 * Handles cases where the property might be stored as 'userid' instead of 'userId'
 */
function getPhotoUserId(photo: any): string | null {
  if (!photo) return null;
  
  // Try the correct property name first
  if (photo.userId && typeof photo.userId === 'string') {
    return photo.userId;
  }
  
  // Fallback to lowercase version if it exists
  if (photo.userid && typeof photo.userid === 'string') {
    console.warn('⚠️ Found photo with lowercase userid property, using fallback');
    return photo.userid;
  }
  
  // If neither exists, return null
  console.warn('⚠️ Photo record missing userId property:', Object.keys(photo));
  return null;
}

/**
 * Migrate existing photo records to use correct property names
 * This fixes any records that might have been stored with 'userid' instead of 'userId'
 */
export const migratePhotoRecords = async (): Promise<void> => {
  try {
    console.log('🔄 Starting photo records migration...');
    
    const photos = await db.list<UserProfilePhotoRecord>('user_profile_photos');
    let migratedCount = 0;
    
    // Filter out any undefined/null values that might come from the database
    const validPhotos = photos.filter(photo => photo != null && typeof photo === 'object');
    console.log('🔍 Debug - migration valid photos count:', validPhotos.length, 'out of', photos.length);
    
    for (const photo of validPhotos) {
      // Add safety check for photo object
      if (!photo || typeof photo !== 'object') {
        console.warn('⚠️ Invalid photo object found in migration:', photo);
        continue;
      }
      
      // Check if this record has the wrong property name
      if ((photo as any).userid && !photo.userId) {
        console.log('🔧 Migrating photo record:', photo?.id);
        
        // Create a corrected record
        const correctedPhoto: UserProfilePhotoRecord = {
          ...photo,
          userId: (photo as any).userid,
        };
        
        // Remove the incorrect property
        delete (correctedPhoto as any).userid;
        
        // Save the corrected record
        await db.upsert('user_profile_photos', photo.id, correctedPhoto);
        migratedCount++;
      }
    }
    
    if (migratedCount > 0) {
      console.log(`✅ Migrated ${migratedCount} photo records`);
    } else {
      console.log('✅ No photo records needed migration');
    }
  } catch (error) {
    console.error('❌ Error during photo records migration:', error);
  }
};

/**
 * Save user profile photo to database
 */
export const saveUserProfilePhoto = async (
  userId: string,
  photoUri: string,
  photoData?: string,
  fileName?: string,
  fileSize?: number,
  mimeType?: string
): Promise<string> => {
  try {
    console.log('💾 Saving user profile photo to database...');
    console.log('🔍 Debug - userId parameter:', userId);
    console.log('🔍 Debug - userId type:', typeof userId);
    
    // Validate userId parameter
    if (!userId || typeof userId !== 'string') {
      const error = new Error(`Invalid userId parameter: ${userId} (type: ${typeof userId})`);
      console.error('❌ Error saving user profile photo:', error);
      throw error;
    }
    
    // Process photo data to ensure proper format
    let processedPhotoUri = photoUri.trim();
    let processedPhotoData = photoData?.trim() || photoUri.trim();
    let processedMimeType = mimeType || 'image/jpeg';
    
    // Convert file:// URIs to base64 data URIs for persistence
    if (processedPhotoUri.startsWith('file://')) {
      console.log('🔄 Converting file:// URI to base64 for persistence...');
      try {
        const base64 = await FileSystem.readAsStringAsync(processedPhotoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        processedPhotoData = `data:${processedMimeType};base64,${base64}`;
        processedPhotoUri = processedPhotoData; // Store as data URI
        console.log('✅ Converted file:// to base64 data URI, length:', processedPhotoData.length);
      } catch (error) {
        console.error('❌ Failed to convert file:// URI to base64:', error);
        throw new Error('Failed to read image file. Please try again.');
      }
    }
    
    // If photoUri is a data URI, extract mime type and base64 data
    if (processedPhotoUri.startsWith('data:')) {
      const dataUriMatch = processedPhotoUri.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUriMatch) {
        processedMimeType = dataUriMatch[1] || processedMimeType;
        const base64Data = dataUriMatch[2];
        // Store full data URI in photoUri, and base64 data in photoData for flexibility
        processedPhotoData = processedPhotoData.startsWith('data:') 
          ? processedPhotoData 
          : processedPhotoUri; // Use full data URI if photoData wasn't provided
      }
    } else if (processedPhotoData.startsWith('data:')) {
      // If photoData is a data URI but photoUri is not, extract mime type
      const dataUriMatch = processedPhotoData.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUriMatch) {
        processedMimeType = dataUriMatch[1] || processedMimeType;
      }
    }
    
    // Ensure we have valid photo data
    if (!processedPhotoUri && !processedPhotoData) {
      throw new Error('No photo data provided');
    }
    
    // Check if user already has a profile photo
    const existingPhotos = await db.list<UserProfilePhotoRecord>('user_profile_photos');
    
    // Filter out any undefined/null values that might come from the database
    const validPhotos = existingPhotos.filter(photo => photo != null && typeof photo === 'object');
    
    const existingPhoto = validPhotos.find(photo => {
      if (!photo || typeof photo !== 'object') {
        return false;
      }
      const photoUserId = getPhotoUserId(photo);
      return photoUserId === userId;
    });
    
    let photoId: string;
    
    if (existingPhoto) {
      // Update existing photo
      photoId = existingPhoto.id;
      const updatedPhoto: UserProfilePhotoRecord = {
        ...existingPhoto,
        userId, // Ensure userId is set correctly
        photoUri: processedPhotoUri || existingPhoto.photoUri,
        photoData: processedPhotoData || existingPhoto.photoData,
        fileName: fileName || existingPhoto.fileName,
        fileSize: fileSize || existingPhoto.fileSize,
        mimeType: processedMimeType || existingPhoto.mimeType,
        updatedAt: new Date().toISOString()
      };
      
      await db.upsert('user_profile_photos', photoId, updatedPhoto);
      console.log('✅ Updated existing profile photo:', photoId, 'for user:', userId);
    } else {
      // Create new photo record
      photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newPhoto: UserProfilePhotoRecord = {
        id: photoId,
        userId,
        photoUri: processedPhotoUri,
        photoData: processedPhotoData,
        fileName: fileName || `profile_${userId}_${Date.now()}.jpg`,
        fileSize: fileSize || (processedPhotoData ? processedPhotoData.length : 0),
        mimeType: processedMimeType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.upsert('user_profile_photos', photoId, newPhoto);
      console.log('✅ Created new profile photo:', photoId, 'for user:', userId);
    }
    
    // Verify the photo was saved correctly
    const savedPhoto = await db.get('user_profile_photos', photoId) as UserProfilePhotoRecord | null;
    if (savedPhoto) {
      const savedUserId = getPhotoUserId(savedPhoto);
      if (savedUserId === userId) {
        console.log('✅ Verified profile photo saved correctly for user:', userId);
      } else {
        console.warn('⚠️ Profile photo userId mismatch after save:', { expected: userId, found: savedUserId });
      }
    }
    
    return photoId;
  } catch (error) {
    console.error('❌ Error saving user profile photo:', error);
    throw error;
  }
};

/**
 * Load user profile photo from database
 */
export const loadUserProfilePhoto = async (userId: string): Promise<string | null> => {
  try {
    console.log('📸 Loading user profile photo for:', userId);
    
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('⚠️ Invalid userId provided to loadUserProfilePhoto:', userId);
      return null;
    }
    
    const photos = await db.list<UserProfilePhotoRecord>('user_profile_photos');
    console.log('🔍 Total photos in database:', photos.length);
    
    // Filter out any undefined/null values that might come from the database
    const validPhotos = photos.filter(photo => photo != null && typeof photo === 'object');
    console.log('🔍 Valid photos count:', validPhotos.length);
    
    // Try to find photo by userId (case-insensitive comparison)
    let userPhoto = validPhotos.find(photo => {
      if (!photo || typeof photo !== 'object') {
        return false;
      }
      
      const photoUserId = getPhotoUserId(photo);
      // Use strict equality and also try trimmed comparison
      return photoUserId === userId || 
             (photoUserId && userId && photoUserId.trim() === userId.trim());
    });
    
    // If not found, try with different userId variations
    if (!userPhoto) {
      console.log('🔍 Photo not found with exact match, trying variations...');
      userPhoto = validPhotos.find(photo => {
        if (!photo || typeof photo !== 'object') {
          return false;
        }
        const photoUserId = getPhotoUserId(photo);
        // Try case-insensitive comparison
        return photoUserId && userId && 
               photoUserId.toLowerCase() === userId.toLowerCase();
      });
    }
    
    if (userPhoto) {
      const rawData = (userPhoto.photoData || '').trim();
      const rawUri = (userPhoto.photoUri || '').trim();
      console.log('✅ Found profile photo record:', {
        id: userPhoto.id,
        fileName: userPhoto.fileName,
        hasPhotoData: !!rawData,
        photoDataLength: rawData.length,
        hasPhotoUri: !!rawUri,
        photoUriLength: rawUri.length,
        mimeType: userPhoto.mimeType,
        photoUriPrefix: rawUri ? rawUri.substring(0, 50) : '',
        photoDataPrefix: rawData ? rawData.substring(0, 50) : ''
      });

      // Prefer embedded base64 data if available
      if (rawData && rawData.length > 10) {
        // Check for malformed URI (contains both data: and file://)
        if (rawData.includes('data:') && rawData.includes('file://')) {
          console.warn('⚠️ Malformed photo data detected (contains both data: and file://), skipping');
          return null;
        }
        
        // Check if it's already a valid URI format
        if (rawData.startsWith('data:')) {
          // Validate data URI format - should not contain file://
          if (rawData.includes('file://')) {
            console.warn('⚠️ Malformed data URI detected (contains file://), skipping');
            return null;
          }
          console.log('✅ Returning photo data as data URI');
          return rawData;
        }
        
        if (rawData.startsWith('file://')) {
          // File URIs don't persist across app restarts - warn user
          console.warn('⚠️ Profile photo stored as file:// URI - may not persist. URI:', rawData.substring(0, 100));
          // Return null to show fallback instead of broken image
          return null;
        }
        
        if (rawData.startsWith('http://') || rawData.startsWith('https://')) {
          // It's an HTTP/HTTPS URI, return it directly
          console.log('✅ Returning photo data as HTTP/HTTPS URI');
          return rawData;
        }
        
        // Check if it contains file:// but doesn't start with it (malformed)
        if (rawData.includes('file://')) {
          console.warn('⚠️ Photo data contains file:// but is not a valid file URI, skipping');
          return null;
        }
        
        // Assume it's base64 data and construct data URI
        const mimeType = userPhoto.mimeType || 'image/jpeg';
        // Normalize MIME type (fix "image" -> "image/jpeg")
        const normalizedMimeType = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
        const dataUri = `data:${normalizedMimeType};base64,${rawData}`;
        console.log('✅ Constructed data URI from photoData, length:', dataUri.length);
        return dataUri;
      }

      // Fallback to stored URI if present
      if (rawUri && rawUri.length > 10) {
        // Check for malformed URI (contains both data: and file://)
        if (rawUri.includes('data:') && rawUri.includes('file://')) {
          console.warn('⚠️ Malformed photo URI detected (contains both data: and file://), skipping');
          return null;
        }
        
        // Check if it's already a valid URI format
        if (rawUri.startsWith('data:')) {
          // Validate data URI format - should not contain file://
          if (rawUri.includes('file://')) {
            console.warn('⚠️ Malformed data URI detected (contains file://), skipping');
            return null;
          }
          console.log('✅ Returning photo URI as data URI');
          return rawUri;
        }
        
        if (rawUri.startsWith('file://')) {
          // File URIs don't persist across app restarts - warn user
          console.warn('⚠️ Profile photo stored as file:// URI - may not persist. URI:', rawUri.substring(0, 100));
          // Return null to show fallback instead of broken image
          return null;
        }
        
        if (rawUri.startsWith('http://') || rawUri.startsWith('https://')) {
          // It's an HTTP/HTTPS URI, return it directly
          console.log('✅ Returning photo URI as HTTP/HTTPS URI');
          return rawUri;
        }
        
        // Check if it contains file:// but doesn't start with it (malformed)
        if (rawUri.includes('file://')) {
          console.warn('⚠️ Photo URI contains file:// but is not a valid file URI, skipping');
          return null;
        }
        
        // If it looks like bare base64, add prefix
        const looksLikeBase64 = /[A-Za-z0-9+/=]{100,}/.test(rawUri);
        if (looksLikeBase64) {
          const mimeType = userPhoto.mimeType || 'image/jpeg';
          // Normalize MIME type (fix "image" -> "image/jpeg")
          const normalizedMimeType = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
          const dataUri = `data:${normalizedMimeType};base64,${rawUri}`;
          console.log('✅ Constructed data URI from photoUri (looks like base64)');
          return dataUri;
        }
        
        console.log('✅ Returning photo URI as-is');
        return rawUri;
      }

      console.warn('⚠️ Photo record found but no usable data/uri. Data length:', rawData.length, 'URI length:', rawUri.length);
      return null;
    } else {
      console.log('📸 No profile photo found for user:', userId);
      // Log all userIds in database for debugging
      const allUserIds = validPhotos.map(p => getPhotoUserId(p)).filter(id => id);
      console.log('🔍 All userIds in database:', allUserIds);
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading user profile photo:', error);
    return null;
  }
};

/**
 * Delete user profile photo from database
 */
export const deleteUserProfilePhoto = async (userId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting user profile photo for:', userId);
    
    const photos = await db.list<UserProfilePhotoRecord>('user_profile_photos');
    console.log('🔍 Debug - deleteUserProfilePhoto photos sample:', photos.slice(0, 2));
    console.log('🔍 Debug - deleteUserProfilePhoto first photo structure:', photos[0] ? Object.keys(photos[0]) : 'No photos');
    
    // Filter out any undefined/null values that might come from the database
    const validPhotos = photos.filter(photo => photo != null && typeof photo === 'object');
    console.log('🔍 Debug - deleteUserProfilePhoto valid photos count:', validPhotos.length, 'out of', photos.length);
    
    const userPhoto = validPhotos.find(photo => {
      // Add safety check for photo object
      if (!photo || typeof photo !== 'object') {
        console.warn('⚠️ Invalid photo object found in deleteUserProfilePhoto:', photo);
        return false;
      }
      
      const photoUserId = getPhotoUserId(photo);
      console.log('🔍 Debug - deleteUserProfilePhoto checking photo:', { 
        id: photo?.id, 
        hasUserId: 'userId' in photo, 
        hasUserid: 'userid' in photo,
        userId: photo?.userId,
        userid: (photo as any)?.userid,
        photoUserId,
        allKeys: photo ? Object.keys(photo) : []
      });
      return photoUserId === userId;
    });
    
    if (userPhoto) {
      await db.remove('user_profile_photos', userPhoto.id);
      console.log('✅ Deleted profile photo:', userPhoto.id);
      return true;
    } else {
      console.log('📸 No profile photo found to delete for user:', userId);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting user profile photo:', error);
    return false;
  }
};
