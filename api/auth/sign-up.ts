import { z } from "zod";
import { supabase } from '../../utils/supabase-client';
import { storeAuthUser } from '../../utils/auth-user';
import { db, generateId } from '@/utils/db';
import { DbUserRecord, TenantProfileRecord, OwnerProfileRecord, OwnerVerificationRecord, OwnerApplicationRecord, BrgyNotificationRecord } from '@/types';
import { validateEmailForSignup } from '@/utils/validation';

// Allow role selection: tenant or owner
export const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    contactNumber: z.string()
        .length(13, "Contact number must be exactly 13 characters with +63 prefix")
        .regex(/^\+63[0-9]{10}$/, "Contact number must be exactly 10 digits after +63"),
    address: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
    role: z.enum(['tenant', 'owner']).default('tenant'),
    gender: z.enum(['male', 'female']).optional(),
    familyType: z.enum(['individual', 'couple', 'family', 'group']).optional(),
    emergencyContactPerson: z.string().optional(),
    emergencyContactNumber: z.string().optional(),
    // Owner-specific fields
    houseNumber: z.string().optional(),
    street: z.string().optional(),
    barangay: z.enum(['RIZAL', 'TALOLONG', 'GOMEZ', 'MAGSAYSAY', 'BURGOS']).optional(),
    // Owner documents (already uploaded to Supabase Storage)
    documents: z.array(z.object({
        id: z.string(),
        name: z.string(),
        uri: z.string(),
        uploadedAt: z.string(),
    })).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
});

export type SignUpData = z.infer<typeof signUpSchema>;

