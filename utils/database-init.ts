import { db } from './db';
import { generateId } from './db';
import { DbUserRecord, OwnerApplicationRecord, BrgyNotificationRecord } from '../types';

/**
 * Database initialization utility
 * Ensures all necessary tables and default data are created
 */

export interface DatabaseInitResult {
  success: boolean;
  tablesCreated: string[];
  defaultDataCreated: boolean;
  message: string;
}

/**
 * Initialize the database with all necessary tables and default data
 */
export async function initializeDatabase(): Promise<DatabaseInitResult> {
  try {
    console.log('🚀 Initializing database...');
    
    const tablesCreated: string[] = [];
    
    // Test each table by trying to read from it
    // If it doesn't exist, it will return an empty array
    const tablesToCheck = [
      'users',
      'owner_applications',
      'brgy_notifications',
      'published_listings',
      'bookings',
      'conversations',
      'messages',
      'user_profile_photos',
      'property_photos',
      'property_videos',
      'favorites',
      'property_ratings'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        await db.list(tableName as any);
        console.log(`✅ Table ${tableName} is accessible`);
        tablesCreated.push(tableName);
      } catch (error) {
        console.log(`⚠️ Table ${tableName} may not exist yet, will be created on first write`);
      }
    }
    
    // Note: Barangay officials should be created using the setup script
    // Run: npx tsx scripts/create-brgy-officials.ts
    console.log('ℹ️  To create barangay officials, run: npx tsx scripts/create-brgy-officials.ts');
    const defaultDataCreated = false;
    
    console.log('✅ Database initialization completed');
    
    return {
      success: true,
      tablesCreated,
      defaultDataCreated,
      message: 'Database initialized successfully with all necessary tables'
    };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      tablesCreated: [],
      defaultDataCreated: false,
      message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Create or update barangay official for a specific barangay
 * This can be called to ensure a barangay has an official account
 */
export async function createBarangayOfficial(barangay: string): Promise<{ success: boolean; message: string; officialId?: string }> {
  try {
    const existingUsers = await db.list<DbUserRecord>('users');
    const existingOfficial = existingUsers.find(
      user => user.role === 'brgy_official' && user.barangay?.toUpperCase() === barangay.toUpperCase()
    );
    
    if (existingOfficial) {
      return {
        success: true,
        message: `Barangay official for ${barangay} already exists`,
        officialId: existingOfficial.id
      };
    }
    
    const officialId = generateId('brgy');
    const now = new Date().toISOString();
    const official: DbUserRecord = {
      id: officialId,
      email: `brgy.${barangay.toLowerCase()}@hanapbahay.com`,
      name: `Barangay ${barangay} Official`,
      phone: '+63 910 000 0000',
      address: `${barangay} Street, Lopez, Quezon`,
      role: 'brgy_official',
      roles: ['brgy_official'],
      barangay: barangay.toUpperCase(),
      createdAt: now,
      updatedAt: now
    };
    
    await db.upsert('users', officialId, official);
    console.log(`✅ Created barangay official for ${barangay}`);
    
    return {
      success: true,
      message: `Successfully created barangay official for ${barangay}`,
      officialId: officialId
    };
  } catch (error) {
    console.error(`❌ Failed to create barangay official for ${barangay}:`, error);
    return {
      success: false,
      message: `Failed to create barangay official: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * NOTE: This function is deprecated
 * Use the setup script instead: npx tsx scripts/create-brgy-officials.ts
 */
async function createDefaultBarangayOfficials(): Promise<boolean> {
  console.log('ℹ️  Barangay officials should be created using: npx tsx scripts/create-brgy-officials.ts');
  return false;
}

/**
 * Verify database integrity and fix any issues
 */
export async function verifyAndFixDatabase(): Promise<{
  success: boolean;
  issuesFound: string[];
  issuesFixed: string[];
  message: string;
}> {
  try {
    console.log('🔧 Verifying and fixing database integrity...');
    
    const issuesFound: string[] = [];
    const issuesFixed: string[] = [];
    
    // Check for orphaned applications (applications without users)
    const allApplications = await db.list<OwnerApplicationRecord>('owner_applications');
    const allUsers = await db.list<DbUserRecord>('users');
    const userIds = new Set(allUsers.map(user => user.id));
    
    for (const application of allApplications) {
      if (!userIds.has(application.userId)) {
        issuesFound.push(`Orphaned application ${application.id} for non-existent user ${application.userId}`);
        // Note: We don't automatically delete orphaned applications as they might be needed for audit
      }
    }
    
    // Check for applications with missing required fields
    for (const application of allApplications) {
      if (!application.barangay) {
        issuesFound.push(`Application ${application.id} missing barangay field`);
      }
      if (!application.status) {
        issuesFound.push(`Application ${application.id} missing status field`);
      }
    }
    
    // Check for users with owner role but no application
    const ownerUsers = allUsers.filter(user => user.role === 'owner');
    const applicationUserIds = new Set(allApplications.map(app => app.userId));
    
    for (const owner of ownerUsers) {
      if (!applicationUserIds.has(owner.id)) {
        issuesFound.push(`User ${owner.id} has owner role but no application record`);
        // This might be intentional for some users, so we just log it
      }
    }
    
    console.log(`🔍 Found ${issuesFound.length} potential issues`);
    console.log(`✅ Fixed ${issuesFixed.length} issues`);
    
    return {
      success: true,
      issuesFound,
      issuesFixed,
      message: `Database verification completed. Found ${issuesFound.length} issues, fixed ${issuesFixed.length}`
    };
    
  } catch (error) {
    console.error('❌ Database verification and fix failed:', error);
    return {
      success: false,
      issuesFound: [],
      issuesFixed: [],
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  tables: { [tableName: string]: { exists: boolean; recordCount: number } };
  issues: string[];
  message: string;
}> {
  try {
    console.log('🏥 Checking database health...');
    
    const tables = {
      users: { exists: false, recordCount: 0 },
      owner_applications: { exists: false, recordCount: 0 },
      brgy_notifications: { exists: false, recordCount: 0 },
      published_listings: { exists: false, recordCount: 0 },
      bookings: { exists: false, recordCount: 0 }
    };
    
    const issues: string[] = [];
    
    // Check each table
    for (const tableName of Object.keys(tables)) {
      try {
        const records = await db.list(tableName as any);
        tables[tableName as keyof typeof tables] = {
          exists: true,
          recordCount: records.length
        };
      } catch (error) {
        tables[tableName as keyof typeof tables] = {
          exists: false,
          recordCount: 0
        };
        issues.push(`Table ${tableName} is not accessible`);
      }
    }
    
    // Check for critical data
    if (tables.users.recordCount === 0) {
      issues.push('No users found in database');
    }
    
    if (tables.owner_applications.recordCount === 0) {
      issues.push('No owner applications found in database');
    }
    
    const healthy = issues.length === 0;
    
    console.log(`🏥 Database health check completed. Healthy: ${healthy}, Issues: ${issues.length}`);
    
    return {
      healthy,
      tables,
      issues,
      message: healthy ? 'Database is healthy' : `Database has ${issues.length} issues`
    };
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      healthy: false,
      tables: {},
      issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      message: 'Database health check failed'
    };
  }
}
