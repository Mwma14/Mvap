/**
 * Centralized external link handling for WebToApp APK compatibility.
 * 
 * FIX 1 — External links staying in-app:
 *   WebToApp WebViews intercept window.open() and window.location.href changes.
 *   The most reliable escape is a real synchronous anchor click with an 
 *   Android Intent URL. We've added a "Direct Escape" strategy using a 
 *   hidden form submission as a fallback, which some WebViews cannot block.
 *
 * FIX 2 — "Open With" button not working:
 *   Ensuring the MIME type is correctly passed and the intent is triggered
 *   synchronously within the user gesture context.
 */

const PLAYER_PACKAGES: Record<string, string> = {
  mxplayer: 'com.mxtech.videoplayer.ad',
  vlc: 'org.videolan.vlc',
  playit: 'com.playit.videoplayer',
};

/** Detect Android WebView environment */
export function isAndroidWebView(): boolean {
  const ua = navigator.userAgent || '';
  return (
    /wv|WebView/i.test(ua) ||
    (ua.includes('Android') && ua.includes('Version/'))
  );
}

/** Build an Android Intent URL for the system browser */
export function buildBrowserIntentUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    return (
      `intent://${parsed.host}${parsed.pathname}${parsed.search}` +
      `#Intent;` +
      `scheme=${scheme};` +
      `action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};` +
      `end`
    );
  } catch {
    return url;
  }
}

/** Build an Android Intent URL for video players */
export function buildVideoIntentUrl(videoUrl: string, mimeType = 'video/*'): string {
  return (
    `intent:${videoUrl}` +
    `#Intent;` +
    `action=android.intent.action.VIEW;` +
    `type=${mimeType};` +
    `category=android.intent.category.DEFAULT;` +
    `S.browser_fallback_url=${encodeURIComponent(videoUrl)};` +
    `end`
  );
}

/** Build an Intent URL for a specific player package */
export function buildPlayerIntentUrl(
  videoUrl: string,
  player: keyof typeof PLAYER_PACKAGES,
  mimeType = 'video/*',
): string {
  const pkg = PLAYER_PACKAGES[player];
  if (!pkg) return buildVideoIntentUrl(videoUrl, mimeType);
  return (
    `intent:${videoUrl}` +
    `#Intent;` +
    `action=android.intent.action.VIEW;` +
    `type=${mimeType};` +
    `package=${pkg};` +
    `S.browser_fallback_url=${encodeURIComponent(videoUrl)};` +
    `end`
  );
}

/** Infer video MIME type from URL */
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

/**
 * The most aggressive way to trigger an external navigation.
 * Uses multiple methods synchronously to ensure at least one works.
 */
function triggerEscape(href: string): void {
  console.log('[ExternalLinks] Triggering escape for:', href);
  
  // Method 1: Standard Anchor Click
  const a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  
  // Method 2: Form Submission (Harder for some WebViews to block)
  try {
    const form = document.createElement('form');
    form.action = href;
    form.method = 'GET';
    form.target = '_blank';
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 100);
  } catch (e) {
    console.error('[ExternalLinks] Form escape failed:', e);
  }

  // Method 3: Direct Location Change (as fallback)
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = href;
    }
  }, 100);

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 500);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface OpenExternalOptions {
  useIntent?: boolean;
  strategyDelay?: number;
  onFail?: () => void;
}

export function openExternalUrl(url: string, options?: OpenExternalOptions): void {
  const useIntent = options?.useIntent !== false;
  const href = useIntent ? buildBrowserIntentUrl(url) : url;
  
  triggerEscape(href);

  // If still visible after a delay, try the standard URL as a last resort
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      console.log('[ExternalLinks] Still visible, trying standard URL fallback');
      triggerEscape(url);
      
      // Final fail callback if still here after another delay
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          options?.onFail?.();
        }
      }, 2000);
    }
  }, 1500);
}

interface OpenVideoOptions {
  player?: 'generic' | 'mxplayer' | 'vlc' | 'playit';
  title?: string;
  mimeType?: string;
}

export function openVideoExternal(videoUrl: string, options?: OpenVideoOptions): void {
  const player = options?.player ?? 'generic';
  const mime = options?.mimeType ?? inferVideoMime(videoUrl);

  const intentUrl =
    player === 'generic'
      ? buildVideoIntentUrl(videoUrl, mime)
      : buildPlayerIntentUrl(videoUrl, player, mime);
  
  triggerEscape(intentUrl);

  // Fallback to standard URL if intent fails
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      console.log('[ExternalLinks] Video intent might have failed, trying direct URL');
      openExternalUrl(videoUrl, { useIntent: false });
    }
  }, 2000);
}
