/**
 * ⚠️ CLOUD-ONLY DATABASE ⚠️
 * This file now redirects ALL operations to Supabase cloud storage.
 * No local AsyncStorage is used - everything goes to the cloud.
 */

import { supabase } from './supabase-client';
import {
  DbUserRecord,
  TenantProfileRecord,
  OwnerProfileRecord,
  OwnerVerificationRecord,
  OwnerApplicationRecord,
  BrgyNotificationRecord,
  PaymentProfileRecord,
  PaymentAccount,
  UserProfilePhotoRecord,
  PublishedListingRecord,
  ConversationRecord,
  MessageRecord,
  PropertyPhotoRecord,
  PropertyVideoRecord,
  ListingInquiryRecord,
  BookingRecord,
  FavoriteRecord,
  PropertyRatingRecord
} from '../types';

// Flag to completely disable local storage - ALL operations use cloud now
const LOCAL_STORAGE_DISABLED = true;

type CollectionName =
  | 'users'
  | 'tenants'
  | 'owners'
  | 'owner_profiles'
  | 'owner_verifications'
  | 'owner_applications'
  | 'brgy_notifications'
  | 'payment_profiles'
  | 'payment_accounts'
  | 'conversations'
  | 'messages'
  | 'user_profile_photos'
  | 'property_photos'
  | 'property_videos'
  | 'listing_inquiries'
  | 'published_listings'
  | 'bookings'
  | 'favorites'
  | 'property_ratings'
  | 'personal_details'
  | 'user_notification_states'
  | 'listing_drafts'
  | 'rent_payments'
  | 'tenant_complaints'
  | 'maintenance_requests'
  | 'password_reset_tokens'
  | 'properties';

type AnyRecord = DbUserRecord | TenantProfileRecord | OwnerProfileRecord | OwnerVerificationRecord | OwnerApplicationRecord | BrgyNotificationRecord | PaymentProfileRecord | PaymentAccount | UserProfilePhotoRecord | PublishedListingRecord | ListingInquiryRecord | ConversationRecord | MessageRecord | PropertyPhotoRecord | PropertyVideoRecord | BookingRecord | FavoriteRecord | PropertyRatingRecord | RentPaymentRecord | TenantComplaintRecord | MaintenanceRequestRecord | Record<string, any>;

// Type guards for better type safety
export function isPublishedListingRecord(record: AnyRecord): record is PublishedListingRecord {
  // Check for both camelCase (from db.list) and snake_case (from direct Supabase queries)
  const hasPropertyType = 'propertyType' in record || 'property_type' in record;
  const hasRentalType = 'rentalType' in record || 'rental_type' in record;
  const hasMonthlyRent = 'monthlyRent' in record || 'monthly_rent' in record;
  return hasPropertyType && hasRentalType && hasMonthlyRent;
}

export function isConversationRecord(record: AnyRecord): record is ConversationRecord {
  return 'ownerId' in record && 'tenantId' in record && 'participantIds' in record;
}

export function isMessageRecord(record: AnyRecord): record is MessageRecord {
  return 'conversationId' in record && 'senderId' in record && 'text' in record;
}

export function isPropertyPhotoRecord(record: AnyRecord): record is PropertyPhotoRecord {
  return 'listingId' in record && 'photoUri' in record && 'isCoverPhoto' in record;
}

export function isPropertyVideoRecord(record: AnyRecord): record is PropertyVideoRecord {
  return 'listingId' in record && 'videoUri' in record && 'duration' in record;
}

export function isUserProfilePhotoRecord(record: AnyRecord): record is UserProfilePhotoRecord {
  return 'userId' in record && 'photoUri' in record && 'fileName' in record;
}

export function isBookingRecord(record: AnyRecord): record is BookingRecord {
  return 'propertyId' in record && 'tenantId' in record && 'ownerId' in record && 'status' in record;
}

export function isFavoriteRecord(record: AnyRecord): record is FavoriteRecord {
  return 'userId' in record && 'propertyId' in record && 'createdAt' in record;
}

export function isPropertyRatingRecord(record: AnyRecord): record is PropertyRatingRecord {
  return 'propertyId' in record && 'userId' in record && 'rating' in record;
}

export const KEY_PREFIX = 'hb_db_';

// Cache for frequently accessed collections (cloud operations)
const collectionCache = new Map<string, any>();

// Helper function to convert camelCase to snake_case for database
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  const snakeCaseObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeCaseObj[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return snakeCaseObj;
}

// Helper function to convert snake_case to camelCase from database
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const camelCaseObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return camelCaseObj;
}

