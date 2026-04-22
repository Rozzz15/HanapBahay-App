/**
 * BRAND NEW OWNER CHAT ROOM
 * Clean, optimized, and easy to debug
 * All features included
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, 
    Image, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/utils/db';
import { supabase } from '@/utils/supabase-client';
import { showAlert } from '@/utils/alert';
import { createSafeConversationUpdate } from '@/utils/conversation-update-helper';

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    type: 'message' | 'image';
    imageUri?: string;
}

export default function OwnerChatRoomNew() {
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    
    // Get conversation ID from params
    const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
    
    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [tenantName, setTenantName] = useState('Tenant');
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    
    const scrollRef = useRef<ScrollView>(null);
    
    // Load conversation info and messages
    const loadChat = useCallback(async () => {
        if (!conversationId || !user?.id) return;
        
        try {
            console.log('⏱️ [OWNER-NEW] Loading chat...');
            const start = performance.now();
            
            // Get conversation info
            const conv = await db.get('conversations', conversationId);
            if (conv) {
                const convTenantId = (conv as any).tenantId || (conv as any).tenant_id;
                setTenantId(convTenantId);
                
                // Get tenant name
                if (convTenantId) {
                    const tenant = await db.get('users', convTenantId);
                    if (tenant) {
                        const name = (tenant as any).name || 'Tenant';
                        setTenantName(name);
                    }
                }
            }
            
            // Query messages for this conversation ONLY (fast!)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('Error loading messages:', error);
            } else {
                const msgs = (data || []).map((msg: any) => ({
                    id: msg.id,
                    text: msg.text || '',
                    senderId: msg.sender_id,
                    createdAt: msg.created_at,
                    type: msg.type || 'message',
                    imageUri: msg.image_uri
                }));
                setMessages(msgs);
            }
            
            console.log(`⏱️ [OWNER-NEW] Loaded in ${(performance.now() - start).toFixed(2)}ms`);
            
            // Mark as read
            if (conv) {
                const safeUpdate = createSafeConversationUpdate(conv as any, {
                    unreadByOwner: 0,
                    lastReadByOwner: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                await db.upsert('conversations', conversationId, safeUpdate);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        } finally {
            setLoading(false);
        }
    }, [conversationId, user?.id]);
    
    // Load on mount and focus
    useEffect(() => {
        loadChat();
    }, [loadChat]);
    
    useFocusEffect(
        useCallback(() => {
            if (conversationId && user?.id) {
                loadChat();
                const interval = setInterval(loadChat, 30000); // Refresh every 30s
                return () => clearInterval(interval);
            }
        }, [loadChat, conversationId, user?.id])
    );
    
    // Send text message
    const sendTextMessage = async () => {
        if (!newMessage.trim() || !conversationId || !user?.id || sending) return;
        
        try {
            setSending(true);
            const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            // Save message
            await db.upsert('messages', msgId, {
                id: msgId,
                conversationId,
                senderId: user.id,
                text: newMessage.trim(),
                createdAt: now,
                type: 'message'
            });
            
            // Update conversation
            const conv = await db.get('conversations', conversationId);
            if (conv) {
                const safeUpdate = createSafeConversationUpdate(conv as any, {
                    lastMessageText: newMessage.trim(),
                    lastMessageAt: now,
                    unreadByTenant: ((conv as any).unreadByTenant || 0) + 1,
                    updatedAt: now
                });
                await db.upsert('conversations', conversationId, safeUpdate);
            }
            
            // Add to UI
            setMessages(prev => [...prev, {
                id: msgId,
                text: newMessage.trim(),
                senderId: user.id,
                createdAt: now,
                type: 'message'
            }]);
            
            setNewMessage('');
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            
            console.log('✅ Message sent');
        } catch (error) {
            console.error('Error sending message:', error);
            showAlert('Error', 'Failed to send message');
        } finally {
            setSending(false);
        }
    };
    
    // Send image message
    const sendImage = async () => {
        if (!selectedImage || !conversationId || !user?.id) return;
        
        try {
            setSending(true);
            const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();
            
            await db.upsert('messages', msgId, {
                id: msgId,
                conversationId,
                senderId: user.id,
                text: '',
                createdAt: now,
                type: 'image',
                imageUri: selectedImage.uri
            });
            
            const conv = await db.get('conversations', conversationId);
            if (conv) {
                const safeUpdate = createSafeConversationUpdate(conv as any, {
                    lastMessageText: '📷 Image',
                    lastMessageAt: now,
                    unreadByTenant: ((conv as any).unreadByTenant || 0) + 1,
                    updatedAt: now
                });
                await db.upsert('conversations', conversationId, safeUpdate);
            }
            
            setMessages(prev => [...prev, {
                id: msgId,
                text: '',
                senderId: user.id,
                createdAt: now,
                type: 'image',
                imageUri: selectedImage.uri
            }]);
            
            setSelectedImage(null);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error('Error sending image:', error);
            showAlert('Error', 'Failed to send image');
        } finally {
            setSending(false);
        }
    };
    
    // Pick image
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Required', 'Please grant permission to access photos');
                return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
        }
    };
    
    // Delete message
    const deleteMessage = async (msgId: string) => {
        try {
            await db.remove('messages', msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
            console.log('✅ Message deleted');
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };
    
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#10B981" />
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{tenantName}</Text>
                <View style={{ width: 40 }} />
            </View>
            
            {/* Messages */}
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView 
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
                >
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <View 
                                key={msg.id}
                                style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}
                            >
                                <TouchableOpacity
                                    style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
                                    onLongPress={() => {
                                        if (isMe) {
                                            Alert.alert('Delete Message', 'Delete this message?', [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(msg.id) }
                                            ]);
                                        }
                                    }}
                                    delayLongPress={500}
                                >
                                    {msg.type === 'image' && msg.imageUri ? (
                                        <TouchableOpacity onPress={() => setViewingImage(msg.imageUri!)}>
                                            <Image source={{ uri: msg.imageUri }} style={styles.messageImage} />
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                                            {msg.text}
                                        </Text>
                                    )}
                                    <Text style={styles.messageTime}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
                
                {/* Input */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                        <Ionicons name="image-outline" size={24} color="#10B981" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity 
                        onPress={sendTextMessage} 
                        style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
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
            
            {/* Image Preview Modal */}
            {selectedImage && (
                <Modal visible={true} transparent animationType="slide">
                    <View style={styles.imagePreviewContainer}>
                        <View style={styles.imagePreviewHeader}>
                            <TouchableOpacity onPress={() => setSelectedImage(null)}>
                                <Ionicons name="close" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.imagePreviewTitle}>Send Image</Text>
                            <TouchableOpacity onPress={sendImage} disabled={sending}>
                                {sending ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Ionicons name="send" size={24} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} resizeMode="contain" />
                    </View>
                </Modal>
            )}
            
            {/* Image Viewer Modal */}
            {viewingImage && (
                <Modal visible={true} transparent animationType="fade">
                    <View style={styles.imageViewerContainer}>
                        <TouchableOpacity style={styles.imageViewerClose} onPress={() => setViewingImage(null)}>
                            <Ionicons name="close" size={32} color="#FFF" />
                        </TouchableOpacity>
                        <Image source={{ uri: viewingImage }} style={styles.imageViewer} resizeMode="contain" />
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
    },
    messageRow: {
        marginBottom: 12,
    },
    myMessageRow: {
        alignItems: 'flex-end',
    },
    theirMessageRow: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#10B981',
    },
    theirBubble: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myText: {
        color: '#FFFFFF',
    },
    theirText: {
        color: '#111827',
    },
    messageTime: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    imageButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
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
    imagePreviewContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
    },
    imagePreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
    },
    imagePreviewTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    imagePreview: {
        flex: 1,
        width: '100%',
    },
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    imageViewer: {
        width: '100%',
        height: '100%',
    },
});
