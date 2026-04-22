/**
 * Enhanced Supabase Storage Helper with Better Error Handling
 * This file provides improved upload functionality with retry logic and better error messages
 */

import { supabase } from './supabase-client';
import { decode } from 'base64-arraybuffer';

// Dynamic import for FileSystem
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system/legacy');
  console.log('✅ FileSystem (legacy) loaded successfully');
} catch (error) {
  console.warn('⚠️ FileSystem not available on this platform');
}

interface UploadOptions {
  bucketName?: string;
  fileName?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Enhanced upload with retry logic and better error handling
 */
export async function uploadToSupabaseWithRetry(
  imageUri: string,
  options: UploadOptions = {}
): Promise<string> {
  const {
    bucketName = 'property-images',
    fileName,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Upload attempt ${attempt}/${maxRetries}...`);
      
      // Check internet connectivity first
      const netInfo = await import('@react-native-community/netinfo');
      const connectionState = await netInfo.default.fetch();
      
      if (!connectionState.isConnected) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Proceed with upload
      const url = await uploadToSupabaseCore(imageUri, bucketName, fileName);
      console.log(`✅ Upload successful on attempt ${attempt}`);
      return url;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Upload attempt ${attempt} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('Invalid base64') ||
        lastError.message.includes('File not found') ||
        lastError.message.includes('not available')
      ) {
        throw lastError;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to upload after ${maxRetries} attempts. ${lastError?.message || 'Please check your internet connection and try again.'}`
  );
}

/**
 * Core upload function (same as original but with better error messages)
 */
async function uploadToSupabaseCore(
  imageUri: string,
  bucketName: string,
  fileName?: string
): Promise<string> {
  try {
    console.log('📤 Starting upload to Supabase Storage...');
    console.log('📊 Image URI prefix:', imageUri.substring(0, 50));

    // Verify Supabase is configured
    // Try multiple sources for environment variables (Expo Constants, process.env)
    const Constants = require('expo-constants').default;
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;
    
    console.log('🔍 Supabase URL check:', supabaseUrl ? '✅ Found' : '❌ Missing');
    console.log('🔍 Supabase Key check:', supabaseKey ? '✅ Found' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'https://your-project.supabase.co' ||
        supabaseKey === 'your-anon-key') {
      throw new Error('Supabase is not configured. Please contact support.');
    }

    // Generate file name
    let defaultExtension = '.jpg';
    if (bucketName === 'property-videos') {
      defaultExtension = '.mp4';
    } else if (imageUri.toLowerCase().endsWith('.png')) {
      defaultExtension = '.png';
    } else if (imageUri.toLowerCase().endsWith('.pdf')) {
      defaultExtension = '.pdf';
    }
    
    const finalFileName = fileName || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}${defaultExtension}`;

    let fileData: ArrayBuffer;
    let contentType = 'image/jpeg';

    // Handle base64 data URI
    if (imageUri.startsWith('data:image') || imageUri.startsWith('data:application/')) {
      console.log('📸 Converting base64 data URI...');
      
      const mimeMatch = imageUri.match(/data:([^;,]+)/);
      if (mimeMatch) {
        contentType = mimeMatch[1] === 'image' ? 'image/jpeg' : mimeMatch[1];
      }

      const base64Data = imageUri.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data. Please select the image again.');
      }

      console.log('📊 Base64 data length:', base64Data.length);
      fileData = decode(base64Data);
      console.log('✅ Converted to ArrayBuffer:', fileData.byteLength, 'bytes');
    }
    // Handle file:// URI
    else if (imageUri.startsWith('file://')) {
      console.log('📁 Reading file from filesystem...');

      if (!FileSystem) {
        throw new Error('File system access not available. Please use a different image source.');
      }

      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        
        if (!fileInfo.exists) {
          throw new Error('Selected file no longer exists. Please select it again.');
        }
        
        console.log('✅ File exists, size:', fileInfo.size, 'bytes');
        
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });

        if (!base64 || base64.length === 0) {
          throw new Error('Failed to read file. Please try selecting it again.');
        }

        console.log('✅ File read successfully, length:', base64.length);
        
        fileData = decode(base64);
        console.log('✅ Converted to ArrayBuffer:', fileData.byteLength, 'bytes');
      } catch (readError) {
        console.error('❌ Error reading file:', readError);
        throw new Error(`Cannot read file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      }

      // Detect content type
      const lowerUri = imageUri.toLowerCase();
      if (lowerUri.endsWith('.png')) contentType = 'image/png';
      else if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (lowerUri.endsWith('.pdf')) contentType = 'application/pdf';
      
      console.log('📝 Content type:', contentType);
    } else {
      throw new Error(`Unsupported file format. Please use an image from your gallery.`);
    }

    // Verify file data size
    if (fileData.byteLength === 0) {
      throw new Error('File is empty. Please select a valid image.');
    }

    if (fileData.byteLength > 50 * 1024 * 1024) {
      throw new Error('File is too large (max 50MB). Please choose a smaller image.');
    }

    // Upload to Supabase
    console.log(`☁️ Uploading to bucket: ${bucketName}/${finalFileName}`);
    console.log(`📊 File size: ${(fileData.byteLength / 1024).toFixed(2)} KB`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(finalFileName, fileData, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${bucketName}" not configured. Please contact support.`);
      }
      if (error.message.includes('not allowed')) {
        throw new Error('You do not have permission to upload files. Please contact support.');
      }
      if (error.message.includes('size')) {
        throw new Error('File is too large. Please choose a smaller image.');
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalFileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get file URL. Please try again.');
    }

    console.log('✅ Upload successful:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error in uploadToSupabaseCore:', error);
    throw error;
  }
}

/**
 * Upload owner documents with enhanced error handling
 */
export async function uploadOwnerDocumentsEnhanced(
  documents: { uri: string; name: string }[],
  userId: string
): Promise<Array<{ id: string; name: string; uri: string; uploadedAt: string }>> {
  try {
    console.log(`📤 Uploading ${documents.length} owner documents with retry logic...`);

    const uploadedDocs: Array<{ id: string; name: string; uri: string; uploadedAt: string }> = [];
    const errors: string[] = [];

    // Upload documents sequentially to avoid overwhelming the connection
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`📄 Uploading document ${i + 1}/${documents.length}: ${doc.name}`);

      try {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).slice(2, 9);
        const sanitizedName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${userId}/${sanitizedName}_${timestamp}_${randomId}.jpg`;

        const publicUrl = await uploadToSupabaseWithRetry(doc.uri, {
          bucketName: 'owner-documents',
          fileName,
          maxRetries: 3,
          retryDelay: 1000,
        });

        uploadedDocs.push({
          id: `doc_${timestamp}_${randomId}`,
          name: doc.name,
          uri: publicUrl,
          uploadedAt: new Date().toISOString(),
        });

        console.log(`✅ Document ${i + 1} uploaded successfully`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to upload document ${i + 1}:`, errorMsg);
        errors.push(`${doc.name}: ${errorMsg}`);
      }
    }

    if (errors.length > 0 && uploadedDocs.length === 0) {
      // All uploads failed
      throw new Error(`Failed to upload documents:\n${errors.join('\n')}`);
    }

    if (errors.length > 0) {
      // Some uploads failed
      console.warn(`⚠️ Some documents failed to upload: ${errors.length}/${documents.length}`);
    }

    console.log(`✅ Successfully uploaded ${uploadedDocs.length}/${documents.length} documents`);
    return uploadedDocs;
    
  } catch (error) {
    console.error('❌ Error uploading owner documents:', error);
    throw error;
  }
}
