import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';

interface FullscreenManagerProps {
  active: boolean;
  onBack?: () => void;
  /** Kept for API compatibility — orientation is always landscape during playback */
  manualOrientation?: 'landscape' | 'portrait';
}

export function FullscreenManager({ active, onBack }: FullscreenManagerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListener: any;
    let isLocking = false;

    const enableFullscreen = async () => {
      if (isLocking) return;
      isLocking = true;
      try {
        // 1. Hide status bar immediately
        await StatusBar.hide();
        
        // 2. Lock orientation to landscape
        // Try multiple approaches to ensure landscape lock works
        try {
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (e) {
          console.warn('Initial orientation lock failed, retrying with landscape-primary...', e);
          try {
            await ScreenOrientation.lock({ orientation: 'landscape-primary' });
          } catch (e2) {
            console.warn('landscape-primary failed, trying landscape-secondary...', e2);
            try {
              await ScreenOrientation.lock({ orientation: 'landscape-secondary' });
            } catch (e3) {
              console.error('All ScreenOrientation lock attempts failed:', e3);
            }
          }
        }

        // 3. Hide navigation bar
        await NavigationBar.hide();
        try {
          await NavigationBar.setBackgroundColor({ color: '#00000000' });
        } catch { /* ignore */ }
      } catch (e) {
        console.error('Failed to enable fullscreen mode:', e);
      } finally {
        isLocking = false;
      }
    };

    const disableFullscreen = async () => {
      try {
        // 1. Lock to portrait first to ensure we return to portrait
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
        } catch (e) {
          console.warn('Portrait lock failed during disable:', e);
        }
        // 2. Then unlock to allow free rotation
        await ScreenOrientation.unlock();
        // 3. Restore navigation bar but keep status bar hidden (immersive mode)
        await StatusBar.hide();
        await NavigationBar.show();
      } catch (e) {
        console.error('Failed to disable fullscreen mode:', e);
      }
    };

    const setupBackListener = async () => {
      try {
        backListener = await App.addListener('backButton', () => {
          if (active) {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
          }
        });
      } catch (e) {
        console.error('Failed to setup back button listener:', e);
      }
    };

    if (active) {
      enableFullscreen();
      setupBackListener();

      // Periodically ensure bars are hidden and orientation is locked during playback
      // This prevents system UI from popping back up during interactions
      const intervalId = setInterval(async () => {
        if (active && !isLocking) {
          try {
            await NavigationBar.hide();
            await StatusBar.hide();
            // Re-enforce landscape lock periodically to prevent orientation drift
            try {
              await ScreenOrientation.lock({ orientation: 'landscape' });
            } catch { /* ignore */ }
          } catch { /* ignore */ }
        }
      }, 2000);

      return () => {
        clearInterval(intervalId);
        if (backListener) backListener.remove();
        disableFullscreen();
      };
    } else {
      disableFullscreen();
      return () => {
        if (backListener) backListener.remove();
      };
    }
  }, [active, onBack, navigate]);

  return null;
}
