import { z } from 'zod';
import { supabase } from '../../utils/supabase-client';

// Schema for password change
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

// Function to change password for logged-in user using Supabase
export async function changePassword(
  userId: string, 
  data: ChangePasswordData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔐 Starting password change process for user:', userId);
    
    // Validate input
    changePasswordSchema.parse(data);
    console.log('✅ Schema validation passed');
    
    // Get the current session to verify the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ No active session found');
      return {
        success: false,
        error: 'Please sign in again to change your password.'
      };
    }

    // Verify the session user matches the provided userId
    if (session.user.id !== userId) {
      console.log('❌ User ID mismatch');
      return {
        success: false,
        error: 'Invalid user session. Please sign in again.'
      };
    }
    
    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: data.currentPassword
    });
    
    if (signInError) {
      console.log('❌ Current password is incorrect:', signInError.message);
      return {
        success: false,
        error: 'Current password is incorrect.'
      };
    }
    
    // Check if new password is the same as current password
    if (data.currentPassword === data.newPassword) {
      return {
        success: false,
        error: 'New password must be different from your current password.'
      };
    }
    
    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword
    });
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return {
        success: false,
        error: updateError.message || 'Failed to change password. Please try again.'
      };
    }
    
    console.log('✅ Password changed successfully for user:', userId);
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error changing password:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    
    return {
      success: false,
      error: 'Failed to change password. Please try again.'
    };
  }
}
