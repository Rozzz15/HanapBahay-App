import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    Image, 
    ActivityIndicator,
    RefreshControl,
    Modal,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { showAlert } from '@/utils/alert';
import { ConversationRecord, MessageRecord } from '@/types';
import { createOrFindConversation } from '@/utils/conversation-utils';
import { loadUserProfilePhoto } from '@/utils/user-profile-photos';
import TenantInfoModal from '@/components/TenantInfoModal';
import OwnerChatRoomDirect from './chat-room/[id]';
import { createSafeConversationUpdate } from '@/utils/conversation-update-helper';

interface Conversation {
    id: string;
    ownerId: string;
    tenantId: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    tenantName: string;
    tenantAvatar?: string;
    propertyTitle?: string;
}

function isValidImageUri(uri: string | null | undefined): boolean {
    if (!uri || typeof uri !== 'string' || uri.trim() === '') {
        return false;
    }
    
    const trimmedUri = uri.trim();
    
    if (trimmedUri.includes('data:') && trimmedUri.includes('file://')) {
        return false;
    }
    
    if (trimmedUri.startsWith('data:image/')) {
        const base64Part = trimmedUri.split(',')[1];
        if (!base64Part || base64Part.length < 10) {
            return false;
        }
        if (base64Part.includes('file://')) {
            return false;
        }
        return true;
    }
    
    if (trimmedUri.startsWith('file://')) {
        return true;
    }
    
    if (trimmedUri.startsWith('http://') || trimmedUri.startsWith('https://')) {
        return true;
    }
    
    return false;
}

