/**
 * Helper function to safely update conversation records
 * Avoids "index row requires 369920 bytes" error by only including specific fields
 */

import { ConversationRecord } from '@/types';

export interface ConversationUpdateFields {
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadByOwner?: number;
  unreadByTenant?: number;
  lastReadByOwner?: string;
  lastReadByTenant?: string;
  updatedAt?: string;
}

/**
 * Creates a safe conversation update object that won't exceed database limits
 * Only includes essential fields, avoiding large nested objects
 */
export function createSafeConversationUpdate(
  conversation: ConversationRecord,
  updates: ConversationUpdateFields
): ConversationRecord {
  return {
    id: conversation.id,
    ownerId: conversation.ownerId || conversation.owner_id,
    tenantId: conversation.tenantId || conversation.tenant_id,
    participantIds: conversation.participantIds || conversation.participant_ids || [],
    lastMessageText: updates.lastMessageText ?? (conversation.lastMessageText || conversation.last_message_text),
    lastMessageAt: updates.lastMessageAt ?? (conversation.lastMessageAt || conversation.last_message_at),
    unreadByOwner: updates.unreadByOwner ?? (conversation.unreadByOwner || conversation.unread_by_owner || 0),
    unreadByTenant: updates.unreadByTenant ?? (conversation.unreadByTenant || conversation.unread_by_tenant || 0),
    lastReadByOwner: updates.lastReadByOwner ?? (conversation.lastReadByOwner || conversation.last_read_by_owner),
    lastReadByTenant: updates.lastReadByTenant ?? (conversation.lastReadByTenant || conversation.last_read_by_tenant),
    createdAt: conversation.createdAt || conversation.created_at || new Date().toISOString(),
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
    ...(conversation.propertyId && { propertyId: conversation.propertyId }),
    ...(conversation.property_id && { propertyId: conversation.property_id }),
    ...(conversation.propertyTitle && { propertyTitle: conversation.propertyTitle })
  } as ConversationRecord;
}
