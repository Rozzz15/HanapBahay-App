import { z } from "zod";
import { supabase } from '../../utils/supabase-client';
import { storeAuthUser } from '../../utils/auth-user';
import { db } from '../../utils/db';

// Define allowed roles
const roles = ["official", "tenant", "host", "owner", "brgy_official"] as const;

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Login function using real Supabase authentication
export async function loginUser(data: LoginData) {
    try {
        loginSchema.parse(data);

        console.log('🔑 Attempting Supabase login for:', data.email);

        // Sign in with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (authError) {
            console.error('❌ Supabase login error:', authError);
            
            // Determine specific error type based on Supabase error
            let errorType = 'UNKNOWN_ERROR';
            let errorMessage = 'Invalid email or password';
            
            if (authError.message.toLowerCase().includes('invalid login credentials')) {
                // This could be wrong email OR wrong password
                // Check if user exists to determine which
                const { data: userCheck } = await supabase
                    .from('users')
                    .select('id, role, roles')
                    .eq('email', data.email)
                    .single();
                
                if (userCheck) {
                    errorType = 'INVALID_PASSWORD';
                    errorMessage = 'Incorrect password. Please try again.';
                } else {
                    errorType = 'USER_NOT_FOUND';
                    errorMessage = 'No account found with this email address.';
                }
            } else if (authError.message.toLowerCase().includes('email not confirmed')) {
                // Check if user is an owner - owners don't need email verification
                const { data: userCheck } = await supabase
                    .from('users')
                    .select('id, role, roles')
                    .eq('email', data.email)
                    .single();
                
                const userRoles = userCheck?.roles || [userCheck?.role] || [];
                const isOwner = userRoles.includes('owner');
                
                if (isOwner) {
                    // Owners don't need email verification - skip this error
                    // The error is likely because Supabase has email confirmation enabled
                    // but owners should be able to login immediately after signup
                    console.log('⚠️ Owner login blocked by email confirmation - this should not happen');
                    errorType = 'OWNER_PENDING_APPROVAL';
                    errorMessage = 'Your owner application is pending approval from your Barangay. You will be able to access your dashboard once approved.';
                } else {
                    errorType = 'EMAIL_NOT_CONFIRMED';
                    errorMessage = 'Please verify your email address before logging in.';
                }
            } else if (authError.message.toLowerCase().includes('user not found')) {
                errorType = 'USER_NOT_FOUND';
                errorMessage = 'No account found with this email address.';
            }
            
            return {
                success: false,
                error: errorType,
                errorMessage: errorMessage
            };
        }

        if (!authData.user) {
            throw new Error("Login failed - no user data returned");
        }

        console.log('✅ Supabase login successful:', authData.user.id);

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('⚠️ Error fetching user profile:', profileError);
        }

        // Determine user role from profile or metadata
        const userRole = profile?.role || authData.user.user_metadata?.role || 'tenant';
        const userRoles = profile?.roles || [userRole];

        // Store auth user data locally for quick access
        const authUser = {
            id: authData.user.id,
            email: authData.user.email!,
            name: profile?.name || authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
            roles: userRoles,
            permissions: [],
            isOwnerApproved: profile?.is_owner_approved || false,
        };

        await storeAuthUser(authUser);
        console.log('✅ Auth user stored in Supabase cloud only:', authUser);

        return { 
            success: true, 
            roles: userRoles,
            permissions: [],
            user: authUser
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        console.error("Login error:", message);
        return {
            success: false,
            error: 'UNKNOWN_ERROR',
            errorMessage: message
        };
    }
}
