import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Download, Share2 } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  X,
  ArrowLeft,
  Edit,
  Upload,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Image as ImageIcon,
  Play,
  Video as VideoIcon,
} from 'lucide-react-native';
import { sharedStyles, designTokens } from '../../styles/owner-dashboard-styles';
import { db } from '../../utils/db';
import { DbUserRecord, PublishedListingRecord, TenantComplaintRecord } from '../../types';
import {
  getComplaintsByBarangay,
  getComplaintWithDetails,
  updateComplaintStatus,
  addSettlementDocuments,
  getComplaintCategoryLabel,
  getStatusLabel,
  getUrgencyColor,
  markComplaintAsRead,
} from '../../utils/tenant-complaints';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

// Type assertion for FileSystem directories
const FS = FileSystem as typeof FileSystem & {
  documentDirectory: string | null;
  cacheDirectory: string | null;
};
import * as Sharing from 'expo-sharing';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<TenantComplaintRecord[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<TenantComplaintRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [complaintDetails, setComplaintDetails] = useState<{
    complaint: TenantComplaintRecord;
    tenant?: DbUserRecord;
    property?: PublishedListingRecord;
  } | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | TenantComplaintRecord['status']>('all');
  const [downloadingDocument, setDownloadingDocument] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});

  // Video player setup
  const videoPlayer = useVideoPlayer(
    selectedComplaint && selectedVideoIndex !== null 
      ? selectedComplaint.videos[selectedVideoIndex] 
      : '',
    (player) => {
      player.loop = false;
      player.play();
    }
  );

  // Cleanup video player on unmount
  useEffect(() => {
    return () => {
      if (videoPlayer) {
        try {
          console.log('🧹 Cleaning up video player on unmount');
          videoPlayer.pause();
          videoPlayer.release();
        } catch (err) {
          console.log('Error releasing video player:', err);
        }
      }
    };
  }, [videoPlayer]);

  const loadComplaints = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get barangay name from user data
      const userRecord = await db.get<DbUserRecord>('users', user.id);
      const barangay = userRecord?.barangay || 'Unknown Barangay';
      console.log('🏢 Loading complaints for barangay:', barangay);
      console.log('👤 User record:', { id: userRecord?.id, name: userRecord?.name, barangay: userRecord?.barangay });

      const barangayComplaints = await getComplaintsByBarangay(barangay);
      console.log('📋 Found complaints:', barangayComplaints.length);
      console.log('📋 Complaints data:', barangayComplaints.map(c => ({ 
        id: c.id.slice(0, 8), 
        category: c.category, 
        status: c.status,
        propertyId: c.propertyId,
        tenantId: c.tenantId
      })));
      setComplaints(barangayComplaints);
    } catch (error) {
      console.error('❌ Error loading complaints:', error);
      Alert.alert('Error', 'Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !user.roles?.includes('brgy_official')) {
      router.replace('/login');
      return;
    }
    loadComplaints();
  }, [user, router, loadComplaints]);

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [loadComplaints])
  );

  const generateVideoThumbnails = async (videoUris: string[]) => {
    const thumbnails: { [key: string]: string } = {};
    
    for (const videoUri of videoUris) {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1000, // Get thumbnail at 1 second
          quality: 0.8,
        });
        thumbnails[videoUri] = uri;
      } catch (error) {
        console.warn('Failed to generate thumbnail for video:', videoUri, error);
        // Keep using default placeholder if thumbnail generation fails
      }
    }
    
    return thumbnails;
  };

  const handleViewDetails = async (complaint: TenantComplaintRecord) => {
    setSelectedComplaint(complaint);
    const details = await getComplaintWithDetails(complaint.id);
    setComplaintDetails(details);
    // Use the fresh data from details if available
    setStatusNotes(details?.complaint.barangayNotes || complaint.barangayNotes || '');
    
    // Generate video thumbnails if there are videos
    if (complaint.videos && complaint.videos.length > 0) {
      const thumbnails = await generateVideoThumbnails(complaint.videos);
      setVideoThumbnails(thumbnails);
    }
    
    // Mark complaint as read when opened by barangay official
    if (user?.id && !complaint.isRead) {
      await markComplaintAsRead(complaint.id, user.id);
      // Refresh the complaints list to update the UI
      loadComplaints();
    }
    
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (newStatus: TenantComplaintRecord['status']) => {
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await updateComplaintStatus(selectedComplaint.id, newStatus, statusNotes || undefined);
      
      // Refresh the complaint details to show updated data
      const updated = await getComplaintWithDetails(selectedComplaint.id);
      if (updated) {
        setSelectedComplaint(updated.complaint);
        setComplaintDetails(updated);
        setStatusNotes(updated.complaint.barangayNotes || '');
      }
      
      Alert.alert('Success', `Complaint status updated to ${getStatusLabel(newStatus)}.`);
      setShowStatusModal(false);
      await loadComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDocument = async (documentUri: string, index: number) => {
    try {
      setDownloadingDocument(true);
      
      // Get file extension
      const fileExtension = documentUri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
      const fileName = `settlement_doc_${index + 1}_${Date.now()}.${fileExtension}`;
      const fileUri = `${FS.documentDirectory || ''}${fileName}`;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(documentUri, fileUri);
      
      if (downloadResult.status === 200) {
        Alert.alert(
          'Download Complete',
          `Document saved to: ${fileName}`,
          [
            { text: 'OK' },
            {
              text: 'Share',
              onPress: () => handleShareDocument(downloadResult.uri, fileName),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to download document.');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert('Error', 'Failed to download document. Please try again.');
    } finally {
      setDownloadingDocument(false);
    }
  };

  const handleShareDocument = async (documentUri: string, fileName?: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      // If documentUri is a remote URL, download it first
      let localUri = documentUri;
      if (documentUri.startsWith('http')) {
        setDownloadingDocument(true);
        const fileExtension = documentUri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
        const tempFileName = fileName || `document_${Date.now()}.${fileExtension}`;
        const tempUri = `${FS.cacheDirectory || ''}${tempFileName}`;
        
        const downloadResult = await FileSystem.downloadAsync(documentUri, tempUri);
        
        if (downloadResult.status === 200) {
          localUri = downloadResult.uri;
        } else {
          Alert.alert('Error', 'Failed to prepare document for sharing.');
          setDownloadingDocument(false);
          return;
        }
      }

      await Sharing.shareAsync(localUri, {
        dialogTitle: 'Share Settlement Document',
        mimeType: localUri.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      });
      
      setDownloadingDocument(false);
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', 'Failed to share document. Please try again.');
      setDownloadingDocument(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleAddSettlementDocuments = async () => {
    if (!selectedComplaint) return;

    try {
      // Use DocumentPicker to support both images and PDFs
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return; // User cancelled
      }

      if (result.assets && result.assets.length > 0) {
        // File size validation
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
        const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB total
        
        const oversizedFiles: string[] = [];
        let totalSize = 0;
        const validAssets: typeof result.assets = [];
        
        for (const asset of result.assets) {
          const fileSize = asset.size || 0;
          totalSize += fileSize;
          
          if (fileSize > MAX_FILE_SIZE) {
            oversizedFiles.push(`${asset.name} (${formatFileSize(fileSize)})`);
          } else {
            validAssets.push(asset);
          }
        }
        
        // Check if any files are too large
        if (oversizedFiles.length > 0) {
          Alert.alert(
            'Files Too Large',
            `The following files exceed the 10 MB limit:\n\n${oversizedFiles.join('\n')}\n\nPlease compress or resize these files and try again.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Check if total size exceeds limit
        if (totalSize > MAX_TOTAL_SIZE) {
          Alert.alert(
            'Total Size Too Large',
            `Total size: ${formatFileSize(totalSize)}\nMaximum allowed: ${formatFileSize(MAX_TOTAL_SIZE)}\n\nPlease select fewer files or compress them.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Show file details before upload
        const fileDetails = validAssets.map((asset, index) => 
          `${index + 1}. ${asset.name} (${formatFileSize(asset.size || 0)})`
        ).join('\n');
        
        Alert.alert(
          'Upload Documents',
          `${validAssets.length} document(s) selected:\n\n${fileDetails}\n\nTotal: ${formatFileSize(totalSize)}\n\nProceed with upload?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upload',
              onPress: async () => {
                try {
                  const documentUris = validAssets.map(asset => asset.uri);
                  
                  await addSettlementDocuments(selectedComplaint.id, documentUris);
                  
                  // Refresh the complaint details to show uploaded documents
                  const updated = await getComplaintWithDetails(selectedComplaint.id);
                  if (updated) {
                    setSelectedComplaint(updated.complaint);
                    setComplaintDetails(updated);
                  }
                  
                  Alert.alert('Success', `${documentUris.length} settlement document(s) uploaded successfully.`);
                  await loadComplaints();
                } catch (uploadError) {
                  console.error('Error uploading documents:', uploadError);
                  Alert.alert('Error', 'Failed to upload documents. Please try again.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting documents:', error);
      Alert.alert('Error', 'Failed to select documents. Please try again.');
    }
  };

  const getStatusIcon = (status: TenantComplaintRecord['status']) => {
    switch (status) {
      case 'submitted':
        return <Clock size={16} color={designTokens.colors.warning} />;
      case 'received_by_brgy':
        return <AlertTriangle size={16} color={designTokens.colors.info} />;
      case 'under_review':
        return <FileText size={16} color={designTokens.colors.info} />;
      case 'for_mediation':
        return <AlertTriangle size={16} color={designTokens.colors.warning} />;
      case 'resolved':
        return <CheckCircle size={16} color={designTokens.colors.success} />;
      case 'closed':
        return <CheckCircle size={16} color={designTokens.colors.textMuted} />;
      default:
        return <AlertTriangle size={16} color={designTokens.colors.textMuted} />;
    }
  };

  const getStatusColor = (status: TenantComplaintRecord['status']) => {
    switch (status) {
      case 'submitted':
        return designTokens.colors.warning;
      case 'received_by_brgy':
        return designTokens.colors.info;
      case 'under_review':
        return designTokens.colors.info;
      case 'for_mediation':
        return designTokens.colors.warning;
      case 'resolved':
        return designTokens.colors.success;
      case 'closed':
        return designTokens.colors.textMuted;
      default:
        return designTokens.colors.textMuted;
    }
  };

  const filteredComplaints = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  const newComplaints = complaints.filter(c => c.status === 'submitted').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designTokens.colors.primary} />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.pageContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.pageTitle}>Complaints Management</Text>
              <Text style={styles.pageSubtitle}>
                {complaints.length > 0 
                  ? `${filteredComplaints.length} ${filterStatus === 'all' ? 'total' : filterStatus} complaint${filteredComplaints.length !== 1 ? 's' : ''}`
                  : 'Monitor and resolve tenant complaints'}
              </Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[styles.filterTabText, filterStatus === 'all' && styles.filterTabTextActive]}>
                  All ({complaints.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterStatus === 'submitted' && styles.filterTabActive]}
                onPress={() => setFilterStatus('submitted')}
              >
                <Text style={[styles.filterTabText, filterStatus === 'submitted' && styles.filterTabTextActive]}>
                  New ({newComplaints})
                </Text>
                {newComplaints > 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{newComplaints}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterStatus === 'under_review' && styles.filterTabActive]}
                onPress={() => setFilterStatus('under_review')}
              >
                <Text style={[styles.filterTabText, filterStatus === 'under_review' && styles.filterTabTextActive]}>
                  Under Review
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterStatus === 'for_mediation' && styles.filterTabActive]}
                onPress={() => setFilterStatus('for_mediation')}
              >
                <Text style={[styles.filterTabText, filterStatus === 'for_mediation' && styles.filterTabTextActive]}>
                  For Mediation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, filterStatus === 'resolved' && styles.filterTabActive]}
                onPress={() => setFilterStatus('resolved')}
              >
                <Text style={[styles.filterTabText, filterStatus === 'resolved' && styles.filterTabTextActive]}>
                  Resolved
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Complaints List */}
          {filteredComplaints.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <AlertTriangle size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>
                {filterStatus === 'all' ? 'No Complaints' : 'No Matching Complaints'}
              </Text>
              <Text style={styles.emptyText}>
                {filterStatus === 'all'
                  ? 'No complaints have been submitted yet.'
                  : `No complaints with status "${getStatusLabel(filterStatus as TenantComplaintRecord['status'])}".`}
              </Text>
            </View>
          ) : (
            <View style={styles.complaintsContainer}>
              {filteredComplaints.map((complaint) => (
                <TouchableOpacity
                  key={complaint.id}
                  style={[
                    styles.complaintCard,
                    complaint.status === 'submitted' && !complaint.isRead && styles.newComplaintCard,
                  ]}
                  onPress={() => handleViewDetails(complaint)}
                  activeOpacity={0.7}
                >
                  {/* Complaint Header */}
                  <View style={styles.complaintHeader}>
                    <View style={styles.complaintHeaderLeft}>
                      <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(complaint.status)}20` }]}>
                        {getStatusIcon(complaint.status)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.complaintTitleRow}>
                          <Text style={styles.complaintCategory}>
                            {getComplaintCategoryLabel(complaint.category)}
                          </Text>
                          {complaint.status === 'submitted' && !complaint.isRead && (
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.complaintDate}>
                          {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(complaint.status)}` }]}>
                      <Text style={styles.statusText}>
                        {getStatusLabel(complaint.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Complaint Description */}
                  <Text style={styles.complaintDescription} numberOfLines={3}>
                    {complaint.description}
                  </Text>

                  {/* Complaint Footer */}
                  <View style={styles.complaintFooter}>
                    <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(complaint.urgency)}`, borderWidth: 1, borderColor: getUrgencyColor(complaint.urgency) }]}>
                      <Text style={styles.urgencyText}>
                        {complaint.urgency.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.complaintMeta}>
                      {complaint.isAnonymous ? (
                        <Text style={styles.anonymousLabel}>🔒 Anonymous</Text>
                      ) : (
                        <Text style={styles.mediaCount}>
                          📎 {complaint.photos.length + complaint.videos.length} attachment{complaint.photos.length + complaint.videos.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Complaint Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedComplaint(null);
          setComplaintDetails(null);
          setSelectedPhotoIndex(null);
        }}
      >
        <SafeAreaView style={sharedStyles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complaint Details</Text>
            <TouchableOpacity
              onPress={() => {
                setShowDetailModal(false);
                setSelectedComplaint(null);
                setComplaintDetails(null);
                setSelectedPhotoIndex(null);
              }}
            >
              <X size={24} color={designTokens.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={sharedStyles.scrollView} showsVerticalScrollIndicator={false}>
            {selectedComplaint && complaintDetails && (
              <View style={sharedStyles.pageContainer}>
                {/* Status Header Card - Modern Design */}
                <View style={[sharedStyles.card, { backgroundColor: designTokens.colors.white, borderLeftWidth: 4, borderLeftColor: getStatusColor(selectedComplaint.status) }]}>
                  <View style={styles.modernHeader}>
                    <View style={styles.modernHeaderTop}>
                      <View style={styles.modernHeaderLeft}>
                        <View style={[styles.modernStatusIcon, { backgroundColor: `${getStatusColor(selectedComplaint.status)}15` }]}>
                          {getStatusIcon(selectedComplaint.status)}
                        </View>
                        <View style={styles.modernHeaderText}>
                          <Text style={styles.modernCategory}>
                            {getComplaintCategoryLabel(selectedComplaint.category)}
                          </Text>
                          <Text style={styles.modernComplaintId}>ID: #{selectedComplaint.id.slice(0, 8)}</Text>
                        </View>
                      </View>
                      <View style={[styles.modernStatusBadge, { backgroundColor: `${getStatusColor(selectedComplaint.status)}` }]}>
                        <Text style={styles.modernStatusText}>{getStatusLabel(selectedComplaint.status)}</Text>
                      </View>
                    </View>
                    <View style={styles.modernHeaderBottom}>
                      <View style={[styles.modernPriorityBadge, { backgroundColor: `${getUrgencyColor(selectedComplaint.urgency)}15`, borderColor: getUrgencyColor(selectedComplaint.urgency) }]}>
                        <Text style={[styles.modernPriorityText, { color: getUrgencyColor(selectedComplaint.urgency) }]}>
                          {selectedComplaint.urgency.toUpperCase()} PRIORITY
                        </Text>
                      </View>
                      <View style={styles.modernDateContainer}>
                        <Calendar size={14} color={designTokens.colors.textSecondary} />
                        <Text style={styles.modernDateText}>
                          {new Date(selectedComplaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description Card - Clean Design */}
                <View style={[sharedStyles.card, styles.modernSection]}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.modernSectionIconContainer}>
                      <FileText size={18} color={designTokens.colors.primary} />
                    </View>
                    <Text style={styles.modernSectionTitle}>Complaint Description</Text>
                  </View>
                  <Text style={styles.modernDescription}>{selectedComplaint.description}</Text>
                </View>

                {/* Property & Tenant Info Card - Combined for Better Layout */}
                <View style={[sharedStyles.card, styles.modernSection]}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.modernSectionIconContainer}>
                      <MapPin size={18} color={designTokens.colors.primary} />
                    </View>
                    <Text style={styles.modernSectionTitle}>Property & Contact Info</Text>
                  </View>
                  
                  {complaintDetails.property && (
                    <View style={styles.modernInfoRow}>
                      <View style={styles.modernInfoIcon}>
                        <MapPin size={16} color={designTokens.colors.textSecondary} />
                      </View>
                      <View style={styles.modernInfoContent}>
                        <Text style={styles.modernInfoLabel}>Property Address</Text>
                        <Text style={styles.modernInfoValue}>{complaintDetails.property.address}</Text>
                      </View>
                    </View>
                  )}

                  {!selectedComplaint.isAnonymous && complaintDetails.tenant ? (
                    <>
                      <View style={styles.modernDivider} />
                      <View style={styles.modernInfoRow}>
                        <View style={styles.modernInfoIcon}>
                          <User size={16} color={designTokens.colors.textSecondary} />
                        </View>
                        <View style={styles.modernInfoContent}>
                          <Text style={styles.modernInfoLabel}>Tenant Name</Text>
                          <Text style={styles.modernInfoValue}>{complaintDetails.tenant.name}</Text>
                        </View>
                      </View>
                      <View style={styles.modernInfoRow}>
                        <View style={styles.modernInfoIcon}>
                          <Mail size={16} color={designTokens.colors.textSecondary} />
                        </View>
                        <View style={styles.modernInfoContent}>
                          <Text style={styles.modernInfoLabel}>Email</Text>
                          <Text style={styles.modernInfoValue}>{complaintDetails.tenant.email}</Text>
                        </View>
                      </View>
                      <View style={styles.modernInfoRow}>
                        <View style={styles.modernInfoIcon}>
                          <Phone size={16} color={designTokens.colors.textSecondary} />
                        </View>
                        <View style={styles.modernInfoContent}>
                          <Text style={styles.modernInfoLabel}>Phone</Text>
                          <Text style={styles.modernInfoValue}>{complaintDetails.tenant.phone}</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.modernDivider} />
                      <View style={styles.modernAnonymousContainer}>
                        <AlertTriangle size={20} color={designTokens.colors.warning} />
                        <Text style={styles.modernAnonymousText}>This complaint was submitted anonymously</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Media Section - Modern Gallery */}
                {(selectedComplaint.photos.length > 0 || selectedComplaint.videos.length > 0) && (
                  <View style={[sharedStyles.card, styles.modernSection]}>
                    <View style={styles.modernSectionHeader}>
                      <View style={styles.modernSectionIconContainer}>
                        <ImageIcon size={18} color={designTokens.colors.primary} />
                      </View>
                      <Text style={styles.modernSectionTitle}>
                        Attached Media ({selectedComplaint.photos.length + selectedComplaint.videos.length})
                      </Text>
                    </View>
                    
                    {selectedComplaint.photos.length > 0 && (
                      <>
                        <Text style={styles.modernMediaLabel}>Photos ({selectedComplaint.photos.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modernMediaScroll}>
                          {selectedComplaint.photos.map((photo, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => setSelectedPhotoIndex(index)}
                              style={styles.modernPhotoThumbnail}
                            >
                              <Image source={{ uri: photo }} style={styles.modernThumbnailImage} />
                              <View style={styles.modernPhotoOverlay}>
                                <ImageIcon size={20} color="#FFFFFF" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </>
                    )}

                    {selectedComplaint.videos.length > 0 && (
                      <>
                        {selectedComplaint.photos.length > 0 && <View style={styles.modernMediaSpacer} />}
                        <Text style={styles.modernMediaLabel}>Videos ({selectedComplaint.videos.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modernMediaScroll}>
                          {selectedComplaint.videos.map((video, index) => {
                            const thumbnail = videoThumbnails[video];
                            return (
                              <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedVideoIndex(index)}
                                style={styles.modernVideoThumbnail}
                                activeOpacity={0.8}
                              >
                                {/* Video thumbnail image or placeholder */}
                                {thumbnail ? (
                                  <Image 
                                    source={{ uri: thumbnail }} 
                                    style={styles.modernThumbnailImage}
                                  />
                                ) : (
                                  <View style={styles.modernVideoPlaceholder}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.videoThumbnailLabel}>Loading...</Text>
                                  </View>
                                )}
                                {/* Gradient overlay for better text visibility */}
                                <View style={styles.videoGradientOverlay} />
                                {/* Play button */}
                                <View style={styles.modernVideoPlayButton}>
                                  <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                                {/* Video number label */}
                                <Text style={styles.modernVideoNumber}>Video {index + 1}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </>
                    )}
                  </View>
                )}

                {/* Barangay Notes - Modern Editable */}
                <View style={[sharedStyles.card, styles.modernSection]}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.modernSectionIconContainer}>
                      <Edit size={18} color={designTokens.colors.primary} />
                    </View>
                    <Text style={styles.modernSectionTitle}>Barangay Notes</Text>
                    <TouchableOpacity
                      onPress={() => setShowNotesModal(true)}
                      style={styles.modernEditButton}
                    >
                      <Edit size={16} color={designTokens.colors.primary} />
                      <Text style={styles.modernEditButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modernNotesContainer}>
                    <Text style={styles.modernNotesText}>
                      {complaintDetails.complaint.barangayNotes || 'No notes have been added yet. Click "Edit" to add notes about this complaint.'}
                    </Text>
                  </View>
                </View>

                {/* Settlement Documents */}
                {complaintDetails.complaint.settlementDocuments && complaintDetails.complaint.settlementDocuments.length > 0 && (
                  <View style={[sharedStyles.card, styles.modernSection]}>
                    <View style={styles.modernSectionHeader}>
                      <View style={styles.modernSectionIconContainer}>
                        <FileText size={18} color={designTokens.colors.primary} />
                      </View>
                      <Text style={styles.modernSectionTitle}>
                        Settlement Documents ({complaintDetails.complaint.settlementDocuments?.length || 0})
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modernMediaScroll}>
                      {complaintDetails.complaint.settlementDocuments?.map((docUri, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modernDocumentThumbnail}
                          activeOpacity={0.7}
                          onPress={() => setSelectedDocumentIndex(index)}
                        >
                          <Image source={{ uri: docUri }} style={styles.modernThumbnailImage} />
                          <View style={styles.modernDocumentOverlay}>
                            <FileText size={20} color="#FFFFFF" />
                            <Text style={styles.modernDocumentLabel}>Doc {index + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Action Buttons - Modern Style */}
                <View style={styles.modernActionButtons}>
                  <TouchableOpacity
                    style={styles.modernActionButtonPrimary}
                    onPress={() => setShowStatusModal(true)}
                  >
                    <Edit size={18} color="#FFFFFF" />
                    <Text style={styles.modernActionButtonTextPrimary}>Update Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modernActionButtonSecondary}
                    onPress={handleAddSettlementDocuments}
                  >
                    <Upload size={18} color={designTokens.colors.primary} />
                    <Text style={styles.modernActionButtonTextSecondary}>Upload Documents</Text>
                  </TouchableOpacity>
                </View>

                {/* Timeline - Clean Design */}
                <View style={[sharedStyles.card, styles.modernSection, { marginBottom: designTokens.spacing.xl }]}>
                  <View style={styles.modernSectionHeader}>
                    <View style={styles.modernSectionIconContainer}>
                      <Clock size={18} color={designTokens.colors.primary} />
                    </View>
                    <Text style={styles.modernSectionTitle}>Timeline</Text>
                  </View>
                  <View style={styles.modernTimelineContainer}>
                    <View style={styles.modernTimelineItem}>
                      <View style={styles.modernTimelineDot} />
                      <View style={styles.modernTimelineContent}>
                        <Text style={styles.modernTimelineLabel}>Submitted</Text>
                        <Text style={styles.modernTimelineDate}>
                          {new Date(selectedComplaint.createdAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                    {selectedComplaint.resolvedAt && (
                      <View style={styles.modernTimelineItem}>
                        <View style={[styles.modernTimelineDot, { backgroundColor: designTokens.colors.success }]} />
                        <View style={styles.modernTimelineContent}>
                          <Text style={styles.modernTimelineLabel}>Resolved</Text>
                          <Text style={styles.modernTimelineDate}>
                            {new Date(selectedComplaint.resolvedAt).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                    )}
                    {selectedComplaint.closedAt && (
                      <View style={styles.modernTimelineItem}>
                        <View style={[styles.modernTimelineDot, { backgroundColor: designTokens.colors.textMuted }]} />
                        <View style={styles.modernTimelineContent}>
                          <Text style={styles.modernTimelineLabel}>Closed</Text>
                          <Text style={styles.modernTimelineDate}>
                            {new Date(selectedComplaint.closedAt).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSubtitle}>Select new status for this complaint</Text>

            {(['received_by_brgy', 'under_review', 'for_mediation', 'resolved', 'closed'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusOption}
                onPress={() => handleUpdateStatus(status)}
                disabled={updating}
              >
                <Text style={styles.statusOptionText}>{getStatusLabel(status)}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[sharedStyles.secondaryButton, { marginTop: designTokens.spacing.md }]}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={sharedStyles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter notes about this complaint..."
              placeholderTextColor={designTokens.colors.textMuted}
              multiline
              numberOfLines={6}
              value={statusNotes}
              onChangeText={setStatusNotes}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[sharedStyles.secondaryButton, { flex: 1 }]}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={sharedStyles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sharedStyles.primaryButton, { flex: 1 }]}
                onPress={async () => {
                  if (selectedComplaint) {
                    await updateComplaintStatus(selectedComplaint.id, selectedComplaint.status, statusNotes);
                    
                    // Refresh the complaint details to show updated notes
                    const updated = await getComplaintWithDetails(selectedComplaint.id);
                    if (updated) {
                      setSelectedComplaint(updated.complaint);
                      setComplaintDetails(updated);
                      setStatusNotes(updated.complaint.barangayNotes || '');
                    }
                    
                    Alert.alert('Success', 'Notes updated successfully.');
                    setShowNotesModal(false);
                    await loadComplaints();
                  }
                }}
              >
                <Text style={sharedStyles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Viewer Modal */}
      {selectedComplaint && selectedPhotoIndex !== null && (
        <Modal
          visible={selectedPhotoIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhotoIndex(null)}
        >
          <View style={styles.photoViewer}>
            <TouchableOpacity
              style={styles.photoViewerClose}
              onPress={() => setSelectedPhotoIndex(null)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedComplaint.photos[selectedPhotoIndex] }}
              style={styles.photoViewerImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}

      {/* Video Player Modal */}
      {selectedComplaint && selectedVideoIndex !== null && (
        <Modal
          visible={selectedVideoIndex !== null}
          animationType="slide"
          onRequestClose={() => setSelectedVideoIndex(null)}
        >
          <View style={styles.videoPlayerContainer}>
            <View style={styles.videoPlayerContent}>
              <VideoView
                player={videoPlayer}
                style={styles.videoPlayer}
                nativeControls={true}
                contentFit="contain"
              />
            </View>
            <View style={styles.videoPlayerHeader}>
              <Text style={styles.videoPlayerTitle}>Video {selectedVideoIndex + 1}</Text>
              <TouchableOpacity
                style={styles.videoPlayerClose}
                onPress={() => {
                  videoPlayer.pause();
                  setSelectedVideoIndex(null);
                }}
                activeOpacity={0.7}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Settlement Document Viewer Modal */}
      {complaintDetails && selectedDocumentIndex !== null && complaintDetails.complaint.settlementDocuments[selectedDocumentIndex] && (
        <Modal
          visible={selectedDocumentIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDocumentIndex(null)}
        >
          <View style={styles.documentViewer}>
            <View style={styles.documentViewerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.documentViewerTitle}>Settlement Document {selectedDocumentIndex + 1}</Text>
                <Text style={styles.documentViewerSubtitle}>
                  {complaintDetails.complaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') 
                    ? 'PDF Document' 
                    : 'Pinch to zoom'}
                </Text>
              </View>
              <View style={styles.documentViewerActions}>
                <TouchableOpacity
                  style={styles.documentViewerActionButton}
                  onPress={() => handleDownloadDocument(
                    complaintDetails.complaint.settlementDocuments?.[selectedDocumentIndex] || '',
                    selectedDocumentIndex
                  )}
                  disabled={downloadingDocument}
                >
                  {downloadingDocument ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.documentViewerActionButton}
                  onPress={() => handleShareDocument(
                    complaintDetails.complaint.settlementDocuments[selectedDocumentIndex],
                    `settlement_doc_${selectedDocumentIndex + 1}.${complaintDetails.complaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg'}`
                  )}
                  disabled={downloadingDocument}
                >
                  <Share2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.documentViewerClose}
                  onPress={() => setSelectedDocumentIndex(null)}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            {complaintDetails.complaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') ? (
              <View style={styles.pdfViewerContainer}>
                <WebView
                  source={{ 
                    uri: `https://docs.google.com/viewer?url=${encodeURIComponent(complaintDetails.complaint.settlementDocuments[selectedDocumentIndex])}&embedded=true`
                  }}
                  style={styles.pdfWebView}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.pdfLoadingContainer}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                    Alert.alert(
                      'PDF Viewer Error',
                      'Unable to display PDF in viewer. Would you like to download it instead?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Download',
                          onPress: () => handleDownloadDocument(
                            complaintDetails.complaint.settlementDocuments[selectedDocumentIndex],
                            selectedDocumentIndex
                          ),
                        },
                      ]
                    );
                  }}
                />
              </View>
            ) : (
              <ScrollView
                style={styles.documentViewerScroll}
                contentContainerStyle={styles.documentViewerContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <Image
                  source={{ uri: complaintDetails.complaint.settlementDocuments[selectedDocumentIndex] }}
                  style={styles.documentViewerImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.xl,
  },
  header: {
    marginBottom: designTokens.spacing.lg,
  },
  headerLeft: {
    gap: designTokens.spacing.xs,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: designTokens.colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: designTokens.colors.white,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: designTokens.colors.primary,
    borderColor: designTokens.colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    color: designTokens.colors.textSecondary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: designTokens.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  complaintsContainer: {
    gap: designTokens.spacing.md,
  },
  complaintCard: {
    backgroundColor: designTokens.colors.white,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
  },
  newComplaintCard: {
    borderLeftWidth: 4,
    borderLeftColor: designTokens.colors.error,
    backgroundColor: '#FFF9F9',
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.sm,
  },
  complaintHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  complaintCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
    flex: 1,
  },
  complaintDate: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  complaintDescription: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  complaintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  complaintMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anonymousLabel: {
    fontSize: 12,
    color: designTokens.colors.textMuted,
    fontWeight: '500',
  },
  mediaCount: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: designTokens.spacing.lg,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.background,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: designTokens.typography.semibold as any,
    color: designTokens.colors.textPrimary,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xs,
  },
  emptyStateText: {
    fontSize: designTokens.typography.base,
    color: designTokens.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: designTokens.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border,
  },
  modalTitle: {
    fontSize: designTokens.typography.xl,
    fontWeight: designTokens.typography.bold as any,
    color: designTokens.colors.textPrimary,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.md,
  },
  detailCategory: {
    fontSize: designTokens.typography.lg,
    fontWeight: designTokens.typography.bold as any,
    color: designTokens.colors.textPrimary,
    marginBottom: designTokens.spacing.xs,
  },
  detailStatus: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textSecondary,
  },
  detailSectionTitle: {
    fontSize: designTokens.typography.base,
    fontWeight: designTokens.typography.semibold as any,
    color: designTokens.colors.textPrimary,
    marginBottom: designTokens.spacing.sm,
  },
  detailDescription: {
    fontSize: designTokens.typography.base,
    color: designTokens.colors.textSecondary,
    lineHeight: 22,
  },
  detailText: {
    fontSize: designTokens.typography.base,
    color: designTokens.colors.textSecondary,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.sm,
  },
  editButton: {
    padding: designTokens.spacing.xs,
  },
  photoThumbnail: {
    marginRight: designTokens.spacing.sm,
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderRadius: designTokens.borderRadius.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: designTokens.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: designTokens.spacing.lg,
    maxHeight: '80%',
  },
  modalSubtitle: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textSecondary,
    marginBottom: designTokens.spacing.md,
  },
  statusOption: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.background,
    marginBottom: designTokens.spacing.sm,
  },
  statusOptionText: {
    fontSize: designTokens.typography.base,
    color: designTokens.colors.textPrimary,
    fontWeight: designTokens.typography.medium as any,
  },
  notesInput: {
    minHeight: 120,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: designTokens.colors.background,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    fontSize: designTokens.typography.base,
    color: designTokens.colors.textPrimary,
    marginBottom: designTokens.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  photoViewer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: designTokens.spacing.sm,
  },
  photoViewerImage: {
    width: '100%',
    height: '100%',
  },
  
  // Modern Redesign Styles
  modernSection: {
    marginBottom: designTokens.spacing.md,
  },
  modernHeader: {
    gap: designTokens.spacing.md,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modernHeaderLeft: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    flex: 1,
  },
  modernStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernHeaderText: {
    flex: 1,
    gap: 4,
  },
  modernCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
    lineHeight: 24,
  },
  modernComplaintId: {
    fontSize: 13,
    color: designTokens.colors.textSecondary,
    fontFamily: 'monospace',
  },
  modernStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernPriorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  modernPriorityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modernDateContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  modernDateText: {
    fontSize: 13,
    color: designTokens.colors.textSecondary,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
  },
  modernSectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${designTokens.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
    flex: 1,
  },
  modernDescription: {
    fontSize: 15,
    color: designTokens.colors.textPrimary,
    lineHeight: 24,
  },
  modernInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: designTokens.spacing.sm,
  },
  modernInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: designTokens.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernInfoContent: {
    flex: 1,
    gap: 2,
  },
  modernInfoLabel: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
    fontWeight: '500',
  },
  modernInfoValue: {
    fontSize: 14,
    color: designTokens.colors.textPrimary,
    fontWeight: '400',
  },
  modernDivider: {
    height: 1,
    backgroundColor: designTokens.colors.border,
    marginVertical: designTokens.spacing.md,
  },
  modernAnonymousContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: designTokens.spacing.md,
    backgroundColor: `${designTokens.colors.warning}08`,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernAnonymousText: {
    flex: 1,
    fontSize: 14,
    color: designTokens.colors.textSecondary,
    fontStyle: 'italic',
  },
  modernMediaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.textSecondary,
    marginBottom: designTokens.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernMediaScroll: {
    marginHorizontal: -designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
  },
  modernPhotoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: designTokens.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  modernThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  modernPhotoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMediaSpacer: {
    height: designTokens.spacing.lg,
  },
  modernVideoInfo: {
    flexDirection: 'row',
    gap: 8,
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernVideoText: {
    fontSize: 14,
    color: designTokens.colors.textSecondary,
  },
  modernEditButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: `${designTokens.colors.primary}10`,
  },
  modernEditButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: designTokens.colors.primary,
  },
  modernNotesContainer: {
    padding: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: designTokens.colors.primary,
  },
  modernNotesText: {
    fontSize: 14,
    color: designTokens.colors.textPrimary,
    lineHeight: 22,
  },
  modernDocumentInfo: {
    flexDirection: 'row',
    gap: 8,
    padding: designTokens.spacing.md,
    backgroundColor: `${designTokens.colors.success}08`,
    borderRadius: 8,
    alignItems: 'center',
  },
  modernDocumentText: {
    fontSize: 14,
    color: designTokens.colors.textPrimary,
  },
  modernActionButtons: {
    gap: designTokens.spacing.sm,
    marginVertical: designTokens.spacing.md,
  },
  modernActionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: designTokens.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: designTokens.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modernActionButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modernActionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: designTokens.colors.primary,
  },
  modernActionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: designTokens.colors.primary,
  },
  modernTimelineContainer: {
    gap: designTokens.spacing.md,
  },
  modernTimelineItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  modernTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: designTokens.colors.primary,
    marginTop: 4,
  },
  modernTimelineContent: {
    flex: 1,
    gap: 2,
  },
  modernTimelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: designTokens.colors.textPrimary,
  },
  modernTimelineDate: {
    fontSize: 13,
    color: designTokens.colors.textSecondary,
  },
  
  // Video Player Styles
  modernVideoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: designTokens.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: designTokens.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    gap: 8,
  },
  videoThumbnailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  videoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'transparent',
    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))',
  },
  modernVideoPlayButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modernVideoNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoPlayerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  videoPlayerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoPlayerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  videoPlayerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  // Settlement Document Styles
  modernDocumentThumbnail: {
    width: 120,
    height: 120,
    borderRadius: designTokens.borderRadius.md,
    marginRight: designTokens.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  modernDocumentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: designTokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
  },
  modernDocumentLabel: {
    color: '#FFFFFF',
    fontSize: designTokens.typography.xs,
    fontWeight: designTokens.typography.semibold as any,
  },
  // Document Viewer Styles
  documentViewer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  documentViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  documentViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  documentViewerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  documentViewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  documentViewerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentViewerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentViewerScroll: {
    flex: 1,
  },
  documentViewerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.md,
  },
  documentViewerImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height - 150,
  },
  // PDF Viewer Styles
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfWebView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  pdfLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: designTokens.spacing.md,
  },
});

