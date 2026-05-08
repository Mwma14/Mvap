/**
 * Native Bridge for Capacitor Plugins
 * 
 * Provides native implementations for:
 * 1. Opening external links in the system browser
 * 2. Opening files with the system "Open With" chooser
 * 3. Screen orientation control (Landscape/Portrait)
 * 4. App-level back button handling
 */

import { Browser } from '@capacitor/browser';
import { AppLauncher } from '@capacitor/app-launcher';
import { FileOpener } from '@capacitor-community/file-opener';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Check if we're running on a native platform (Android/iOS)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if we're running on Android specifically
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Open a URL in the system browser using native Capacitor Browser plugin
 */
export async function openBrowserNative(url: string): Promise<void> {
  try {
    console.log('[NativeBridge] Opening URL in system browser:', url);
    await Browser.open({ url, windowName: '_blank' });
  } catch (error) {
    console.error('[NativeBridge] Failed to open browser:', error);
    throw error;
  }
}

/**
 * Open a file with the system "Open With" chooser
 */
export async function openFileWithChooser(fileUrl: string, mimeType: string): Promise<void> {
  try {
    console.log('[NativeBridge] Opening file with chooser:', fileUrl, 'MIME:', mimeType);
    
    if (isNativePlatform()) {
      await FileOpener.open({
        filePath: fileUrl,
        contentType: mimeType,
        openWithDefault: false,
      });
    } else {
      window.open(fileUrl, '_blank');
    }
  } catch (error) {
    console.error('[NativeBridge] Failed to open file with chooser:', error);
    try {
      await AppLauncher.openUrl({ url: fileUrl });
    } catch (e) {
      window.open(fileUrl, '_blank');
    }
  }
}

/**
 * Force landscape orientation (for video playback)
 */
export async function setLandscapeOrientation(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch (e) {
      console.error('[NativeBridge] Failed to lock landscape:', e);
    }
  }
}

/**
 * Reset orientation to portrait (when leaving video player)
 */
export async function setPortraitOrientation(): Promise<void> {
  if (isNativePlatform()) {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
      // Unlock after a short delay to allow user to rotate freely again if they want
      setTimeout(async () => {
        await ScreenOrientation.unlock();
      }, 1000);
    } catch (e) {
      console.error('[NativeBridge] Failed to lock portrait:', e);
    }
  }
}

/**
 * Register a listener for the native Android back button
 */
export function onNativeBack(callback: () => void) {
  if (isNativePlatform()) {
    return App.addListener('backButton', (data) => {
      if (data.canGoBack) {
        callback();
      }
    });
  }
  return null;
}

/**
 * Open a video file with the system "Open With" chooser
 */
export async function openVideoWithChooser(videoUrl: string, _title?: string): Promise<void> {
  const mimeType = inferVideoMime(videoUrl);
  await openFileWithChooser(videoUrl, mimeType);
}

function inferVideoMime(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith('.mp4')) return 'video/mp4';
    if (path.endsWith('.mkv')) return 'video/x-matroska';
    if (path.endsWith('.avi')) return 'video/x-msvideo';
    if (path.endsWith('.webm')) return 'video/webm';
    if (path.endsWith('.mov')) return 'video/quicktime';
    if (path.endsWith('.m3u8')) return 'application/x-mpegURL';
    if (path.endsWith('.ts')) return 'video/mp2t';
  } catch { /* ignore */ }
  return 'video/*';
}

export async function openExternalUrlFallback(url: string): Promise<void> {
  if (isNativePlatform()) {
    await openBrowserNative(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Fallback for opening files on web platforms
 */
export async function openFileWithChooserFallback(fileUrl: string, _mimeType: string): Promise<void> {
  if (isNativePlatform()) {
    await openFileWithChooser(fileUrl, _mimeType);
  } else {
    // Fallback to web methods
    window.open(fileUrl, '_blank');
  }
}
