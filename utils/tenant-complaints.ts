import { db, generateId } from './db';
import { TenantComplaintRecord, PublishedListingRecord, BookingRecord, DbUserRecord, Property } from '../types';

/**
 * Create a new tenant complaint
 */
export async function createTenantComplaint(data: {
  tenantId: string;
  propertyId: string;
  bookingId?: string;
  category: TenantComplaintRecord['category'];
  description: string;
  photos?: string[];
  videos?: string[];
  isAnonymous: boolean;
  urgency?: TenantComplaintRecord['urgency'];
}): Promise<TenantComplaintRecord> {
  try {
    const complaintId = generateId('complaint');
    
    console.log('📝 Creating complaint with media:', {
      photos: data.photos?.length || 0,
      videos: data.videos?.length || 0
    });
    
    // Upload photos to permanent storage
    const permanentPhotos: string[] = [];
    if (data.photos && data.photos.length > 0) {
      for (let i = 0; i < data.photos.length; i++) {
        const photoUri = data.photos[i];
        try {
          console.log(`📸 Uploading complaint photo ${i + 1}/${data.photos.length}...`);
          const { uploadToSupabase } = await import('./supabase-storage');
          const fileName = `complaint_${complaintId}_photo_${i + 1}_${Date.now()}.jpg`;
          const permanentUrl = await uploadToSupabase(photoUri, 'complaint-media', fileName);
          permanentPhotos.push(permanentUrl);
          console.log(`✅ Photo ${i + 1} uploaded successfully`);
        } catch (error) {
          console.error(`❌ Failed to upload photo ${i + 1}:`, error);
          // Keep the original URI if upload fails
          permanentPhotos.push(photoUri);
        }
      }
    }
    
    // Upload videos to permanent storage
    const permanentVideos: string[] = [];
    if (data.videos && data.videos.length > 0) {
      for (let i = 0; i < data.videos.length; i++) {
        const videoUri = data.videos[i];
        try {
          console.log(`🎥 Uploading complaint video ${i + 1}/${data.videos.length}...`);
          const { uploadToSupabase } = await import('./supabase-storage');
          const fileName = `complaint_${complaintId}_video_${i + 1}_${Date.now()}.mp4`;
          const permanentUrl = await uploadToSupabase(videoUri, 'complaint-media', fileName);
          permanentVideos.push(permanentUrl);
          console.log(`✅ Video ${i + 1} uploaded successfully`);
        } catch (error) {
          console.error(`❌ Failed to upload video ${i + 1}:`, error);
          // Keep the original URI if upload fails
          permanentVideos.push(videoUri);
        }
      }
    }
    
    const complaint: TenantComplaintRecord = {
      id: complaintId,
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      bookingId: data.bookingId,
      category: data.category,
      description: data.description,
      photos: permanentPhotos,
      videos: permanentVideos,
      isAnonymous: data.isAnonymous,
      status: 'submitted',
      urgency: data.urgency || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Created tenant complaint with permanent media URLs:', complaint.id);
    await db.upsert('tenant_complaints', complaint.id, complaint);
    
    return complaint;
  } catch (error) {
    console.error('❌ Error creating tenant complaint:', error);
    throw error;
  }
}

/**
 * Get all complaints for a tenant
 */
export async function getComplaintsByTenant(tenantId: string): Promise<TenantComplaintRecord[]> {
  try {
    console.log('🔍 getComplaintsByTenant called for:', tenantId.slice(0, 8));
    
    const allComplaints = await db.list<TenantComplaintRecord>('tenant_complaints');
    console.log('📊 Total complaints in database:', allComplaints.length);
    
    const tenantComplaints = allComplaints.filter(complaint => complaint.tenantId === tenantId);
    console.log('📋 Tenant complaints found:', tenantComplaints.length);
    
    // Check for duplicate IDs
    const ids = tenantComplaints.map(c => c.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.error('❌ DUPLICATE COMPLAINT IDs IN DATABASE!');
      console.error('Total complaints:', ids.length, 'Unique IDs:', uniqueIds.size);
      console.error('All IDs:', ids.map(id => id.slice(0, 12)));
    }
    
    const sorted = tenantComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log('✅ Returning sorted complaints:', sorted.length);
    
    return sorted;
  } catch (error) {
    console.error('❌ Error getting tenant complaints:', error);
    return [];
  }
}

/**
 * Get all complaints for a barangay (filtered by property barangay)
 */
export async function getComplaintsByBarangay(barangayName: string): Promise<TenantComplaintRecord[]> {
  try {
    console.log('🔍 getComplaintsByBarangay called with:', barangayName);
    
    const allComplaints = await db.list<TenantComplaintRecord>('tenant_complaints');
    const publishedProperties = await db.list<PublishedListingRecord>('published_listings');
    const allProperties = await db.list<Property>('properties'); // Check both tables
    const allUsers = await db.list<DbUserRecord>('users');
    
    console.log('📊 Database counts:', {
      complaints: allComplaints.length,
      publishedProperties: publishedProperties.length,
      allProperties: allProperties.length,
      users: allUsers.length
    });
    
    // Filter complaints by property's barangay
    const complaintsInBarangay = allComplaints.filter(complaint => {
      // Try to find property in published_listings first, then fall back to properties table
      let property = publishedProperties.find(p => p.id === complaint.propertyId);
      if (!property) {
        property = allProperties.find(p => p.id === complaint.propertyId) as any;
      }
      
      if (!property) {
        console.log(`⚠️ Property not found in any table for complaint ${complaint.id.slice(0, 8)}`);
        return false;
      }
      
      // Check property's barangay field
      if (property.barangay) {
        const match = property.barangay.trim().toUpperCase() === barangayName.trim().toUpperCase();
        console.log(`🏠 Property ${property.id.slice(0, 8)}: barangay="${property.barangay}" vs target="${barangayName}" => ${match ? '✅' : '❌'}`);
        return match;
      }
      
      // Fallback: check via property user/owner
      const ownerId = (property as any).userId || (property as any).ownerId;
      const propertyUser = allUsers.find(u => u.id === ownerId);
      const userBarangay = propertyUser?.barangay;
      if (userBarangay) {
        const match = userBarangay.trim().toUpperCase() === barangayName.trim().toUpperCase();
        console.log(`👤 Property ${property.id.slice(0, 8)} owner barangay="${userBarangay}" vs target="${barangayName}" => ${match ? '✅' : '❌'}`);
        return match;
      }
      
      console.log(`⚠️ No barangay found for property ${property.id.slice(0, 8)}`);
      return false;
    });
    
    console.log(`✅ Found ${complaintsInBarangay.length} complaints for barangay "${barangayName}"`);
    return complaintsInBarangay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('❌ Error getting barangay complaints:', error);
    return [];
  }
}

/**
 * Get complaint by ID
 */
export async function getComplaintById(complaintId: string): Promise<TenantComplaintRecord | null> {
  try {
    return await db.get<TenantComplaintRecord>('tenant_complaints', complaintId);
  } catch (error) {
    console.error('❌ Error getting complaint:', error);
    return null;
  }
}

/**
 * Update complaint status (for barangay officials)
 */
export async function updateComplaintStatus(
  complaintId: string,
  status: TenantComplaintRecord['status'],
  barangayNotes?: string
): Promise<boolean> {
  try {
    const complaint = await db.get<TenantComplaintRecord>('tenant_complaints', complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const updated: TenantComplaintRecord = {
      ...complaint,
      status,
      barangayNotes: barangayNotes !== undefined ? barangayNotes : complaint.barangayNotes,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : complaint.resolvedAt,
      closedAt: status === 'closed' ? new Date().toISOString() : complaint.closedAt,
      updatedAt: new Date().toISOString(),
    };

    // Auto-update status to 'received_by_brgy' if it's still 'submitted'
    if (status !== 'submitted' && complaint.status === 'submitted') {
      updated.status = 'received_by_brgy';
    }

    await db.upsert('tenant_complaints', complaintId, updated);
    console.log('✅ Updated complaint:', complaintId, 'to status:', updated.status);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    throw error;
  }
}

/**
 * Add settlement documents to a complaint (for barangay officials)
 */
export async function addSettlementDocuments(
  complaintId: string,
  documentUris: string[]
): Promise<boolean> {
  try {
    const complaint = await db.get<TenantComplaintRecord>('tenant_complaints', complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const updated: TenantComplaintRecord = {
      ...complaint,
      settlementDocuments: [...(complaint.settlementDocuments || []), ...documentUris],
      updatedAt: new Date().toISOString(),
    };

    await db.upsert('tenant_complaints', complaintId, updated);
    console.log('✅ Added settlement documents to complaint:', complaintId);
    
    return true;
  } catch (error) {
    console.error('❌ Error adding settlement documents:', error);
    throw error;
  }
}

/**
 * Get new complaints count for barangay (status = 'submitted')
 */
export async function getNewComplaintsCount(barangayName: string): Promise<number> {
  try {
    const complaints = await getComplaintsByBarangay(barangayName);
    return complaints.filter(c => c.status === 'submitted').length;
  } catch (error) {
    console.error('❌ Error getting new complaints count:', error);
    return 0;
  }
}

/**
 * Mark complaint as read by barangay official
 */
export async function markComplaintAsRead(
  complaintId: string,
  userId: string
): Promise<boolean> {
  try {
    const complaint = await db.get<TenantComplaintRecord>('tenant_complaints', complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Only mark as read if it's currently unread
    if (!complaint.isRead) {
      // Create update object without read fields first (in case columns don't exist yet)
      const baseUpdate = {
        ...complaint,
        updatedAt: new Date().toISOString(),
      };
      
      // Try to add read fields (will be stripped if columns don't exist)
      const updated: TenantComplaintRecord = {
        ...baseUpdate,
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: userId,
      };

      await db.upsert('tenant_complaints', complaintId, updated);
      console.log('✅ Marked complaint as read:', complaintId);
      return true;
    }
    
    return false; // Already read
  } catch (error: any) {
    // If error is due to missing columns, just log and continue
    if (error?.code === 'PGRST204') {
      console.warn('⚠️ Read status columns not yet added to database. Please run add-complaint-read-status.sql migration.');
      return false;
    }
    console.error('❌ Error marking complaint as read:', error);
    return false;
  }
}

/**
 * Get unread complaints count for barangay
 */
export async function getUnreadComplaintsCount(barangayName: string): Promise<number> {
  try {
    const complaints = await getComplaintsByBarangay(barangayName);
    // Filter for unread complaints (if is_read field exists, use it; otherwise count submitted)
    return complaints.filter(c => {
      // If is_read field exists, use it
      if (c.hasOwnProperty('isRead')) {
        return !c.isRead && c.status === 'submitted';
      }
      // Fallback: if is_read doesn't exist yet, just count all submitted
      return c.status === 'submitted';
    }).length;
  } catch (error: any) {
    // If error is due to missing columns, return 0 gracefully
    if (error?.code === 'PGRST204') {
      console.warn('⚠️ Read status columns not yet added. Returning 0 unread count.');
      return 0;
    }
    console.error('❌ Error getting unread complaints count:', error);
    return 0;
  }
}

/**
 * Get complaint with full details (including tenant and property info)
 */
export async function getComplaintWithDetails(complaintId: string): Promise<{
  complaint: TenantComplaintRecord;
  tenant?: DbUserRecord;
  property?: PublishedListingRecord;
  booking?: BookingRecord;
} | null> {
  try {
    const complaint = await getComplaintById(complaintId);
    if (!complaint) return null;

    const tenant = await db.get<DbUserRecord>('users', complaint.tenantId);
    const property = await db.get<PublishedListingRecord>('published_listings', complaint.propertyId);
    const booking = complaint.bookingId 
      ? await db.get<BookingRecord>('bookings', complaint.bookingId)
      : undefined;

    return {
      complaint,
      tenant: tenant || undefined,
      property: property || undefined,
      booking: booking || undefined,
    };
  } catch (error) {
    console.error('❌ Error getting complaint details:', error);
    return null;
  }
}

/**
 * Get complaint category label
 */
export function getComplaintCategoryLabel(category: TenantComplaintRecord['category']): string {
  const labels: Record<TenantComplaintRecord['category'], string> = {
    noise_complaint: 'Noise Complaint',
    landlord_abuse: 'Landlord Abuse / Harassment',
    unsanitary_conditions: 'Unsanitary Living Conditions',
    illegal_activities: 'Illegal Activities',
    maintenance_neglect: 'Maintenance Neglect',
    payment_dispute: 'Payment Dispute',
    safety_concern: 'Safety Concern',
    neighbor_conflict: 'Neighbor Conflict',
  };
  return labels[category] || category;
}

/**
 * Get status label
 */
export function getStatusLabel(status: TenantComplaintRecord['status']): string {
  const labels: Record<TenantComplaintRecord['status'], string> = {
    submitted: 'Submitted',
    received_by_brgy: 'Received by Brgy',
    under_review: 'Under Review',
    for_mediation: 'For Mediation',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
}

/**
 * Get urgency color
 */
export function getUrgencyColor(urgency: TenantComplaintRecord['urgency']): string {
  const colors: Record<TenantComplaintRecord['urgency'], string> = {
    low: '#6B7280',
    medium: '#F59E0B',
    high: '#EF4444',
    urgent: '#DC2626',
  };
  return colors[urgency] || '#6B7280';
}

/**
 * Delete complaints by tenant ID and category
 */
export async function deleteComplaintsByTenantAndCategory(
  tenantId: string, 
  category: string
): Promise<number> {
  try {
    console.log(`🔍 Searching for complaints with category "${category}" for tenant ${tenantId.slice(0, 8)}...`);
    
    const allComplaints = await db.list<TenantComplaintRecord>('tenant_complaints');
    const matchingComplaints = allComplaints.filter(c => 
      c.tenantId === tenantId && 
      (c.category === category || c.category.toLowerCase().includes(category.toLowerCase()))
    );
    
    console.log(`📊 Found ${matchingComplaints.length} matching complaint(s)`);
    
    if (matchingComplaints.length === 0) {
      console.log('⚠️ No matching complaints found');
      return 0;
    }
    
    // List complaints before deletion
    matchingComplaints.forEach(c => {
      console.log(`  - ${c.id.slice(0, 8)}: ${c.category} (${c.status}) - Created: ${c.createdAt}`);
    });
    
    // Delete each matching complaint
    for (const complaint of matchingComplaints) {
      console.log(`🗑️ Deleting complaint ${complaint.id.slice(0, 8)}`);
      await db.delete('tenant_complaints', complaint.id);
    }
    
    console.log(`✅ Deleted ${matchingComplaints.length} complaint(s)`);
    return matchingComplaints.length;
  } catch (error) {
    console.error('❌ Error deleting complaints:', error);
    throw error;
  }
}

/**
 * Delete a tenant complaint
 * Only allows deletion if complaint is still in 'submitted' status
 */
export async function deleteTenantComplaint(complaintId: string, tenantId: string): Promise<boolean> {
  try {
    console.log('🗑️ Attempting to delete complaint:', complaintId, 'for tenant:', tenantId);
    
    // Get all complaints to see what's in the database
    const allComplaints = await db.list<TenantComplaintRecord>('tenant_complaints');
    console.log('📋 Total complaints in database:', allComplaints.length);
    
    // Find the complaint in the list
    const complaint = allComplaints.find(c => c.id === complaintId);
    
    if (!complaint) {
      console.error('❌ Complaint not found in database. ID:', complaintId);
      console.log('Available complaint IDs:', allComplaints.map(c => c.id));
      throw new Error('Complaint not found in database');
    }
    
    console.log('✓ Found complaint:', complaint.id, 'status:', complaint.status, 'tenant:', complaint.tenantId);
    
    // Verify the complaint belongs to the tenant
    if (complaint.tenantId !== tenantId) {
      console.error('❌ Unauthorized deletion attempt. Complaint tenant:', complaint.tenantId, 'Current user:', tenantId);
      throw new Error('Unauthorized: You can only delete your own complaints');
    }
    
    // Only allow deletion if complaint is still submitted (not yet processed by barangay)
    if (complaint.status !== 'submitted') {
      console.error('❌ Cannot delete. Complaint status:', complaint.status);
      throw new Error('Cannot delete complaint: It has already been processed by the barangay');
    }
    
    // Delete the complaint
    await db.remove('tenant_complaints', complaintId);
    console.log('✅ Successfully deleted tenant complaint:', complaintId);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting tenant complaint:', error);
    throw error;
  }
}

