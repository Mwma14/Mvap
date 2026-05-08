import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Play,
  Crown,
  Eye,
  Download,
  ArrowLeft,
  Heart,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PremiumModal } from '@/components/PremiumModal';
import { SeasonEpisodeList } from '@/components/SeasonEpisodeList';
import { RelatedMovies } from '@/components/RelatedMovies';
import { ServerDrawer } from '@/components/ServerDrawer';
import { LoginRequiredModal } from '@/components/LoginRequiredModal';
import { CastSection } from '@/components/CastSection';
import { useAuth } from '@/hooks/useAuth';
import { useMovie, useIsInWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';

import { useMovieViews, useIncrementView } from '@/hooks/useMovieViews';
import { StarRating } from '@/components/StarRating';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { proxyImageUrl } from '@/lib/utils';
import { FullscreenManager } from '@/components/FullscreenManager';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPremium, isLoading: authLoading } = useAuth();
  const { data: movie, isLoading } = useMovie(id || '');
  const { data: isInWatchlist, isLoading: watchlistLoading } = useIsInWatchlist(id || '');
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  
  const { data: viewCount } = useMovieViews(id || '');
  const incrementView = useIncrementView();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPlayDrawer, setShowPlayDrawer] = useState(false);
  const [showDownloadDrawer, setShowDownloadDrawer] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginFeature, setLoginFeature] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  // Track view when page loads (only increment view count, don't touch watch progress)
  useEffect(() => {
    if (id && user) {
      incrementView.mutate(id);
    }
  }, [id, user]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner message="Loading details..." />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    if (!user) {
      setLoginFeature(t('play'));
      setShowLoginModal(true);
      return;
    }
    if (!isPremium) {
      setShowPremiumModal(true);
    } else {
      if (id) incrementView.mutate(id);
      setShowPlayDrawer(true);
    }
  };

  const handleDownload = () => {
    if (!user) {
      setLoginFeature(t('download'));
      setShowLoginModal(true);
      return;
    }
    if (!isPremium) {
      setShowPremiumModal(true);
    } else {
      setShowDownloadDrawer(true);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      setLoginFeature(t('favorite'));
      setShowLoginModal(true);
      return;
    }
    if (!id) return;
    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(id);
        toast({ title: "Removed from Watchlist", description: `${movie.title} removed.` });
      } else {
        await addToWatchlist.mutateAsync(id);
        toast({ title: "Added to Watchlist", description: `${movie.title} added.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update watchlist.", variant: "destructive" });
    }
  };

  const isWatchlistMutating = addToWatchlist.isPending || removeFromWatchlist.isPending;
  const descriptionTruncated = movie.description && movie.description.length > 200;
  const displayDescription = showFullDescription
    ? movie.description
    : movie.description?.slice(0, 200);

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      {/* Fullscreen Manager for External Server Playback */}
      <FullscreenManager active={isPlaying} onBack={() => setIsPlaying(false)} />

      {/* Top bar with back button */}
      <div className="pt-16 px-4 pb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Movie Header - Poster + Info side by side */}
      <div className="px-4 pb-4">
        <div className="flex gap-4">
          {/* Poster */}
          <div className="flex-shrink-0 w-40 relative">
            {movie.poster_url ? (
              <img
                src={proxyImageUrl(movie.poster_url)}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                <Film className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            {/* Resolution badge on poster */}
            {movie.resolution && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                {movie.resolution.includes('4K') || movie.resolution.includes('2160')
                  ? '4K'
                  : movie.resolution}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground mb-1 leading-tight">
              {movie.title}
            </h1>

            {/* Year • Genre */}
            <p className="text-sm text-muted-foreground mb-2">
              {movie.year && <span>{movie.year}</span>}
              {movie.category && movie.category.length > 0 && (
                <span> • {movie.category.join(', ')}</span>
              )}
            </p>

            {/* Resolution badge */}
            {movie.resolution && (
              <Badge className="bg-cg-success text-white border-0 mb-2 text-xs font-bold">
                Web-dl {movie.resolution}
              </Badge>
            )}

            {/* Rating */}
            <div className="mb-2">
              <StarRating
                movieId={movie.id}
                averageRating={movie.average_rating}
                ratingCount={movie.rating_count}
                size="md"
              />
            </div>

            {/* Stats row: views, downloads, file size */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{viewCount ?? 0}</span>
              </div>
              {movie.file_size && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{movie.file_size}</span>
                </div>
              )}
            </div>

            {/* Premium Badge */}
            {movie.is_premium && (
              <div className="premium-badge inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mt-1">
                <Crown className="w-3 h-3 text-black" />
                <span className="text-[10px] font-bold text-black uppercase">Premium</span>
              </div>
            )}

            {/* Series status badges */}
            {movie.content_type === 'series' && (
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-cg-success text-white border-0 text-xs">
                  {t('ongoing')}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Play Button - Full width red */}
      <div className="px-4 mb-4">
        <Button
          onClick={handlePlay}
          className="w-full h-14 text-lg font-semibold rounded-xl gap-3"
          size="lg"
        >
          <Play className="w-6 h-6 fill-current" />
          {!isPremium ? 'Premium Only' : t('play')}
        </Button>
      </div>

      {/* Favorite & Download buttons */}
      <div className={`px-4 mb-6 flex ${movie.content_type === 'series' ? 'justify-center' : 'justify-around'}`}>
        <button
          onClick={toggleWatchlist}
          disabled={isWatchlistMutating || watchlistLoading}
          className="flex flex-col items-center gap-1.5 text-foreground hover:text-primary transition-colors"
        >
          <Heart
            className={`w-7 h-7 ${isInWatchlist ? 'fill-primary text-primary' : ''}`}
          />
          <span className="text-xs font-medium">{t('favorite')}</span>
        </button>

        {movie.content_type !== 'series' && (
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 text-foreground hover:text-primary transition-colors"
          >
            <Download className="w-7 h-7" />
            <span className="text-xs font-medium">{t('download')}</span>
          </button>
        )}
      </div>

      {/* Storyline */}
      {movie.description && (
        <div className="px-4 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-3">{t('storyline')}</h2>
          <p className="text-foreground leading-relaxed">
            {displayDescription}
            {descriptionTruncated && !showFullDescription && (
              <button
                onClick={() => setShowFullDescription(true)}
                className="text-primary font-semibold ml-1"
              >
                {t('readMore')}
              </button>
            )}
            {showFullDescription && descriptionTruncated && (
              <button
                onClick={() => setShowFullDescription(false)}
                className="text-primary font-semibold ml-1"
              >
                {t('readLess')}
              </button>
            )}
          </p>
        </div>
      )}

      {/* Director */}
      {movie.director && (
        <div className="px-4 mb-2">
          <span className="text-xs text-muted-foreground">Director</span>
          <p className="text-sm font-medium text-foreground">{movie.director}</p>
        </div>
      )}

      {/* Cast & Actors */}
      <CastSection movieId={movie.id} fallbackActors={movie.actors} />

      {/* Seasons and Episodes for Series */}
      {movie.content_type === 'series' && (
        <div className="px-4">
          <SeasonEpisodeList
            movieId={movie.id}
            isPremium={movie.is_premium}
            userIsPremium={isPremium}
            onPremiumRequired={() => setShowPremiumModal(true)}
            movieTitle={movie.title}
            posterUrl={movie.poster_url}
            year={movie.year}
            resolution={movie.resolution}
            fileSize={movie.file_size}
          />
        </div>
      )}

      {/* Related Movies */}
      <div className="px-4">
        <RelatedMovies
          movieId={movie.id}
          category={movie.category}
          onMovieClick={(relatedMovie) => navigate(`/movie/${relatedMovie.id}`)}
        />
      </div>

      {/* Drawers */}
      <ServerDrawer
        open={showPlayDrawer}
        onOpenChange={setShowPlayDrawer}
        type="play"
        streamUrl={movie.stream_url}
        mxPlayerUrl={movie.mx_player_url}
        setIsPlaying={setIsPlaying}
        movieInfo={{
          movieId: movie.id,
          title: movie.title,
          posterUrl: movie.poster_url,
          year: movie.year,
          resolution: movie.resolution,
          fileSize: movie.file_size,
        }}
      />
      {movie.content_type !== 'series' && (
        <ServerDrawer
          open={showDownloadDrawer}
          onOpenChange={setShowDownloadDrawer}
          streamUrl={movie.stream_url}
          telegramUrl={movie.telegram_url}
          megaUrl={movie.mega_url}
          downloadUrl={(movie as any).download_url}
          mxPlayerUrl={(movie as any).mx_player_url}
          type="download"
          movieInfo={{
            movieId: movie.id,
            title: movie.title,
            posterUrl: movie.poster_url,
            year: movie.year,
            resolution: movie.resolution,
            fileSize: movie.file_size,
          }}
        />
      )}

      {/* Premium Modal */}
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />

      {/* Login Required Modal for guests */}
      <LoginRequiredModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        feature={loginFeature}
      />

      <MobileBottomNav />
    </div>
  );
}
