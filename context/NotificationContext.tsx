import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase-client';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  pendingBookingsCount: number;
  pendingPaymentsCount: number;
  unreadComplaintsCount: number;
  refreshUnreadCount: () => Promise<void>;
  refreshPendingBookings: () => Promise<void>;
  refreshPendingPayments: () => Promise<void>;
  refreshUnreadComplaints: () => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [unreadComplaintsCount, setUnreadComplaintsCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      console.log('🔔 Refreshing unread count for user:', user.id);
      
      // Get all conversations for this user from Supabase
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`owner_id.eq.${user.id},tenant_id.eq.${user.id}`);

      if (error) {
        console.error('❌ Error fetching conversations from Supabase:', error);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      let totalUnread = 0;
      for (const conv of conversations) {
        const isOwner = user.id === conv.owner_id;
        const unreadCount = isOwner ? (conv.unread_by_owner || 0) : (conv.unread_by_tenant || 0);
        totalUnread += unreadCount;
      }

      console.log('📊 Total unread messages:', totalUnread);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('❌ Error refreshing unread count:', error);
    }
  }, [user?.id]);

  // Create a stable reference to avoid infinite loops
  const refreshUnreadCountRef = useRef(refreshUnreadCount);
  refreshUnreadCountRef.current = refreshUnreadCount;

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    try {
      console.log('✅ Marking conversation as read:', conversationId);
      
      // Get conversation from Supabase
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (fetchError || !conversation) {
        console.error('❌ Error fetching conversation:', fetchError);
        return;
      }

      const isOwner = user.id === conversation.owner_id;
      const now = new Date().toISOString();

      // Update conversation in Supabase
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          unread_by_owner: isOwner ? 0 : conversation.unread_by_owner,
          unread_by_tenant: !isOwner ? 0 : conversation.unread_by_tenant,
          last_read_by_owner: isOwner ? now : conversation.last_read_by_owner,
          last_read_by_tenant: !isOwner ? now : conversation.last_read_by_tenant,
          updated_at: now
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('❌ Error updating conversation:', updateError);
        return;
      }

      // Refresh unread count by calling the function directly
      await refreshUnreadCountRef.current();
    } catch (error) {
      console.error('❌ Error marking conversation as read:', error);
    }
  }, [user?.id]);

  const refreshPendingBookings = useCallback(async () => {
    if (!user?.id || !user?.roles?.includes('owner')) {
      setPendingBookingsCount(0);
      return;
    }

    try {
      console.log('📋 Refreshing pending bookings count for owner:', user.id);
      
      // Get pending bookings from Supabase (exclude deleted bookings)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, is_deleted')
        .eq('owner_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Error fetching bookings from Supabase:', error);
        return;
      }

      // Filter out soft-deleted bookings
      const activeBookings = bookings?.filter(b => !b.is_deleted) || [];
      const pendingCount = activeBookings.length;
      console.log('📊 Pending bookings count (excluding deleted):', pendingCount);
      setPendingBookingsCount(pendingCount);
    } catch (error) {
      console.error('❌ Error refreshing pending bookings count:', error);
    }
  }, [user?.id, user?.roles]);

  // Create a stable reference to avoid infinite loops
  const refreshPendingBookingsRef = useRef(refreshPendingBookings);
  refreshPendingBookingsRef.current = refreshPendingBookings;

  const refreshPendingPayments = useCallback(async () => {
    if (!user?.id || !user?.roles?.includes('owner')) {
      setPendingPaymentsCount(0);
      return;
    }

    try {
      console.log('💰 Refreshing pending payments count for owner:', user.id);
      
      // Get pending payments from Supabase
      const { data: payments, error } = await supabase
        .from('rent_payments')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'pending_owner_confirmation');

      if (error) {
        console.error('❌ Error fetching payments from Supabase:', error);
        return;
      }

      const pendingCount = payments?.length || 0;
      console.log('📊 Pending payments count:', pendingCount);
      setPendingPaymentsCount(pendingCount);
    } catch (error) {
      console.error('❌ Error refreshing pending payments count:', error);
    }
  }, [user?.id, user?.roles]);

  // Create a stable reference to avoid infinite loops
  const refreshPendingPaymentsRef = useRef(refreshPendingPayments);
  refreshPendingPaymentsRef.current = refreshPendingPayments;

  const refreshUnreadComplaints = useCallback(async () => {
    if (!user?.id || !user?.roles?.includes('brgy_official')) {
      setUnreadComplaintsCount(0);
      return;
    }

    try {
      console.log('📋 Refreshing unread complaints count for barangay official:', user.id);
      
      // Import the function dynamically to avoid circular dependencies
      const { getUnreadComplaintsCount } = await import('../utils/tenant-complaints');
      const { db } = await import('../utils/db');
      
      // Get user's barangay
      const userRecord = await db.get('users', user.id);
      const barangay = userRecord?.barangay || '';
      
      if (!barangay) {
        setUnreadComplaintsCount(0);
        return;
      }
      
      const count = await getUnreadComplaintsCount(barangay);
      console.log('📊 Unread complaints count:', count);
      setUnreadComplaintsCount(count);
    } catch (error) {
      console.error('❌ Error refreshing unread complaints count:', error);
    }
  }, [user?.id, user?.roles]);

  // Create a stable reference to avoid infinite loops
  const refreshUnreadComplaintsRef = useRef(refreshUnreadComplaints);
  refreshUnreadComplaintsRef.current = refreshUnreadComplaints;

  // Refresh unread count when user changes
  useEffect(() => {
    if (user?.id) {
      refreshUnreadCountRef.current();
      refreshPendingBookingsRef.current();
      refreshPendingPaymentsRef.current();
      refreshUnreadComplaintsRef.current();
    }
  }, [user?.id]);

  // Periodic refresh of unread count, pending bookings, pending payments, and complaints
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      refreshUnreadCountRef.current();
      refreshPendingBookingsRef.current();
      refreshPendingPaymentsRef.current();
      refreshUnreadComplaintsRef.current();
    }, 15000); // Check every 15 seconds (reduced frequency)

    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      pendingBookingsCount,
      pendingPaymentsCount,
      unreadComplaintsCount,
      refreshUnreadCount,
      refreshPendingBookings,
      refreshPendingPayments,
      refreshUnreadComplaints,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
