import { useEffect, useState, RefObject } from 'react';

/**
 * Hook that auto-enters fullscreen on mobile and locks orientation to landscape.
 * Falls back to CSS rotation if fullscreen is denied.
 */
export function useFullscreenLandscape(containerRef: RefObject<HTMLElement | null>) {
  const [needsCssRotation, setNeedsCssRotation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);

    const lockOrientation = async () => {
      try {
        const orientation = screen.orientation as any;
        if (orientation?.lock) {
          await orientation.lock('landscape');
        }
      } catch (e) {
        console.log('Orientation lock failed:', e);
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (isNowFullscreen) {
        lockOrientation();
        setNeedsCssRotation(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const enterFullscreen = async () => {
      if (!isMobile) return;

      try {
        // Try standard fullscreen with navigation UI hidden
        if (container.requestFullscreen) {
          await container.requestFullscreen({ navigationUI: 'hide' } as any);
          return;
        }
        // Webkit fallback (iOS Safari)
        const webkitContainer = container as any;
        if (webkitContainer.webkitRequestFullscreen) {
          webkitContainer.webkitRequestFullscreen();
          return;
        }
        // Webkit (older Android WebView)
        if (webkitContainer.webkitEnterFullscreen) {
          webkitContainer.webkitEnterFullscreen();
          return;
        }
      } catch (e) {
        console.log('Fullscreen request failed, using CSS rotation fallback:', e);
      }

      // Fullscreen failed — use CSS rotation fallback if in portrait
      if (!cancelled) {
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        if (isPortrait) {
          setNeedsCssRotation(true);
        }
      }
    };

    // Attempt fullscreen immediately, and also on first user interaction
    enterFullscreen();

    const handleInteraction = () => {
      if (!document.fullscreenElement && isMobile) {
        enterFullscreen();
      }
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('click', handleInteraction, { once: true });

    // Listen for orientation changes to toggle CSS fallback
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      if (!document.fullscreenElement && isMobile) {
        setNeedsCssRotation(e.matches);
      }
    };
    portraitQuery.addEventListener('change', handleOrientationChange);

    return () => {
      cancelled = true;
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      portraitQuery.removeEventListener('change', handleOrientationChange);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);

      // Unlock orientation
      try {
        (screen.orientation as any)?.unlock?.();
      } catch (e) { /* ignore */ }

      // Don't exit fullscreen here — let Watch.tsx handle navigation on fullscreen exit
    };
  }, [containerRef]);

  return { needsCssRotation, isFullscreen };
}
