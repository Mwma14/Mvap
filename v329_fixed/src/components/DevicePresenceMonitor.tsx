import { useAuth } from '@/hooks/useAuth';
import { useDevicePresence } from '@/hooks/useDevicePresence';

function getDeviceId(): string {
  const key = 'cineverse_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

/**
 * Component that monitors if the current device has been kicked.
 * Must be rendered inside AuthProvider.
 */
export function DevicePresenceMonitor() {
  const { user, isPremium, isAdmin } = useAuth();
  const deviceId = getDeviceId();

  useDevicePresence(user?.id, isPremium || isAdmin, deviceId);

  return null;
}
