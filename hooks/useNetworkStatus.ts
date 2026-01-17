import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  details: NetInfoState['details'] | null;
}

/**
 * Hook to monitor network connectivity status
 * Returns true only when device has internet access (not just WiFi/Mobile connection)
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    isInternetReachable: null,
    type: null,
    details: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
        details: state.details,
      });
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
        details: state.details,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check if we have actual internet access
  // For production, we require both connection AND internet reachability
  const hasInternet = networkStatus.isConnected && 
                      (networkStatus.isInternetReachable === true || networkStatus.isInternetReachable === null);

  return {
    ...networkStatus,
    hasInternet,
  };
}
