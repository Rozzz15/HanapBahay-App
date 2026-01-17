/**
 * Supabase Storage Helper
 * For uploading and managing property images/videos
 */

import { supabase } from './supabase-client';
import { decode } from 'base64-arraybuffer';

// Dynamic import for FileSystem to handle web/native differences
// Using legacy API for compatibility with Expo SDK 54+
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system/legacy');
  console.log('✅ FileSystem (legacy) loaded successfully');
} catch (error) {
  console.warn('⚠️ FileSystem not available on this platform');
}

/**
 * Upload image to Supabase Storage
 * @param imageUri - Local file URI or base64 data URI
 * @param bucketName - Supabase storage bucket name
 * @param fileName - Desired file name
 * @returns Public URL of uploaded image
 */
export async function uploadToSupabase(
    imageUri: string,
    bucketName: string = 'property-images',
    fileName?: string
): Promise<string> {
    try {
        console.log('📤 Uploading to Supabase Storage...');

        // Generate file name if not provided
        // Detect file extension from URI or use default based on bucket
        let defaultExtension = '.jpg';
        if (bucketName === 'property-videos') {
            defaultExtension = '.mp4';
        } else if (imageUri.toLowerCase().endsWith('.png')) {
            defaultExtension = '.png';
        } else if (imageUri.toLowerCase().endsWith('.mp4')) {
            defaultExtension = '.mp4';
        } else if (imageUri.toLowerCase().endsWith('.mov')) {
            defaultExtension = '.mov';
        } else if (imageUri.toLowerCase().endsWith('.webm')) {
            defaultExtension = '.webm';
        }
        
        const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}${defaultExtension}`;

        let fileData: ArrayBuffer;
        let contentType = 'image/jpeg';

        // Handle base64 data URI (most common for profile photos from image picker)
        if (imageUri.startsWith('data:image') || imageUri.startsWith('data:application/')) {
            console.log('📸 Converting base64 data URI to file...');
            console.log('📊 Data URI prefix:', imageUri.substring(0, 50));

            // Extract mime type from data URI
            const mimeMatch = imageUri.match(/data:([^;,]+)/);
            if (mimeMatch) {
                let extractedType = mimeMatch[1];
                // If mime type is just 'image', default to 'image/jpeg'
                if (extractedType === 'image') {
                    extractedType = 'image/jpeg';
                    console.log('⚠️ Generic "image" type detected, defaulting to image/jpeg');
                }
                contentType = extractedType;
                console.log('📝 Detected content type:', contentType);
            } else {
                console.log('⚠️ Could not extract mime type, using default image/jpeg');
                contentType = 'image/jpeg';
            }

            // Extract base64 data (remove data:image/jpeg;base64, prefix)
            const base64Data = imageUri.split(',')[1];

            if (!base64Data) {
                throw new Error('Invalid base64 data URI - no data found after comma');
            }

            console.log('📊 Base64 data length:', base64Data.length);

            // Convert base64 to ArrayBuffer
            fileData = decode(base64Data);
            console.log('✅ Converted base64 to ArrayBuffer, size:', fileData.byteLength, 'bytes');
        }
        // Handle file:// URI (from file system)
        else if (imageUri.startsWith('file://')) {
            console.log('📁 Reading file from filesystem...');

            // Check if FileSystem is available
            if (!FileSystem) {
                console.error('❌ FileSystem module not loaded');
                throw new Error('FileSystem module not available. Please use base64 data URI instead.');
            }

            try {
                // First, check if file exists
                console.log('🔍 Checking if file exists...');
                const fileInfo = await FileSystem.getInfoAsync(imageUri);
                
                if (!fileInfo.exists) {
                    console.error('❌ File does not exist:', imageUri);
                    throw new Error('File not found - it may have been deleted from cache. Please select the file again.');
                }
                
                console.log('✅ File exists, size:', fileInfo.size, 'bytes');
                console.log('📖 Reading file with FileSystem...');
                
                // Read file as base64 using string encoding instead of EncodingType enum
                const base64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: 'base64',
                });

                console.log('✅ File read successfully, length:', base64?.length || 0);
                
                // Convert to ArrayBuffer
                fileData = decode(base64);
                console.log('✅ Converted to ArrayBuffer');
            } catch (readError) {
                console.error('❌ Error reading file:', readError);
                throw new Error(`Failed to read file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
            }

            // Detect content type from file extension
            const lowerUri = imageUri.toLowerCase();
            if (lowerUri.endsWith('.png')) {
                contentType = 'image/png';
            } else if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) {
                contentType = 'image/jpeg';
            } else if (lowerUri.endsWith('.mp4')) {
                contentType = 'video/mp4';
            } else if (lowerUri.endsWith('.mov')) {
                contentType = 'video/quicktime';
            } else if (lowerUri.endsWith('.avi')) {
                contentType = 'video/x-msvideo';
            } else if (lowerUri.endsWith('.webm')) {
                contentType = 'video/webm';
            } else if (lowerUri.endsWith('.mkv')) {
                contentType = 'video/x-matroska';
            }
            console.log('📝 Detected content type from extension:', contentType);
        } else {
            throw new Error(`Unsupported image URI format. Must start with 'data:image/' or 'file://'. Got: ${imageUri.substring(0, 50)}...`);
        }

        // Upload to Supabase Storage
        console.log(`☁️ Uploading to bucket: ${bucketName}/${finalFileName}`);

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(finalFileName, fileData, {
                contentType,
                upsert: true, // Overwrite if exists
            });

        if (error) {
            console.error('❌ Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(finalFileName);

        console.log('✅ Uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error) {
        console.error('❌ Error uploading to Supabase:', error);
        throw error;
    }
}

/**
 * Upload multiple images to Supabase Storage
 * @param imageUris - Array of local file URIs or base64 data URIs
 * @param bucketName - Supabase storage bucket name
 * @returns Array of public URLs
 */
export async function uploadMultipleToSupabase(
    imageUris: string[],
    bucketName: string = 'property-images'
): Promise<string[]> {
    try {
        console.log(`📤 Uploading ${imageUris.length} images to Supabase...`);

        const uploadPromises = imageUris.map((uri, index) =>
            uploadToSupabase(uri, bucketName, `image_${Date.now()}_${index}.jpg`)
        );

        const urls = await Promise.all(uploadPromises);
        console.log(`✅ Successfully uploaded ${urls.length} images`);

        return urls;
    } catch (error) {
        console.error('❌ Error uploading multiple images:', error);
        throw error;
    }
}

/**
 * Delete image from Supabase Storage
 * @param fileUrl - Public URL or file path
 * @param bucketName - Supabase storage bucket name
 */
export async function deleteFromSupabase(
    fileUrl: string,
    bucketName: string = 'property-images'
): Promise<void> {
    try {
        // Extract file name from URL
        const fileName = fileUrl.split('/').pop();

        if (!fileName) {
            throw new Error('Invalid file URL');
        }

        console.log(`🗑️ Deleting from Supabase: ${fileName}`);

        const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);

        if (error) {
            console.error('❌ Supabase delete error:', error);
            throw error;
        }

        console.log('✅ Deleted successfully');
    } catch (error) {
        console.error('❌ Error deleting from Supabase:', error);
        throw error;
    }
}

