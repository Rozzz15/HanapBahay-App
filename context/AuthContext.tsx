import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthUser, clearAuthUser, clearAuthSession } from '../utils/auth-user';
import { supabase } from '../utils/supabase-client';
import { useRouter } from 'expo-router';
import { dispatchCustomEvent } from '../utils/custom-events';
import { isOwnerApproved } from '../utils/owner-approval';

interface AuthUser {
  id: string;
  roles: string[];
  permissions: string[];
  name?: string;
  email?: string;
  isOwnerApproved?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  redirectOwnerBasedOnListings: (ownerId: string) => Promise<void>;
  redirectTenantToTabs: () => Promise<void>;
  redirectBrgyOfficial: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      // Set loading state immediately
      setIsLoading(true);
      
      const authUser = await getAuthUser();
      if (authUser) {
        // Ensure user has required fields with fallbacks
        const userWithFallbacks = {
          id: authUser.id || `user-${Date.now()}`,
          roles: authUser.roles || ['tenant'],
          permissions: authUser.permissions || [],
          name: authUser.name,
          email: authUser.email,
          isOwnerApproved: authUser.isOwnerApproved
        };
        
        console.log('🔍 Auth user ID debug:', {
          originalId: authUser.id,
          fallbackId: `user-${Date.now()}`,
          finalId: userWithFallbacks.id,
          hasOriginalId: !!authUser.id
        });
        
        // Only update user if it's actually different to prevent infinite loops
        setUser(prevUser => {
          if (prevUser?.id === userWithFallbacks.id && 
              JSON.stringify(prevUser.roles) === JSON.stringify(userWithFallbacks.roles)) {
            return prevUser; // No change needed
          }
          return userWithFallbacks;
        });
        
        // Dispatch global event to notify all components to reload data
        dispatchCustomEvent('userLoggedIn', { 
          userId: userWithFallbacks.id, 
          roles: userWithFallbacks.roles 
        });
        
        // Refresh property media for tenant accounts
        if (userWithFallbacks.roles.includes('tenant')) {
          console.log('🔄 Tenant logged in - refreshing property media and profile photo...');
          try {
            // Clear expired cache first
            try {
              const { clearExpiredCachedPropertyMedia } = await import('../utils/property-media-cache');
              await clearExpiredCachedPropertyMedia();
              console.log('✅ Cleared expired property media cache');
            } catch (cacheError) {
              console.log('⚠️ Could not clear expired cache:', cacheError);
            }
            
            const { refreshAllPropertyMedia } = await import('../utils/media-storage');
            await refreshAllPropertyMedia();
            console.log('✅ Property media refreshed for tenant');
            
            // Dispatch property media refreshed event
            dispatchCustomEvent('propertyMediaRefreshed', { 
              userId: userWithFallbacks.id, 
              timestamp: new Date().toISOString() 
            });

            // Fetch listings from Supabase and dispatch media loaded events
            // This is done in the background to avoid blocking the auth flow
            (async () => {
              try {
                const { data: publishedListings, error } = await supabase
                  .from('published_listings')
                  .select('id');
                
                if (error) {
                  console.error('⚠️ Error fetching listings from Supabase:', error);
                  return;
                }
                
                if (!publishedListings || publishedListings.length === 0) {
                  console.log('ℹ️ No published listings found');
                  return;
                }
                
                for (const listing of publishedListings) {
                  try {
                    const { loadPropertyMediaFromStorage } = await import('../utils/media-storage');
                    const storedMedia = await loadPropertyMediaFromStorage(listing.id);
                    if (storedMedia && storedMedia.coverPhoto) {
                      dispatchCustomEvent('propertyMediaLoaded', {
                        listingId: listing.id,
                        userId: userWithFallbacks.id,
                        coverPhoto: storedMedia.coverPhoto,
                        photos: storedMedia.photos,
                        videos: storedMedia.videos
                      });
                    }
                  } catch (listingError) {
                    console.log('⚠️ Error loading media for listing:', listing.id, listingError);
                  }
                }
                console.log('✅ Dispatched property media loaded events for all listings (tenant)');
              } catch (mediaEventError) {
                console.log('⚠️ Could not dispatch property media loaded events (tenant):', mediaEventError);
              }
            })();

            // Also refresh tenant profile photo
            try {
              const { loadUserProfilePhoto, migratePhotoRecords } = await import('../utils/user-profile-photos');
              
              // Run migration first to fix any data issues
              await migratePhotoRecords();
              
              const profilePhoto = await loadUserProfilePhoto(userWithFallbacks.id);
              if (profilePhoto) {
                console.log('✅ Tenant profile photo loaded from database');
                // Dispatch event to update profile photo in UI
                dispatchCustomEvent('profilePhotoLoaded', { 
                  userId: userWithFallbacks.id, 
                  photoUri: profilePhoto 
                });
              } else {
                console.log('📸 No profile photo found for tenant:', userWithFallbacks.id);
              }
            } catch (photoError) {
              console.error('❌ Failed to refresh tenant profile photo:', photoError);
            }
          } catch (error) {
            console.error('❌ Failed to refresh property media:', error);
          }
        }
        
        // Refresh property media for owner accounts
        if (userWithFallbacks.roles.includes('owner')) {
          console.log('🔄 Owner logged in - refreshing property media and profile photo...');
          try {
            const { refreshAllPropertyMedia } = await import('../utils/media-storage');
            await refreshAllPropertyMedia();
            console.log('✅ Property media refreshed for owner');
            
            // Also refresh owner profile photo
            try {
              const { loadUserProfilePhoto, migratePhotoRecords } = await import('../utils/user-profile-photos');
              
              // Run migration first to fix any data issues
              await migratePhotoRecords();
              
              const profilePhoto = await loadUserProfilePhoto(userWithFallbacks.id);
              if (profilePhoto) {
                console.log('✅ Owner profile photo loaded from database');
                // Dispatch event to update profile photo in UI
                dispatchCustomEvent('profilePhotoLoaded', { 
                  userId: userWithFallbacks.id, 
                  photoUri: profilePhoto 
                });
              } else {
                console.log('📸 No profile photo found for owner:', userWithFallbacks.id);
              }
            } catch (photoError) {
              console.error('❌ Failed to refresh owner profile photo:', photoError);
            }
          } catch (error) {
            console.error('❌ Failed to refresh property media:', error);
          }
        }
      } else {
        // No authenticated user - user needs to login
        console.log('🔧 No auth user found - user needs to login');
        setUser(prevUser => prevUser === null ? prevUser : null);
        console.log('✅ User is not authenticated - showing login screen');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // On error, set user to null so they can login
      console.log('🔧 Error occurred, user needs to login');
      setUser(prevUser => prevUser === null ? prevUser : null);
      console.log('✅ User is not authenticated due to error - showing login screen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const redirectTenantToTabs = async () => {
    try {
      console.log('🏠 Redirecting tenant to tabs layout');
      // Ensure we dismiss any modals before redirecting
      if (router.canDismiss()) {
        router.dismissAll();
      }
      
      // Delay to ensure modal is closed
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('❌ Error redirecting tenant:', error);
      // Fallback redirect
      try {
        if (router.canDismiss()) {
          router.dismissAll();
        }
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } catch (fallbackError) {
        // Last resort
        router.replace('/(tabs)');
      }
    }
  };

  const redirectOwnerBasedOnListings = async (ownerId: string) => {
    try {
      console.log('🔍 Owner redirection - always going to dashboard:', ownerId);
      // Always redirect owners to dashboard regardless of listing status
      // Use a more aggressive navigation approach to ensure redirect works from any screen
      
      // First, try to reset the navigation stack to root
      if (router.canDismiss()) {
        router.dismissAll();
      }
      
      // Then navigate to owner dashboard
      // Use setTimeout to ensure navigation happens after any modal closes
      setTimeout(() => {
        router.replace('/(owner)/dashboard');
      }, 100);
    } catch (error) {
      console.error('❌ Error redirecting owner:', error);
      // Fallback: force redirect even from modal screens
      try {
        if (router.canDismiss()) {
          router.dismissAll();
        }
        setTimeout(() => {
          router.replace('/(owner)/dashboard');
        }, 100);
      } catch (fallbackError) {
        console.error('❌ Fallback redirect also failed:', fallbackError);
        // Last resort: direct replace
        router.replace('/(owner)/dashboard');
      }
    }
  };

  const redirectBrgyOfficial = async () => {
    try {
      console.log('🏛️ Redirecting barangay official to dashboard');
      router.replace('/(brgy)/dashboard');
    } catch (error) {
      console.error('❌ Error redirecting barangay official:', error);
      router.replace('/(brgy)/dashboard');
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting comprehensive logout process...');
      
      // 1. Sign out from Supabase
      try {
        if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
          const { error: supabaseError } = await supabase.auth.signOut();
          if (supabaseError) {
            console.error('❌ Supabase signout error:', supabaseError);
            // Continue with local cleanup even if Supabase signout fails
          } else {
            console.log('✅ Successfully signed out from Supabase');
          }
        } else {
          console.log('⚠️ Supabase auth.signOut not available, skipping Supabase signout');
        }
      } catch (supabaseError) {
        console.error('❌ Supabase signout failed:', supabaseError);
        // Continue with local cleanup
      }
      
      // 2. Clear only session data, preserve user data
      try {
        await clearAuthSession();
        console.log('✅ Auth session cleared (user data preserved)');
      } catch (storageError) {
        console.error('❌ Error clearing session:', storageError);
        // Continue with state clearing
      }
      
      // 3. Dispatch global logout event before clearing user state
      dispatchCustomEvent('userLoggedOut');
      console.log('✅ Global logout event dispatched');
      
      // 4. Clear user state - this is the most important step
      setUser(null);
      console.log('✅ User state cleared - user is now logged out');
      
      // 5. Set logout flag in cloud for notification
      try {
        // Store logout flag in Supabase user metadata
        await supabase.auth.updateUser({
          data: { user_logged_out: true, logged_out_at: new Date().toISOString() }
        });
        console.log('✅ Logout flag set in cloud for notification');
      } catch (flagError) {
        console.error('❌ Error setting logout flag:', flagError);
        // Continue with logout process even if flag setting fails
      }
      
      // 6. Force a small delay to ensure state update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Comprehensive logout completed successfully');
      
      // 7. Force redirect to login page using Expo Router
      console.log('🔄 Redirecting to login page...');
      router.replace('/login');
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      // Even if there's an error, try to clear local state
      try {
        await clearAuthSession();
        
        // Dispatch global logout event
        dispatchCustomEvent('userLoggedOut');
        
        setUser(null);
        
        // Set logout flag in cloud for notification
        try {
          await supabase.auth.updateUser({
            data: { user_logged_out: true, logged_out_at: new Date().toISOString() }
          });
        } catch (flagError) {
          console.error('❌ Error setting logout flag in emergency:', flagError);
        }
        
        // Force redirect even on error
        console.log('🔄 Emergency redirect to login page...');
        router.replace('/login');
        
        console.log('✅ Emergency logout completed - user is logged out');
      } catch (emergencyError) {
        console.error('❌ Emergency logout failed:', emergencyError);
        
        // Dispatch global logout event
        dispatchCustomEvent('userLoggedOut');
        
        setUser(null);
        
        // Set logout flag in cloud for notification
        try {
          await supabase.auth.updateUser({
            data: { user_logged_out: true, logged_out_at: new Date().toISOString() }
          });
        } catch (flagError) {
          console.error('❌ Error setting logout flag in force logout:', flagError);
        }
        
        // Last resort - force redirect
        console.log('🔄 Force redirect to login page...');
        router.replace('/login');
        
        console.log('✅ Force logout completed - user is logged out');
      }
    }
  };

