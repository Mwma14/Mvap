import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioDownmix } from '@/hooks/useAudioDownmix';
import Hls from 'hls.js';
import { X, AlertTriangle, Loader2, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FullscreenManager } from '@/components/FullscreenManager';

interface LiveTvPlayerProps {
  url: string;
  channelName: string;
  onClose: () => void;
  onError?: (url: string, channelName: string) => void;
}

const isHLSUrl = (url: string) => /\.(m3u8?)([\?#]|$)/i.test(url);
const MAX_NETWORK_RETRIES = 3;

export function LiveTvPlayer({ url, channelName, onClose, onError }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Auto-downmix 5.1 surround audio → stereo so dialogue (centre channel) is audible
  useAudioDownmix(videoRef, true);
  const networkRetryCount = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cleanup HLS instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Manage body class to hide Navbar and MobileBottomNav in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('tv-player-fullscreen');
    } else {
      document.body.classList.remove('tv-player-fullscreen');
    }
    // Always clean up on unmount
    return () => {
      document.body.classList.remove('tv-player-fullscreen');
    };
  }, [isFullscreen]);

  // Toggle fullscreen — user-initiated only
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Close handler — exit fullscreen first if active, otherwise close player
  const handleClose = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else {
      onClose();
    }
  }, [isFullscreen, onClose]);

  // Intercept the native HTML5 video fullscreen button press
  useEffect(() => {
    const handleNativeFullscreenChange = () => {
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (fsElement) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        } catch (e) {
          console.warn('Failed to exit native fullscreen:', e);
        }
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleNativeFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleNativeFullscreenChange);
    };
  }, []);

  // Setup video stream — only depends on url, not on fullscreen state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    destroyHls();
    setError(null);
    setLoading(true);
    setBuffering(false);
    setIsFullscreen(false);
    networkRetryCount.current = 0;

    video.pause();
    video.removeAttribute('src');
    video.load();

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => {
      setBuffering(false);
      networkRetryCount.current = 0;
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    if (!isHLSUrl(url)) {
      video.crossOrigin = 'anonymous';
      video.src = url;

      const handleCanPlay = () => {
        setLoading(false);
        video.play().catch(() => {});
      };
      const handleNativeError = () => {
        setLoading(false);
        setError('Video failed to load.');
        onError?.(url, channelName);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleNativeError);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleNativeError);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.pause();
        video.src = '';
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 7,
        liveMaxLatencyDurationCount: 12,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount.current += 1;
              if (networkRetryCount.current <= MAX_NETWORK_RETRIES) {
                setBuffering(true);
                setLoading(false);
                hls.startLoad();
              } else {
                setLoading(false);
                setBuffering(false);
                setError('Network error — stream may be offline or blocked by CORS.');
                onError?.(url, channelName);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setLoading(false);
              setBuffering(false);
              setError('Stream failed to load.');
              onError?.(url, channelName);
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });

      return () => {
        destroyHls();
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError('Stream failed to load.');
        onError?.(url, channelName);
      });

      return () => {
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
      };
    } else {
      setError('HLS playback is not supported in this browser.');
      setLoading(false);
    }
  }, [url]);

  return (
    <>
      {/* FullscreenManager — handles orientation lock, status bar, nav bar */}
      <FullscreenManager active={isFullscreen} onBack={handleClose} />

      {/*
        The <video> element NEVER moves in the DOM.
        When fullscreen: container becomes fixed + covers entire screen.
        body.tv-player-fullscreen CSS hides all <nav> elements (Navbar + MobileBottomNav).
      */}
      <div
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: '#000',
        } : {
          position: 'relative',
          width: '100%',
          backgroundColor: '#000',
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        {/* Top overlay bar — channel name + buttons */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isFullscreen
              ? 'max(0.5rem, env(safe-area-inset-top)) 0.75rem 0.5rem'
              : '0.5rem 0.75rem',
            background: isFullscreen
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
              : 'transparent',
          }}
        >
          {/* Channel name */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.5rem',
          }}>
            <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
              {channelName}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!loading && !error && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={isFullscreen ? handleClose : onClose}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Loading / Buffering overlay */}
        {(loading || buffering) && !error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}>
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
            ...(isFullscreen ? { height: '100%' } : { aspectRatio: '16/9' }),
          }}>
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <p style={{ color: '#fff', fontSize: '0.875rem' }}>{error}</p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          /* Video element — ALWAYS the same element, never unmounted or moved */
          <div style={isFullscreen
            ? { width: '100%', height: '100%' }
            : { aspectRatio: '16/9' }
          }>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              controls
              playsInline
              autoPlay
              crossOrigin="anonymous"
            />
          </div>
        )}
      </div>
    </>
  );
}
