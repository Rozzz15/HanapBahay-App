import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, FileText, X, Image as ImageIcon, Download, Share2, Play, Video as VideoIcon } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sharedStyles, designTokens, iconBackgrounds } from '../../styles/owner-dashboard-styles';
import { getComplaintsByTenant, getComplaintCategoryLabel, getStatusLabel, getUrgencyColor, deleteTenantComplaint } from '../../utils/tenant-complaints';
import { TenantComplaintRecord } from '../../types';
import { db } from '../../utils/db';
import { PublishedListingRecord } from '../../types';

export default function ComplaintTrackingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<TenantComplaintRecord[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<TenantComplaintRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [property, setProperty] = useState<PublishedListingRecord | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [downloadingDocument, setDownloadingDocument] = useState(false);

  const loadComplaints = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Check if tenant has active booking
      const { getBookingsByTenant } = await import('../../utils/booking');
      const bookings = await getBookingsByTenant(user.id);
      const active = bookings.find(
        b => b.status === 'approved' && b.paymentStatus === 'paid'
      );
      
      if (!active) {
        // No active booking - show message and allow viewing past complaints
        Alert.alert(
          'No Active Rental',
          'You need to have an active rental booking to submit new complaints. You can still view your past complaints below.',
          [{ text: 'OK' }]
        );
      }
      
      const tenantComplaints = await getComplaintsByTenant(user.id);
      setComplaints(tenantComplaints);
    } catch (error) {
      console.error('❌ Error loading complaints:', error);
      Alert.alert('Error', 'Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [loadComplaints])
  );

  const handleDownloadDocument = async (documentUri: string, index: number) => {
    try {
      setDownloadingDocument(true);
      
      // Get file extension
      const fileExtension = documentUri.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg';
      const fileName = `settlement_doc_${index + 1}_${Date.now()}.${fileExtension}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
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
        const tempUri = `${FileSystem.cacheDirectory}${tempFileName}`;
        
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

  const handleViewDetails = async (complaint: TenantComplaintRecord) => {
    setSelectedComplaint(complaint);
    
    // Load property details
    if (complaint.propertyId) {
      const propertyData = await db.get<PublishedListingRecord>('published_listings', complaint.propertyId);
      setProperty(propertyData || null);
    }
    
    setShowDetailModal(true);
  };

  const handleDeleteComplaint = async (complaint: TenantComplaintRecord) => {
    // Check if complaint can be deleted (only submitted status)
    if (complaint.status !== 'submitted') {
      Alert.alert(
        'Cannot Delete',
        'You can only delete complaints that have not been processed yet. This complaint has already been received by the barangay.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Complaint',
      `Are you sure you want to delete this complaint?\n\nCategory: ${getComplaintCategoryLabel(complaint.category)}\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTenantComplaint(complaint.id, user?.id || '');
              Alert.alert('Success', 'Complaint deleted successfully');
              
              // Reload complaints
              await loadComplaints();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete complaint');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: TenantComplaintRecord['status']) => {
    switch (status) {
      case 'submitted':
        return <Clock size={16} color={designTokens.colors.warning} />;
      case 'received_by_brgy':
        return <AlertCircle size={16} color={designTokens.colors.info} />;
      case 'under_review':
        return <FileText size={16} color={designTokens.colors.info} />;
      case 'for_mediation':
        return <AlertCircle size={16} color={designTokens.colors.warning} />;
      case 'resolved':
        return <CheckCircle size={16} color={designTokens.colors.success} />;
      case 'closed':
        return <CheckCircle size={16} color={designTokens.colors.textMuted} />;
      default:
        return <AlertCircle size={16} color={designTokens.colors.textMuted} />;
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
              <Text style={styles.pageTitle}>My Complaints</Text>
              <Text style={styles.pageSubtitle}>
                {complaints.length > 0 
                  ? `${complaints.length} complaint${complaints.length !== 1 ? 's' : ''} submitted`
                  : 'Track your rental complaints and resolutions'}
              </Text>
            </View>
          </View>

          {complaints.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <AlertCircle size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Complaints Yet</Text>
              <Text style={styles.emptyText}>
                You haven&apos;t submitted any complaints. Use the &quot;Submit Complaint&quot; button to report issues.
              </Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={async () => {
                  // Check if tenant has active booking before allowing submission
                  const { getBookingsByTenant } = await import('../../utils/booking');
                  const bookings = await getBookingsByTenant(user?.id || '');
                  const active = bookings.find(
                    b => b.status === 'approved' && b.paymentStatus === 'paid'
                  );
                  
                  if (!active) {
                    Alert.alert(
                      'No Active Rental',
                      'You need to have an active rental booking to submit a complaint. Please contact your barangay directly if you have an urgent issue.'
                    );
                    return;
                  }
                  
                  router.push('/(tabs)/submit-complaint');
                }}
              >
                <Text style={styles.submitButtonText}>Submit Complaint</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.complaintsContainer}>
              {complaints.map((complaint) => (
                <Pressable
                  key={complaint.id}
                  style={({ pressed }) => [
                    styles.complaintCard,
                    pressed && styles.complaintCardPressed,
                  ]}
                  onPress={() => handleViewDetails(complaint)}
                  onLongPress={() => handleDeleteComplaint(complaint)}
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
                          {complaint.status === 'submitted' && (
                            <Text style={styles.deleteHint}>Hold to delete</Text>
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
                      {(complaint.photos.length > 0 || complaint.videos.length > 0) && (
                        <Text style={styles.mediaCount}>
                          📎 {complaint.photos.length + complaint.videos.length} attachment{complaint.photos.length + complaint.videos.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
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
          setProperty(null);
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
                setProperty(null);
                setSelectedPhotoIndex(null);
              }}
            >
              <X size={24} color={designTokens.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={sharedStyles.scrollView}>
            {selectedComplaint && (
              <View style={sharedStyles.pageContainer}>
                <View style={sharedStyles.card}>
                  <View style={styles.detailHeader}>
                    <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(selectedComplaint.status)}20` }]}>
                      {getStatusIcon(selectedComplaint.status)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailCategory}>
                        {getComplaintCategoryLabel(selectedComplaint.category)}
                      </Text>
                      <Text style={styles.detailStatus}>
                        Status: {getStatusLabel(selectedComplaint.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(selectedComplaint.urgency)}20`, alignSelf: 'flex-start', marginTop: designTokens.spacing.md }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(selectedComplaint.urgency) }]}>
                      {selectedComplaint.urgency.toUpperCase()} PRIORITY
                    </Text>
                  </View>
                </View>

                <View style={sharedStyles.card}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.detailDescription}>{selectedComplaint.description}</Text>
                </View>

                {property && (
                  <View style={sharedStyles.card}>
                    <Text style={styles.detailSectionTitle}>Property</Text>
                    <Text style={styles.detailText}>{property.address}</Text>
                  </View>
                )}

                {selectedComplaint.photos.length > 0 && (
                  <View style={sharedStyles.card}>
                    <Text style={styles.detailSectionTitle}>
                      Photos ({selectedComplaint.photos.length})
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedComplaint.photos.map((photo, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedPhotoIndex(index)}
                          style={styles.photoThumbnail}
                        >
                          <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedComplaint.videos.length > 0 && (
                  <View style={sharedStyles.card}>
                    <View style={styles.videosHeader}>
                      <VideoIcon size={20} color={designTokens.colors.primary} />
                      <Text style={styles.detailSectionTitle}>
                        Videos ({selectedComplaint.videos.length})
                      </Text>
                    </View>
                    <Text style={styles.videosSubtext}>
                      Tap any video to play in full screen
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
                      {selectedComplaint.videos.map((video, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.videoThumbnail}
                          onPress={() => setSelectedVideoIndex(index)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.videoThumbnailPlaceholder}>
                            <Play size={32} color="#FFFFFF" />
                          </View>
                          <View style={styles.videoOverlay}>
                            <VideoIcon size={16} color="#FFFFFF" />
                            <Text style={styles.videoLabel}>Video {index + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedComplaint.barangayNotes && (
                  <View style={[sharedStyles.card, styles.barangayNotesCard]}>
                    <View style={styles.notesHeader}>
                      <FileText size={20} color={designTokens.colors.primary} />
                      <Text style={styles.detailSectionTitle}>Barangay Notes</Text>
                    </View>
                    <View style={styles.notesContent}>
                      <Text style={styles.notesText}>{selectedComplaint.barangayNotes}</Text>
                    </View>
                  </View>
                )}

                {selectedComplaint.settlementDocuments && selectedComplaint.settlementDocuments.length > 0 && (
                  <View style={sharedStyles.card}>
                    <View style={styles.documentsHeader}>
                      <FileText size={20} color={designTokens.colors.success} />
                      <Text style={styles.detailSectionTitle}>
                        Settlement Documents ({selectedComplaint.settlementDocuments.length})
                      </Text>
                    </View>
                    <Text style={styles.documentsSubtext}>
                      Tap any document to view in full screen
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.documentsScroll}>
                      {selectedComplaint.settlementDocuments.map((docUri, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.documentThumbnail}
                          onPress={() => setSelectedDocumentIndex(index)}
                          activeOpacity={0.7}
                        >
                          <Image source={{ uri: docUri }} style={styles.documentThumbnailImage} />
                          <View style={styles.documentOverlay}>
                            <FileText size={18} color="#FFFFFF" />
                            <Text style={styles.documentLabel}>Doc {index + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={sharedStyles.card}>
                  <Text style={styles.detailSectionTitle}>Timeline</Text>
                  <Text style={styles.detailText}>
                    Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>
                  {selectedComplaint.resolvedAt && (
                    <Text style={styles.detailText}>
                      Resolved: {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                    </Text>
                  )}
                  {selectedComplaint.closedAt && (
                    <Text style={styles.detailText}>
                      Closed: {new Date(selectedComplaint.closedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
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
      {selectedComplaint && selectedVideoIndex !== null && selectedComplaint.videos[selectedVideoIndex] && (
        <Modal
          visible={selectedVideoIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedVideoIndex(null)}
        >
          <View style={styles.videoViewer}>
            <View style={styles.videoViewerHeader}>
              <Text style={styles.videoViewerTitle}>Video {selectedVideoIndex + 1}</Text>
              <TouchableOpacity
                style={styles.videoViewerClose}
                onPress={() => setSelectedVideoIndex(null)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoPlayerContainer}>
              <Video
                source={{ uri: selectedComplaint.videos[selectedVideoIndex] }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Settlement Document Viewer Modal */}
      {selectedComplaint && selectedDocumentIndex !== null && selectedComplaint.settlementDocuments && selectedComplaint.settlementDocuments[selectedDocumentIndex] && (
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
                  {selectedComplaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') 
                    ? 'PDF Document' 
                    : 'Pinch to zoom'}
                </Text>
              </View>
              <View style={styles.documentViewerActions}>
                <TouchableOpacity
                  style={styles.documentViewerActionButton}
                  onPress={() => handleDownloadDocument(
                    selectedComplaint.settlementDocuments[selectedDocumentIndex],
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
                    selectedComplaint.settlementDocuments[selectedDocumentIndex],
                    `settlement_doc_${selectedDocumentIndex + 1}.${selectedComplaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg'}`
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
            {selectedComplaint.settlementDocuments[selectedDocumentIndex].toLowerCase().endsWith('.pdf') ? (
              <View style={styles.pdfViewerContainer}>
                <WebView
                  source={{ 
                    uri: `https://docs.google.com/viewer?url=${encodeURIComponent(selectedComplaint.settlementDocuments[selectedDocumentIndex])}&embedded=true`
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
                            selectedComplaint.settlementDocuments[selectedDocumentIndex],
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
                  source={{ uri: selectedComplaint.settlementDocuments[selectedDocumentIndex] }}
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
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: designTokens.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  complaintCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
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
  },
  deleteHint: {
    fontSize: 10,
    color: designTokens.colors.error,
    fontStyle: 'italic',
    marginLeft: 8,
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
  mediaCount: {
    fontSize: 12,
    color: designTokens.colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: designTokens.colors.textSecondary,
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
  photoThumbnail: {
    marginRight: designTokens.spacing.sm,
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderRadius: designTokens.borderRadius.md,
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
  // Video Styles
  videosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
  },
  videosSubtext: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textSecondary,
    marginBottom: designTokens.spacing.md,
  },
  videosScroll: {
    marginTop: designTokens.spacing.sm,
  },
  videoThumbnail: {
    width: 140,
    height: 140,
    borderRadius: designTokens.borderRadius.lg,
    marginRight: designTokens.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: designTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: designTokens.typography.sm,
    fontWeight: designTokens.typography.semibold as any,
  },
  // Video Player Modal Styles
  videoViewer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  videoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  videoViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoViewerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * (9 / 16), // 16:9 aspect ratio
  },
  // Enhanced Barangay Notes Styles
  barangayNotesCard: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: designTokens.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  notesContent: {
    backgroundColor: '#FFFFFF',
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  notesText: {
    fontSize: 15,
    color: designTokens.colors.textPrimary,
    lineHeight: 24,
    fontWeight: '400',
  },
  // Settlement Documents Styles
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
  },
  documentsSubtext: {
    fontSize: 13,
    color: designTokens.colors.textSecondary,
    marginBottom: designTokens.spacing.md,
    fontStyle: 'italic',
  },
  documentsScroll: {
    marginTop: designTokens.spacing.sm,
  },
  documentThumbnail: {
    width: 140,
    height: 180,
    borderRadius: designTokens.borderRadius.lg,
    marginRight: designTokens.spacing.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: designTokens.colors.success,
  },
  documentThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  documentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    padding: designTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
  },
  documentLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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