// Some legacy tables were created with camelCase column names (not recommended in Postgres)
// and therefore should NOT be converted to snake_case on write.
const NO_SNAKE_CASE_TABLES = new Set<CollectionName>([
  'listing_inquiries',
]);

// Map of tables to their primary key column names
const PRIMARY_KEY_MAP: Record<string, string> = {
  'owner_profiles': 'user_id',
  // Add other tables with non-standard primary keys here if needed
};

// Get the primary key column name for a table
function getPrimaryKey(tableName: CollectionName): string {
  return PRIMARY_KEY_MAP[tableName] || 'id';
}

// Cloud-only implementation - all operations use Supabase
export const db = {
  async upsert<T extends AnyRecord>(name: CollectionName, id: string, record: T): Promise<void> {
    try {
      console.log(`☁️ Upserting to cloud: ${name}/${id}`);
      
      const primaryKey = getPrimaryKey(name);
      
      // Use the correct primary key column name
      const recordWithPrimaryKey: any = { ...record, [primaryKey]: id };

      // SAFETY: Some deployments may not have the optional `read_by` column on `messages`.
      // If we send it, Supabase will throw PGRST204 (column not found in schema cache).
      // To keep messaging functional across older schemas, strip it on write.
      if (name === 'messages') {
        delete recordWithPrimaryKey.readBy;
        delete recordWithPrimaryKey.read_by;
      }

      // Convert camelCase to snake_case for most tables.
      // For legacy camelCase tables, write as-is.
      const payload = NO_SNAKE_CASE_TABLES.has(name)
        ? recordWithPrimaryKey
        : toSnakeCase(recordWithPrimaryKey);
      
      const { error } = await supabase
        .from(name)
        .upsert(payload, { onConflict: primaryKey });
      
      if (error) {
        console.error(`❌ Error upserting to ${name}:`, error);
        throw error;
      }
      console.log(`✅ Successfully upserted to ${name}/${id}`);
    } catch (error) {
      console.error(`❌ Failed to upsert to ${name}:`, error);
      throw error;
    }
  },
  
  async get<T extends AnyRecord>(name: CollectionName, id: string): Promise<T | null> {
    try {
      console.log(`☁️ Fetching from cloud: ${name}/${id}`);
      
      const primaryKey = getPrimaryKey(name);
      
      const { data, error } = await supabase
        .from(name)
        .select('*')
        .eq(primaryKey, id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Not found - return null instead of throwing
          console.log(`ℹ️ No record found: ${name}/${id}`);
          return null;
        }
        console.error(`❌ Error fetching from ${name}:`, error);
        throw error;
      }
      console.log(`✅ Successfully fetched from ${name}/${id}`);
      // Convert snake_case from database to camelCase for app
      return toCamelCase(data) as T;
    } catch (error) {
      console.error(`❌ Failed to fetch from ${name}:`, error);
      return null;
    }
  },
  
  async list<T extends AnyRecord>(name: CollectionName): Promise<T[]> {
    try {
      console.log(`☁️ Listing from cloud: ${name}`);
      const { data, error } = await supabase
        .from(name)
        .select('*');
      
      if (error) {
        // Check if it's a network error
        const errorMessage = error.message || '';
        if (errorMessage.includes('Network') || errorMessage.includes('gateway') || errorMessage.includes('connection')) {
          console.warn(`⚠️ Network error listing from ${name}:`, errorMessage);
          console.log('💡 Tip: Check your internet connection or try again later');
        } else {
          console.error(`❌ Error listing from ${name}:`, error);
        }
        // Don't throw - just return empty array to prevent app crashes
        return [];
      }
      
      // Handle null data gracefully
      if (!data) {
        console.log(`ℹ️ No data returned from ${name}`);
        return [];
      }
      
      console.log(`✅ Successfully listed ${data.length} records from ${name}`);
      // Convert snake_case from database to camelCase for app
      return data.map(item => toCamelCase(item)) as T[];
    } catch (error) {
      // Check if it's a network error in the catch block too
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Network') || errorMessage.includes('gateway') || errorMessage.includes('connection')) {
        console.warn(`⚠️ Network error listing from ${name}:`, errorMessage);
        console.log('💡 Tip: Check your internet connection and try refreshing');
      } else {
        console.error(`❌ Failed to list from ${name}:`, error);
      }
      // Always return empty array instead of throwing to prevent app crashes
      return [];
    }
  },
  
  async getAll<T extends AnyRecord>(name: CollectionName): Promise<T[]> {
    return this.list<T>(name);
  },
  
  async remove(name: CollectionName, id: string): Promise<void> {
    try {
      // Safety guard: never allow deleting users in non-dev environments
      const isDev = process.env.NODE_ENV !== 'production' && process.env.EXPO_PUBLIC_ALLOW_DATA_CLEAR === 'true';
      if (name === 'users' && !isDev) {
        console.warn('[db.remove] Blocked attempt to delete from users collection');
        return;
      }
      
      console.log(`☁️ Removing from cloud: ${name}/${id}`);
      const { error } = await supabase
        .from(name)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Error removing from ${name}:`, error);
        throw error;
      }
      console.log(`✅ Successfully removed from ${name}/${id}`);
    } catch (error) {
      console.error(`❌ Failed to remove from ${name}:`, error);
      throw error;
    }
  }
};

export function generateId(prefix: string = 'rec'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Danger: Clears all collections - CLOUD VERSION
export async function clearAllCollections(): Promise<void> {
  console.warn('⚠️ clearAllCollections: Cloud storage clearing is disabled for safety.');
  console.warn('⚠️ To clear data, use Supabase dashboard or SQL commands.');
  // Do nothing - cloud data should be managed through Supabase dashboard
}

// Check if an owner has any existing published listings
export async function hasOwnerListings(ownerId: string): Promise<boolean> {
  try {
    console.log('🔍 Checking if owner has existing listings:', ownerId);
    
    // Check published listings only
    const publishedListings = await db.list<PublishedListingRecord>('published_listings');
    const hasPublishedListings = publishedListings.some(listing => listing.userId === ownerId);
    
    console.log(`📊 Owner listing check results:`, {
      ownerId,
      publishedListings: publishedListings.length,
      hasPublishedListings
    });
    
    return hasPublishedListings;
  } catch (error) {
    console.error('❌ Error checking owner listings:', error);
    return false; // Default to false if there's an error
  }
}

// Remove duplicate published listings - CLOUD VERSION
export async function removeDuplicateListings(): Promise<void> {
  try {
    console.log('☁️ Checking for duplicate listings in cloud...');
    const listings = await db.list<PublishedListingRecord>('published_listings');
    const seen = new Set<string>();
    const duplicates: string[] = [];
    
    listings.forEach(listing => {
      if (seen.has(listing.id)) {
        duplicates.push(listing.id);
      } else {
        seen.add(listing.id);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicate listings`);
      console.log('Duplicate IDs:', duplicates);
      console.log('⚠️ Manual cleanup recommended via Supabase dashboard');
    } else {
      console.log(`✅ No duplicate listings found - all ${listings.length} listings are unique`);
    }
  } catch (error) {
    console.error('❌ Error checking duplicate listings:', error);
  }
}

