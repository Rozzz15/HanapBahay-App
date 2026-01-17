import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { View, ScrollView, Pressable, Alert, Modal, TextInput, TouchableOpacity, Image, Platform, StyleSheet, Text, KeyboardAvoidingView, Keyboard, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabase-client';
import { uploadToSupabase } from '../../utils/supabase-storage';
import { db } from '../../utils/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/toast';
import { saveUserProfilePhoto } from '../../utils/user-profile-photos';
import { changePassword } from '../../api/auth/change-password';
import { showAlert } from '../../utils/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bot, Send, X } from 'lucide-react-native';

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    route?: string;
    onPress?: () => void;
    isLogout?: boolean;
};

const MenuButton = memo(({ item }: { item: MenuItem }) => {
    const router = useRouter();

    const handlePress = useCallback(() => {
        console.log('MenuButton pressed:', item.label);
        if (item.onPress) {
            console.log('Calling onPress for:', item.label);
            item.onPress();
        } else if (item.route) {
            console.log('Navigating to route:', item.route);
            router.push(item.route as any);
        }
    }, [item, router]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                styles.menuButton,
                item.isLogout && styles.logoutButton
            ]}
            activeOpacity={0.7}
        >
            <View style={[
                styles.menuIcon,
                item.isLogout && styles.logoutIcon
            ]}>
                {item.icon}
            </View>
            <Text style={[
                styles.menuText,
                item.isLogout && styles.logoutText
            ]}>
                {item.label}
            </Text>
            {!item.isLogout && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
        </TouchableOpacity>
    );
});
MenuButton.displayName = 'MenuButton';

