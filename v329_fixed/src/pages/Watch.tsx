/**
 * Watch.tsx — Production-grade in-app video player
 *
 * Strategy by URL type:
 *
 *   1. Bot proxy WATCH page  (.../proxy/watch/...)
 *   2. Bot proxy PLAYER page (.../proxy/player/...)
 *      → Load the page DIRECTLY in a full-screen <iframe>.
 *        The bot's Artplayer handles MKV/MP4/WebM decoding.
 *        Android WebView's <video> tag cannot decode MKV — but
 *        the full WebView (iframe) CAN, just like Chrome browser.
 *
 *   3. Direct video URL (mp4, m3u8, etc.)
 *      → Load in the custom <video> element with HLS.js support.
 *
 * Why iframe instead of <video> for proxy pages:
 *   - Android WebView <video> does NOT support MKV (Matroska) codec
 *   - The bot's page uses Artplayer which uses MediaSource Extensions
 *     and handles MKV perfectly — same as Chrome browser
 *   - iframe gives us a full browser context inside the app
 *   - The bot server already sends CORS: * so iframe loads fine
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, AlertCircle, RefreshCw, VolumeX,
  Play, Pause, RotateCcw, RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FullscreenManager } from '@/components/FullscreenManager';
import { useUpdateProgress } from '@/hooks/useWatchHistory';
import { useAudioDownmix } from '@/hooks/useAudioDownmix';
import { Slider } from '@/components/ui/slider';
import Hls from 'hls.js';

// ─── URL Classification ───────────────────────────────────────────────────────

type UrlKind = 'proxy-page' | 'hls' | 'direct';

function classifyUrl(url: string): UrlKind {
  // Bot proxy watch/player pages — load as iframe
  // Matches:
  //   https://...run.app/proxy/watch/{id}/file.mkv?hash=...
  //   https://...run.app/proxy/player/{id}/file.mkv?hash=...
  //   https://tw.thewayofthedragg.workers.dev/watch/{id}/file.mkv?hash=...
  //   Any URL with /watch/ or /player/ in the path (not a direct file CDN)
  if (/\/proxy\/(watch|player)\//.test(url)) return 'proxy-page';
  if (/workers\.dev\/(watch|player)\//.test(url)) return 'proxy-page';
  if (/\/watch\/\d+\//.test(url)) return 'proxy-page';  // generic /watch/{id}/ pattern
  if (/\.m3u8(\?|#|$)/i.test(url)) return 'hls';
  return 'direct';
}

// ─── Vercel proxy helper (for direct video fallback) ─────────────────────────

const VERCEL_PROXY = 'https://proxies-lake.vercel.app/api/stream';
function makeProxyUrl(url: string): string {
  return `${VERCEL_PROXY}?url=${encodeURIComponent(url)}`;
}

// ─── WebView Player (for proxy pages) ────────────────────────────────────────

interface WebViewPlayerProps {
  url: string;
  title: string;
  onBack: () => void;
}

function WebViewPlayer({ url, title, onBack }: WebViewPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timeout: if iframe doesn't load in 20s, show error
  useEffect(() => {
    loadTimerRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('The stream page took too long to load. The server may be temporarily down.');
      }
    }, 20000);
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, []);

  const handleLoad = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setLoading(false);
    setError('Failed to load the stream page. Please check your connection and try again.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ width: '100vw', height: '100dvh' }}>
      <FullscreenManager active={!loading && !error} onBack={onBack} />

      {/* Back button — always visible, overlaid on top of iframe */}
      <div
        className="absolute top-0 left-0 right-0 z-[60] flex items-center gap-3 px-3 py-2 bg-gradient-to-b from-black/70 to-transparent"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <button
          onClick={onBack}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm font-medium truncate flex-1 drop-shadow">{title}</span>
      </div>

      {/* The iframe — loads the bot's Artplayer page directly */}
      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full border-0"
        style={{ flex: 1 }}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; screen-wake-lock"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        title={title}
        // NO sandbox attribute — sandbox restricts autoplay and media APIs
        // which breaks video playback inside the iframe on Android WebView
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[55] bg-black flex items-center justify-center">
          <LoadingSpinner message={`Loading ${title}...`} />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-[70] bg-black flex flex-col items-center justify-center p-6 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground text-center text-lg">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={() => { setError(null); setLoading(true); if (iframeRef.current) { iframeRef.current.src = url; } }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Video Player (for direct mp4/m3u8 files) ─────────────────────────

