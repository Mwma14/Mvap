import { useRelatedMovies } from '@/hooks/useRecommendations';
import { MovieCard } from './MovieCard';
import { SkeletonCard } from './SkeletonCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Movie } from '@/types/database';

interface RelatedMoviesProps {
  movieId: string;
  category?: string[];
  onMovieClick: (movie: Movie) => void;
}

export function RelatedMovies({ movieId, category, onMovieClick }: RelatedMoviesProps) {
  const { data: relatedMovies, isLoading } = useRelatedMovies(movieId, category);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!category || category.length === 0) return null;
  if (!isLoading && (!relatedMovies || relatedMovies.length === 0)) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {t('youMayAlsoLike')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
      
      <div ref={scrollRef} className="scroll-row">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          relatedMovies?.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => onMovieClick(movie)}
            />
          ))
        )}
      </div>
    </section>
  );
}
