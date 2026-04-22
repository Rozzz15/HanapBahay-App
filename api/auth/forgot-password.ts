import { z } from "zod";
import { supabase } from '../../utils/supabase-client';
import { db } from '../../utils/db';

// Define the user type structure to match mock-auth.ts
interface MockUser {
    email: string;
    password: string;
    id: string;
    roles: string[];
    role?: string;
    barangay?: string;
    createdAt: string;
    updatedAt?: string;
    name?: string;
    phone?: string;
    address?: string;
}

// Schema for forgot password request
export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// Mock user database key
const MOCK_USERS_KEY = 'mock_users_database';

// Function to check if email exists in Supabase
const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        
        // Check in Supabase users table
        const { data, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', normalizedEmail)
            .single();
        
        if (error) {
            console.log('Email not found in users table:', normalizedEmail);
            return false;
        }
        
        return !!data;
    } catch (error) {
        console.error('Error checking email existence:', error);
        return false;
    }
};

// Function to generate a password reset token (mock implementation)
const generateResetToken = (): string => {
    return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Function to store reset token with expiration
const storeResetToken = async (email: string, token: string): Promise<void> => {
    try {
        const resetTokenId = `reset_token_${email.toLowerCase()}`;
        
        // Store token with 1 hour expiration
        const tokenData = {
            id: resetTokenId,
            email: email.toLowerCase(),
            token,
            expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
            createdAt: Date.now()
        };
        
        await db.upsert('password_reset_tokens', resetTokenId, tokenData);
        console.log('✅ Password reset token stored for:', email);
    } catch (error) {
        console.error('❌ Error storing reset token:', error);
        throw error;
    }
};

// Function to send password reset email using Supabase Auth
const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
    try {
        console.log(`📧 Sending password reset email to: ${email}`);
        
        // Use Supabase Auth to send password reset email
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'exp://localhost:8081/reset-password', // Update with your app's deep link
        });
        
        if (error) {
            console.error('❌ Error sending reset email:', error);
            return false;
        }
        
        console.log('✅ Password reset email sent successfully via Supabase');
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return false;
    }
};

// Main forgot password function
export async function forgotPassword(data: ForgotPasswordData) {
    try {
        console.log('🔐 Starting forgot password process for:', data.email);
        
        // Validate input
        forgotPasswordSchema.parse(data);
        console.log('✅ Schema validation passed');
        
        // Check if email exists in the system
        const emailExists = await checkEmailExists(data.email);
        
        if (!emailExists) {
            console.log('❌ Email not found in system:', data.email);
            return {
                success: false,
                error: 'This email address is not registered in our system. Please check your email or create a new account.',
                emailExists: false
            };
        }
        
        console.log('✅ Email found in system:', data.email);
        
        // Send password reset email via Supabase (no need to generate token manually)
        const emailSent = await sendPasswordResetEmail(data.email);
        
        if (!emailSent) {
            return {
                success: false,
                error: 'Unable to send password reset email. Please try again later.',
                emailExists: true
            };
        }
        
        console.log('✅ Password reset process completed successfully');
        
        return {
            success: true,
            message: 'Password reset instructions have been sent to your email address.',
            emailExists: true
        };
        
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        
        return {
            success: false,
            error: message,
            emailExists: false
        };
    }
}

// Function to verify reset token
export async function verifyResetToken(email: string, token: string): Promise<boolean> {
    try {
        const resetTokenId = `reset_token_${email.toLowerCase()}`;
        const tokenData = await db.get<any>('password_reset_tokens', resetTokenId);
        
        if (!tokenData) {
            return false;
        }
        
        // Check if token matches and is not expired
        if (tokenData.token === token && tokenData.expiresAt > Date.now()) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error verifying reset token:', error);
        return false;
    }
}

// Function to reset password with token
export async function resetPasswordWithToken(email: string, token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Verify token first
        const isValidToken = await verifyResetToken(email, token);
        
        if (!isValidToken) {
            return {
                success: false,
                error: 'Invalid or expired reset token. Please request a new password reset.'
            };
        }
        
        const normalizedEmail = email.trim().toLowerCase();
        
        // Get user from database
        const allUsers = await db.list<MockUser>('users');
        const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
        
        if (!user) {
            return {
                success: false,
                error: 'User not found. Please create a new account.'
            };
        }
        
        // Update password
        user.password = newPassword;
        user.updatedAt = new Date().toISOString();
        await db.upsert('users', user.id, user);
        
        // Remove used reset token
        const resetTokenId = `reset_token_${normalizedEmail}`;
        await db.remove('password_reset_tokens', resetTokenId);
        
        console.log('✅ Password reset successfully for:', email);
        
        return {
            success: true
        };
        
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        return {
            success: false,
            error: 'Failed to reset password. Please try again.'
        };
    }
}
