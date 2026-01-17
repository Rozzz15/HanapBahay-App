/**
 * Railway PostgreSQL Database Client
 * Replaces AsyncStorage with Railway cloud database
 */

import { Pool } from 'pg';
import {
    DbUserRecord,
    PublishedListingRecord,
    ConversationRecord,
    MessageRecord,
    BookingRecord,
    FavoriteRecord,
    PropertyRatingRecord,
    OwnerApplicationRecord,
    TenantComplaintRecord,
} from '../types';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set - database features will not work');
}

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL?.includes('railway.app') ? { rejectUnauthorized: false } : undefined,
});

type CollectionName =
    | 'users'
    | 'published_listings'
    | 'conversations'
    | 'messages'
    | 'bookings'
    | 'favorites'
    | 'property_ratings'
    | 'owner_applications'
    | 'tenant_complaints';

type AnyRecord = DbUserRecord | PublishedListingRecord | ConversationRecord | MessageRecord | BookingRecord | FavoriteRecord | PropertyRatingRecord | OwnerApplicationRecord | TenantComplaintRecord;

/**
 * Railway PostgreSQL database client
 * Same API as local db for easy migration
 */
export const railwayDb = {
    /**
     * Insert or update a record
     */
    async upsert<T extends AnyRecord>(
        tableName: CollectionName,
        id: string,
        record: T
    ): Promise<void> {
        try {
            console.log(`🚂 Railway DB: Upserting to ${tableName}:`, id);

            // Convert record to columns and values
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = values.map((_, i) => `$${i + 1}`);

            // Build upsert query (INSERT ... ON CONFLICT UPDATE)
            const updateSet = columns
                .filter(col => col !== 'id')
                .map(col => `${col} = EXCLUDED.${col}`)
                .join(', ');

            const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (id) DO UPDATE SET ${updateSet}
      `;

            await pool.query(query, values);
            console.log(`✅ Railway DB: Successfully upserted to ${tableName}`);
        } catch (error) {
            console.error(`❌ Railway DB: Error upserting to ${tableName}:`, error);
            throw error;
        }
    },

    /**
     * Get a single record by ID
     */
    async get<T extends AnyRecord>(
        tableName: CollectionName,
        id: string
    ): Promise<T | null> {
        try {
            console.log(`🚂 Railway DB: Getting from ${tableName}:`, id);

            const query = `SELECT * FROM ${tableName} WHERE id = $1`;
            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                console.log(`📭 Railway DB: No record found in ${tableName} with id:`, id);
                return null;
            }

            console.log(`✅ Railway DB: Successfully got from ${tableName}`);
            return result.rows[0] as T;
        } catch (error) {
            console.error(`❌ Railway DB: Error getting from ${tableName}:`, error);
            return null;
        }
    },

    /**
     * Get all records from a table
     */
    async list<T extends AnyRecord>(tableName: CollectionName): Promise<T[]> {
        try {
            console.log(`🚂 Railway DB: Listing all from ${tableName}`);

            const query = `SELECT * FROM ${tableName} ORDER BY created_at DESC`;
            const result = await pool.query(query);

            console.log(`✅ Railway DB: Successfully listed ${result.rows.length} records from ${tableName}`);
            return result.rows as T[];
        } catch (error) {
            console.error(`❌ Railway DB: Error listing from ${tableName}:`, error);
            return [];
        }
    },

    /**
     * Delete a record
     */
    async remove(tableName: CollectionName, id: string): Promise<void> {
        try {
            console.log(`🚂 Railway DB: Removing from ${tableName}:`, id);

            const query = `DELETE FROM ${tableName} WHERE id = $1`;
            await pool.query(query, [id]);

            console.log(`✅ Railway DB: Successfully removed from ${tableName}`);
        } catch (error) {
            console.error(`❌ Railway DB: Error removing from ${tableName}:`, error);
            throw error;
        }
    },
};

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'rec'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Helper: Check if owner has published listings
 */
export async function hasOwnerListings(ownerId: string): Promise<boolean> {
    try {
        const query = 'SELECT id FROM published_listings WHERE user_id = $1 LIMIT 1';
        const result = await pool.query(query, [ownerId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking owner listings:', error);
        return false;
    }
}

/**
 * Helper: Get all published listings
 */
export async function getAllPublishedListings(): Promise<PublishedListingRecord[]> {
    try {
        const query = `
      SELECT * FROM published_listings 
      WHERE availability_status = 'Available' 
      ORDER BY published_at DESC
    `;
        const result = await pool.query(query);
        return result.rows as PublishedListingRecord[];
    } catch (error) {
        console.error('Error getting published listings:', error);
        return [];
    }
}

/**
 * Helper: Get user by email
 */
export async function getUserByEmail(email: string): Promise<DbUserRecord | null> {
    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as DbUserRecord;
    } catch (error) {
        console.error('Error getting user by email:', error);
        return null;
    }
}

/**
 * Helper: Get conversations for a user
 */
export async function getConversationsForUser(userId: string): Promise<ConversationRecord[]> {
    try {
        const query = `
      SELECT * FROM conversations 
      WHERE owner_id = $1 OR tenant_id = $1 
      ORDER BY last_message_at DESC NULLS LAST, created_at DESC
    `;
        const result = await pool.query(query, [userId]);
        return result.rows as ConversationRecord[];
    } catch (error) {
        console.error('Error getting conversations:', error);
        return [];
    }
}

/**
 * Helper: Get messages for a conversation
 */
export async function getMessagesForConversation(conversationId: string): Promise<MessageRecord[]> {
    try {
        const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC
    `;
        const result = await pool.query(query, [conversationId]);
        return result.rows as MessageRecord[];
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

/**
 * Helper: Get bookings for a tenant
 */
export async function getBookingsForTenant(tenantId: string): Promise<BookingRecord[]> {
    try {
        const query = `
      SELECT * FROM bookings 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query, [tenantId]);
        return result.rows as BookingRecord[];
    } catch (error) {
        console.error('Error getting tenant bookings:', error);
        return [];
    }
}

/**
 * Helper: Get bookings for an owner
 */
export async function getBookingsForOwner(ownerId: string): Promise<BookingRecord[]> {
    try {
        const query = `
      SELECT * FROM bookings 
      WHERE owner_id = $1 
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query, [ownerId]);
        return result.rows as BookingRecord[];
    } catch (error) {
        console.error('Error getting owner bookings:', error);
        return [];
    }
}

// Export as default for backward compatibility
export default railwayDb;
