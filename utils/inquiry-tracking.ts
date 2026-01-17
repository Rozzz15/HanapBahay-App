import { db, generateId } from './db';
import { supabase } from './supabase-client';

/**
 * Track an inquiry for a specific listing
 * This function should be called when a tenant sends a message or inquiry
 */
export async function trackListingInquiry(
  listingId: string, 
  tenantId: string,
  inquiryType: 'message' | 'booking_request' | 'contact' = 'message',
  metadata?: {
    source?: string; // 'property_preview', 'tenant_dashboard', etc.
    timestamp?: string;
    message?: string;
  }
): Promise<{
  success: boolean;
  newInquiryCount: number;
  message: string;
}> {
  try {
    console.log(`📨 Tracking inquiry for listing: ${listingId}`, {
      tenantId,
      inquiryType,
      metadata
    });
    
    // Get the current listing
    const listing = await db.get('published_listings', listingId);
    
    if (!listing) {
      console.log(`❌ Listing not found: ${listingId}`);
      return {
        success: false,
        newInquiryCount: 0,
        message: 'Listing not found'
      };
    }
    
    // Increment the inquiry count
    const currentInquiries = listing.inquiries || 0;
    const newInquiryCount = currentInquiries + 1;
    
    // Update the listing with the new inquiry count
    const updatedListing = {
      ...listing,
      inquiries: newInquiryCount,
      updatedAt: new Date().toISOString()
    };
    
    await db.upsert('published_listings', listingId, updatedListing);
    
    // Store detailed inquiry record
    const inquiryRecord = {
      id: generateId('inquiry'),
      listingId,
      tenantId,
      inquiryType,
      source: metadata?.source || 'unknown',
      message: metadata?.message || '',
      // Use a single timestamp field; do not send createdAt/created_at because
      // some deployments have different column naming or rely on DB defaults.
      timestamp: metadata?.timestamp || new Date().toISOString(),
    };
    
    // listing_inquiries was created with camelCase identifiers in SQL without quotes,
    // so Postgres stores them as lowercase (listingid, tenantid, createdat, inquirytype, ...).
    // Use exact lowercase column names to avoid PostgREST schema cache errors.
    const { error: inquiryError } = await supabase
      .from('listing_inquiries')
      .upsert(
        {
          id: inquiryRecord.id,
          listingid: inquiryRecord.listingId,
          tenantid: inquiryRecord.tenantId,
          inquirytype: inquiryRecord.inquiryType,
          source: inquiryRecord.source,
          message: inquiryRecord.message,
          timestamp: inquiryRecord.timestamp,
          createdat: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (inquiryError) {
      console.error('Failed to upsert to listing_inquiries:', inquiryError);
      throw inquiryError;
    }
    
    console.log(`✅ Inquiry tracked for listing ${listingId}: ${currentInquiries} → ${newInquiryCount}`);
    
    return {
      success: true,
      newInquiryCount,
      message: `Inquiry tracked: ${currentInquiries} → ${newInquiryCount}`
    };
    
  } catch (error) {
    console.error(`❌ Error tracking inquiry for listing ${listingId}:`, error);
    return {
      success: false,
      newInquiryCount: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get the current inquiry count for a specific listing
 */
export async function getListingInquiries(listingId: string): Promise<number> {
  try {
    const listing = await db.get('published_listings', listingId);
    return listing?.inquiries || 0;
  } catch (error) {
    console.error(`❌ Error getting inquiries for listing ${listingId}:`, error);
    return 0;
  }
}

/**
 * Get all inquiries for a specific listing
 */
export async function getListingInquiryHistory(listingId: string): Promise<any[]> {
  try {
    const allInquiries = await db.list('listing_inquiries');
    const listingInquiries = allInquiries.filter((inquiry: any) => (inquiry.listingId ?? inquiry.listingid) === listingId);
    
    // Sort by creation date (newest first)
    return listingInquiries.sort((a, b) => {
      const bTime = new Date((b as any).timestamp ?? (b as any).createdAt ?? (b as any).created_at ?? 0).getTime();
      const aTime = new Date((a as any).timestamp ?? (a as any).createdAt ?? (a as any).created_at ?? 0).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error(`❌ Error getting inquiry history for listing ${listingId}:`, error);
    return [];
  }
}
