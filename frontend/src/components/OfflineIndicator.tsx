import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import styles from './OfflineIndicator.module.css';

export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Don't show anything if online and wasn't recently offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={`${styles.indicator} ${isOnline ? styles.online : styles.offline}`}>
      <div className={styles.content}>
        {isOnline ? (
          <>
            <RefreshCw size={16} className={styles.syncIcon} />
            <span>Back online - Syncing...</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>You're offline - Changes will sync when connected</span>
          </>
        )}
      </div>
    </div>
  );
}