interface VideoPlayerProps {
  url: string;
  title: string;
  movieId: string;
  episodeId?: string;
  startTime: number;
  onBack: () => void;
}

function VideoPlayer({ url, title, movieId, episodeId, startTime, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const seekedRef = useRef(false);
  const lastSaveRef = useRef(0);
  const progressRef = useRef({ current: 0, duration: 0 });
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateProgress = useUpdateProgress();
  useAudioDownmix(videoRef, true);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '00:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return [h > 0 ? h : null, m, sec]
      .filter(x => x !== null)
      .map(x => x!.toString().padStart(2, '0'))
      .join(':');
  };

  const skip = (amount: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + amount));
  };

  const handleVideoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const x = e.clientX;
    const w = window.innerWidth;
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      if (x < w / 3) skip(-10);
      else if (x > (w * 2) / 3) skip(10);
      else {
        const v = videoRef.current;
        if (v) { v.paused ? v.play() : v.pause(); }
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x };
      setShowControls(prev => {
        if (!prev) { hideControlsAfterDelay(); return true; }
        return false;
      });
    }
  };

  // Watch progress tracking
  useEffect(() => {
    if (!movieId) return;
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (!isDragging) setCurrentTime(v.currentTime);
      setDuration(v.duration || 0);
      progressRef.current = { current: v.currentTime, duration: v.duration || 0 };
      const now = Date.now();
      if (now - lastSaveRef.current < 10_000) return;
      lastSaveRef.current = now;
      updateProgress.mutate({ movieId, episodeId, progressSeconds: Math.floor(v.currentTime), durationSeconds: Math.floor(v.duration || 0) });
    };
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      if (progressRef.current.current > 5) {
        updateProgress.mutate({ movieId, episodeId, progressSeconds: Math.floor(progressRef.current.current), durationSeconds: Math.floor(progressRef.current.duration) });
      }
    };
  }, [movieId, episodeId, isDragging]);

  // Video setup
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url) return;
    let cancelled = false;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const tryAutoPlay = async () => {
      if (startTime > 0 && !seekedRef.current) { seekedRef.current = true; v.currentTime = startTime; }
      v.muted = false;
      try {
        await v.play();
        setIsPlaying(true);
        setShowUnmute(false);
        hideControlsAfterDelay();
      } catch {
        v.muted = true;
        setShowUnmute(true);
        try { await v.play(); } catch { /* shown via onerror */ }
      }
    };

    const loadDirect = (src: string, isRetry = false) => {
      v.onloadedmetadata = null;
      v.onerror = null;
      const finalSrc = isRetry ? makeProxyUrl(src) : src;
      v.src = finalSrc;
      v.onloadedmetadata = () => { if (!cancelled) { setLoading(false); tryAutoPlay(); } };
      v.onerror = () => {
        if (cancelled) return;
        if (!isRetry) { loadDirect(src, true); }
        else { setLoading(false); setError(`Video failed to load (error ${v.error?.code}). The server may be down or the link has expired.`); }
      };
      v.load();
    };

    const loadHls = (src: string, isRetry = false) => {
      const finalSrc = isRetry ? makeProxyUrl(src) : src;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(finalSrc);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!cancelled) { setLoading(false); tryAutoPlay(); } });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && !cancelled) {
            hls.destroy(); hlsRef.current = null;
            if (!isRetry) loadHls(src, true);
            else { setLoading(false); setError('HLS stream failed to load.'); }
          }
        });
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        v.src = finalSrc;
        v.onloadedmetadata = () => { if (!cancelled) { setLoading(false); tryAutoPlay(); } };
        v.onerror = () => { if (!cancelled) { setLoading(false); setError('HLS stream failed.'); } };
      } else {
        setLoading(false);
        setError('HLS streaming is not supported on this device.');
      }
    };

    const kind = classifyUrl(url);
    if (kind === 'hls') loadHls(url);
    else loadDirect(url);

    return () => {
      cancelled = true;
      v.onloadedmetadata = null;
      v.onerror = null;
      v.src = '';
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ width: '100vw', height: '100dvh' }}>
      {!error && <FullscreenManager active={isPlaying} onBack={onBack} />}

      <div className="relative w-full h-full flex items-center justify-center" onClick={handleVideoTap}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain pointer-events-none"
          playsInline
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Controls overlay */}
        <div
          className={`absolute inset-0 z-[60] flex flex-col justify-between bg-black/30 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-white font-medium truncate flex-1">{title}</h1>
          </div>

          <div className="flex items-center justify-center gap-12">
            <button onClick={() => skip(-10)} className="p-3 hover:bg-white/20 rounded-full transition-colors">
              <RotateCcw className="w-8 h-8 text-white" />
            </button>
            <button
              onClick={() => { const v = videoRef.current; if (v) { v.paused ? v.play() : v.pause(); } }}
              className="p-5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all transform active:scale-90"
            >
              {isPlaying ? <Pause className="w-10 h-10 text-white fill-white" /> : <Play className="w-10 h-10 text-white fill-white ml-1" />}
            </button>
            <button onClick={() => skip(10)} className="p-3 hover:bg-white/20 rounded-full transition-colors">
              <RotateCw className="w-8 h-8 text-white" />
            </button>
          </div>

          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-white text-xs font-mono w-12">{formatTime(currentTime)}</span>
              <div className="flex-1 px-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={val => { setIsDragging(true); setCurrentTime(val[0]); }}
                  onValueCommit={val => {
                    const v = videoRef.current;
                    if (v) { v.currentTime = val[0]; setCurrentTime(val[0]); }
                    setIsDragging(false);
                    hideControlsAfterDelay();
                  }}
                  className="cursor-pointer"
                />
              </div>
              <span className="text-white text-xs font-mono w-12 text-right">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[55] bg-black flex items-center justify-center">
          <LoadingSpinner message={`Loading ${title}...`} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[70] bg-black flex flex-col items-center justify-center p-6 gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground text-center text-lg">{error}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
          </div>
        </div>
      )}

      {showUnmute && (
        <button
          onClick={() => { const v = videoRef.current; if (v) { v.muted = false; setShowUnmute(false); } }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg animate-pulse"
        >
          <VolumeX className="w-5 h-5" />
          <span className="text-sm font-medium">Tap to unmute</span>
        </button>
      )}
    </div>
  );
}

// ─── Main Watch Page ──────────────────────────────────────────────────────────

export default function Watch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawUrl    = searchParams.get('url') || '';
  const title     = searchParams.get('title') || 'Video';
  const movieId   = searchParams.get('movieId') || '';
  const episodeId = searchParams.get('episodeId') || undefined;
  const startTime = parseFloat(searchParams.get('t') || '0');

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!rawUrl) navigate('/', { replace: true });
  }, [rawUrl, navigate]);

  if (!rawUrl) return null;

  const kind = classifyUrl(rawUrl);

  // Proxy pages (main server / external server) → iframe WebView
  if (kind === 'proxy-page') {
    return <WebViewPlayer url={rawUrl} title={title} onBack={goBack} />;
  }

  // Direct video files (mp4, m3u8, etc.) → custom player
  return (
    <VideoPlayer
      url={rawUrl}
      title={title}
      movieId={movieId}
      episodeId={episodeId}
      startTime={startTime}
      onBack={goBack}
    />
  );
}
