import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRateMovie, useUserRating } from '@/hooks/useRatings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StarRatingProps {
  movieId: string;
  averageRating?: number;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showCount?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarRating({
  movieId,
  averageRating = 0,
  ratingCount = 0,
  size = 'md',
  interactive = true,
  showCount = true,
  className,
}: StarRatingProps) {
  const { user } = useAuth();
  const { data: userRating } = useUserRating(movieId);
  const rateMovie = useRateMovie();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || userRating?.rating || 0;
  const starSize = sizeClasses[size];

  const handleRate = async (rating: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to rate movies.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await rateMovie.mutateAsync({ movieId, rating });
      toast({
        title: 'Rating Saved',
        description: `You rated this ${rating} star${rating !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save rating. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= displayRating
            : star <= Math.round(averageRating);

          return (
            <button
              key={star}
              type="button"
              onClick={() => interactive && handleRate(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              disabled={!interactive || rateMovie.isPending}
              className={cn(
                'transition-colors focus:outline-none',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  starSize,
                  'transition-colors',
                  isFilled
                    ? 'fill-cg-gold text-cg-gold'
                    : 'fill-transparent text-muted-foreground'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Rating text */}
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {averageRating > 0 ? (
            <>
              {averageRating.toFixed(1)}
              {ratingCount > 0 && <span className="ml-1">({ratingCount})</span>}
            </>
          ) : (
            'No ratings'
          )}
        </span>
      )}

      {/* User's rating indicator */}
      {userRating && (
        <span className="text-xs text-cg-gold font-medium">
          Your rating: {userRating.rating}
        </span>
      )}
    </div>
  );
}

// Display-only star rating (no interactivity)
export function StarRatingDisplay({
  rating,
  size = 'sm',
  className,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const starSize = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.round(rating)
              ? 'fill-cg-gold text-cg-gold'
              : 'fill-transparent text-muted-foreground/50'
          )}
        />
      ))}
      {rating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
