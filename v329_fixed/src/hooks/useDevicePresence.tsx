import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

function parseDeviceName(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Chrome on Android';
  if (/iphone|ipad/i.test(ua)) return 'Safari on iOS';
  if (/windows/i.test(ua)) return 'Chrome on Windows';
  if (/mac/i.test(ua)) return 'Chrome on Mac';
  return 'Unknown Device';
}

/**
 * Device presence monitor:
 * - ADMIN: completely unlimited — always registers, never kicked
 * - PREMIUM: registers up to max_devices, kicked only if explicitly removed
 * - FREE: no tracking at all
 */
export function useDevicePresence(
  userId: string | undefined,
  isPremiumOrAdmin: boolean,
  deviceId: string
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registeredRef = useRef(false);
  const isAdminRef = useRef(false);

  useEffect(() => {
    if (!userId || !isPremiumOrAdmin) return;

    registeredRef.current = false;
    isAdminRef.current = false;

    const checkPresence = async () => {
      try {
        // Step 1: Get user role — ADMIN bypasses everything
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, max_devices')
          .eq('user_id', userId)
          .single();

        const isAdmin = roleData?.role === 'admin';
        isAdminRef.current = isAdmin;

        if (isAdmin) {
          // Admin: always register/update, NEVER kick
          await supabase
            .from('user_devices')
            .upsert(
              {
                user_id: userId,
                device_id: deviceId,
                device_name: parseDeviceName(),
                last_active_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,device_id' }
            );
          registeredRef.current = true;
          return; // Done — no kick logic for admin
        }

        // Step 2: Premium user — check if device is registered
        const { data: deviceRow } = await supabase
          .from('user_devices')
          .select('id')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .maybeSingle();

        if (deviceRow) {
          // Device exists — update heartbeat
          registeredRef.current = true;
          await supabase
            .from('user_devices')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', deviceRow.id);
        } else {
          if (!registeredRef.current) {
            // Fresh install — try to register
            const maxDevices = roleData?.max_devices ?? 1;
            const { data: existingDevices } = await supabase
              .from('user_devices')
              .select('id')
              .eq('user_id', userId);

            const count = existingDevices?.length ?? 0;
            if (count < maxDevices) {
              await supabase.from('user_devices').insert({
                user_id: userId,
                device_id: deviceId,
                device_name: parseDeviceName(),
                last_active_at: new Date().toISOString(),
              });
              registeredRef.current = true;
            } else {
              // Device limit reached — sign out
              console.log('[DevicePresence] Device limit reached, signing out...');
              clearInterval(intervalRef.current!);
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }
          } else {
            // Was registered before but now gone — explicitly kicked by admin
            console.log('[DevicePresence] Device was removed by admin, signing out...');
            clearInterval(intervalRef.current!);
            await supabase.auth.signOut();
            window.location.href = '/auth';
          }
        }
      } catch (err) {
        console.error('[DevicePresence] Error:', err);
        // On error, do NOT sign out — just retry next interval
      }
    };

    // OPTIMIZED: Run immediately, then every 5 minutes instead of every 60 seconds.
    // The original 60-second interval caused 1440 DB writes/day per active premium user.
    // 5-minute interval reduces this to 288 writes/day (80% reduction in PostgREST egress).
    checkPresence();
    intervalRef.current = setInterval(checkPresence, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, isPremiumOrAdmin, deviceId]);
}
