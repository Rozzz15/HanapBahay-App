import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, RefreshCw } from 'lucide-react-native';

interface InternetRequiredProps {
  children: React.ReactNode;
}

/**
 * Component that blocks app usage when there's no internet connection
 * Shows a blocking screen until internet is available
 */
export function InternetRequired({ children }: InternetRequiredProps) {
  const { hasInternet, isConnected, type } = useNetworkStatus();

  // If we have internet, render children normally
  if (hasInternet) {
    return <>{children}</>;
  }

  // Otherwise, show blocking screen
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <WifiOff size={64} color="#EF4444" strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>Internet Required</Text>
        
        <Text style={styles.message}>
          This app requires an active internet connection to function properly.
        </Text>
        
        <Text style={styles.submessage}>
          Please check your network connection and try again.
        </Text>

        {!isConnected && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.statusText}>
              Waiting for connection...
            </Text>
          </View>
        )}

        {isConnected && type && (
          <View style={styles.statusContainer}>
            <RefreshCw size={16} color="#F59E0B" />
            <Text style={styles.statusText}>
              Connected to {type} but no internet access
            </Text>
          </View>
        )}

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Troubleshooting:</Text>
          <Text style={styles.tip}>• Check your WiFi or mobile data</Text>
          <Text style={styles.tip}>• Make sure airplane mode is off</Text>
          <Text style={styles.tip}>• Try moving to an area with better signal</Text>
          <Text style={styles.tip}>• Restart your device if needed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  submessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tip: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});
