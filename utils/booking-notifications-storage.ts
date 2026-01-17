import { supabase } from './supabase-client';
import { db } from './db';
import { Platform } from 'react-native';

/**
 * Cloud-based notification storage using Supabase
 */
const NOTIFICATION_TABLE = 'user_notification_states';

/**
 * Load shown booking notifications for a user from Supabase cloud
 */
export async function loadShownBookingNotifications(userId: string): Promise<Set<string>> {
  try {
    console.log(`☁️ Loading shown booking notifications from cloud for user ${userId}`);
    
    const { data, error } = await supabase
      .from(NOTIFICATION_TABLE)
      .select('notification_data')
      .eq('user_id', userId)
      .eq('notification_type', 'booking')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error loading notifications from cloud:', error);
      return new Set();
    }
    
    if (data && data.notification_data) {
      const notifications = data.notification_data as string[];
      console.log(`📥 Loaded ${notifications.length} shown booking notifications for user ${userId}`);
      return new Set(notifications);
    }
    
    console.log(`📥 No shown booking notifications found for user ${userId}`);
    return new Set();
  } catch (error) {
    console.error('❌ Error loading shown booking notifications:', error);
    return new Set();
  }
}

/**
 * Save shown booking notifications for a user to Supabase cloud
 */
export async function saveShownBookingNotifications(
  userId: string,
  notifications: Set<string>
): Promise<void> {
  try {
    console.log(`☁️ Saving ${notifications.size} shown booking notifications to cloud for user ${userId}`);
    
    const notificationsArray = Array.from(notifications);
    
    const { error } = await supabase
      .from(NOTIFICATION_TABLE)
      .upsert({
        user_id: userId,
        notification_type: 'booking',
        notification_data: notificationsArray,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type'
      });
    
    if (error) {
      console.error('❌ Error saving notifications to cloud:', error);
      return;
    }
    
    console.log(`💾 Saved ${notificationsArray.length} shown booking notifications to cloud for user ${userId}`);
  } catch (error) {
    console.error('❌ Error saving shown booking notifications:', error);
  }
}

/**
 * Mark a booking notification as shown and save to persistent storage
 */
export async function markBookingNotificationAsShown(
  userId: string,
  bookingId: string,
  status: 'approved' | 'rejected',
  currentNotifications: Set<string>
): Promise<Set<string>> {
  const notificationKey = `${bookingId}-${status}`;
  const updatedNotifications = new Set(currentNotifications);
  updatedNotifications.add(notificationKey);
  
  // Save to persistent storage
  await saveShownBookingNotifications(userId, updatedNotifications);
  
  return updatedNotifications;
}

/**
 * Check if a booking notification has been shown before
 */
export function hasBookingNotificationBeenShown(
  bookingId: string,
  status: 'approved' | 'rejected',
  shownNotifications: Set<string>
): boolean {
  const notificationKey = `${bookingId}-${status}`;
  return shownNotifications.has(notificationKey);
}