/**
 * Get public URL for a file in Supabase Storage
 * @param fileName - File name in the bucket
 * @param bucketName - Supabase storage bucket name
 * @returns Public URL
 */
export function getSupabasePublicUrl(
    fileName: string,
    bucketName: string = 'property-images'
): string {
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    return data.publicUrl;
}

/**
 * Upload video to Supabase Storage
 * @param videoUri - Local video file URI
 * @param bucketName - Supabase storage bucket name
 * @param fileName - Desired file name
 * @returns Public URL of uploaded video
 */
export async function uploadVideoToSupabase(
    videoUri: string,
    bucketName: string = 'property-videos',
    fileName?: string
): Promise<string> {
    try {
        console.log('📹 Uploading video to Supabase Storage...');

        // Generate file name if not provided
        const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.mp4`;

        // Check if FileSystem is available
        if (!FileSystem) {
            throw new Error('FileSystem module not available. Cannot upload videos.');
        }

        // Read video file as base64 using string encoding
        const base64 = await FileSystem.readAsStringAsync(videoUri, {
            encoding: 'base64',
        });

        // Convert to ArrayBuffer
        const fileData = decode(base64);

        // Upload to Supabase Storage
        console.log(`☁️ Uploading video to bucket: ${bucketName}/${finalFileName}`);

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(finalFileName, fileData, {
                contentType: 'video/mp4',
                upsert: true,
            });

        if (error) {
            console.error('❌ Supabase video upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(finalFileName);

        console.log('✅ Video uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error) {
        console.error('❌ Error uploading video to Supabase:', error);
        throw error;
    }
}

/**
 * Check if Supabase Storage is configured
 */
export function isSupabaseStorageConfigured(): boolean {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    return !!(supabaseUrl && supabaseKey &&
        supabaseUrl !== 'https://your-project.supabase.co' &&
        supabaseKey !== 'your-anon-key-here');
}

/**
 * Upload owner application document to Supabase Storage
 * @param documentUri - Local file URI or base64 data URI
 * @param userId - Owner's user ID
 * @param documentName - Document type name (e.g., "Government ID")
 * @returns Object with document details including public URL
 */
export async function uploadOwnerDocument(
    documentUri: string,
    userId: string,
    documentName: string
): Promise<{ id: string; name: string; uri: string; uploadedAt: string }> {
    try {
        console.log(`📄 Uploading owner document: ${documentName}`);

        // Create a unique filename with userId and timestamp
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).slice(2, 9);
        const sanitizedName = documentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${userId}/${sanitizedName}_${timestamp}_${randomId}.jpg`;

        // Upload to 'owner-documents' bucket
        const publicUrl = await uploadToSupabase(documentUri, 'owner-documents', fileName);

        console.log(`✅ Document uploaded successfully: ${publicUrl}`);

        // Return document object in the format expected by the app
        return {
            id: `doc_${timestamp}_${randomId}`,
            name: documentName,
            uri: publicUrl,
            uploadedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`❌ Error uploading owner document "${documentName}":`, error);
        throw error;
    }
}

