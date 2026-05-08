import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X, Star, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMovies } from '@/hooks/useMovies';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { FadeIn } from '@/components/FadeIn';
import type { Movie } from '@/types/database';

export default function SearchPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { data: movies, isLoading } = useMovies();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!movies || !query.trim()) return [];
    const q = query.toLowerCase();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q) ||
        m.actors?.some((a) => a.toLowerCase().includes(q))
    );
  }, [movies, query]);

  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground">{t('searchMovies')}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>

        {/* Search Input */}
        <div className="px-4 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('searchMovies')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-xl border-2 border-primary/60 bg-card text-foreground focus:border-primary"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4 space-y-3">
        {isLoading && (
          <LoadingSpinner message={t('loading')} />
        )}

        {!isLoading && query.trim() && results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('noResults')}
          </div>
        )}

        {!query.trim() && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            {t('searchMovies')}
          </div>
        )}

        <FadeIn>
        {results.map((movie) => (
          <button
            key={movie.id}
            onClick={() => handleMovieClick(movie)}
            className="w-full flex items-start gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-left"
          >
            {/* Poster */}
            <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No Image
                </div>
              )}
              {/* Rating badge */}
              {movie.average_rating > 0 && (
                <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/70 rounded px-1.5 py-0.5">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] text-white font-medium">
                    {movie.average_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-1">
              <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {movie.year && (
                  <span className="text-xs text-muted-foreground">{movie.year}</span>
                )}
                {movie.content_type === 'series' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Series
                  </Badge>
                )}
              </div>
              {movie.resolution && (
                <span className="inline-block mt-1.5 text-xs font-medium text-emerald-500">
                  {movie.resolution}
                </span>
              )}
              {movie.file_size && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {movie.file_size}
                </span>
              )}
            </div>
          </button>
        ))}
        </FadeIn>
      </div>

      <MobileBottomNav />
    </div>
  );
}
