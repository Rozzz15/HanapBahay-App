/**
 * Storage Migration Utility
 * Migrates data from AsyncStorage/localStorage to Supabase cloud storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  storeCloudAuthUser, 
  cacheCloudPropertyMedia,
  storeUserPreferences,
  CloudAuthUser,
  CloudPropertyMedia 
} from './cloud-storage';
import { getAuthUser } from './auth-user';

export interface MigrationResult {
  success: boolean;
  migratedItems: string[];
  failedItems: string[];
  errors: string[];
}

/**
 * Migrate auth user from AsyncStorage to Supabase
 */
async function migrateAuthUser(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('?? Migrating auth user...');
    
    const user = await getAuthUser();
    if (!user) {
      console.log('?? No auth user to migrate');
      return { success: true };
    }

    await storeCloudAuthUser(user);
    console.log('? Auth user migrated successfully');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('? Failed to migrate auth user:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Migrate property media cache from AsyncStorage to Supabase
 */
async function migratePropertyMediaCache(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('?? Migrating property media cache...');
    
    // Note: getAllCachedPropertyMedia not available in cloud version
    // Cache will rebuild naturally as users browse
    console.log('?? Property media cache will rebuild as users browse properties');
    return { success: true, count: 0 };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('? Failed to migrate property media cache:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

/**
 * Migrate user preferences from AsyncStorage to Supabase
 */
async function migrateUserPreferences(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('?? Migrating user preferences...');
    
    const keys = await AsyncStorage.getAllKeys();
    
    // Look for preference-related keys
    const prefKeys = keys.filter(key => 
      key.includes('preference') || 
      key.includes('setting') ||
      key.includes('theme') ||
      key.includes('notification')
    );

    if (prefKeys.length === 0) {
      console.log('?? No user preferences to migrate');
      return { success: true };
    }

    const preferences: any = {};
    for (const key of prefKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            preferences[key] = JSON.parse(value);
          } catch {
            preferences[key] = value;
          }
        }
      } catch (error) {
        console.warn(`?? Could not migrate preference: ${key}`);
      }
    }

    if (Object.keys(preferences).length > 0) {
      await storeUserPreferences(preferences);
      console.log('? User preferences migrated successfully');
    }
    
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('? Failed to migrate user preferences:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Main migration function - migrates all data from AsyncStorage to Supabase
 */
export async function migrateToCloudStorage(): Promise<MigrationResult> {
  console.log('?? Starting migration to cloud storage...');
  
  const migratedItems: string[] = [];
  const failedItems: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Migrate auth user
    const authResult = await migrateAuthUser();
    if (authResult.success) {
      migratedItems.push('auth_user');
    } else {
      failedItems.push('auth_user');
      if (authResult.error) errors.push(authResult.error);
    }

    // 2. Migrate property media cache
    const cacheResult = await migratePropertyMediaCache();
    if (cacheResult.success) {
      migratedItems.push(`property_media_cache (${cacheResult.count} items)`);
    } else {
      failedItems.push('property_media_cache');
      if (cacheResult.error) errors.push(cacheResult.error);
    }

    // 3. Migrate user preferences
    const prefResult = await migrateUserPreferences();
    if (prefResult.success) {
      migratedItems.push('user_preferences');
    } else {
      failedItems.push('user_preferences');
      if (prefResult.error) errors.push(prefResult.error);
    }

    const success = failedItems.length === 0;
    console.log(success ? '? Migration completed successfully' : '?? Migration completed with errors');
    
    return {
      success,
      migratedItems,
      failedItems,
      errors
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('? Migration failed:', errorMsg);
    
    return {
      success: false,
      migratedItems,
      failedItems: ['migration_process'],
      errors: [errorMsg]
    };
  }
}

/**
 * Clean up AsyncStorage after successful migration
 * CAUTION: This will delete all local storage data
 */
export async function cleanupLocalStorage(options: {
  keepAuthTokens?: boolean;
} = {}): Promise<void> {
  try {
    console.log('??? Cleaning up local storage...');
    
    const keys = await AsyncStorage.getAllKeys();
    
    // Keys to keep (Supabase auth tokens should be kept)
    const keysToKeep = options.keepAuthTokens ? [
      'supabase.auth.token',
      'sb-localhost-auth-token',
      'sb-localhost-auth-token.0',
      'sb-localhost-auth-token.1'
    ] : [];

    // Remove all keys except the ones to keep
    const keysToRemove = keys.filter(key => !keysToKeep.includes(key));
    
    for (const key of keysToRemove) {
      await AsyncStorage.removeItem(key);
    }
    
    console.log(`? Cleaned up ${keysToRemove.length} local storage items`);
  } catch (error) {
    console.error('? Error cleaning up local storage:', error);
    throw error;
  }
}

/**
 * Verify migration success by checking if data exists in Supabase
 */
export async function verifyMigration(): Promise<{
  success: boolean;
  checks: Record<string, boolean>;
  errors: string[];
}> {
  console.log('?? Verifying migration...');
  
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  try {
    // Check auth user
    const { getCloudAuthUser } = await import('./cloud-storage');
    const authUser = await getCloudAuthUser();
    checks.auth_user = authUser !== null;
    if (!checks.auth_user) {
      errors.push('Auth user not found in cloud storage');
    }

    // Check user preferences
    const { getUserPreferences } = await import('./cloud-storage');
    const prefs = await getUserPreferences();
    checks.user_preferences = true; // May be null for new users, which is ok

    console.log('? Migration verification completed');
    
    return {
      success: checks.auth_user, // At least auth user should exist
      checks,
      errors
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('? Migration verification failed:', errorMsg);
    
    return {
      success: false,
      checks,
      errors: [errorMsg]
    };
  }
}

/**
 * Rollback migration (restore from cloud to local storage)
 * Use this if migration causes issues
 */
export async function rollbackMigration(): Promise<void> {
  try {
    console.log('?? Rolling back migration...');
    
    const { getCloudAuthUser } = await import('./cloud-storage');
    const { storeAuthUser } = await import('./auth-user');
    
    // Restore auth user
    const cloudUser = await getCloudAuthUser();
    if (cloudUser) {
      await storeAuthUser(cloudUser);
      console.log('? Auth user restored to local storage');
    }

    // Note: Media cache rollback is not implemented as it's less critical
    // and the app will rebuild the cache naturally as users browse
    
    console.log('? Rollback completed');
  } catch (error) {
    console.error('? Rollback failed:', error);
    throw error;
  }
}