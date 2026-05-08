import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';

import { MovieRow } from '@/components/MovieRow';
import { MovieCard } from '@/components/MovieCard';
import { ContinueWatchingCard } from '@/components/ContinueWatchingCard';

import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MovieQuickPreview } from '@/components/MovieQuickPreview';
import { SkeletonRow } from '@/components/SkeletonCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { CategoryGrid } from '@/components/CategoryGrid';
import { InfoCarousel } from '@/components/InfoCarousel';
import { useAuth } from '@/hooks/useAuth';
import { useMoviesByCategory, useWatchlist } from '@/hooks/useMovies';
import { useContinueWatching, useRemoveFromHistory } from '@/hooks/useWatchHistory';
import { useTrendingMovies } from '@/hooks/useTrending';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useFilter } from '@/contexts/FilterContext';

import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import type { Movie } from '@/types/database';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();

  // If user is not authenticated and didn't come from Welcome page, redirect to /auth
  useEffect(() => {
    if (!isAuthLoading && !user && !location.state?.fromWelcome && !location.state?.guestBrowse) {
      navigate('/auth', { replace: true });
    }
  }, [user, isAuthLoading, navigate, location.state]);
  const { data: moviesByCategory, isLoading, isError, error, refetch } = useMoviesByCategory();
  const { data: watchlistData } = useWatchlist();
  const { data: continueWatching } = useContinueWatching();
  const { data: trendingMovies } = useTrendingMovies();
  const { data: recommendations } = useRecommendations();
  const removeFromHistory = useRemoveFromHistory();
  
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const { searchQuery, selectedCategory, selectedYear } = useFilter();
  const continueWatchingRef = useRef<HTMLDivElement>(null);

  // Get all unique categories and years for filters
  const { categories, years } = useMemo(() => {
    if (!moviesByCategory) return { categories: [], years: [] };
    
    const allMovies = Object.values(moviesByCategory).flat();
    const uniqueCategories = [...new Set(Object.keys(moviesByCategory))].sort();
    const uniqueYears = [...new Set(allMovies.map(m => m.year).filter(Boolean) as number[])].sort((a, b) => b - a);
    
    return { categories: uniqueCategories, years: uniqueYears };
  }, [moviesByCategory]);

  // Filter movies based on search, category, and year
  const filteredMoviesByCategory = useMemo(() => {
    if (!moviesByCategory) return {};

    let result: Record<string, Movie[]> = {};

    // If a specific category is selected, only show that category
    const categoriesToProcess = selectedCategory !== 'all' 
      ? [selectedCategory] 
      : Object.keys(moviesByCategory);

    for (const cat of categoriesToProcess) {
      if (!moviesByCategory[cat]) continue;

      let movies = moviesByCategory[cat];

      // Filter by year
      if (selectedYear !== 'all') {
        movies = movies.filter(m => m.year?.toString() === selectedYear);
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        movies = movies.filter(m => 
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.director?.toLowerCase().includes(query)
        );
      }

      if (movies.length > 0) {
        result[cat] = movies;
      }
    }

    return result;
  }, [moviesByCategory, searchQuery, selectedCategory, selectedYear]);

  // Get watchlist movies
  const watchlistMovies = useMemo(() => {
    if (!watchlistData) return [];
    return watchlistData.map(item => item.movie);
  }, [watchlistData]);

  const handleMovieClick = (movie: Movie) => {
    if (!user) {
      navigate(`/auth?returnUrl=${encodeURIComponent(`/movie/${movie.id}`)}`);
    } else {
      setPreviewMovie(movie);
    }
  };

  const handlePlay = (movie: Movie) => {
    if (!user) {
      navigate(`/auth?returnUrl=${encodeURIComponent(`/movie/${movie.id}`)}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const handleMoreInfo = (movie: Movie) => {
    if (!user) {
      navigate(`/auth?returnUrl=${encodeURIComponent(`/movie/${movie.id}`)}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const scrollContinueWatching = (direction: 'left' | 'right') => {
    if (continueWatchingRef.current) {
      const scrollAmount = 400;
      continueWatchingRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Define category display order
  const categoryOrder = [
    'Latest',
    'Action',
    'K-Drama',
    'Hollywood',
    'Thriller',
    'Comedy',
    'Romance',
    'Horror',
    'Sci-Fi',
    'Documentary',
  ];

  // Sort categories by preference, then alphabetically for unlisted ones
  const sortedCategories = Object.keys(filteredMoviesByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const hasNoResults = Object.keys(filteredMoviesByCategory).length === 0 && !isLoading;
  const isFiltering = searchQuery.trim() || selectedCategory !== 'all' || selectedYear !== 'all';

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['movies'] });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar categories={categories} years={years} />
      <AnnouncementBanner />

      {/* Info Carousel - replaces hero */}
      <InfoCarousel />

      {/* Category Grid Section */}
      <CategoryGrid />

      {/* Default home view (not filtering) */}
      {!isFiltering && !isLoading && (
        <div className="py-8 relative z-30 bg-background">
          <FadeIn>
            {/* Continue Watching Row */}
            {user && continueWatching && continueWatching.length > 0 && (
              <section className="mb-10">
                <div className="mb-5 px-4 md:px-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    Continue Watching
                  </h2>
                </div>
                <div ref={continueWatchingRef} className="scroll-row px-4 md:px-8">
                  {continueWatching.map((item) => (
                    <ContinueWatchingCard
                      key={item.id}
                      movie={item.movie}
                      progressPercent={item.progress_percent}
                      progressSeconds={item.progress}
                      onResume={(startAt) => {
                        const movie = item.movie;
                        const streamUrl = movie.stream_url;
                        if (streamUrl) {
                          navigate(`/watch?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(movie.title)}&movieId=${encodeURIComponent(item.movie_id)}&t=${Math.floor(startAt)}`);
                        } else {
                          navigate(`/movie/${item.movie_id}`);
                        }
                      }}
                      onRemove={() => removeFromHistory.mutate(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* My Watchlist Row */}
            {user && watchlistMovies.length > 0 && (
              <MovieRow
                title="My Watchlist"
                movies={watchlistMovies}
                onMovieClick={handleMovieClick}
                seeAllPath="/watchlist"
              />
            )}
          </FadeIn>
        </div>
      )}

      {/* Filtered results (only when searching/filtering) */}
      {isFiltering && (
        <div className="py-8 relative z-30 bg-background">
          {isLoading ? (
            <LoadingSpinner message="Loading movies..." />
          ) : hasNoResults ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No movies match your filters. Try adjusting your search.
              </p>
            </div>
          ) : (
            <FadeIn>
              {sortedCategories.map((category) => (
                <MovieRow
                  key={category}
                  title={category}
                  movies={filteredMoviesByCategory[category]}
                  onMovieClick={handleMovieClick}
                />
              ))}
            </FadeIn>
          )}
        </div>
      )}

      {isLoading && !isFiltering && (
        <LoadingSpinner message="Loading movies..." />
      )}


      <MobileBottomNav />
      
      <MovieQuickPreview 
        movie={previewMovie} 
        open={!!previewMovie} 
        onOpenChange={(open) => !open && setPreviewMovie(null)} 
      />
    </div>
  );
};

export default Index;
