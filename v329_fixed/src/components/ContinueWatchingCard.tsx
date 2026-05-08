import { Play, X } from 'lucide-react';
import { cn, proxyImageUrl } from '@/lib/utils';
import type { Movie } from '@/types/database';

interface ContinueWatchingCardProps {
  movie: Movie;
  progressPercent: number;
  progressSeconds: number;
  onResume: (startAtSeconds: number) => void;
  onRemove?: () => void;
  className?: string;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ContinueWatchingCard({
  movie,
  progressPercent,
  progressSeconds,
  onResume,
  onRemove,
  className,
}: ContinueWatchingCardProps) {
  return (
    <div
      className={cn(
        "movie-card group relative flex-shrink-0 w-[calc(50%-6px)] min-w-[160px] max-w-[200px] sm:w-[180px] sm:max-w-none md:w-[200px] aspect-video bg-card rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Poster/Backdrop Image */}
      {movie.backdrop_url || movie.poster_url ? (
        <img
          src={proxyImageUrl(movie.backdrop_url || movie.poster_url)}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">{movie.title[0]}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-10"
          aria-label="Remove from continue watching"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Timestamp badge */}
      {progressSeconds > 0 && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded z-10">
          {formatTime(progressSeconds)}
        </span>
      )}

      {/* Play/Resume button overlay */}
      <button
        onClick={() => onResume(progressSeconds)}
        className="absolute inset-0 flex items-center justify-center focus:outline-none"
        aria-label={`Resume ${movie.title}`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
          <Play className="w-4 h-4 text-primary-foreground fill-current ml-0.5" />
        </div>
      </button>

      {/* Info & Progress */}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-left pointer-events-none">
        <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors drop-shadow-lg mb-2">
          {movie.title}
        </h3>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