/**
 * Upload multiple owner documents to Supabase Storage
 * @param documents - Array of { uri: string, name: string }
 * @param userId - Owner's user ID
 * @returns Array of document objects with public URLs
 */
export async function uploadOwnerDocuments(
    documents: { uri: string; name: string }[],
    userId: string
): Promise<Array<{ id: string; name: string; uri: string; uploadedAt: string }>> {
    try {
        console.log(`📤 Uploading ${documents.length} owner documents...`);

        const uploadPromises = documents.map(doc =>
            uploadOwnerDocument(doc.uri, userId, doc.name)
        );

        const uploadedDocs = await Promise.all(uploadPromises);
        
        console.log(`✅ Successfully uploaded ${uploadedDocs.length} owner documents`);
        return uploadedDocs;
    } catch (error) {
        console.error('❌ Error uploading owner documents:', error);
        throw error;
    }
}

/**
 * Example usage:
 * 
 * // Upload single image
 * const imageUrl = await uploadToSupabase(localImageUri, 'property-images');
 * 
 * // Upload multiple images
 * const urls = await uploadMultipleToSupabase([uri1, uri2, uri3]);
 * 
 * // Upload owner document
 * const doc = await uploadOwnerDocument(uri, userId, 'Government ID');
 * 
 * // Upload multiple owner documents
 * const docs = await uploadOwnerDocuments([{uri, name}], userId);
 * 
 * // Upload video
 * const videoUrl = await uploadVideoToSupabase(localVideoUri, 'property-videos');
 * 
 * // Delete image
 * await deleteFromSupabase(imageUrl);
 */
