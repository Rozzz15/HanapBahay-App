/**
 * Safe navigation helpers to prevent "GO_BACK" errors
 */

import { router } from 'expo-router';

/**
 * Safely go back if possible, otherwise navigate to a fallback route
 * @param fallbackRoute - Route to navigate to if can't go back (e.g., '/(tabs)')
 */
export function safeGoBack(fallbackRoute: string = '/(tabs)') {
  // Check if we can go back by checking if there's history
  if (router.canGoBack()) {
    router.back();
  } else {
    // No history, navigate to fallback (usually main tab)
    console.log('⚠️ No screen to go back to, navigating to:', fallbackRoute);
    router.replace(fallbackRoute as any);
  }
}

/**
 * Check if navigation can go back
 */
export function canGoBack(): boolean {
  return router.canGoBack();
}
