import { useState, useEffect, useRef } from 'react';
import { Server, ChevronRight, Play, ExternalLink, Download, Loader2, Copy, RefreshCw, X } from 'lucide-react';
import { openBrowserNative, isNativePlatform, openExternalUrlFallback } from '@/lib/nativeBridge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDownloadManager } from '@/contexts/DownloadContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ServerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streamUrl?: string | null;
  telegramUrl?: string | null;
  megaUrl?: string | null;
  downloadUrl?: string | null;
  mxPlayerUrl?: string | null;
  type: 'play' | 'download';
  setIsPlaying?: (playing: boolean) => void;
  movieInfo?: {
    movieId: string;
    episodeId?: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    resolution: string | null;
    fileSize: string | null;
  };
}

export function ServerDrawer({
  open,
  onOpenChange,
  streamUrl,
  telegramUrl,
  megaUrl,
  downloadUrl,
  mxPlayerUrl,
  type,
  setIsPlaying,
  movieInfo,
}: ServerDrawerProps) {
  const { t } = useLanguage();
  const { startDownload } = useDownloadManager();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset redirecting state when user returns to the app
  useEffect(() => {
    if (!redirecting) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setRedirecting(false);
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [redirecting]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  const handleOpen = (url: string, useInAppPlayer: boolean = false) => {
    // In-app download with progress tracking
    if (type === 'download' && movieInfo) {
      console.log('[ServerDrawer] Starting in-app download for:', movieInfo.title);
      startDownload({
        movieId: movieInfo.movieId,
        title: movieInfo.title,
        posterUrl: movieInfo.posterUrl,
        year: movieInfo.year,
        resolution: movieInfo.resolution,
        fileSize: movieInfo.fileSize,
        url: url,
      });
      navigate('/downloads');
      onOpenChange(false);
      return;
    }

    if (useInAppPlayer && type === 'play') {
      const title = movieInfo?.title || 'Video';
      const movieId = movieInfo?.movieId || '';
      const episodeId = movieInfo?.episodeId || '';
      let watchUrl = `/watch?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&movieId=${encodeURIComponent(movieId)}`;
      if (episodeId) watchUrl += `&episodeId=${encodeURIComponent(episodeId)}`;
      navigate(watchUrl);
      onOpenChange(false);
      return;
    }

    // External link flow — use native Capacitor Browser plugin
    setRedirecting(true);
    onOpenChange(false);
    // Ensure we don't trigger landscape mode for external links
    if (setIsPlaying) setIsPlaying(false);

    toast({
      title: 'Opening external link...',
      description: 'Tap back to return to Kyi Mal',
      duration: 5000,
    });

    // Use native browser if available, otherwise fallback
    if (isNativePlatform()) {
      openBrowserNative(url).catch(() => {
        setRedirecting(false);
        setFallbackUrl(url);
      });
    } else {
      openExternalUrlFallback(url).catch(() => {
        setRedirecting(false);
        setFallbackUrl(url);
      });
    }
  };

  /**
   * Handle the "External Server" (mxPlayerUrl) link — use native browser
   */
  const handleExternalServerClick = (url: string) => {
    setRedirecting(true);
    onOpenChange(false);
    // Don't set isPlaying(true) for external servers as it triggers landscape rotation
    // via FullscreenManager in the parent component
    if (setIsPlaying) setIsPlaying(false);

    toast({
      title: 'Opening in browser...',
      description: 'Tap back to return to Kyi Mal',
      duration: 5000,
    });

    // Use native browser plugin
    if (isNativePlatform()) {
      openBrowserNative(url).catch(() => {
        setRedirecting(false);
        setFallbackUrl(url);
      });
    } else {
      openExternalUrlFallback(url).catch(() => {
        setRedirecting(false);
        setFallbackUrl(url);
      });
    }
  };

  const servers = type === 'download'
    ? [
        ...(downloadUrl ? [{ name: 'Main Server', url: downloadUrl, icon: 'download' as const, inApp: false }] : []),
        ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const, inApp: false }] : []),
        ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const, inApp: false }] : []),
      ]
    : [
        ...(streamUrl ? [{ name: 'Main Server', url: streamUrl, icon: 'main' as const, inApp: true, externalServer: false }] : []),
        ...(mxPlayerUrl ? [{ name: 'External Server', url: mxPlayerUrl, icon: 'external' as const, inApp: false, externalServer: true }] : []),
        ...(downloadUrl ? [{ name: 'Direct Download', url: downloadUrl, icon: 'download' as const, inApp: false, externalServer: false }] : []),
        ...(telegramUrl ? [{ name: 'Telegram', url: telegramUrl, icon: 'telegram' as const, inApp: false, externalServer: false }] : []),
        ...(megaUrl ? [{ name: 'MEGA', url: megaUrl, icon: 'mega' as const, inApp: false, externalServer: false }] : []),
      ];

  if (servers.length === 0 && !redirecting) return null;

  const title = type === 'play' ? t('chooseServer') : t('chooseDownloader');

  return (
    <>
      {/* Full-screen loading overlay */}
      {redirecting && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-lg font-semibold text-foreground">Opening external link...</p>
          <p className="text-sm text-muted-foreground">You'll be redirected to your browser</p>
        </div>
      )}

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-2xl font-bold text-foreground">
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3">
            {servers.map((server) => {
              const sharedClassName =
                'w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors';
              const inner = (
                <>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <span className="flex-1 text-left font-medium text-foreground text-lg">
                    {server.name}
                  </span>
                  {type === 'play' ? (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  )}
                </>
              );

              // "External Server" — must open in system browser
              if ((server as any).externalServer) {
                return (
                  <button
                    key={server.name}
                    onClick={() => handleExternalServerClick(server.url)}
                    className={sharedClassName}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <button
                  key={server.name}
                  onClick={() => handleOpen(server.url, (server as any).inApp)}
                  className={sharedClassName}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Fallback dialog when native browser fails */}
      {fallbackUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Couldn't open browser</h3>
              <button onClick={() => setFallbackUrl(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy the link below and paste it in your browser:
            </p>
            <div className="bg-muted rounded-lg p-3 break-all text-xs text-foreground select-all font-mono">
              {fallbackUrl}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard
                    .writeText(fallbackUrl)
                    .then(() => {
                      toast({ title: 'Link copied!', description: 'Paste it in your browser', duration: 3000 });
                    })
                    .catch(() => {
                      toast({
                        title: "Couldn't copy",
                        description: 'Long-press the link above to copy manually',
                        variant: 'destructive',
                      });
                    });
                }}
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    // Retry with native browser
                    if (isNativePlatform()) {
                      openBrowserNative(fallbackUrl).catch(() => {
                        setFallbackUrl(fallbackUrl);
                      });
                    } else {
                      openExternalUrlFallback(fallbackUrl).catch(() => {
                        setFallbackUrl(fallbackUrl);
                      });
                    }
                    setRedirecting(true);
                    setFallbackUrl(null);
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setFallbackUrl(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
