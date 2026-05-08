import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MovieCard } from './MovieCard';
import type { Movie } from '@/types/database';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  seeAllPath?: string;
}

export function MovieRow({ title, movies, onMovieClick, seeAllPath }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (movies.length === 0) return null;

  const handleSeeAll = () => {
    if (seeAllPath) {
      navigate(seeAllPath);
    } else {
      navigate(`/browse?category=${encodeURIComponent(title)}`);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeeAll}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            See All
          </button>
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105 tv-focus"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-full bg-card/80 hover:bg-card border border-border/50 transition-all hover:scale-105 tv-focus"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="scroll-row px-4 md:px-8"
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick(movie)}
          />
        ))}
      </div>
    </section>
  );
}