// Verify listing persistence for a specific user
export async function verifyUserListingsPersistence(userId: string): Promise<{
  success: boolean;
  listingsCount: number;
  listings: PublishedListingRecord[];
  message: string;
}> {
  try {
    console.log(`🔍 Verifying listing persistence for user: ${userId}`);
    
    const allListings = await db.list<PublishedListingRecord>('published_listings');
    const userListings = allListings.filter(listing => listing.userId === userId);
    
    console.log(`📊 Found ${userListings.length} listings for user ${userId}`);
    
    // Log listing details for verification
    userListings.forEach((listing, index) => {
      console.log(`📋 Listing ${index + 1}:`, {
        id: listing.id,
        propertyType: listing.propertyType,
        address: listing.address?.substring(0, 50) + '...',
        monthlyRent: listing.monthlyRent,
        publishedAt: listing.publishedAt,
        hasPhotos: !!(listing.photos && listing.photos.length > 0),
        photosCount: listing.photos?.length || 0
      });
    });
    
    return {
      success: true,
      listingsCount: userListings.length,
      listings: userListings,
      message: `Successfully verified ${userListings.length} listings for user ${userId}`
    };
  } catch (error) {
    console.error('❌ Error verifying user listings persistence:', error);
    return {
      success: false,
      listingsCount: 0,
      listings: [],
      message: `Failed to verify listings: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Get all records from a collection - CLOUD VERSION
export async function getAll<T extends AnyRecord>(name: CollectionName): Promise<T[]> {
  return db.list<T>(name);
}

// Clear cache function
export async function clearCache(): Promise<void> {
  collectionCache.clear();
  console.log('🗑️ Database cache cleared');
}

// Get all published listings with proper typing - CLOUD VERSION
export async function getAllPublishedListings(): Promise<PublishedListingRecord[]> {
  try {
    console.log('☁️ Fetching all published listings from cloud...');
    const rawListings = await db.list<PublishedListingRecord>('published_listings');
    const validListings = rawListings.filter(isPublishedListingRecord);
    console.log(`✅ Fetched ${validListings.length} published listings from cloud`);
    return validListings;
  } catch (error) {
    console.error('❌ Error fetching published listings:', error);
    return [];
  }
}