  useEffect(() => {
    // Initialize auth state on app startup
    const initializeAuth = async () => {
      console.log('🚀 App initialized - checking auth state');
      try {
        // Add a small delay to ensure all modules are loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if user has a valid auth session
        const authUser = await getAuthUser();
        if (authUser) {
          console.log('✅ Found existing auth session - user is logged in');
          // Load user data
          const userWithFallbacks = {
            id: authUser.id || `user-${Date.now()}`,
            roles: authUser.roles || ['tenant'],
            permissions: authUser.permissions || [],
            name: authUser.name,
            email: authUser.email
          };
          setUser(userWithFallbacks);
          setIsLoading(false);
        } else {
          console.log('ℹ️ No auth session found - user needs to login');
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        // On error, assume user needs to login - don't crash the app
        try {
          setUser(null);
          setIsLoading(false);
        } catch (setStateError) {
          console.error('❌ Error setting auth state:', setStateError);
          // Last resort: force loading to false
          setIsLoading(false);
        }
      }
    };
    
    // Wrap in try-catch to prevent app crash
    try {
      initializeAuth();
    } catch (initError) {
      console.error('❌ Fatal error in auth initialization:', initError);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
    redirectOwnerBasedOnListings,
    redirectTenantToTabs,
    redirectBrgyOfficial,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

