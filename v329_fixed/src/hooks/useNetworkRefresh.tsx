import { useEffect, useRef } from 'react';

/**
 * Detects when the user goes offline and comes back online,
 * then auto-refreshes the page. Does NOT refresh on every
 * connection type change to avoid aggressive reloading.
 */
export function useNetworkRefresh() {
  const wasOfflineRef = useRef(false);
  const offlineAtRef = useRef<number>(0);
  const lastReloadRef = useRef<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        const offlineDuration = Date.now() - offlineAtRef.current;
        const timeSinceLastReload = Date.now() - lastReloadRef.current;
        wasOfflineRef.current = false;
        // Only reload if offline >3s and no reload in last 30s
        if (offlineDuration > 3000 && timeSinceLastReload > 30000) {
          console.log('[Network] Back online — refreshing...');
          lastReloadRef.current = Date.now();
          window.location.reload();
        } else {
          console.log('[Network] Back online — skipping reload (brief disconnect or recent reload)');
        }
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      offlineAtRef.current = Date.now();
      console.log('[Network] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}