export default function OwnerMessages() {
    const router = useRouter();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [showTenantInfoModal, setShowTenantInfoModal] = useState(false);
    const [selectedTenantForModal, setSelectedTenantForModal] = useState<{
        id: string;
        name: string;
        email?: string;
        phone?: string;
        avatar?: string;
    } | null>(null);
    
    // State-based navigation (bypass slow Expo Router)
    const [selectedConversation, setSelectedConversation] = useState<{
        id: string;
        tenantName: string;
        tenantAvatar: string;
        propertyTitle: string;
    } | null>(null);

    const loadConversations = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setImageErrors(new Set());
            console.log('🔄 Loading conversations for owner:', user.id);

            // Get all conversations where user is the owner
            const allConversations = await db.list('conversations') || [];
            const ownerConversations = (Array.isArray(allConversations) ? allConversations : []).filter((conv: any) => {
                const convOwnerId = conv.ownerId || conv.owner_id;
                const participantIds = conv.participantIds || conv.participant_ids || [];
                const isOwner = convOwnerId === user.id;
                const isParticipant = Array.isArray(participantIds) && participantIds.includes(user.id);
                return isOwner || isParticipant;
            });

            console.log(`📊 Found ${ownerConversations.length} conversations for owner`);

            // OPTIMIZED: Process conversations with minimal database calls
            const conversationsWithDetails: Conversation[] = await Promise.all(
                ownerConversations.map(async (conv: any) => {
                    const participantIds = conv.participantIds || conv.participant_ids || [];
                    const tenantId = conv.tenantId || conv.tenant_id || 
                        (Array.isArray(participantIds) ? participantIds.find((id: string) => id !== user.id) : null);
                    
                    // Get tenant details
                    let tenantName = 'Unknown Tenant';
                    let tenantAvatar = '';

                    try {
                        if (tenantId) {
                            const tenantRecord = await db.get('users', tenantId);
                            if (tenantRecord) {
                                tenantName = (tenantRecord as any).name || tenantName;
                                
                                // Load tenant profile photo
                                try {
                                    const { loadUserProfilePhoto } = await import('@/utils/user-profile-photos');
                                    const photoUri = await loadUserProfilePhoto(tenantId);
                                    if (photoUri && photoUri.trim() !== '') {
                                        tenantAvatar = photoUri.trim();
                                        console.log('✅ Loaded tenant profile photo for:', tenantId);
                                    }
                                } catch (photoError) {
                                    console.log('⚠️ Could not load tenant profile photo:', photoError);
                                }
                            }
                        }
                    } catch (error) {
                        console.log('Error loading tenant details:', error);
                    }

                    // Get property title if available from conversation
                    const propertyTitle = conv.propertyTitle || conv.property_title || '';

                    // OPTIMIZED: Use conversation's lastMessageText directly
                    const lastMessage = conv.lastMessageText || conv.last_message_text || 'Start conversation';
                    const lastMessageAt = conv.lastMessageAt || conv.last_message_at;

                    return {
                        id: conv.id,
                        ownerId: user.id,
                        tenantId: tenantId || '',
                        lastMessage,
                        lastMessageAt,
                        unreadCount: conv.unreadByOwner || 0,
                        tenantName,
                        tenantAvatar,
                        propertyTitle
                    };
                })
            );

            // OPTIMIZED: Sort by last message time and set conversations
            conversationsWithDetails.sort((a, b) => {
                const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return timeB - timeA;
            });

            setConversations(conversationsWithDetails);
            console.log(`✅ Loaded ${conversationsWithDetails.length} conversations`);

            
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            showAlert('Error', 'Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            if (user?.id) {
                loadConversations();
                
                // Set up interval to check for new messages every 60 seconds (1 minute)
                // Increased from 15s to prevent typed messages from being cleared
                const interval = setInterval(() => {
                    loadConversations();
                }, 60000);
                
                return () => clearInterval(interval);
            }
        }, [user?.id, loadConversations])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setImageErrors(new Set());
        await loadConversations();
        setRefreshing(false);
    }, [loadConversations]);

    const filteredConversations = conversations.filter(conv =>
        conv.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.propertyTitle && conv.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleChatPress = (conversation: Conversation) => {
        console.log('🔵🔵🔵 USER CLICKED CONVERSATION - handleChatPress called');
        const clickStartTime = Date.now();
        
        console.log('⏱️ MESSAGES: Using direct state navigation (bypassing router)...');
        
        // BYPASS EXPO ROUTER - Use state instead (instant!)
        setSelectedConversation({
            id: conversation.id,
            tenantName: conversation.tenantName || '',
            tenantAvatar: conversation.tenantAvatar || '',
            propertyTitle: conversation.propertyTitle || '',
        });
        
        console.log(`⏱️ MESSAGES: State navigation took ${Date.now() - clickStartTime}ms`);

        // Mark as read in the background (after navigation)
        setTimeout(async () => {
            try {
                const existingConv = await db.get('conversations', conversation.id);
                if (existingConv) {
                    const safeUpdate = createSafeConversationUpdate(existingConv as any, {
                        unreadByOwner: 0,
                        lastReadByOwner: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    await db.upsert('conversations', conversation.id, safeUpdate);
                }

                setConversations(prev => prev.map(c => 
                    c.id === conversation.id ? { ...c, unreadCount: 0 } : c
                ));
            } catch (error) {
                console.error('Error marking conversation as read:', error);
            }
        }, 0);
    };

    const handleDeleteConversation = (conversation: Conversation) => {
        Alert.alert(
            'Delete Conversation',
            `Are you sure you want to delete this conversation with ${conversation.tenantName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete conversation
                            await db.remove('conversations', conversation.id);
                            
                            // Delete all messages in this conversation - OPTIMIZED
                            const { data: conversationMessages, error: msgError } = await supabase
                                .from('messages')
                                .select('id')
                                .eq('conversation_id', conversation.id);
                            
                            if (msgError) {
                                console.error('Error fetching messages for deletion:', msgError);
                                throw msgError;
                            }
                            
                            for (const message of conversationMessages) {
                                await db.remove('messages', message.id);
                            }

                            // Update local state
                            setConversations(prev => prev.filter(c => c.id !== conversation.id));
                            
                            Alert.alert('Done', 'Conversation has been deleted');
                        } catch (error) {
                            console.error('Error deleting conversation:', error);
                            Alert.alert('Error', 'Failed to delete conversation');
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return 'Now';
        
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
            
            if (diffInHours < 24) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (diffInHours < 168) {
                return date.toLocaleDateString([], { weekday: 'short' });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        } catch {
            return 'Now';
        }
    };

    // BYPASS EXPO ROUTER: Render chat directly (instant!)
    if (selectedConversation) {
        console.log('⏱️ MESSAGES: Rendering chat component directly (bypassing router)');
        
        return (
            <OwnerChatRoomDirect 
                conversationId={selectedConversation.id}
                tenantName={selectedConversation.tenantName}
                tenantAvatar={selectedConversation.tenantAvatar}
                propertyTitle={selectedConversation.propertyTitle}
                onBack={() => {
                    console.log('⏱️ MESSAGES: Back button pressed');
                    setSelectedConversation(null);
                }}
            />
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <Text style={styles.headerSubtitle}>Communicate with tenants</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Conversations List */}
            <ScrollView 
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
                }
            >
                <View style={styles.content}>
                    {filteredConversations.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="chatbubbles-outline" size={48} color="#10B981" />
                            </View>
                            <Text style={styles.emptyStateTitle}>No conversations yet</Text>
                            <Text style={styles.emptyStateText}>
                                {searchQuery.trim() 
                                    ? `No conversations match your search "${searchQuery}"`
                                    : 'Messages from tenants will appear here when they start a conversation'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.conversationsList}>
                            {filteredConversations.map((conversation) => (
                                <TouchableOpacity 
                                    key={conversation.id} 
                                    style={styles.conversationCard}
                                    onPress={() => {
                                        console.log('🎯 TouchableOpacity onPress fired');
                                        handleChatPress(conversation);
                                    }}
                                    onLongPress={() => handleDeleteConversation(conversation)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.conversationContent}>
                                        {/* Avatar - Clickable to view tenant info */}
                                        <View style={styles.avatarContainer}>
                                            <TouchableOpacity
                                                onPress={async (e) => {
                                                    e.stopPropagation(); // Prevent opening chat
                                                    if (conversation.tenantId) {
                                                        try {
                                                            // Load tenant information
                                                            const tenantRecord = await db.get('users', conversation.tenantId);
                                                            if (tenantRecord) {
                                                                const email = (tenantRecord as any).email;
                                                                const phone = (tenantRecord as any).phone;
                                                                setSelectedTenantForModal({
                                                                    id: conversation.tenantId,
                                                                    name: conversation.tenantName,
                                                                    email,
                                                                    phone,
                                                                    avatar: conversation.tenantAvatar
                                                                });
                                                                setShowTenantInfoModal(true);
                                                            } else {
                                                                // Fallback if tenant record not found
                                                                setSelectedTenantForModal({
                                                                    id: conversation.tenantId,
                                                                    name: conversation.tenantName,
                                                                    avatar: conversation.tenantAvatar
                                                                });
                                                                setShowTenantInfoModal(true);
                                                            }
                                                        } catch (error) {
                                                            console.log('Error loading tenant info:', error);
                                                            // Still show modal with available info
                                                            setSelectedTenantForModal({
                                                                id: conversation.tenantId,
                                                                name: conversation.tenantName,
                                                                avatar: conversation.tenantAvatar
                                                            });
                                                            setShowTenantInfoModal(true);
                                                        }
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                                style={styles.avatarTouchable}
                                            >
                                                <View style={styles.avatar}>
                                                    {conversation.tenantAvatar && 
                                                     conversation.tenantAvatar.trim() !== '' && 
                                                     conversation.tenantAvatar.length > 10 &&
                                                     isValidImageUri(conversation.tenantAvatar) && 
                                                     !imageErrors.has(conversation.id) ? (
                                                        <Image 
                                                            source={{ uri: conversation.tenantAvatar }} 
                                                            style={styles.avatarImage}
                                                            resizeMode="cover"
                                                            onError={() => {
                                                                setImageErrors(prev => new Set(prev).add(conversation.id));
                                                            }}
                                                        />
                                                    ) : (
                                                        <Text style={styles.avatarText}>
                                                            {conversation.tenantName.charAt(0).toUpperCase()}
                                                        </Text>
                                                    )}
                                                    {conversation.unreadCount > 0 && (
                                                        <View style={styles.unreadBadge}>
                                                            <Text style={styles.unreadText}>
                                                                {conversation.unreadCount}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Message Content */}
                                        <View style={styles.messageContent}>
                                            <View style={styles.messageHeader}>
                                                <View style={styles.tenantNameContainer}>
                                                    <Text style={styles.tenantName}>{conversation.tenantName}</Text>
                                                </View>
                                                <Text style={styles.messageTime}>
                                                    {formatTime(conversation.lastMessageAt)}
                                                </Text>
                                            </View>
                                            
                                            {conversation.propertyTitle && (
                                                <Text style={styles.propertyTitle}>{conversation.propertyTitle}</Text>
                                            )}
                                            
                                            <Text 
                                                style={[
                                                    styles.messageText,
                                                    conversation.unreadCount > 0 && styles.unreadMessage
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {conversation.lastMessage}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
            
            {/* Tenant Info Modal */}
            {selectedTenantForModal && selectedTenantForModal.id && (
                <TenantInfoModal
                    visible={showTenantInfoModal}
                    tenantId={selectedTenantForModal.id}
                    tenantName={selectedTenantForModal.name}
                    tenantEmail={selectedTenantForModal.email}
                    tenantPhone={selectedTenantForModal.phone}
                    tenantAvatar={selectedTenantForModal.avatar}
                    onClose={() => {
                        setShowTenantInfoModal(false);
                        setSelectedTenantForModal(null);
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        marginLeft: 12,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    conversationsList: {
        gap: 12,
    },
    conversationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    conversationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatarTouchable: {
        // Touchable area for avatar - no additional styling needed
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6B7280',
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    messageContent: {
        flex: 1,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    tenantNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    messageTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    propertyTitle: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    unreadMessage: {
        fontWeight: '600',
        color: '#111827',
    },
});