const ProfileScreen = memo(function ProfileScreen() {
    const router = useRouter();
    const { signOut, user, isAuthenticated } = useAuth();
    const isOwner = Array.isArray(user?.roles) && user?.roles.includes('owner');
    const toast = useToast();

    // State for modals
    const [showPersonalDetails, setShowPersonalDetails] = useState(false);
    const [showHelpSupport, setShowHelpSupport] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Personal details state - single source of truth
    const [personalDetails, setPersonalDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+63',
        address: '',
        gender: undefined as 'male' | 'female' | undefined,
        familyType: undefined as 'individual' | 'family' | undefined,
        emergencyContactPerson: '',
        emergencyContactNumber: '',
        profilePhoto: null as string | null
    });

    // Form state for editing
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '+63',
        address: '',
        gender: undefined as 'male' | 'female' | undefined,
        familyType: undefined as 'individual' | 'family' | undefined,
        emergencyContactPerson: '',
        emergencyContactNumber: '',
        profilePhoto: null as string | null
    });

    // Reset form state when modal is closed without saving
    const handleCloseModal = () => {
        setFormData({ ...personalDetails }); // Reset to current saved state
        setShowPersonalDetails(false);
    };

    // Fixed country code for Philippines
    const countryCode = '+63';

    // Storage keys (per-user)
    const PERSONAL_DETAILS_KEY = user?.id ? `personal_details:${user.id}` : 'personal_details';

    // Define loadPersonalDetails with useCallback to avoid hook violations
    const loadPersonalDetails = useCallback(async () => {
        try {
            console.log('📂 Loading personal details...');

            if (!user?.id) {
                console.log('❌ No user ID available');
                return;
            }

            // Load from Supabase cloud
            console.log('☁️ Loading personal details from cloud for user:', user?.id);
            const { data: stored, error: loadError } = await supabase
                .from('personal_details')
                .select('data')
                .eq('user_id', user?.id)
                .single();
            let details = {
                firstName: '',
                lastName: '',
                email: user.email || '',
                phone: '+63',
                address: '',
                gender: undefined as 'male' | 'female' | undefined,
                familyType: undefined as 'individual' | 'family' | undefined,
                emergencyContactPerson: '',
                emergencyContactNumber: '',
                profilePhoto: null as string | null
            };

            // Also load from database (tenants table) for emergency contact
            try {
                const { db } = await import('../../utils/db');
                const tenantProfile = await db.get('tenants', user.id);
                if (tenantProfile) {
                    details.emergencyContactPerson = (tenantProfile as any).emergencyContactPerson || '';
                    details.emergencyContactNumber = (tenantProfile as any).emergencyContactNumber || '';
                }
            } catch (error) {
                console.log('⚠️ Could not load emergency contact from database:', error);
            }

            if (stored && stored.data) {
                console.log('📦 Loaded data from cloud:', stored.data);
                console.log('🔍 Gender from cloud:', stored.data.gender);
                console.log('🔍 FamilyType from cloud:', stored.data.familyType);
                console.log('🔍 Emergency contacts from cloud:', {
                    contactPersonEmergency: stored.data.contactPersonEmergency,
                    contactNumberEmergency: stored.data.contactNumberEmergency
                });
                
                // Map field names from database JSONB to app state
                const mappedData = {
                    ...stored.data,
                    // Map emergency contacts: database uses contactPersonEmergency, app uses emergencyContactPerson
                    emergencyContactPerson: stored.data.contactPersonEmergency || stored.data.emergencyContactPerson || '',
                    emergencyContactNumber: stored.data.contactNumberEmergency || stored.data.emergencyContactNumber || '',
                };
                
                details = { ...details, ...mappedData };
                console.log('✅ Mapped emergency contacts:', {
                    emergencyContactPerson: details.emergencyContactPerson,
                    emergencyContactNumber: details.emergencyContactNumber
                });
            } else {
                console.log('⚠️ No stored data found');
            }

            // Load profile photo
            try {
                // Load profile photo from cloud
                const { data: photoData, error: photoError } = await supabase
                    .from('user_profile_photos')
                    .select('photo_uri')
                    .eq('user_id', user?.id)
                    .single();
                const storedPhoto = photoData?.photo_uri || null;
                if (storedPhoto) {
                    details.profilePhoto = storedPhoto;
                }
            } catch (photoError) {
                console.log('⚠️ Could not load profile photo:', photoError);
            }

            console.log('✅ Final details loaded:', details);
            setPersonalDetails(details);
            setFormData(details);
            console.log('✅ Personal details loaded successfully');

        } catch (error) {
            console.error('❌ Error loading personal details:', error);
            const fallbackDetails = {
                firstName: '',
                lastName: '',
                email: user?.email || '',
                phone: '+63',
                address: '',
                gender: undefined,
                familyType: undefined,
                emergencyContactPerson: '',
                emergencyContactNumber: '',
                profilePhoto: null
            };
            setPersonalDetails(fallbackDetails);
            setFormData(fallbackDetails);
        }
    }, [user]);

    // Load data from storage on component mount
    useEffect(() => {
        // Load user data with error handling
        const loadUserData = async () => {
            try {
                console.log('🔄 Loading user data for profile...');
                console.log('👤 Current user:', user?.id);

                // Debug: Check cloud storage
                if (user?.id) {
                    console.log('🔍 Checking cloud storage for user:', user.id);
                    try {
                        const { data: detailsCheck } = await supabase
                            .from('personal_details')
                            .select('data')
                            .eq('user_id', user.id)
                            .single();
                        
                        const { data: photoCheck } = await supabase
                            .from('user_profile_photos')
                            .select('photo_uri')
                            .eq('user_id', user.id)
                            .single();
                        
                        console.log('📦 Cloud storage check results:');
                        console.log('📝 Has personal details:', !!detailsCheck);
                        console.log('📸 Has photo:', !!photoCheck);
                    } catch (storageError) {
                        console.log('⚠️ Cloud storage check failed:', storageError);
                    }
                }

                await loadPersonalDetails();
                console.log('✅ User data loaded successfully');
                // Note: Removed clearAllStoredData to preserve sign-up data
            } catch (error) {
                console.error('❌ Error loading user data:', error);
                // Continue with default values even if loading fails
            }
        };

        if (user?.id) {
            loadUserData();
        }
    }, [user?.id, loadPersonalDetails]);

    // Reload profile data when authentication state changes (after login/logout)
    useEffect(() => {
        console.log('🔄 Auth state effect triggered:', { isAuthenticated, userId: user?.id });
        if (isAuthenticated && user?.id) {
            console.log('🔄 Authentication state changed - reloading profile data');
            loadPersonalDetails();
        }
    }, [isAuthenticated, user?.id, loadPersonalDetails]);

    // Reload profile data when screen comes into focus (navigation back to profile)
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated && user?.id) {
                console.log('🔄 Profile screen focused - reloading profile data');
                loadPersonalDetails();
            }
        }, [isAuthenticated, user?.id, loadPersonalDetails])
    );

    const savePersonalDetails = async (data: typeof personalDetails) => {
        try {
            console.log('💾 Saving personal details...');
            console.log('📊 Data to save:', {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                gender: data.gender,
                familyType: data.familyType,
                emergencyContactPerson: data.emergencyContactPerson,
                emergencyContactNumber: data.emergencyContactNumber
            });

            if (!user?.id) {
                throw new Error('No user ID available');
            }

            // Save basic details to Supabase cloud
            console.log('💾 Attempting to save personal details...');
            console.log('Data to save:', detailsWithoutPhoto);
            
            const { profilePhoto, ...detailsWithoutPhoto } = data;
            
            const personalDetailsRecord = {
                id: `${user?.id}_details`,
                user_id: user?.id,
                data: detailsWithoutPhoto,
                updated_at: new Date().toISOString()
            };
            
            console.log('Record to upsert:', personalDetailsRecord);
            
            const { error: saveError } = await supabase
                .from('personal_details')
                .upsert(personalDetailsRecord, { onConflict: 'user_id' });
            
            if (saveError) {
                console.error('❌ Error saving to cloud:', saveError);
                throw new Error(`Failed to save profile: ${saveError.message}`);
            } else {
                console.log('✅ Personal details saved to Supabase cloud successfully!');
            }

            // IMPORTANT: Also update the users table in database so owner can see the changes
            try {
                const { db } = await import('../../utils/db');
                const userRecord = await db.get('users', user.id);

                if (userRecord) {
                    const updatedUser = {
                        ...userRecord,
                        name: `${data.firstName} ${data.lastName}`.trim() || data.email,
                        email: data.email,
                        phone: data.phone,
                        address: data.address,
                        gender: data.gender,
                        familyType: data.familyType,
                        updatedAt: new Date().toISOString()
                    };

                    await db.upsert('users', user.id, updatedUser);
                    console.log('✅ Updated users table with personal details:', {
                        name: updatedUser.name,
                        email: updatedUser.email,
                        phone: updatedUser.phone,
                        address: updatedUser.address,
                        gender: updatedUser.gender,
                        familyType: updatedUser.familyType
                    });

                    // ALSO update the tenants table with gender, familyType, and emergency contact for owner visibility
                    try {
                        const tenantProfile = await db.get('tenants', user.id);
                        if (tenantProfile) {
                            const updatedTenantProfile = {
                                ...tenantProfile,
                                contactNumber: data.phone,
                                email: data.email,
                                address: data.address,
                                gender: data.gender,
                                familyType: data.familyType,
                                emergencyContactPerson: data.emergencyContactPerson,
                                emergencyContactNumber: data.emergencyContactNumber
                            };
                            await db.upsert('tenants', user.id, updatedTenantProfile);
                            console.log('✅ Updated tenants table with personal details:', {
                                contactNumber: updatedTenantProfile.contactNumber,
                                email: updatedTenantProfile.email,
                                address: updatedTenantProfile.address,
                                gender: updatedTenantProfile.gender,
                                familyType: updatedTenantProfile.familyType,
                                emergencyContactPerson: updatedTenantProfile.emergencyContactPerson,
                                emergencyContactNumber: updatedTenantProfile.emergencyContactNumber
                            });
                        }
                    } catch (tenantError) {
                        console.warn('⚠️ Could not update tenants table:', tenantError);
                    }
                }
            } catch (dbError) {
                console.warn('⚠️ Could not update users table:', dbError);
                // Don't fail the entire save for database issues
            }

            // Save profile photo separately
            if (profilePhoto) {
                try {
                    // Upload photo to Supabase Storage
                    console.log('☁️ Uploading profile photo to Supabase Storage...');
                    const photoUrl = await uploadToSupabase(profilePhoto, 'profile-photos', `${user.id}_profile.jpg`);
                    
                    // Save photo URL to database
                    console.log('💾 Saving photo URL to database...');
                    const { error: photoError } = await supabase
                        .from('user_profile_photos')
                        .upsert({
                            id: `${user.id}_photo`,
                            user_id: user.id,
                            photo_uri: photoUrl,
                            file_name: `${user.id}_profile.jpg`,
                            file_size: 0,
                            mime_type: 'image/jpeg',
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });
                    
                    if (photoError) {
                        console.error('❌ Error saving photo to cloud:', photoError);
                        throw new Error(`Failed to save photo URL: ${photoError.message}`);
                    } else {
                        console.log('✅ Profile photo URL saved to database!');
                    }

                    // ALSO save to database so owners can see tenant photos
                    try {
                        const photoSize = profilePhoto.length;
                        const fileName = `profile_photo_${user.id}_${Date.now()}.jpg`;
                        const mimeType = profilePhoto.startsWith('data:')
                            ? profilePhoto.split(';')[0].split(':')[1]
                            : 'image/jpeg';

                        await saveUserProfilePhoto(
                            user.id,
                            profilePhoto,
                            profilePhoto, // Store as both URI and data
                            fileName,
                            photoSize,
                            mimeType
                        );
                        console.log('✅ Profile photo saved to database for sharing');
                    } catch (dbError) {
                        console.warn('⚠️ Could not save photo to database:', dbError);
                        // Don't fail the entire save for database issues
                    }
                } catch (photoUploadError) {
                    console.error('❌ Photo upload failed:', photoUploadError);
                    throw new Error(`Photo upload failed: ${photoUploadError instanceof Error ? photoUploadError.message : 'Unknown error'}`);
                }
            } else {
                // Remove photo if none
                // Remove photo from cloud
                const { error: deleteError } = await supabase
                    .from('user_profile_photos')
                    .delete()
                    .eq('user_id', user?.id);
                
                if (deleteError) {
                    console.error('❌ Error deleting photo from cloud:', deleteError);
                } else {
                    console.log('✅ Profile photo removed from cloud');
                }
            }

            console.log('✅ Personal details saved successfully');

        } catch (error) {
            console.error('❌ Error saving personal details:', error);
            throw error;
        }
    };



    const handleLogout = useCallback(async () => {
        console.log('🚪 Logout button pressed');
        console.log('🚪 Current user before logout:', user);

        showAlert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('❌ Logout cancelled')
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🚪 User confirmed logout, starting signOut...');

                            // Call signOut from AuthContext - this will handle the redirect
                            await signOut();

                            console.log('✅ Logout successful - redirecting to login');

                        } catch (error) {
                            console.error('❌ Logout error:', error);
                            Alert.alert(
                                'Logout Error',
                                'Failed to logout. Please try again.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            console.log('🚪 User acknowledged logout error, forcing redirect');
                                            // Force redirect even if logout failed
                                            router.replace('/login');
                                        }
                                    }
                                ]
                            );
                        }
                    }
                }
            ]
        );
    }, [user, signOut, router]);

    const handleSavePersonalDetails = async () => {
        try {
            console.log('💾 Saving personal details...');

            // Validate email format if provided
            if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                toast.show('Please enter a valid email address');
                return;
            }

            // Validate phone number if provided
            if (formData.phone.trim() && formData.phone.trim() !== '+63') {
                const cleanPhone = formData.phone.replace(/\s/g, '');
                if (!cleanPhone.startsWith('+63') || cleanPhone.length !== 13) {
                    toast.show('Please enter a valid Philippine phone number (+63XXXXXXXXXX)');
                    return;
                }
            }

            // Update main state
            setPersonalDetails({ ...formData });

            // Save to storage
            await savePersonalDetails(formData);

            toast.show('Profile updated successfully!');
            setShowPersonalDetails(false);

        } catch (error) {
            console.error('❌ Error saving personal details:', error);
            toast.show('Failed to update profile. Please try again.');
        }
    };



    const handleChangePassword = async () => {
        if (!user?.id) return;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Validation Error', 'All password fields are required');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Validation Error', 'New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Validation Error', 'New passwords do not match');
            return;
        }

        try {
            setChangingPassword(true);

            const result = await changePassword(user.id, {
                currentPassword,
                newPassword,
                confirmPassword
            });

            if (result.success) {
                showAlert('Success', 'Password changed successfully!');
                // Clear password fields
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowChangePassword(false);
            } else {
                showAlert('Error', result.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showAlert('Error', 'Failed to change password. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handlePhotoAction = async (action: 'gallery' | 'remove') => {
        if (action === 'remove') {
            Alert.alert(
                'Remove Photo',
                'Are you sure you want to remove your profile photo?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            setFormData(prev => ({ ...prev, profilePhoto: null }));
                            toast.show('Photo removed');
                        }
                    }
                ]
            );
        } else {
            try {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

                if (!permissionResult.granted) {
                    toast.show('Permission required to access photo library');
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [1, 1] as [number, number],
                    quality: 0.7,
                    base64: true, // Always get base64 for easier upload
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const selectedImage = result.assets[0];

                    // Always convert to base64 data URI for consistent handling
                    let imageUri: string;
                    if (selectedImage.base64) {
                        // Determine proper mime type from URI or default to jpeg
                        let mimeType = 'image/jpeg';
                        
                        if (selectedImage.uri) {
                            const uri = selectedImage.uri.toLowerCase();
                            if (uri.endsWith('.png')) {
                                mimeType = 'image/png';
                            } else if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
                                mimeType = 'image/jpeg';
                            } else if (uri.endsWith('.gif')) {
                                mimeType = 'image/gif';
                            } else if (uri.endsWith('.webp')) {
                                mimeType = 'image/webp';
                            }
                        }
                        
                        // Override with explicit type if provided
                        if (selectedImage.type && selectedImage.type.startsWith('image/')) {
                            mimeType = selectedImage.type;
                        }
                        
                        // Build proper data URI
                        imageUri = `data:${mimeType};base64,${selectedImage.base64}`;
                        console.log('✅ Converted image to base64 data URI, mime type:', mimeType);
                        console.log('📊 Image URI starts with:', imageUri.substring(0, 30));
                    } else {
                        // Fallback to file URI if base64 is not available
                        imageUri = selectedImage.uri;
                        console.log('⚠️ Using file URI as fallback:', imageUri.substring(0, 50));
                    }

                    setFormData(prev => ({ ...prev, profilePhoto: imageUri }));
                    toast.show('Photo selected');
                    console.log('📸 Profile photo selected, format:', imageUri.substring(0, 30));
                }
            } catch (error) {
                console.error('Error selecting photo:', error);
                toast.show('Failed to select photo');
            }
        }
    };

    const menuItems: MenuItem[] = useMemo(() => [
        // Owner-only actions
        ...(isOwner ? [
            {
                icon: <Ionicons name="home" size={20} color="#4B5563" />,
                label: 'Create Property Listing',
                route: '/(owner)/create-listing',
            },
            {
                icon: <Ionicons name="list" size={20} color="#4B5563" />,
                label: 'My Listings',
                route: '/(owner)/owner-listings',
            },
        ] : []),
        // Common actions
        {
            icon: <Ionicons name="person" size={20} color="#4B5563" />,
            label: 'Personal details',
            onPress: () => {
                setFormData({ ...personalDetails });
                setShowPersonalDetails(true);
            },
        },
        {
            icon: <Ionicons name="heart" size={20} color="#4B5563" />,
            label: 'Saved Listings',
            route: '/(tabs)/favorites',
        },
        {
            icon: <Ionicons name="lock-closed" size={20} color="#4B5563" />,
            label: 'Change Password',
            onPress: () => setShowChangePassword(true),
        },
        {
            icon: <Ionicons name="help-circle" size={20} color="#4B5563" />,
            label: 'Help & Support',
            onPress: () => setShowHelpSupport(true),
        },
        {
            icon: <Ionicons name="log-out" size={20} color="#DC2626" />,
            label: 'Logout',
            onPress: handleLogout,
            isLogout: true,
        },
    ], [isOwner, personalDetails, handleLogout]);

    // Safety check - ensure profile is always accessible
    if (!isAuthenticated) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-lg font-semibold text-gray-600 mb-2">Authentication Required</Text>
                <Text className="text-gray-500 text-center px-6">
                    Please log in to access your profile
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    style={{ backgroundColor: '#007bff', padding: 10, marginTop: 10, borderRadius: 5 }}
                >
                    <Text style={{ color: 'white' }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Safety check - ensure profile is always accessible
    if (!isAuthenticated) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-lg font-semibold text-gray-600 mb-2">Authentication Required</Text>
                <Text className="text-gray-500 text-center px-6">
                    Please log in to access your profile
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/login')}
                    style={{ backgroundColor: '#007bff', padding: 10, marginTop: 10, borderRadius: 5 }}
                >
                    <Text style={{ color: 'white' }}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (hasError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Profile Error</Text>
                <Text style={styles.errorText}>
                    There was an issue loading your profile. Please try again.
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setHasError(false);
                        loadPersonalDetails();
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    {personalDetails.profilePhoto ? (
                        <Image
                            source={{ uri: personalDetails.profilePhoto }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {personalDetails.firstName && personalDetails.lastName
                                ? `${personalDetails.firstName.charAt(0)}${personalDetails.lastName.charAt(0)}`
                                : '?'
                            }
                        </Text>
                    )}
                </View>
                <Text style={styles.profileName}>
                    {personalDetails.firstName && personalDetails.lastName
                        ? `${personalDetails.firstName} ${personalDetails.lastName}`
                        : personalDetails.firstName
                            ? personalDetails.firstName
                            : personalDetails.email
                                ? personalDetails.email.split('@')[0]
                                : 'Complete Your Profile'
                    }
                </Text>
                <Text style={styles.profileEmail}>
                    {personalDetails.email || 'Please add your email'}
                </Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <MenuButton key={index} item={item} />
                ))}
            </View>


            {/* Personal Details Modal */}
            <Modal
                visible={showPersonalDetails}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Personal Details</Text>
                        <TouchableOpacity onPress={() => {
                            Keyboard.dismiss();
                            handleCloseModal();
                        }}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalContent}
                        contentContainerStyle={styles.modalScrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={Keyboard.dismiss}
                        >
                            <View style={styles.modalForm}>
                                {/* Profile Photo Section */}
                                <View style={styles.photoSection}>
                                    <View style={styles.photoSectionHeader}>
                                        <Text style={styles.photoSectionTitle}>Profile Photo</Text>
                                        {formData.profilePhoto !== personalDetails.profilePhoto && (
                                            <View style={styles.unsavedBadge}>
                                                <Text style={styles.unsavedText}>Unsaved</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.photoContainer}>
                                        <View style={styles.modalAvatar}>
                                            {formData.profilePhoto ? (
                                                <Image
                                                    source={{ uri: formData.profilePhoto }}
                                                    style={styles.modalAvatarImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text style={styles.modalAvatarText}>
                                                    {formData.firstName && formData.lastName
                                                        ? `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`
                                                        : '?'
                                                    }
                                                </Text>
                                            )}
                                        </View>

                                        {/* Photo Action Buttons */}
                                        <View style={styles.photoActions}>
                                            <TouchableOpacity
                                                onPress={() => handlePhotoAction('gallery')}
                                                style={styles.selectPhotoButton}
                                            >
                                                <Ionicons name="image" size={16} color="#3B82F6" />
                                                <Text style={styles.selectPhotoText}>Select Photo</Text>
                                            </TouchableOpacity>

                                            {formData.profilePhoto && (
                                                <TouchableOpacity
                                                    onPress={() => handlePhotoAction('remove')}
                                                    style={styles.removePhotoButton}
                                                >
                                                    <Ionicons name="trash" size={16} color="#EF4444" />
                                                    <Text style={styles.removePhotoText}>Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Form Fields */}
                                <View style={styles.formSection}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>First Name</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={formData.firstName}
                                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                            placeholder="Enter your first name"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Last Name</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={formData.lastName}
                                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                            placeholder="Enter your last name"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Email</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={formData.email}
                                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                                            keyboardType="email-address"
                                            placeholder="Enter your email"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Phone Number</Text>
                                        <View style={styles.phoneContainer}>
                                            <View style={styles.countryCode}>
                                                <Text style={styles.countryCodeText}>🇵🇭 {countryCode}</Text>
                                            </View>
                                            <TextInput
                                                style={styles.phoneInput}
                                                value={formData.phone.replace(countryCode + ' ', '')}
                                                onChangeText={(text) => {
                                                    const digitsOnly = text.replace(/\D/g, '');
                                                    if (digitsOnly.length <= 10) {
                                                        const fullPhone = countryCode + ' ' + digitsOnly;
                                                        setFormData({ ...formData, phone: fullPhone });
                                                    }
                                                }}
                                                placeholder="912 345 6789"
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Address</Text>
                                        <TextInput
                                            style={[styles.textInput, styles.addressInput]}
                                            value={formData.address}
                                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                                            multiline
                                            numberOfLines={3}
                                            placeholder="Enter your address"
                                        />
                                    </View>

                                    {/* Gender Selection */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Gender</Text>
                                        <View style={styles.radioGroup}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.gender === 'male' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, gender: 'male' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.gender === 'male' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.gender === 'male' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.gender === 'male' && styles.radioTextSelected
                                                ]}>Male</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.gender === 'female' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, gender: 'female' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.gender === 'female' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.gender === 'female' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.gender === 'female' && styles.radioTextSelected
                                                ]}>Female</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Tenant Type Selection */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Tenant Type</Text>
                                        <View style={styles.radioGroup}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.familyType === 'individual' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, familyType: 'individual' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.familyType === 'individual' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.familyType === 'individual' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.familyType === 'individual' && styles.radioTextSelected
                                                ]}>Individual</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.familyType === 'couple' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, familyType: 'couple' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.familyType === 'couple' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.familyType === 'couple' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.familyType === 'couple' && styles.radioTextSelected
                                                ]}>Couple</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.familyType === 'family' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, familyType: 'family' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.familyType === 'family' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.familyType === 'family' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.familyType === 'family' && styles.radioTextSelected
                                                ]}>Family</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.radioOption,
                                                    formData.familyType === 'group' && styles.radioOptionSelected
                                                ]}
                                                onPress={() => setFormData({ ...formData, familyType: 'group' })}
                                            >
                                                <View style={[
                                                    styles.radioCircle,
                                                    formData.familyType === 'group' && styles.radioCircleSelected
                                                ]}>
                                                    {formData.familyType === 'group' && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[
                                                    styles.radioText,
                                                    formData.familyType === 'group' && styles.radioTextSelected
                                                ]}>Group/Shared</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Emergency Contact Fields */}
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Contact Person In case of Emergency (Optional)</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={formData.emergencyContactPerson}
                                            onChangeText={(text) => setFormData({ ...formData, emergencyContactPerson: text })}
                                            placeholder="Enter contact person name"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Contact Number In case of Emergency (Optional)</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={formData.emergencyContactNumber}
                                            onChangeText={(text) => setFormData({ ...formData, emergencyContactNumber: text })}
                                            placeholder="Enter contact number"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSavePersonalDetails}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>


            {/* Help & Support AI Agent Modal */}
            <Modal
                visible={showHelpSupport}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowHelpSupport(false)}
            >
                <HelpSupportAI
                    visible={showHelpSupport}
                    onClose={() => setShowHelpSupport(false)}
                    userName={personalDetails.firstName && personalDetails.lastName
                        ? `${personalDetails.firstName} ${personalDetails.lastName}`
                        : personalDetails.firstName
                            ? personalDetails.firstName
                            : user?.name || 'Tenant'}
                    userId={user?.id || ''}
                    userRole="tenant"
                />
            </Modal>

            {/* Change Password Modal */}
            <Modal
                visible={showChangePassword}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TouchableOpacity onPress={() => {
                            setShowChangePassword(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                        }}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalContent}
                        contentContainerStyle={styles.modalScrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.modalForm}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <View style={styles.passwordInputWrapper}>
                                    <TextInput
                                        style={styles.passwordTextInput}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        placeholder="Enter current password"
                                        secureTextEntry={!showCurrentPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        <Ionicons
                                            name={showCurrentPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={styles.passwordInputWrapper}>
                                    <TextInput
                                        style={styles.passwordTextInput}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Enter new password"
                                        secureTextEntry={!showNewPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        <Ionicons
                                            name={showNewPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.helperText}>Must be at least 6 characters</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <View style={styles.passwordInputWrapper}>
                                    <TextInput
                                        style={styles.passwordTextInput}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Confirm new password"
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? "eye-off" : "eye"}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.saveButton, changingPassword && styles.saveButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={changingPassword}
                        >
                            {changingPassword ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 32, // Reduced from 40
        paddingBottom: 20, // Reduced from 24
        paddingHorizontal: 16, // Reduced from 20
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatarContainer: {
        width: 100, // Reduced from 128
        height: 100, // Reduced from 128
        borderRadius: 50, // Reduced from 64
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14, // Reduced from 16
        overflow: 'hidden',
    },
    avatarImage: {
        width: 100, // Reduced from 128
        height: 100, // Reduced from 128
        borderRadius: 50, // Reduced from 64
    },
    avatarText: {
        fontSize: 36, // Reduced from 48
        fontWeight: '600',
        color: '#6B7280',
    },
    profileName: {
        fontSize: 20, // Reduced from 24
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    profileEmail: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    menuContainer: {
        paddingTop: 8,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14, // Reduced from 16
        paddingHorizontal: 16, // Reduced from 20
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    logoutButton: {
        backgroundColor: '#FEF2F2',
    },
    menuIcon: {
        width: 28, // Reduced from 32
        height: 28, // Reduced from 32
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14, // Reduced from 16
        backgroundColor: '#F3F4F6',
        marginRight: 12,
    },
    logoutIcon: {
        backgroundColor: '#FEE2E2',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    logoutText: {
        color: '#DC2626',
        fontWeight: '600',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        zIndex: 1000,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalScrollContent: {
        paddingBottom: 100, // Add bottom padding to ensure content isn't cut off
    },
    modalForm: {
        gap: 24,
    },
    photoSection: {
        alignItems: 'center',
    },
    photoSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    photoSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    unsavedBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    unsavedText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#92400E',
    },
    photoContainer: {
        alignItems: 'center',
    },
    modalAvatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    modalAvatarImage: {
        width: 128,
        height: 128,
        borderRadius: 64,
    },
    modalAvatarText: {
        fontSize: 48,
        fontWeight: '600',
        color: '#6B7280',
    },
    photoActions: {
        flexDirection: 'row',
        gap: 12,
    },
    selectPhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    selectPhotoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3B82F6',
        marginLeft: 4,
    },
    removePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    removePhotoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EF4444',
        marginLeft: 4,
    },
    formSection: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        paddingRight: 8,
    },
    passwordTextInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    eyeIcon: {
        padding: 4,
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    addressInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    countryCode: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 16,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flex: 1,
    },
    radioOptionSelected: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        borderColor: '#10B981',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
    },
    radioText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    radioTextSelected: {
        color: '#10B981',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    saveButton: {
        backgroundColor: '#10B981',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    faqContent: {
        gap: 24,
    },
    faqItem: {
        gap: 8,
    },
    faqQuestion: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    faqAnswer: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
});

export default ProfileScreen;

// AI Agent Component for Help & Support (Tenant-specific)
interface HelpSupportAIProps {
    visible: boolean;
    onClose: () => void;
    userName: string;
    userId: string;
    userRole: 'owner' | 'tenant';
}

function HelpSupportAI({ visible, onClose, userName, userId, userRole }: HelpSupportAIProps) {
    const [messages, setMessages] = useState<Array<{ id: string; text: string; isUser: boolean; timestamp: Date }>>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    // Initialize with welcome message and reset when modal opens
    useEffect(() => {
        if (visible) {
            // Only show welcome message if no messages exist
            setMessages(prev => {
                if (prev.length === 0) {
                    const welcomeMessage = {
                        id: 'welcome',
                        text: `Hello ${userName}! 👋 I'm Yna, your AI assistant for HanapBahay. I can help you with:\n\n• Searching and filtering properties\n• Contacting property owners\n• Booking and viewing properties\n• Managing your profile and saved listings\n• Understanding rental processes\n• Troubleshooting issues\n\nWhat would you like to know?`,
                        isUser: false,
                        timestamp: new Date()
                    };
                    return [welcomeMessage];
                }
                return prev;
            });
        } else {
            // Reset when modal closes
            setMessages([]);
            setInputText('');
            setIsTyping(false);
        }
    }, [visible, userName]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const generateAIResponse = async (userMessage: string): Promise<string> => {
        const lowerMessage = userMessage.toLowerCase().trim();

        // First, check if user is asking about a specific receipt number or booking ID
        if (userId) {
            try {
                const { searchHelpSupportData } = await import('../../utils/ai-support-search');
                const searchResult = await searchHelpSupportData(userMessage, userId, userRole);

                if (searchResult.responseText) {
                    return searchResult.responseText;
                }
            } catch (error) {
                console.error('❌ Error searching help support data:', error);
                // Continue with regular responses if search fails
            }
        }

        // Tenant-specific context-aware responses
        if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('property') || lowerMessage.includes('look')) {
            return `To search for properties:\n\n1. Use the search bar on the dashboard to search by location, property type, or keywords\n2. Tap the filter button to narrow down by:\n   • Barangay (Danlagan, Gomez, Magsaysay, Rizal, Bocboc, Talolong)\n   • Price range (set min/max monthly rent)\n   • Property type (house, apartment, boarding house, bedspace)\n3. Click "Apply Filters" to see filtered results\n4. Use "Clear All" to reset filters\n\n💡 Tip: Save your favorite properties to easily find them later!`;
        }

        if (lowerMessage.includes('filter') || lowerMessage.includes('barangay') || lowerMessage.includes('price') || lowerMessage.includes('budget')) {
            return `Filtering properties:\n\n• Barangay: Select your preferred area from the dropdown\n• Price Range: Use the slider to set your monthly rent budget\n• Property Type: Choose house, apartment, boarding house, or bedspace\n• Apply multiple filters together for precise results\n• Clear filters anytime with "Clear All" button\n\nStart with broad filters and narrow down based on what you find!`;
        }

        if (lowerMessage.includes('contact') || lowerMessage.includes('owner') || lowerMessage.includes('message') || lowerMessage.includes('chat')) {
            return `Contacting property owners:\n\n1. Tap on any property listing to view details\n2. Use the "Contact Owner" button\n3. Or go to the Chat tab to start a conversation\n4. Be ready to share:\n   • Your name and contact number\n   • Preferred move-in date\n   • Rental budget\n   • Specific requirements\n\nQuick responses help owners understand your needs better!`;
        }

        if (lowerMessage.includes('book') || lowerMessage.includes('viewing') || lowerMessage.includes('inspect') || lowerMessage.includes('visit')) {
            return `Booking property viewings:\n\n• Contact the property owner through the chat feature\n• Discuss your move-in date and requirements\n• Owners will coordinate with you to schedule a viewing\n• Be flexible with timing to increase your chances\n• Ask about availability, amenities, and rental terms\n\nAlways confirm viewing details before visiting!`;
        }

        if (lowerMessage.includes('save') || lowerMessage.includes('favorite') || lowerMessage.includes('bookmark')) {
            return `Saving properties:\n\n• Tap the heart icon on any property listing\n• View all saved properties in "Saved Listings" from your profile\n• Remove from favorites by tapping the heart again\n• Saved listings help you compare options easily\n\nKeep your favorites organized for quick access!`;
        }

        if (lowerMessage.includes('profile') || lowerMessage.includes('personal') || lowerMessage.includes('details') || lowerMessage.includes('edit')) {
            return `Managing your profile:\n\n• Go to Profile tab and tap "Personal details"\n• Update your name, email, phone number, and address\n• Add a profile photo to help owners recognize you\n• Keep information current for better communication\n• Changes are saved automatically\n\nComplete profiles get faster responses from owners!`;
        }

        if (lowerMessage.includes('password') || lowerMessage.includes('security') || lowerMessage.includes('change')) {
            return `Changing your password:\n\n• Go to Profile tab\n• Tap "Change Password"\n• Enter your current password\n• Enter and confirm your new password (min 6 characters)\n• Save changes\n\nKeep your account secure with a strong password!`;
        }

        if (lowerMessage.includes('type') || lowerMessage.includes('house') || lowerMessage.includes('apartment') || lowerMessage.includes('bedspace') || lowerMessage.includes('boarding')) {
            return `Property types available:\n\n• Houses: Standalone homes with multiple rooms\n• Apartments: Units in buildings with shared facilities\n• Boarding Houses: Shared living spaces with common areas\n• Bedspaces: Individual beds in shared rooms\n\nEach listing shows rent, rooms, size, amenities, and location details.`;
        }

        if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
            return `I'm Yna, and I'm here to help! You can ask me about:\n\n• Searching and filtering properties\n• Contacting owners and booking viewings\n• Managing your profile and saved listings\n• Understanding rental processes\n• Troubleshooting app issues\n\nOr contact support at support@hanapbahay.com for urgent matters.`;
        }

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `Hello! I'm Yna. How can I help you find your perfect home today? 🏠`;
        }

        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return `You're welcome! Feel free to ask if you need any other help. 😊`;
        }

        // Default helpful response
        return `I'm Yna, and I understand you're asking about "${userMessage}". Here are some ways I can help:\n\n• Property search and filtering\n• Contacting owners and booking viewings\n• Profile and account management\n• Understanding rental processes\n• General questions about HanapBahay\n\nCould you be more specific about what you need help with?`;
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMessage = inputText.trim();
        setInputText('');

        // Add user message
        const newUserMessage = {
            id: Date.now().toString(),
            text: userMessage,
            isUser: true,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);

        // Simulate AI thinking
        setIsTyping(true);

        // Generate AI response
        setTimeout(async () => {
            const aiResponse = await generateAIResponse(userMessage);
            const newAIMessage = {
                id: (Date.now() + 1).toString(),
                text: aiResponse,
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newAIMessage]);
            setIsTyping(false);
        }, 800 + Math.random() * 500); // Simulate thinking time
    };

    const quickQuestions = [
        'How do I search for properties?',
        'How to contact owners?',
        'Book a property viewing',
        'Update my profile'
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <View style={{
                paddingTop: insets.top + 16,
                paddingBottom: 16,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12
            }}>
                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                    <X size={24} color="#111827" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#3B82F6' + '20',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Bot size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                            Yna
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                            AI Assistant • Help & Support
                        </Text>
                    </View>
                </View>
                <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#10B981'
                }} />
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                showsVerticalScrollIndicator={true}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={{
                            flexDirection: 'row',
                            justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                            marginBottom: 4
                        }}
                    >
                        <View style={{
                            maxWidth: '80%',
                            padding: 12,
                            borderRadius: 16,
                            backgroundColor: message.isUser ? '#3B82F6' : '#F3F4F6',
                        }}>
                            {!message.isUser && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Bot size={14} color="#3B82F6" />
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6' }}>
                                        Yna
                                    </Text>
                                </View>
                            )}
                            <Text style={{
                                fontSize: 15,
                                color: message.isUser ? '#FFFFFF' : '#111827',
                                lineHeight: 20
                            }}>
                                {message.text}
                            </Text>
                        </View>
                    </View>
                ))}

                {isTyping && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                        <View style={{
                            padding: 12,
                            borderRadius: 16,
                            backgroundColor: '#F3F4F6',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            <Bot size={14} color="#3B82F6" />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#3B82F6', marginRight: 8 }}>
                                Yna
                            </Text>
                            <ActivityIndicator size="small" color="#3B82F6" />
                        </View>
                    </View>
                )}

                {/* Quick Questions */}
                {messages.length <= 1 && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
                            Quick Questions:
                        </Text>
                        <View style={{ gap: 8 }}>
                            {quickQuestions.map((question, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setInputText(question);
                                        setTimeout(() => handleSendMessage(), 100);
                                    }}
                                    style={{
                                        padding: 12,
                                        backgroundColor: '#F9FAFB',
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB'
                                    }}
                                >
                                    <Text style={{ fontSize: 14, color: '#374151' }}>{question}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={{
                padding: 16,
                paddingBottom: Math.max(insets.bottom, 16),
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB'
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    backgroundColor: '#F9FAFB'
                }}>
                    <TextInput
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            fontSize: 15,
                            color: '#111827'
                        }}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask me anything..."
                        multiline
                        maxLength={500}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || isTyping}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: inputText.trim() && !isTyping ? '#3B82F6' : '#D1D5DB',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {isTyping ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Send size={18} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
