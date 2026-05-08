import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { LoginRequiredModal } from '@/components/LoginRequiredModal';
import { FootballVideoCard } from '@/components/FootballVideoCard';
import { useFootballVideos, FootballVideo } from '@/hooks/useFootball';
import { useAuth } from '@/hooks/useAuth';
import { useDownloadManager } from '@/contexts/DownloadContext';

export default function FootballHighlights() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { startDownload } = useDownloadManager();
  const { data: videos, isLoading } = useFootballVideos();
  const [loginModal, setLoginModal] = useState(false);

  const highlightVideos = useMemo(() => {
    if (!videos) return [];
    return videos.filter(v => v.show_in_highlights);
  }, [videos]);

  const liveVideos = useMemo(() => highlightVideos.filter(v => v.is_live), [highlightVideos]);
  const nonLiveVideos = useMemo(() => highlightVideos.filter(v => !v.is_live), [highlightVideos]);

  const handlePlay = (video: FootballVideo) => {
    if (video.is_premium && !isPremium) { setLoginModal(true); return; }
    if (video.stream_url) navigate(`/watch?url=${encodeURIComponent(video.stream_url)}`);
  };

  const handleDownload = (video: FootballVideo) => {
    if (!user) { setLoginModal(true); return; }
    if (video.is_premium && !isPremium) { setLoginModal(true); return; }
    if (video.download_url) {
      startDownload({ movieId: video.id, title: video.title, url: video.download_url, posterUrl: video.thumbnail_url, year: null, resolution: null, fileSize: null });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 pb-24 md:pb-8">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5" /> Highlights
          </h1>
        </div>

        <div className="px-4">
          {isLoading ? (
            <LoadingSpinner message="Loading highlights..." />
          ) : highlightVideos.length === 0 ? (
            <FadeIn>
              <div className="text-center py-20">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No highlights yet</p>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
              {liveVideos.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-destructive" /> Live Now
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {liveVideos.map((video) => (
                      <FootballVideoCard key={video.id} video={video} onPlay={handlePlay} onDownload={handleDownload} />
                    ))}
                  </div>
                </div>
              )}
              {nonLiveVideos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {nonLiveVideos.map((video) => (
                    <FootballVideoCard key={video.id} video={video} onPlay={handlePlay} onDownload={handleDownload} />
                  ))}
                </div>
              )}
            </FadeIn>
          )}
        </div>
      </div>
      <MobileBottomNav />
      <LoginRequiredModal open={loginModal} onOpenChange={setLoginModal} />
    </div>
  );
}
