import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getRatingsForBarangay } from '../../utils/rating-replies';
import { PropertyRatingRecord } from '../../types';
import { 
  Star, 
  MapPin,
  User as UserIcon,
  ArrowLeft,
  Building2
} from 'lucide-react-native';
import { sharedStyles, designTokens, iconBackgrounds } from '../../styles/owner-dashboard-styles';
import { showAlert } from '../../utils/alert';
import { db } from '../../utils/db';
import { DbUserRecord } from '../../types';
import { TouchableOpacity } from 'react-native';

interface EnrichedRating extends PropertyRatingRecord {
  propertyTitle: string;
  propertyAddress: string;
  tenantName?: string;
  ownerName?: string;
  ownerId?: string;
  ownerBusinessName?: string;
}

interface OwnerRatingsGroup {
  ownerId: string;
  ownerName: string;
  ownerBusinessName?: string;
  properties: PropertyRatingsGroup[];
  totalRatings: number;
  averageRating: number;
  latestRatingDate: string;
}

interface PropertyRatingsGroup {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ratings: EnrichedRating[];
  averageRating: number;
  latestRatingDate: string;
}

export default function BrgyRatingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ratings, setRatings] = useState<EnrichedRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [barangayName, setBarangayName] = useState<string>('');

  const ownerRatingGroups = useMemo<OwnerRatingsGroup[]>(() => {
    if (!ratings.length) return [];

    // First group by property
    const propertyGroupsMap: Record<string, PropertyRatingsGroup> = {};
    ratings.forEach((rating) => {
      if (!propertyGroupsMap[rating.propertyId]) {
        propertyGroupsMap[rating.propertyId] = {
          propertyId: rating.propertyId,
          propertyTitle: rating.propertyTitle || 'Untitled Listing',
          propertyAddress: rating.propertyAddress || 'Address not provided',
          ratings: [],
          averageRating: 0,
          latestRatingDate: rating.createdAt,
        };
      }
      propertyGroupsMap[rating.propertyId].ratings.push(rating);
    });

    // Calculate averages for each property
    const propertyGroups = Object.values(propertyGroupsMap).map((group) => ({
      ...group,
      ratings: group.ratings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      averageRating:
        group.ratings.reduce((sum, current) => sum + current.rating, 0) /
        group.ratings.length,
    }));

    // Then group properties by owner
    const ownerGroupsMap: Record<string, OwnerRatingsGroup> = {};
    propertyGroups.forEach((propertyGroup) => {
      const firstRating = propertyGroup.ratings[0];
      const ownerId = firstRating.ownerId || 'unknown';
      
      if (!ownerGroupsMap[ownerId]) {
        ownerGroupsMap[ownerId] = {
          ownerId,
          ownerName: firstRating.ownerName || 'Unknown Owner',
          ownerBusinessName: firstRating.ownerBusinessName,
          properties: [],
          totalRatings: 0,
          averageRating: 0,
          latestRatingDate: propertyGroup.latestRatingDate,
        };
      }
      
      ownerGroupsMap[ownerId].properties.push(propertyGroup);
      ownerGroupsMap[ownerId].totalRatings += propertyGroup.ratings.length;
      
      // Update latest rating date
      if (new Date(propertyGroup.latestRatingDate) > new Date(ownerGroupsMap[ownerId].latestRatingDate)) {
        ownerGroupsMap[ownerId].latestRatingDate = propertyGroup.latestRatingDate;
      }
    });

    // Calculate average rating for each owner across all their properties
    return Object.values(ownerGroupsMap).map((ownerGroup) => {
      const allRatings = ownerGroup.properties.flatMap(p => p.ratings);
      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      return {
        ...ownerGroup,
        averageRating,
        properties: ownerGroup.properties.sort((a, b) => 
          new Date(b.latestRatingDate).getTime() - new Date(a.latestRatingDate).getTime()
        ),
      };
    }).sort((a, b) => {
      return new Date(b.latestRatingDate).getTime() - new Date(a.latestRatingDate).getTime();
    });
  }, [ratings]);

  useEffect(() => {
    if (!user?.id) {
      router.replace('/login');
      return;
    }

    if (!user.roles?.includes('brgy_official')) {
      showAlert('Access Denied', 'This page is for Barangay Officials only.');
      router.replace('/(tabs)');
      return;
    }

    loadRatings();
  }, [user]);

  const loadRatings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get barangay name from user data
      const userRecord = await db.get<DbUserRecord>('users', user.id);
      const barangay = userRecord?.barangay || 'Unknown Barangay';
      setBarangayName(barangay);
      
      const barangayRatings = await getRatingsForBarangay(barangay);
      setRatings(barangayRatings);
    } catch (error) {
      console.error('Error loading ratings:', error);
      showAlert('Error', 'Failed to load ratings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRatings();
  }, [loadRatings]);

  const formatFullDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderOwnerGroup = (ownerGroup: OwnerRatingsGroup) => (
    <View key={ownerGroup.ownerId} style={[sharedStyles.card, { marginBottom: designTokens.spacing.lg }]}>
      {/* Owner Header */}
      <View style={styles.ownerHeader}>
        <View style={[iconBackgrounds.success, styles.ownerIcon]}>
          <Building2 size={24} color={designTokens.colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ownerName}>{ownerGroup.ownerName}</Text>
          {ownerGroup.ownerBusinessName && (
            <Text style={styles.ownerBusinessName}>
              {ownerGroup.ownerBusinessName}
            </Text>
          )}
          <View style={styles.ownerStatsRow}>
            <View style={styles.starRow}>
              {[...Array(5)].map((_, i) => {
                const isFilled = i < Math.round(ownerGroup.averageRating);
                return (
                  <Star
                    key={i}
                    size={14}
                    color={isFilled ? '#F59E0B' : '#E5E7EB'}
                    fill={isFilled ? '#F59E0B' : 'transparent'}
                    style={styles.starIcon}
                  />
                );
              })}
              <Text style={styles.ownerRatingValue}>
                {ownerGroup.averageRating.toFixed(1)}
              </Text>
            </View>
            <Text style={styles.ownerStatsText}>
              • {ownerGroup.totalRatings} rating{ownerGroup.totalRatings > 1 ? 's' : ''} • {ownerGroup.properties.length} propert{ownerGroup.properties.length > 1 ? 'ies' : 'y'}
            </Text>
          </View>
        </View>
      </View>

      {/* Properties List */}
      <View style={styles.propertiesContainer}>
        {ownerGroup.properties.map((propertyGroup, index) => (
          <View key={propertyGroup.propertyId} style={[
            styles.propertySection,
            index < ownerGroup.properties.length - 1 && styles.propertyBorderBottom
          ]}>
            {renderPropertyGroup(propertyGroup)}
          </View>
        ))}
      </View>
    </View>
  );

  const renderPropertyGroup = (group: PropertyRatingsGroup) => (
    <View key={group.propertyId} style={[sharedStyles.card, styles.propertyCard]}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyMeta}>
          <Text style={styles.propertyTitle}>{group.propertyTitle}</Text>
          <View style={styles.propertyAddressRow}>
            <MapPin size={14} color={designTokens.colors.info} />
            <Text style={styles.propertyAddressText} numberOfLines={2}>
              {group.propertyAddress}
            </Text>
          </View>
        </View>
        <View style={styles.propertyStats}>
          <View style={styles.starRow}>
            {[...Array(5)].map((_, i) => {
              const isFilled = i < Math.round(group.averageRating);
              return (
                <Star
                  key={i}
                  size={16}
                  color={isFilled ? '#F59E0B' : '#E5E7EB'}
                  fill={isFilled ? '#F59E0B' : 'transparent'}
                  style={styles.starIcon}
                />
              );
            })}
            <Text style={styles.propertyRatingValue}>
              {group.averageRating.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.propertyStatsLabel}>
            {group.ratings.length} rating{group.ratings.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.ratingList}>
        {group.ratings.map((rating, index) => {
          const isLast = index === group.ratings.length - 1;
          return (
            <View
              key={rating.id}
              style={[
                styles.ratingItem,
                isLast && styles.ratingItemLast,
              ]}
            >
              <View style={styles.ratingHeaderRow}>
                <View style={styles.ratingStarsRow}>
                  {[...Array(5)].map((_, i) => {
                    const filled = i < rating.rating;
                    return (
                      <Star
                        key={i}
                        size={14}
                        color={filled ? '#F59E0B' : '#E5E7EB'}
                        fill={filled ? '#F59E0B' : 'transparent'}
                        style={styles.starIcon}
                      />
                    );
                  })}
                  <Text style={styles.ratingValue}>{rating.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.ratingDate}>
                  {formatFullDate(rating.createdAt)}
                </Text>
              </View>

              <View style={styles.tenantRow}>
                <UserIcon size={14} color={designTokens.colors.info} />
                <Text style={styles.tenantLabel}>
                  Tenant:{' '}
                  {rating.tenantName ||
                    (rating.isAnonymous ? 'Anonymous' : 'Unavailable')}
                </Text>
              </View>

              {rating.review && (
                <View style={styles.reviewBubble}>
                  <Text style={styles.reviewText}>{rating.review}</Text>
                </View>
              )}

              {rating.ownerReply && (
                <View style={styles.replyBubble}>
                  <Text style={styles.replyLabel}>Owner&apos;s Reply</Text>
                  <Text style={styles.replyText}>{rating.ownerReply}</Text>
                  {rating.ownerReplyAt && (
                    <Text style={styles.replyDate}>
                      Replied on {formatFullDate(rating.ownerReplyAt)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[sharedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={sharedStyles.loadingText}>Loading ratings...</Text>
      </View>
    );
  }

  return (
    <View style={sharedStyles.container}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: designTokens.spacing.lg,
        paddingTop: designTokens.spacing.md,
        paddingBottom: designTokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.colors.borderLight,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: designTokens.spacing.sm,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: designTokens.spacing.md,
              padding: designTokens.spacing.xs,
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={designTokens.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[sharedStyles.pageTitle, { fontSize: designTokens.typography.xl }]}>
              Property Ratings
            </Text>
            <Text style={[sharedStyles.pageSubtitle, { fontSize: designTokens.typography.sm }]}>
              {barangayName && `BRGY ${barangayName}`}
            </Text>
          </View>
          <View style={[sharedStyles.statIcon, iconBackgrounds.orange]}>
            <Star size={20} color="#F59E0B" />
          </View>
        </View>
      </View>

      <ScrollView
        style={sharedStyles.scrollView}
        contentContainerStyle={[sharedStyles.pageContainer, { paddingTop: designTokens.spacing.lg }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Stats */}
        {ratings.length > 0 && (
          <View style={[sharedStyles.card, { marginBottom: designTokens.spacing.lg }]}>
            <Text style={[sharedStyles.sectionTitle, { fontSize: designTokens.typography.md, marginBottom: designTokens.spacing.sm }]}>
              Summary
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[sharedStyles.statValue, { fontSize: designTokens.typography['2xl'] }]}>
                  {ratings.length}
                </Text>
                <Text style={[sharedStyles.statLabel, { fontSize: designTokens.typography.xs }]}>
                  Total Ratings
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[sharedStyles.statValue, { fontSize: designTokens.typography['2xl'] }]}>
                  {ratings.length > 0 
                    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                    : '0.0'}
                </Text>
                <Text style={[sharedStyles.statLabel, { fontSize: designTokens.typography.xs }]}>
                  Average Rating
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[sharedStyles.statValue, { fontSize: designTokens.typography['2xl'] }]}>
                  {ratings.filter(r => r.review && r.review.trim().length > 0).length}
                </Text>
                <Text style={[sharedStyles.statLabel, { fontSize: designTokens.typography.xs }]}>
                  With Comments
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Ratings List */}
        {ownerRatingGroups.length === 0 ? (
          <View style={sharedStyles.emptyState}>
            <Star size={48} color={designTokens.colors.textMuted} />
            <Text style={sharedStyles.emptyStateTitle}>No Ratings Yet</Text>
            <Text style={sharedStyles.emptyStateText}>
              There are no ratings for properties in your barangay yet.
            </Text>
          </View>
        ) : (
          ownerRatingGroups.map(renderOwnerGroup)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  propertyCard: {
    marginBottom: designTokens.spacing.lg,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: designTokens.spacing.lg,
  },
  propertyMeta: {
    flex: 1,
    gap: designTokens.spacing.xs,
  },
  propertyTitle: {
    fontSize: designTokens.typography.lg,
    fontWeight: designTokens.typography.semibold,
    color: designTokens.colors.textPrimary,
  },
  propertyAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs,
  },
  propertyAddressText: {
    flex: 1,
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textSecondary,
  },
  propertyOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs,
  },
  propertyOwnerText: {
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textSecondary,
  },
  propertyStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  propertyRatingValue: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.lg,
    fontWeight: designTokens.typography.semibold,
    color: designTokens.colors.textPrimary,
  },
  propertyStatsLabel: {
    marginTop: designTokens.spacing.xs,
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textMuted,
  },
  ratingList: {
    marginTop: designTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.borderLight,
  },
  ratingItem: {
    paddingVertical: designTokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.borderLight,
  },
  ratingItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  ratingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.sm,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.sm,
    fontWeight: designTokens.typography.semibold,
    color: designTokens.colors.textPrimary,
  },
  ratingDate: {
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textMuted,
  },
  tenantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.sm,
  },
  tenantLabel: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textSecondary,
  },
  reviewBubble: {
    backgroundColor: designTokens.colors.background,
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
  },
  reviewText: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textPrimary,
    lineHeight: 20,
  },
  replyBubble: {
    borderRadius: designTokens.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: designTokens.colors.primary,
    backgroundColor: designTokens.colors.primary + '10',
    padding: designTokens.spacing.md,
  },
  replyLabel: {
    fontSize: designTokens.typography.xs,
    fontWeight: designTokens.typography.semibold,
    color: designTokens.colors.primary,
    marginBottom: designTokens.spacing.xs,
  },
  replyText: {
    fontSize: designTokens.typography.sm,
    color: designTokens.colors.textPrimary,
    lineHeight: 20,
  },
  replyDate: {
    marginTop: designTokens.spacing.xs,
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textMuted,
  },
  // Owner Group Styles
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: designTokens.colors.border,
  },
  ownerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: designTokens.typography.lg,
    fontWeight: designTokens.typography.bold as any,
    color: designTokens.colors.textPrimary,
    marginBottom: 2,
  },
  ownerBusinessName: {
    fontSize: designTokens.typography.sm,
    fontWeight: designTokens.typography.semibold as any,
    color: designTokens.colors.primary,
    marginBottom: designTokens.spacing.xs,
  },
  ownerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    marginTop: 4,
  },
  ownerRatingValue: {
    fontSize: designTokens.typography.sm,
    fontWeight: designTokens.typography.semibold as any,
    color: designTokens.colors.textPrimary,
    marginLeft: 4,
  },
  ownerStatsText: {
    fontSize: designTokens.typography.xs,
    color: designTokens.colors.textMuted,
  },
  propertiesContainer: {
    gap: designTokens.spacing.md,
  },
  propertySection: {
    paddingVertical: designTokens.spacing.sm,
  },
  propertyBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border,
  },
});