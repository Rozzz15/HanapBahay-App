import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    Image, 
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Dimensions,
    Alert
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { supabase } from '@/utils/supabase-client';
import { showAlert } from '@/utils/alert';
import { ConversationRecord, MessageRecord } from '@/types';
import { loadUserProfilePhoto } from '@/utils/user-profile-photos';
import TenantInfoModal from '@/components/TenantInfoModal';

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    isOwner: boolean;
    type?: 'message' | 'image';
    imageUri?: string;
}

interface OwnerChatRoomProps {
    conversationId?: string;
    tenantName?: string;
    tenantAvatar?: string;
    propertyTitle?: string;
    onBack?: () => void;
}

export default function OwnerChatRoom(props?: OwnerChatRoomProps) {
    console.log('🚀🚀🚀 OWNER CHAT ROOM COMPONENT CALLED - START 🚀🚀🚀');
    const componentStartTime = Date.now();
    
    const router = useRouter();
    console.log(`⏱️ OWNER: router hook took ${Date.now() - componentStartTime}ms`);
    
    const { user } = useAuth();
    console.log(`⏱️ OWNER: useAuth hook took ${Date.now() - componentStartTime}ms`);
    
    // Support both direct props (fast) and route params (slow)
    let conversationId: string | undefined;
    let tenantName: string | undefined;
    let tenantAvatar: string | undefined;
    let propertyTitle: string | undefined;
    
    if (props?.conversationId) {
        // Direct props mode (FAST - bypasses Expo Router)
        console.log('⏱️ OWNER: Using direct props (bypassing router params)');
        conversationId = props.conversationId;
        tenantName = props.tenantName;
        tenantAvatar = props.tenantAvatar;
        propertyTitle = props.propertyTitle;
        console.log(`⏱️ OWNER: Props extraction took ${Date.now() - componentStartTime}ms`);
    } else {
        // Route params mode (SLOW - uses Expo Router)
        const paramsStartTime = Date.now();
        console.log('⏱️ OWNER: About to call useLocalSearchParams...');
        const params = useLocalSearchParams();
        console.log(`⏱️ OWNER: useLocalSearchParams took ${Date.now() - paramsStartTime}ms`);
        
        // Simple extraction (like tenant side)
        const extractStartTime = Date.now();
        const rawConvId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;
        conversationId = rawConvId ? String(rawConvId).trim() : (Array.isArray(params.id) ? params.id[0] : params.id);
        
        tenantName = Array.isArray(params.tenantName) ? params.tenantName[0] : params.tenantName;
        tenantAvatar = Array.isArray(params.tenantAvatar) ? params.tenantAvatar[0] : params.tenantAvatar;
        propertyTitle = Array.isArray(params.propertyTitle) ? params.propertyTitle[0] : params.propertyTitle;
        console.log(`⏱️ OWNER: Parameter extraction took ${Date.now() - extractStartTime}ms`);
    }
    
    console.log(`⏱️ OWNER: TOTAL COMPONENT INIT TIME = ${Date.now() - componentStartTime}ms`);
    console.log('✅ OWNER: Initialized with conversationId:', conversationId, 'length:', conversationId?.length);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [tenantInfo, setTenantInfo] = useState<{
        name: string;
        avatar: string;
    }>({
        name: tenantName || 'Tenant',
        avatar: tenantAvatar || ''
    });
    const [conversation, setConversation] = useState<ConversationRecord | null>(null);
    const [showTenantInfoModal, setShowTenantInfoModal] = useState(false);
    const [tenantModalInfo, setTenantModalInfo] = useState<{
        id: string;
        name: string;
        email?: string;
        phone?: string;
        avatar?: string;
    } | null>(null);
    
    const scrollViewRef = useRef<ScrollView>(null);
    const isUserAtBottomRef = useRef(true); // Track if user is at bottom of scroll
    const isInitialLoadRef = useRef(true); // Track if this is the initial load

    const loadMessages = useCallback(async () => {
        if (!conversationId || !user?.id) {
            console.log('⚠️ Missing conversationId or user.id:', { conversationId, userId: user?.id });
            setLoading(false);
            return;
        }

        try {
            const startTime = Date.now();
            console.log('⏱️ OWNER: Starting loadMessages...');
            
            setLoading(true);
            const convIdForLookup = String(conversationId || '').trim();

            // PRIORITY 1: Load messages FIRST (fastest, most important)
            // OPTIMIZED: Query messages for this specific conversation only
            const normalizedConvId = String(conversationId || '').trim();
            
            const queryStart = Date.now();
            console.log('⏱️ OWNER: Starting Supabase query...');
            
            // Use Supabase query to filter on the server side (much faster)
            const { data: conversationMessages, error: messagesError } = await supabase
                .from('messages')
                .select('id, conversation_id, sender_id, text, type, image_uri, created_at, read_by')
                .eq('conversation_id', normalizedConvId)
                .order('created_at', { ascending: true });
            
            console.log(`⏱️ OWNER: Supabase query took ${Date.now() - queryStart}ms`);
            
            if (messagesError) {
                console.error('❌ Error loading messages from Supabase:', messagesError);
                throw messagesError; // Throw error to be caught by outer try-catch
            }

            // Successfully loaded messages from Supabase
            
            // PRIORITY 2: Load conversation data in parallel (for owner ID)
            const convStart = Date.now();
            console.log('⏱️ OWNER: Loading conversation data...');
            
            let conv: ConversationRecord | null = null;
            const convPromise = db.get<ConversationRecord>('conversations', convIdForLookup).catch(() => null);
            
            // Get conversation owner ID to determine message sender role
            conv = await convPromise;
            console.log(`⏱️ OWNER: Conversation data took ${Date.now() - convStart}ms`);
            
            const conversationOwnerId = conv ? (conv.ownerId || conv.owner_id) : null;
            
            // Convert to Message format
            const formattedMessages: Message[] = conversationMessages
                .filter((msg: any) => {
                    // Filter out notifications
                    if (msg.type === 'notification') {
                        // console.log('🚫 Filtered out notification message:', msg.id);
                        return false;
                    }
                    // Ensure message has required fields
                    if (!msg.id) {
                        console.log('🚫 Filtered out message without ID');
                        return false;
                    }
                    return true;
                })
                .map((msg: any) => {
                    const senderId = msg.senderId || msg.sender_id || '';
                    // Check if sender is the conversation owner (not just current user)
                    const isOwner = conversationOwnerId ? senderId === conversationOwnerId : senderId === user.id;
                    const messageText = msg.text || '';
                    const isImage = msg.type === 'image';
                    
                    // Reduced logging to avoid console spam during polling
                    // console.log('📝 Processing message:', msg.id);
                    
                    return {
                        id: msg.id,
                        text: messageText,
                        senderId: senderId,
                        createdAt: msg.createdAt || msg.created_at || new Date().toISOString(),
                        isOwner,
                        type: msg.type || 'message',
                        imageUri: msg.imageUri || msg.image_uri
                    };
                })
                .filter((msg: Message) => {
                    // Include messages with text OR images (don't filter out empty text if it's an image)
                    const hasText = msg.text && msg.text.trim().length > 0;
                    const hasImage = msg.type === 'image' && msg.imageUri;
                    const shouldInclude = hasText || hasImage;
                    
                    // Reduced logging - only log in development mode
                    // if (!shouldInclude) {
                    //     console.log('🚫 Filtered out message without content:', msg.id, { hasText, hasImage, type: msg.type });
                    // }
                    
                    return shouldInclude;
                });

            setMessages(formattedMessages);
            console.log(`✅ OWNER: Loaded ${formattedMessages.length} messages successfully`);
            console.log(`⏱️ OWNER: TOTAL TIME = ${Date.now() - startTime}ms`);
            
            // Only scroll to bottom on initial load or if user is already at bottom
            if (isInitialLoadRef.current || isUserAtBottomRef.current) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: !isInitialLoadRef.current });
                }, 100);
                isInitialLoadRef.current = false;
            }

            // PRIORITY 3: Load tenant info in background (non-blocking, after messages are displayed)
            if (conv) {
                setConversation(conv);
                const tenantId = conv.tenantId || conv.tenant_id;
                if (tenantId) {
                    // Load tenant info without blocking
                    db.get('users', tenantId).then(tenantRecord => {
                        if (tenantRecord) {
                            const name = (tenantRecord as any).name || tenantName || 'Tenant';
                            const email = (tenantRecord as any).email;
                            const phone = (tenantRecord as any).phone;
                            setTenantInfo({ name, avatar: tenantAvatar || '' });
                            setTenantModalInfo({
                                id: tenantId,
                                name,
                                email,
                                phone,
                                avatar: tenantAvatar || ''
                            });
                            // Load avatar in background (slowest)
                            loadUserProfilePhoto(tenantId).then(avatar => {
                                if (avatar) {
                                    setTenantInfo({ name, avatar });
                                    setTenantModalInfo(prev => ({ ...prev!, avatar }));
                                }
                            }).catch(() => {});
                        }
                    }).catch(() => {
                        // Fallback to params
                        if (tenantName) {
                            setTenantInfo({ name: tenantName, avatar: tenantAvatar || '' });
                            setTenantModalInfo({
                                id: tenantId,
                                name: tenantName,
                                avatar: tenantAvatar || ''
                            });
                        }
                    });
                } else if (tenantName) {
                    setTenantInfo({ name: tenantName, avatar: tenantAvatar || '' });
                    setTenantModalInfo({
                        id: '',
                        name: tenantName,
                        avatar: tenantAvatar || ''
                    });
                }
            } else if (tenantName) {
                // No conversation found, use fallback
                setTenantInfo({ name: tenantName, avatar: tenantAvatar || '' });
            }

        } catch (error) {
            console.error('❌ Owner: Error loading messages:', error);
            showAlert('Error', 'Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [conversationId, user?.id]);

    useFocusEffect(
        useCallback(() => {
            if (conversationId && user?.id) {
                // Load messages asynchronously (non-blocking)
                setTimeout(() => {
                    loadMessages();
                }, 0);
                
                // Mark conversation as read in background (non-blocking)
                setTimeout(async () => {
                    try {
                        const convIdForRead = String(conversationId).trim();
                        const conv = await db.get<ConversationRecord>('conversations', convIdForRead);
                        if (conv) {
                            await db.upsert('conversations', convIdForRead, {
                                ...conv,
                                unreadByOwner: 0,
                                lastReadByOwner: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        console.error('Error marking conversation as read:', error);
                    }
                }, 100);
                
                // Set up interval to check for new messages every 15 seconds (reduced frequency to minimize interruption)
                const interval = setInterval(() => {
                    loadMessages();
                }, 15000);
                
                return () => clearInterval(interval);
            }
        }, [conversationId, user?.id, loadMessages])
    );

    const sendMessage = async () => {
        // CRITICAL: Ensure conversationId is properly preserved and not truncated
        const activeConversationId = conversationId ? String(conversationId).trim() : undefined;
        
        console.log('🔄 Owner sendMessage called:', {
            conversationId: activeConversationId,
            conversationIdLength: activeConversationId?.length,
            conversationIdType: typeof activeConversationId,
            hasMessage: !!newMessage?.trim(),
            userId: user?.id
        });
        
        // Validate conversationId before proceeding
        if (!activeConversationId || activeConversationId.length < 10) {
            console.error('❌ CRITICAL ERROR: conversationId is missing or truncated!', {
                conversationId: activeConversationId,
                length: activeConversationId?.length,
                type: typeof activeConversationId
            });
            showAlert('Error', 'Invalid conversation ID. Please try again.');
            return;
        }
        
        if (!newMessage || !newMessage.trim() || !user?.id || sending) {
            console.log('⚠️ Owner sendMessage early return:', {
                noMessage: !newMessage,
                noTrim: !newMessage?.trim(),
                noUserId: !user?.id,
                sending
            });
            return;
        }

        try {
            setSending(true);
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();

            // Use the validated conversationId - ensure it's a full string
            const normalizedConversationId = String(activeConversationId).trim();
            
            // Double-check it's still valid after normalization
            if (normalizedConversationId.length < 10 || normalizedConversationId === 'undefined' || normalizedConversationId === 'null') {
                console.error('❌ CRITICAL ERROR: conversationId is invalid after normalization!', {
                    normalized: normalizedConversationId,
                    length: normalizedConversationId.length,
                    original: activeConversationId
                });
                showAlert('Error', 'Invalid conversation ID. Please try again.');
                setSending(false);
                return;
            }
            if (!normalizedConversationId || normalizedConversationId === 'undefined' || normalizedConversationId === 'null') {
                showAlert('Error', 'Invalid conversation. Please try again.');
                setSending(false);
                return;
            }
            
            // Create message record - ensure conversationId is properly set
            const messageRecord: MessageRecord = {
                id: messageId,
                conversationId: normalizedConversationId, // Use normalized ID
                senderId: user.id,
                text: newMessage.trim(),
                createdAt: now,
                type: 'message'
            };
            
            console.log('📤 Owner: Saving message:', {
                messageId,
                conversationId: normalizedConversationId,
                originalConversationId: conversationId,
                senderId: user.id,
                textLength: newMessage.trim().length,
                messageRecord: {
                    id: messageRecord.id,
                    conversationId: messageRecord.conversationId,
                    senderId: messageRecord.senderId,
                    type: messageRecord.type
                }
            });

            // Save message to database
            await db.upsert('messages', messageId, messageRecord);
            
            // Update conversation with last message
            try {
                const conv = await db.get<ConversationRecord>('conversations', normalizedConversationId);
                if (conv) {
                    await db.upsert('conversations', normalizedConversationId, {
                        ...conv,
                        lastMessageText: newMessage.trim(),
                        last_message_text: newMessage.trim(),
                        lastMessageAt: now,
                        last_message_at: now,
                        unreadByTenant: (conv.unreadByTenant || conv.unread_by_tenant || 0) + 1,
                        unread_by_tenant: (conv.unreadByTenant || conv.unread_by_tenant || 0) + 1,
                        updatedAt: now,
                        updated_at: now
                    });
                    console.log('✅ Owner: Conversation updated with last message');
                }
            } catch (error) {
                console.error('⚠️ Owner: Failed to update conversation:', error);
                // Don't fail the send if conversation update fails
            }
            
            // Verify the message was saved correctly
            try {
                const savedMessage = await db.get('messages', messageId) as any;
                console.log('✅ Owner: Message saved successfully:', {
                    savedId: savedMessage?.id,
                    savedConversationId: savedMessage?.conversationId || savedMessage?.conversation_id,
                    expectedConversationId: normalizedConversationId
                });
            } catch (verifyError) {
                console.error('❌ Owner: Error verifying saved message:', verifyError);
            }

            // Update conversation with last message
            try {
                const conv = await db.get<ConversationRecord>('conversations', normalizedConversationId);
                if (conv) {
                    const conversationTenantId = conv.tenantId || conv.tenant_id;
                    const isCurrentUserOwner = user.id === (conv.ownerId || conv.owner_id);
                    
                    await db.upsert('conversations', normalizedConversationId, {
                        ...conv,
                        lastMessageText: newMessage.trim(),
                        lastMessageAt: now,
                        // If owner sends message, increment tenant's unread count
                        // If tenant sends message, increment owner's unread count
                        unreadByOwner: isCurrentUserOwner ? (conv.unreadByOwner || 0) : ((conv.unreadByOwner || conv.unread_by_owner || 0) + 1),
                        unreadByTenant: isCurrentUserOwner ? ((conv.unreadByTenant || conv.unread_by_tenant || 0) + 1) : (conv.unreadByTenant || conv.unread_by_tenant || 0),
                        updatedAt: now
                    });
                }
            } catch (convError) {
                console.error('❌ Error updating conversation:', convError);
            }

            // Add message to local state
            const newMsg: Message = {
                id: messageId,
                text: newMessage.trim(),
                senderId: user.id,
                createdAt: now,
                isOwner: true,
                type: 'message'
            };

            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');

            // Scroll to bottom
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);

            console.log('✅ Message sent successfully');
        } catch (error) {
            console.error('❌ Error sending message:', error);
            showAlert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timeString: string) => {
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (props?.onBack) {
                            // Direct props mode - use callback (INSTANT!)
                            props.onBack();
                        } else {
                            // Route params mode - use router (slow)
                            router.back();
                        }
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if (tenantModalInfo && tenantModalInfo.id) {
                            setShowTenantInfoModal(true);
                        }
                    }}
                    style={styles.headerInfo}
                    activeOpacity={0.7}
                    disabled={!tenantModalInfo || !tenantModalInfo.id}
                >
                    <View style={styles.headerAvatarContainer}>
                        {tenantInfo.avatar ? (
                            <Image source={{ uri: tenantInfo.avatar }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarFallback}>
                                <Text style={styles.headerAvatarText}>
                                    {tenantInfo.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerName}>{tenantInfo.name}</Text>
                        {propertyTitle && (
                            <Text style={styles.headerSubtitle}>{propertyTitle}</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
            
            {/* Tenant Info Modal */}
            {tenantModalInfo && tenantModalInfo.id && (
                <TenantInfoModal
                    visible={showTenantInfoModal}
                    tenantId={tenantModalInfo.id}
                    tenantName={tenantModalInfo.name}
                    tenantEmail={tenantModalInfo.email}
                    tenantPhone={tenantModalInfo.phone}
                    tenantAvatar={tenantModalInfo.avatar}
                    onClose={() => setShowTenantInfoModal(false)}
                />
            )}

            {/* Messages */}
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={[
                        styles.messagesContent,
                        messages.length === 0 && styles.emptyMessagesContent
                    ]}
                    showsVerticalScrollIndicator={false}
                    onScroll={(event) => {
                        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                        const paddingToBottom = 50; // threshold in pixels
                        isUserAtBottomRef.current = 
                            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                    }}
                    scrollEventThrottle={100}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>No messages yet</Text>
                            <Text style={styles.emptyStateSubtext}>Start the conversation by sending a message</Text>
                        </View>
                    ) : (
                        messages.map((message) => {
                            const isCurrentUser = message.isOwner;
                            return (
                                <View
                                    key={message.id}
                                    style={[
                                        styles.messageWrapper,
                                        isCurrentUser ? styles.currentUserMessageWrapper : styles.otherUserMessageWrapper
                                    ]}
                                >
                                    {!isCurrentUser && (
                                        <View style={styles.avatarContainer}>
                                            {tenantInfo.avatar ? (
                                                <Image source={{ uri: tenantInfo.avatar }} style={styles.avatar} />
                                            ) : (
                                                <View style={styles.avatarPlaceholder}>
                                                    <Text style={styles.avatarText}>
                                                        {tenantInfo.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    <View style={[
                                        styles.messageBubble,
                                        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
                                    ]}>
                                        {message.type === 'image' && message.imageUri ? (
                                            <TouchableOpacity
                                                onPress={() => setViewingImage(message.imageUri || null)}
                                                activeOpacity={0.8}
                                            >
                                                <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={[
                                                styles.messageText,
                                                isCurrentUser ? styles.currentUserText : styles.otherUserText
                                            ]}>
                                                {message.text || ''}
                                            </Text>
                                        )}
                                        <Text style={[
                                            styles.messageTime,
                                            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
                                        ]}>
                                            {formatTime(message.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Image Viewer Modal */}
            <Modal
                visible={viewingImage !== null}
                transparent={true}
                onRequestClose={() => setViewingImage(null)}
                animationType="fade"
            >
                <View style={styles.imageViewerContainer}>
                    <TouchableOpacity
                        style={styles.imageViewerClose}
                        onPress={() => setViewingImage(null)}
                    >
                        <Ionicons name="close" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.imageViewerDownload}
                        onPress={async () => {
                            if (!viewingImage) return;
                            
                            try {
                                // Check if running in Expo Go on Android
                                if (Platform.OS === 'android' && !__DEV__) {
                                    Alert.alert(
                                        'Note', 
                                        'Saving images on Android requires a production build. Image viewing and zoom work fully!'
                                    );
                                    return;
                                }
                                
                                // Request media library permissions
                                const { status } = await MediaLibrary.requestPermissionsAsync();
                                
                                if (status !== 'granted') {
                                    Alert.alert('Permission Denied', 'We need permission to save images to your gallery.');
                                    return;
                                }
                                
                                // Download image to cache
                                const filename = viewingImage.split('/').pop() || 'image.jpg';
                                const localUri = FileSystem.cacheDirectory + filename;
                                
                                await FileSystem.downloadAsync(viewingImage, localUri);
                                
                                // Save to media library
                                await MediaLibrary.saveToLibraryAsync(localUri);
                                
                                Alert.alert('Success', 'Image saved to gallery!');
                            } catch (error) {
                                console.error('Error saving image:', error);
                                Alert.alert('Error', 'Failed to save image. Please try again.');
                            }
                        }}
                    >
                        <Ionicons name="download-outline" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    {viewingImage && (
                        <Image
                            source={{ uri: viewingImage }}
                            style={styles.imageViewerImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatarContainer: {
        marginRight: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerAvatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        flexGrow: 1,
    },
    emptyMessagesContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    currentUserMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherUserMessageWrapper: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    currentUserBubble: {
        backgroundColor: '#10B981',
        borderBottomRightRadius: 4,
    },
    otherUserBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#111827',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },
    currentUserTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherUserTime: {
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: '#111827',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    imageViewerDownload: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 10,
    },
    imageViewerImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
});

