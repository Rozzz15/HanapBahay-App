/**
 * Cloud Storage Test Screen
 * A dedicated screen for testing cloud storage functionality
 * 
 * To use: Add this route to your app and navigate to it
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { storeAuthUser, getAuthUser, clearAuthSession } from '../utils/auth-user-cloud';
import { cachePropertyMedia, getCachedPropertyMedia, removeCachedPropertyMedia } from '../utils/property-media-cache-cloud';
import { storeUserPreferences, getUserPreferences } from '../utils/cloud-storage';
import { migrateToCloudStorage, verifyMigration, rollbackMigration } from '../utils/storage-migration';

export default function TestCloudStorageScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Auth User
  const testAuthUser = async () => {
    try {
      addResult('🧪 Testing Auth User...');
      
      const testUser = {
        id: 'test-user-' + Date.now(),
        roles: ['tenant'],
        permissions: ['view_properties'],
        name: 'Test User',
        email: 'test@example.com'
      };

      await storeAuthUser(testUser);
      addResult('✅ Auth user stored');

      const retrievedUser = await getAuthUser();
      if (retrievedUser && retrievedUser.id === testUser.id) {
        addResult('✅ Auth user retrieved correctly');
      } else {
        addResult('❌ Auth user mismatch');
      }

      await clearAuthSession();
      addResult('✅ Auth session cleared');

    } catch (error) {
      addResult(`❌ Auth user test failed: ${error}`);
    }
  };

  // Test 2: Property Media Cache
  const testPropertyMediaCache = async () => {
    try {
      addResult('🧪 Testing Property Media Cache...');
      
      const testListingId = 'test-listing-' + Date.now();
      const testMedia = {
        coverPhoto: 'https://example.com/cover.jpg',
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        videos: ['https://example.com/video1.mp4']
      };

      await cachePropertyMedia(testListingId, testMedia);
      addResult('✅ Property media cached');

      const retrievedMedia = await getCachedPropertyMedia(testListingId);
      if (retrievedMedia && retrievedMedia.coverPhoto === testMedia.coverPhoto) {
        addResult('✅ Property media retrieved correctly');
        addResult(`   Photos: ${retrievedMedia.photos.length}, Videos: ${retrievedMedia.videos.length}`);
      } else {
        addResult('❌ Property media mismatch');
      }

      await removeCachedPropertyMedia(testListingId);
      addResult('✅ Property media cache removed');

    } catch (error) {
      addResult(`❌ Property media cache test failed: ${error}`);
    }
  };

  // Test 3: User Preferences
  const testUserPreferences = async () => {
    try {
      addResult('🧪 Testing User Preferences...');
      
      const testPreferences = {
        theme: 'dark' as const,
        notificationsEnabled: true,
        customSetting: 'test-value'
      };

      await storeUserPreferences(testPreferences);
      addResult('✅ User preferences stored');

      const retrievedPrefs = await getUserPreferences();
      if (retrievedPrefs && retrievedPrefs.theme === testPreferences.theme) {
        addResult('✅ User preferences retrieved correctly');
        addResult(`   Theme: ${retrievedPrefs.theme}, Notifications: ${retrievedPrefs.notificationsEnabled}`);
      } else {
        addResult('❌ User preferences mismatch');
      }

    } catch (error) {
      addResult(`❌ User preferences test failed: ${error}`);
    }
  };

  // Test 4: Migration
  const testMigration = async () => {
    try {
      addResult('🧪 Testing Migration...');
      
      const migrationResult = await migrateToCloudStorage();
      
      if (migrationResult.success) {
        addResult('✅ Migration completed successfully');
        addResult(`   Migrated: ${migrationResult.migratedItems.join(', ')}`);
        if (migrationResult.failedItems.length > 0) {
          addResult(`   Failed: ${migrationResult.failedItems.join(', ')}`);
        }
      } else {
        addResult('❌ Migration failed');
        migrationResult.errors.forEach(error => {
          addResult(`   Error: ${error}`);
        });
      }

      // Verify migration
      const verification = await verifyMigration();
      if (verification.success) {
        addResult('✅ Migration verified');
      } else {
        addResult('❌ Migration verification failed');
        verification.errors.forEach(error => {
          addResult(`   Error: ${error}`);
        });
      }

    } catch (error) {
      addResult(`❌ Migration test failed: ${error}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    addResult('🚀 Starting Cloud Storage Tests...\n');

    await testAuthUser();
    addResult('');
    
    await testPropertyMediaCache();
    addResult('');
    
    await testUserPreferences();
    addResult('');
    
    await testMigration();
    addResult('');
    
    addResult('✅ All tests completed!');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Cloud Storage Tests</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.individualTests}>
        <Text style={styles.subtitle}>Individual Tests:</Text>
        <TouchableOpacity style={styles.smallButton} onPress={testAuthUser} disabled={isLoading}>
          <Text style={styles.smallButtonText}>Test Auth User</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={testPropertyMediaCache} disabled={isLoading}>
          <Text style={styles.smallButtonText}>Test Media Cache</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={testUserPreferences} disabled={isLoading}>
          <Text style={styles.smallButtonText}>Test Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={testMigration} disabled={isLoading}>
          <Text style={styles.smallButtonText}>Test Migration</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Click &quot;Run All Tests&quot; to begin.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  individualTests: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  smallButton: {
    backgroundColor: '#9C27B0',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noResults: {
    color: '#666',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
