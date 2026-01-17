import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase-client';

export interface PersonalDetails {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    gender?: 'male' | 'female';
    familyType?: 'individual' | 'couple' | 'family' | 'group';
    contactPersonEmergency?: string;
    contactNumberEmergency?: string;
    profilePhoto: string | null;
}

export const useProfileData = () => {
    const { user, isAuthenticated } = useAuth();
    const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+63',
        address: '',
        gender: undefined,
        familyType: undefined,
        contactPersonEmergency: '',
        contactNumberEmergency: '',
        profilePhoto: null
    });
    const [tempPersonalDetails, setTempPersonalDetails] = useState<PersonalDetails>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+63',
        address: '',
        gender: undefined,
        familyType: undefined,
        contactPersonEmergency: '',
        contactNumberEmergency: '',
        profilePhoto: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const PERSONAL_DETAILS_KEY = user?.id ? `personal_details:${user.id}` : 'personal_details';

    const loadPersonalDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            setHasError(false);
            
            console.log('📂 Loading personal details from cloud database...');
            console.log('👤 Current user ID:', user?.id);
            console.log('🔐 Is authenticated:', isAuthenticated);
            
            if (!user?.id) {
                console.log('❌ No user ID available');
                setIsLoading(false);
                return;
            }
            
            // Load from Supabase cloud database
            const { data: stored, error: loadError } = await supabase
                .from('personal_details')
                .select('data')
                .eq('user_id', user.id)
                .single();
            
            console.log('📦 Stored data found in cloud:', !!stored);
            
            if (stored && stored.data) {
                const parsedData = stored.data;
                console.log('✅ Personal details loaded from cloud database:', {
                    firstName: parsedData.firstName,
                    lastName: parsedData.lastName,
                    email: parsedData.email,
                    phone: parsedData.phone,
                    address: parsedData.address
                });
                
                // Load profile photo from cloud database
                let finalPhotoUri = null;
                try {
                    if (user?.id) {
                        console.log('🔍 Loading profile photo from cloud database for user:', user.id);
                        const { data: photoData, error: photoError } = await supabase
                            .from('user_profile_photos')
                            .select('photo_uri')
                            .eq('user_id', user.id)
                            .single();
                        
                        if (photoData?.photo_uri) {
                            finalPhotoUri = photoData.photo_uri;
                            console.log('✅ Loaded profile photo from cloud database');
                        } else {
                            console.log('❌ No profile photo found in cloud database for user:', user.id);
                        }
                    }
                } catch (photoError) {
                    console.log('⚠️ Could not load profile photo from cloud:', photoError);
                }
                
                const finalDetails = {
                    ...parsedData,
                    email: parsedData.email || '',
                    gender: parsedData.gender,
                    familyType: parsedData.familyType,
                    // Map field names: database uses contactPersonEmergency, interface uses contactPersonEmergency
                    contactPersonEmergency: parsedData.contactPersonEmergency || parsedData.emergencyContactPerson || '',
                    contactNumberEmergency: parsedData.contactNumberEmergency || parsedData.emergencyContactNumber || '',
                    profilePhoto: finalPhotoUri
                };
                
                setPersonalDetails(finalDetails);
                setTempPersonalDetails(finalDetails);
                
                console.log('🔄 Profile photo state updated:', { hasPhoto: !!finalPhotoUri });
            } else {
                console.log('📝 No stored personal details found, checking database for user data...');
                
                // Try to load user data from database if available
                let userData = null;
                
                if (user?.id) {
                    try {
                        const { db } = await import('../utils/db');
                        userData = await db.get('users', user.id) as any;
                        console.log('📊 User data from database:', userData);
                        
                        if (!userData) {
                            console.log('⚠️ No user data found in database for ID:', user.id);
                            const allUsers = await db.list('users');
                            console.log('📋 All users in database:', allUsers);
                        }
                    } catch (dbError) {
                        console.log('⚠️ Could not load user data from database:', dbError);
                    }
                }
                
                // Load profile photo from cloud database for new users
                let profilePhoto = null;
                try {
                    if (user?.id) {
                        console.log('🔍 Loading profile photo from cloud database for new user:', user.id);
                        const { data: photoData, error: photoError } = await supabase
                            .from('user_profile_photos')
                            .select('photo_uri')
                            .eq('user_id', user.id)
                            .single();
                        
                        if (photoData?.photo_uri) {
                            profilePhoto = photoData.photo_uri;
                            console.log('✅ Profile photo loaded from cloud database for new user');
                        } else {
                            console.log('❌ No profile photo found in cloud database for new user:', user.id);
                        }
                    }
                } catch (photoError) {
                    console.log('⚠️ Could not load profile photo from cloud for new user:', photoError);
                }
                
                // Initialize with user data from database or fallback values
                const defaultDetails = {
                    firstName: userData?.name?.split(' ')[0] || userData?.name || '',
                    lastName: userData?.name?.split(' ').slice(1).join(' ') || '',
                    email: userData?.email || '',
                    phone: userData?.phone || '+63',
                    address: userData?.address || '',
                    gender: userData?.gender,
                    familyType: userData?.familyType,
                    contactPersonEmergency: '',
                    contactNumberEmergency: '',
                    profilePhoto: profilePhoto
                };
                
                console.log('✅ Initialized personal details with user data:', defaultDetails);
                console.log('🔍 User data from database:', userData);
                console.log('🔍 Profile photo loaded:', !!profilePhoto);
                setPersonalDetails(defaultDetails);
                setTempPersonalDetails(defaultDetails);
            }
        } catch (error) {
            console.error('❌ Error loading personal details:', error);
            setHasError(true);
            // Set default values if loading fails
            const fallbackDetails = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '+63',
                address: '',
                gender: undefined,
                familyType: undefined,
                contactPersonEmergency: '',
                contactNumberEmergency: '',
                profilePhoto: null
            };
            setPersonalDetails(fallbackDetails);
            setTempPersonalDetails(fallbackDetails);
            console.log('🔄 Using fallback personal details due to error');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, isAuthenticated, PERSONAL_DETAILS_KEY]);

    const savePersonalDetails = useCallback(async (data: PersonalDetails) => {
        try {
            console.log('💾 Saving personal details to cloud database...');
            console.log('👤 User ID available:', !!user?.id);
            
            if (!user?.id) {
                throw new Error('No user ID available');
            }
            
            // Separate photo from other details
            const { profilePhoto, ...detailsWithoutPhoto } = data;
            
            console.log('📊 Data being saved to cloud (without photo):', {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                hasProfilePhoto: !!profilePhoto
            });
            
            // Save to Supabase cloud database
            const personalDetailsRecord = {
                id: `${user.id}_details`,
                user_id: user.id,
                data: detailsWithoutPhoto,
                updated_at: new Date().toISOString()
            };
            
            const { error: saveError } = await supabase
                .from('personal_details')
                .upsert(personalDetailsRecord, { onConflict: 'user_id' });
            
            if (saveError) {
                console.error('❌ Error saving to cloud database:', saveError);
                throw new Error(`Failed to save profile: ${saveError.message}`);
            }
            
            console.log('✅ Personal details saved to cloud database successfully');
            
            // Store profile photo separately in cloud database
            if (profilePhoto) {
                try {
                    const photoSize = profilePhoto.length;
                    console.log('📸 Saving profile photo to cloud:');
                    console.log('📸 Photo size:', photoSize, 'characters');
                    console.log('📸 Photo preview:', profilePhoto.substring(0, 50) + '...');
                    
                    // Check if photo is too large (limit to ~1MB in base64)
                    if (photoSize > 1000000) {
                        console.warn('⚠️ Profile photo too large, skipping cloud save');
                    } else {
                        // Save to cloud database
                        if (user?.id && typeof user.id === 'string' && user.id.trim() !== '') {
                            try {
                                console.log('💾 Saving profile photo to cloud database for user:', user.id);
                                
                                const fileName = `profile_photo_${user.id}_${Date.now()}.jpg`;
                                const mimeType = profilePhoto.startsWith('data:') 
                                    ? profilePhoto.split(';')[0].split(':')[1] 
                                    : 'image/jpeg';
                                
                                const { saveUserProfilePhoto } = await import('../utils/user-profile-photos');
                                await saveUserProfilePhoto(
                                    user.id,
                                    profilePhoto,
                                    profilePhoto,
                                    fileName,
                                    photoSize,
                                    mimeType
                                );
                                console.log('✅ Profile photo saved to cloud database');
                            } catch (dbError) {
                                console.warn('⚠️ Failed to save profile photo to cloud database:', dbError);
                                // Don't fail the entire save for photo issues
                            }
                        } else {
                            console.warn('⚠️ Cannot save profile photo - invalid user ID');
                        }
                    }
                } catch (photoError) {
                    console.warn('⚠️ Failed to save profile photo:', photoError);
                    // Don't fail the entire save for photo storage issues
                }
            }
        } catch (error) {
            console.error('❌ Error saving personal details:', error);
            console.error('❌ Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                storageKey: PERSONAL_DETAILS_KEY,
                userId: user?.id,
                dataValid: !!data
            });
            throw error; // Re-throw to allow calling functions to handle
        }
    }, [user?.id, PERSONAL_DETAILS_KEY]);

    const refreshProfilePhoto = useCallback(async () => {
        console.log('🔄 Refreshing profile photo from cloud database...');
        try {
            if (user?.id) {
                const { data: photoData, error: photoError } = await supabase
                    .from('user_profile_photos')
                    .select('photo_uri')
                    .eq('user_id', user.id)
                    .single();
                
                if (photoData?.photo_uri) {
                    setPersonalDetails(prev => ({...prev, profilePhoto: photoData.photo_uri}));
                    console.log('✅ Profile photo refreshed from cloud database');
                } else {
                    console.log('❌ No profile photo found in cloud database for refresh');
                }
            }
        } catch (error) {
            console.error('❌ Error refreshing profile photo from cloud:', error);
        }
    }, [user?.id]);

    // Load data when component mounts or user changes
    useEffect(() => {
        if (user?.id && isAuthenticated) {
            loadPersonalDetails();
        }
    }, [user?.id, isAuthenticated, loadPersonalDetails]);

    // Listen for profile photo loaded events from AuthContext
    useEffect(() => {
        const handleProfilePhotoLoaded = (event: CustomEvent) => {
            const { userId, photoUri } = event.detail;
            console.log('📸 Received profile photo loaded event:', { userId, hasPhoto: !!photoUri });
            
            if (user?.id === userId && photoUri) {
                console.log('📸 Updating profile photo from event');
                setPersonalDetails(prev => ({...prev, profilePhoto: photoUri}));
            }
        };

        // Add event listener
        if (typeof window !== 'undefined' && window.addEventListener) {
          window.addEventListener('profilePhotoLoaded', handleProfilePhotoLoaded as EventListener);
        }
        
        // Cleanup
        return () => {
            if (typeof window !== 'undefined' && window.removeEventListener) {
              window.removeEventListener('profilePhotoLoaded', handleProfilePhotoLoaded as EventListener);
            }
        };
    }, [user?.id]);

    return {
        personalDetails,
        setPersonalDetails,
        tempPersonalDetails,
        setTempPersonalDetails,
        isLoading,
        hasError,
        setHasError,
        loadPersonalDetails,
        savePersonalDetails,
        refreshProfilePhoto
    };
};
