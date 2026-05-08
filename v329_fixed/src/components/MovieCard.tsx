import React from 'react';
import { Crown, Play, Star } from 'lucide-react';
import type { Movie } from '@/types/database';
import { cn, proxyImageUrl } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

// Check if movie was added in the last 7 days
function isNewArrival(createdAt: string): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(createdAt) > sevenDaysAgo;
}

export const MovieCard = React.forwardRef<HTMLButtonElement, MovieCardProps>(
  ({ movie, onClick }, ref) => {
    const isNew = isNewArrival(movie.created_at);
    const hasRating = movie.average_rating > 0;

    return (
      <button
        ref={ref}
        onClick={onClick}
        className="movie-card group relative flex-shrink-0 w-[calc(33.333%-8px)] min-w-[105px] max-w-[140px] sm:w-[140px] sm:max-w-none md:w-[160px] aspect-[2/3] bg-card focus:outline-none tv-focus"
      >
        {/* Poster Image */}
        {movie.poster_url ? (
          <img
            src={proxyImageUrl(movie.poster_url)}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{movie.title[0]}</span>
          </div>
        )}

        {/* Gradient overlay - always dark for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* NEW badge */}
        {isNew && !movie.is_premium && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-cg-success text-white text-[10px] font-bold uppercase animate-pulse">
            NEW
          </div>
        )}

        {/* Premium badge */}
        {movie.is_premium && (
          <div className={cn(
            "absolute top-2 premium-badge px-2 py-1 rounded-md flex items-center gap-1",
            isNew ? "right-2" : "right-2"
          )}>
            <Crown className="w-3 h-3 text-black" />
            <span className="text-[10px] font-bold text-black uppercase">Premium</span>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
          </div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 text-left">
          {/* Rating on hover */}
          {hasRating && (
            <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Star className="w-3 h-3 fill-cg-gold text-cg-gold" />
              <span className="text-[11px] text-cg-gold font-medium">
                {movie.average_rating.toFixed(1)}
              </span>
            </div>
          )}

          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors drop-shadow-lg">
            {movie.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            {movie.year && (
              <span className="text-[11px] text-white/80 drop-shadow">{movie.year}</span>
            )}
            {movie.resolution && (
              <span className="text-[10px] px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white/90 font-medium">
                {movie.resolution}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }
);

MovieCard.displayName = 'MovieCard';
