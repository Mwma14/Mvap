import { X, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsInWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';
import type { Movie } from '@/types/database';
import { proxyImageUrl } from '@/lib/utils';

interface MovieQuickPreviewProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovieQuickPreview({ movie, open, onOpenChange }: MovieQuickPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isInWatchlist } = useIsInWatchlist(movie?.id || '');
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  if (!movie) return null;

  const handlePlayNow = () => {
    onOpenChange(false);
    navigate(`/movie/${movie.id}`);
  };

  const handleWatchlistToggle = async () => {
    if (!user) return;
    
    if (isInWatchlist) {
      await removeFromWatchlist.mutateAsync(movie.id);
    } else {
      await addToWatchlist.mutateAsync(movie.id);
    }
  };

  const imageUrl = movie.backdrop_url || movie.poster_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 w-[calc(100vw-2rem)] max-w-md overflow-hidden border-0 bg-card rounded-xl">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">{movie.title} - Quick Preview</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Premium badge */}
        {movie.is_premium && (
          <div className="absolute left-3 top-3 z-20 premium-badge px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
            </svg>
            <span className="text-xs font-bold text-black uppercase">Premium</span>
          </div>
        )}

        {/* Backdrop/Poster Image */}
        <div className="relative w-full aspect-[16/10]">
          {imageUrl ? (
            <img
              src={proxyImageUrl(imageUrl)}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">{movie.title[0]}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4 -mt-8 relative z-10">
          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2">{movie.title}</h2>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
            {movie.year && <span>{movie.year}</span>}
            {movie.category && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{movie.category}</span>
              </>
            )}
            {movie.resolution && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium">{movie.resolution}</span>
              </>
            )}
          </div>

          {/* Description */}
          {movie.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {movie.description}
            </p>
          )}

          {/* Director */}
          {movie.director && (
            <div className="mb-2">
              <span className="text-xs text-muted-foreground/70">Director</span>
              <p className="text-sm font-medium text-foreground">{movie.director}</p>
            </div>
          )}

          {/* Cast */}
          {movie.actors && movie.actors.length > 0 && (
            <div className="mb-4">
              <span className="text-xs text-muted-foreground/70">Cast</span>
              <p className="text-sm font-medium text-foreground">
                {movie.actors.slice(0, 3).join(', ')}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button 
              onClick={handlePlayNow}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Play Now
            </Button>
            
            {user && (
              <Button
                variant="outline"
                onClick={handleWatchlistToggle}
                disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
                className="flex-1"
              >
                {isInWatchlist ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