// Sign-up function using real Supabase authentication
export async function signUpUser(data: SignUpData) {
    try {
        console.log('🔐 Starting Supabase sign-up process for:', data.email, 'role:', data.role);
        
        signUpSchema.parse(data); // Validate input before proceeding
        console.log('✅ Schema validation passed');
        
        // Additional email validation for Supabase-specific restrictions
        const emailValidation = validateEmailForSignup(data.email);
        if (!emailValidation.isValid) {
            console.error('❌ Email validation failed:', emailValidation.error);
            throw new Error(emailValidation.error || 'Invalid email address');
        }
        console.log('✅ Email validation passed');
        
        // Sign up with Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    name: data.name,
                    role: data.role,
                    phone: data.contactNumber,
                }
            }
        });

        if (authError) {
            console.error('❌ Supabase sign-up error:', authError);
            throw new Error(authError.message || "Failed to create account");
        }

        if (!authData.user) {
            throw new Error("Sign-up failed - no user data returned");
        }

        console.log('✅ Supabase sign-up successful:', authData.user.id);

        const userId = authData.user.id;

        // Store personal details from sign-up form
        const personalDetails = {
            firstName: data.name.split(' ')[0] || '',
            lastName: data.name.split(' ').slice(1).join(' ') || '',
            email: data.email,
            phone: data.contactNumber,
            address: data.address,
            gender: data.gender,
            familyType: data.familyType,
            emergencyContactPerson: data.emergencyContactPerson || '',
            emergencyContactNumber: data.emergencyContactNumber || '',
            profilePhoto: null
        };

        // Create user profile in Supabase database
        const now = new Date().toISOString();
        
        // Prepare data for Supabase (using snake_case for database columns)
        const supabaseUserRecord = {
            id: userId,
            email: data.email,
            name: data.name,
            phone: data.contactNumber,
            address: data.address || '',
            role: data.role,
            roles: [data.role],
            gender: data.gender,
            family_type: data.familyType, // snake_case for database
            created_at: now, // snake_case for database
            updated_at: now, // snake_case for database
        };
        
        console.log('💾 Saving user record to Supabase database:', supabaseUserRecord);
        
        // Insert into Supabase users table - CRITICAL: This must succeed before creating tenant/owner profiles
        const { error: userInsertError } = await supabase
            .from('users')
            .insert([supabaseUserRecord]);
        
        let userInsertSuccessful = false;
        
        if (userInsertError) {
            // Check if it's a duplicate email error (code 23505)
            if (userInsertError.code === '23505') {
                console.log('⚠️ User already exists in database (duplicate email), checking if record exists...');
                // Verify the user actually exists in the database
                const { data: existingUser, error: checkError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', userId)
                    .single();
                
                if (existingUser) {
                    console.log('✅ User record exists in database, can proceed');
                    userInsertSuccessful = true;
                } else {
                    console.error('❌ CRITICAL: User record does not exist despite duplicate error:', checkError);
                    throw new Error('User record verification failed');
                }
            } else {
                console.error('❌ CRITICAL: Error saving to Supabase users table:', userInsertError);
                // This is a critical error - we cannot proceed without the user record
                throw new Error(`Failed to create user record: ${userInsertError.message}`);
            }
        } else {
            console.log('✅ User record saved to Supabase');
            // Verify the insert was successful by checking if the record exists
            const { data: verifyUser, error: verifyError } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .single();
            
            if (verifyUser) {
                console.log('✅ User record verified in database');
                userInsertSuccessful = true;
            } else {
                console.error('❌ CRITICAL: User record not found after insert:', verifyError);
                throw new Error('User record verification failed after insert');
            }
        }
        
        // Ensure we have a successful user insert before proceeding
        if (!userInsertSuccessful) {
            throw new Error('User record was not successfully created or verified');
        }
        
        // Also prepare for local DB (using camelCase)
        const userRecord: DbUserRecord = {
            id: userId,
            email: data.email,
            name: data.name,
            phone: data.contactNumber,
            address: data.address || '',
            role: data.role,
            roles: [data.role],
            gender: data.gender,
            familyType: data.familyType,
            createdAt: now,
            updatedAt: now,
        };
        
        // Local storage removed - using Supabase cloud storage only
        console.log('✅ User record saved to Supabase cloud only');
        
        // Store auth user for immediate login
        await storeAuthUser({
            id: userId,
            email: data.email,
            name: data.name,
            roles: [data.role],
            permissions: [],
        });
        console.log('✅ Auth user stored for immediate login');

        // Personal details now stored in Supabase cloud only (in user_profiles tables)
        console.log('✅ Personal details saved to Supabase cloud only');

        if (data.role === 'owner') {
            console.log('👤 Creating owner profile for:', userRecord.id);
            
            // Prepare owner profile for Supabase (snake_case)
            const supabaseOwnerProfile = {
                user_id: userRecord.id,
                business_name: data.name,
                contact_number: data.contactNumber,
                email: data.email,
                created_at: now,
            };
            
            // Insert into Supabase owner_profiles table (use upsert to handle duplicates)
            const { error: ownerInsertError } = await supabase
                .from('owner_profiles')
                .upsert([supabaseOwnerProfile], { onConflict: 'user_id' });
            
            if (ownerInsertError) {
                console.error('⚠️ Error saving to Supabase owner_profiles:', ownerInsertError);
            } else {
                console.log('✅ Owner profile saved to Supabase');
            }
            
            // Create owner profile for local DB (camelCase)
            const ownerProfile: OwnerProfileRecord = {
                userId: userRecord.id,
                businessName: data.name,
                contactNumber: data.contactNumber,
                email: data.email,
                createdAt: now,
            };
            
            // Owner profile now stored in Supabase cloud only
            console.log('✅ Owner profile saved to Supabase cloud only');
            
            console.log('✅ Owner profile created successfully');

            // Get documents from sign-up data (already uploaded to Supabase Storage)
            console.log('📄 Processing owner documents...');
            const documents = data.documents || [];
            console.log(`✅ Found ${documents.length} documents (already uploaded to Supabase Storage)`);
            
            // Extract Government ID document URI for verification record
            let govIdUri: string | null = null;
            if (documents.length > 0) {
                // Find Government ID document
                const govIdDoc = documents.find((doc: any) => doc.name === 'Government ID');
                if (govIdDoc) {
                    govIdUri = govIdDoc.uri;
                }
            }

            if (documents.length > 0 || govIdUri) {
                console.log('📄 Creating owner verification record in Supabase...');
                
                // Save to Supabase owner_verifications table
                const { error: verificationError } = await supabase
                    .from('owner_verifications')
                    .insert([{
                        user_id: userRecord.id,
                        gov_id_uri: govIdUri || documents[0]?.uri || '',
                        status: 'pending',
                        created_at: now,
                    }]);
                
                if (verificationError) {
                    console.error('⚠️ Error saving verification to Supabase:', verificationError);
                } else {
                    console.log('✅ Owner verification record created in Supabase');
                }
            } else {
                console.log('ℹ️ No documents provided, skipping verification record');
            }

            // Create owner application if barangay is specified
            if (data.barangay) {
                console.log('📝 Creating owner application for barangay:', data.barangay);
                
                // Generate a proper UUID v4 format for the application ID
                // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
                const generateUUID = () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        const r = Math.random() * 16 | 0;
                        const v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                };
                
                const applicationId = generateUUID();
                console.log('📝 Generated application UUID:', applicationId);
                
                const ownerApplication: OwnerApplicationRecord = {
                    id: applicationId,
                    userId: userRecord.id,
                    name: data.name,
                    email: data.email,
                    contactNumber: data.contactNumber,
                    houseNumber: data.houseNumber || '',
                    street: data.street || '',
                    barangay: data.barangay,
                    govIdUri: govIdUri, // Keep for backward compatibility
                    documents: documents.length > 0 ? documents : undefined, // New field for multiple documents
                    status: 'pending',
                    createdBy: userRecord.id,
                    createdAt: now,
                };

                try {
                    // Save owner application to Supabase
                    const { error: applicationError } = await supabase
                        .from('owner_applications')
                        .insert([{
                            id: applicationId,
                            user_id: userRecord.id,
                            name: data.name,
                            email: data.email,
                            contact_number: data.contactNumber,
                            house_number: data.houseNumber || '',
                            street: data.street || '',
                            barangay: data.barangay,
                            gov_id_uri: govIdUri,
                            documents: documents.length > 0 ? documents : null,
                            status: 'pending',
                            created_by: userRecord.id,
                            created_at: now,
                        }]);
                    
                    if (applicationError) {
                        console.error('❌ Failed to create owner application in Supabase:', applicationError);
                    } else {
                        console.log('✅ Owner application created in Supabase');

                        // Create notification for barangay officials in Supabase
                        const notificationId = generateId('brgy_notif');
                        
                        const { error: notifError } = await supabase
                            .from('brgy_notifications')
                            .insert([{
                                id: notificationId,
                                barangay: data.barangay,
                                type: 'owner_application',
                                owner_application_id: applicationId,
                                owner_name: data.name,
                                is_read: false,
                                created_at: now,
                            }]);
                        
                        if (notifError) {
                            console.error('❌ Failed to create notification in Supabase:', notifError);
                        } else {
                            console.log('✅ Barangay notification created in Supabase');
                        }
                    }
                } catch (appError) {
                    console.error('❌ Failed to create owner application:', appError);
                }
            }
        } else {
            // Generate tenant ID
            const tenantId = generateId('tenant');
            
            // Prepare tenant profile for Supabase (snake_case)
            const supabaseTenantProfile = {
                id: tenantId, // Add missing id field
                user_id: userRecord.id,
                first_name: data.name.split(' ')[0] || '',
                last_name: data.name.split(' ').slice(1).join(' ') || '',
                contact_number: data.contactNumber,
                email: data.email,
                address: data.address || '',
                gender: data.gender,
                family_type: data.familyType,
                emergency_contact_person: data.emergencyContactPerson,
                emergency_contact_number: data.emergencyContactNumber,
                preferences: {
                    budget: { min: 0, max: 100000 },
                    location: [],
                    amenities: []
                },
                created_at: now,
            };
            
            // Insert into Supabase tenants table (not tenant_profiles)
            const { error: tenantInsertError } = await supabase
                .from('tenants')
                .insert([supabaseTenantProfile]);
            
            if (tenantInsertError) {
                console.error('⚠️ Error saving to Supabase tenants table:', tenantInsertError);
            } else {
                console.log('✅ Tenant profile saved to Supabase tenants table');
            }

            // ALSO save to personal_details table so it's pre-filled
            // Note: personal_details uses JSONB 'data' column, not separate columns
            console.log('💾 Saving personal details from sign-up...');
            const personalDetailsId = generateId('pd');
            const personalDetailsData = {
                firstName: data.name.split(' ')[0] || '',
                lastName: data.name.split(' ').slice(1).join(' ') || '',
                phoneNumber: data.contactNumber,
                address: data.address || '',
                gender: data.gender || null,
                tenantType: data.familyType || null,
                contactPersonEmergency: data.emergencyContactPerson || '',
                contactNumberEmergency: data.emergencyContactNumber || '',
            };
            
            const { error: personalDetailsError } = await supabase
                .from('personal_details')
                .insert([{
                    id: personalDetailsId,
                    user_id: userRecord.id,
                    data: personalDetailsData, // Store as JSONB
                    created_at: now,
                    updated_at: now,
                }]);
            
            if (personalDetailsError) {
                console.error('⚠️ Error saving to personal_details table:', personalDetailsError);
            } else {
                console.log('✅ Personal details saved! User won\'t need to fill again.');
            }
            
            // Create tenant profile for local DB (camelCase)
            const tenantProfile: TenantProfileRecord = {
                userId: userRecord.id,
                firstName: data.name.split(' ')[0] || '',
                lastName: data.name.split(' ').slice(1).join(' ') || '',
                contactNumber: data.contactNumber,
                email: data.email,
                address: data.address || '',
                gender: data.gender,
                familyType: data.familyType,
                emergencyContactPerson: data.emergencyContactPerson,
                emergencyContactNumber: data.emergencyContactNumber,
                preferences: {
                    budget: { min: 0, max: 100000 },
                    location: [],
                    amenities: []
                },
                createdAt: now,
            };
            
            // Tenant profile now stored in Supabase cloud only
            console.log('✅ Tenant profile saved to Supabase cloud only with gender:', tenantProfile.gender ? `✅ ${tenantProfile.gender}` : '⚠️ No gender provided');
        }

        console.log('🎉 Sign-up completed successfully for:', data.email);
        return { 
            success: true, 
            role: data.role,
            user: {
                id: userId,
                email: data.email,
                roles: [data.role],
            },
            error: undefined
        };

    } catch (error) {
        console.error('❌ Sign-up error:', error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        console.error('❌ Error message:', message);
        return {
            success: false,
            role: data.role,
            user: undefined,
            error: message
        };
    }
}
