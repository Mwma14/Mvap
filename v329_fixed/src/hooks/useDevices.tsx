import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_id: string;
  last_active_at: string;
  created_at: string;
}

// Parse user agent into a friendly device name
function parseDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

// Get or create a persistent device ID in localStorage
function getDeviceId(): string {
  const key = 'cineverse_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

export function useDevices(userId: string | undefined) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceLimitReached, setDeviceLimitReached] = useState(false);
  const [maxDevices, setMaxDevices] = useState(1);

  const fetchDevices = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [devicesResult, roleResult] = await Promise.all([
        supabase
          .from('user_devices')
          .select('*')
          .eq('user_id', userId)
          .order('last_active_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('max_devices, role')
          .eq('user_id', userId)
          .single(),
      ]);

      if (!devicesResult.error && devicesResult.data) {
        setDevices(devicesResult.data as UserDevice[]);
      }
      if (!roleResult.error && roleResult.data) {
        setMaxDevices(roleResult.data.max_devices ?? 1);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const registerDevice = useCallback(async (userId: string): Promise<{ allowed: boolean; devices: UserDevice[] }> => {
    const deviceId = getDeviceId();
    const deviceName = parseDeviceName();

    // Get user's max_devices and role from user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('max_devices, role')
      .eq('user_id', userId)
      .single();

    const userRole = roleData?.role;
    const userMaxDevices = roleData?.max_devices ?? 1;
    const isAdmin = userRole === 'admin';
    const isPremium = userRole === 'premium';
    setMaxDevices(userMaxDevices);

    // Free users: skip device tracking entirely, always allow
    if (!isAdmin && !isPremium) {
      setDeviceLimitReached(false);
      setDevices([]);
      return { allowed: true, devices: [] };
    }

    // Admin has unlimited devices - just register and allow
    if (isAdmin) {
      await supabase
        .from('user_devices')
        .upsert(
          {
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,device_id' }
        );

      const { data: allDevices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      const deviceList = (allDevices || []) as UserDevice[];
      setDevices(deviceList);
      setDeviceLimitReached(false);
      return { allowed: true, devices: deviceList };
    }

    // Premium users: enforce device limits strictly
    // First check if this device is already registered
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existingDevice) {
      // Device already registered - just update last_active and allow
      await supabase
        .from('user_devices')
        .update({ last_active_at: new Date().toISOString(), device_name: deviceName })
        .eq('id', existingDevice.id);

      const { data: allDevices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      const deviceList = (allDevices || []) as UserDevice[];
      setDevices(deviceList);
      setDeviceLimitReached(false);
      return { allowed: true, devices: deviceList };
    }

    // New device - check if limit is already reached
    const { data: currentDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    const currentList = (currentDevices || []) as UserDevice[];
    setDevices(currentList);

    if (currentList.length >= userMaxDevices) {
      // Limit reached - DO NOT register the new device, block login
      setDeviceLimitReached(true);
      return { allowed: false, devices: currentList };
    }

    // Under limit - register the new device
    await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName,
        last_active_at: new Date().toISOString(),
      });

    const { data: allDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    const deviceList = (allDevices || []) as UserDevice[];
    setDevices(deviceList);
    setDeviceLimitReached(false);
    return { allowed: true, devices: deviceList };
  }, []);

  const removeDevice = useCallback(async (deviceDbId: string) => {
    if (!userId) return;
    await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceDbId)
      .eq('user_id', userId);
    
    await fetchDevices();
  }, [userId, fetchDevices]);

  useEffect(() => {
    if (userId) {
      fetchDevices();
    }
  }, [userId, fetchDevices]);

  return {
    devices,
    isLoading,
    deviceLimitReached,
    setDeviceLimitReached,
    maxDevices,
    registerDevice,
    removeDevice,
    fetchDevices,
    currentDeviceId: getDeviceId(),
  };
}
