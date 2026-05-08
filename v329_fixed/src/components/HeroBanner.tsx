import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Info, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/types/database';
import { cn, proxyImageUrl } from '@/lib/utils';

interface HeroBannerProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
}

const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds
const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels

export function HeroBanner({ movies, onPlay, onMoreInfo }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect();
        // Only apply parallax when banner is visible
        if (rect.bottom > 0) {
          setScrollY(window.scrollY * 0.3);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasMovies = movies && movies.length > 0;
  const hasMultiple = movies && movies.length > 1;
  const currentMovie = hasMovies ? movies[currentIndex] : null;

  const goToNext = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setProgress(0); // Reset progress on slide change
  }, [hasMultiple, movies?.length]);

  const goToPrevious = useCallback(() => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setProgress(0); // Reset progress on slide change
  }, [hasMultiple, movies?.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0); // Reset progress on manual slide change
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsAutoPlaying(true);
      return;
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = swipeDistance > SWIPE_THRESHOLD;
    const isRightSwipe = swipeDistance < -SWIPE_THRESHOLD;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    // Reset touch positions
    touchStartX.current = null;
    touchEndX.current = null;

    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Auto-rotate with progress tracking
  useEffect(() => {
    if (!isAutoPlaying || !hasMultiple) {
      // Clear progress interval when not auto-playing
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      return;
    }

    // Reset progress when starting auto-play
    setProgress(0);

    // Update progress every 50ms for smooth animation
    const progressStep = (50 / AUTO_ROTATE_INTERVAL) * 100;
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + progressStep;
      });
    }, 50);

    // Go to next slide when progress completes
    const slideInterval = setInterval(goToNext, AUTO_ROTATE_INTERVAL);

    return () => {
      clearInterval(slideInterval);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isAutoPlaying, hasMultiple, goToNext, currentIndex]);

  // Pause on hover (for desktop)
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (!currentMovie) {
    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] bg-gradient-to-b from-muted to-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/kyi-mal-icon.png" alt="Kyi Mal" className="h-16 w-16 rounded-full object-contain" />
            <span className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">MovieKyiMal</span>
          </div>
          <p className="text-lg text-muted-foreground">Your ultimate streaming destination</p>
        </div>
      </div>
    );
  }

  // Build meta info string
  const metaParts: string[] = [];
  if (currentMovie.year) metaParts.push(currentMovie.year.toString());
  if (currentMovie.category && currentMovie.category.length > 0) metaParts.push(currentMovie.category.join(' • '));
  if (currentMovie.resolution) metaParts.push(currentMovie.resolution);
  if (currentMovie.director) metaParts.push(`Dir. ${currentMovie.director}`);

  return (
    <div 
      ref={bannerRef}
      className="relative w-full h-[55vh] md:h-[85vh] overflow-hidden touch-pan-y"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop Images - with transition and parallax */}
      {movies.map((movie, index) => (
        <div
          key={movie.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          style={{ transform: `translateY(${scrollY}px)` }}
        >
          {movie.backdrop_url ? (
            <img
              src={proxyImageUrl(movie.backdrop_url)}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover object-top scale-110"
            />
          ) : movie.poster_url ? (
            <img
              src={proxyImageUrl(movie.poster_url)}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
          )}
        </div>
      ))}

      {/* Dark vignette overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/30 z-20" />
      
      {/* Gradient overlays */}
      <div className="hero-gradient absolute inset-0 z-20" />
      <div className="hero-gradient-bottom absolute inset-0 z-20" />

      {/* Navigation Arrows - Hidden on mobile, positioned higher on desktop */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-6 top-1/3 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm border border-white/10 hover:scale-110"
            aria-label="Previous movie"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="hidden md:flex absolute right-6 top-1/3 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm border border-white/10 hover:scale-110"
            aria-label="Next movie"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-8 md:pb-32 px-4 md:px-8 lg:px-16 max-w-4xl z-20">
        {/* Premium Badge */}
        {currentMovie.is_premium && (
          <div className="premium-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit mb-5 shadow-lg">
            <Crown className="w-4 h-4 text-black" />
            <span className="text-xs font-bold text-black uppercase tracking-wide">Premium</span>
          </div>
        )}

        {/* Title with fade animation */}
        <h1 
          key={currentMovie.id}
          className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 animate-fade-in drop-shadow-2xl"
        >
          {currentMovie.title}
        </h1>

        {/* Meta info - Year · Category · Resolution · Dir. Name */}
        {metaParts.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-5 text-sm md:text-base">
            {metaParts.map((part, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="text-white/40 mx-2">·</span>}
                <span className="text-white/90 font-medium">{part}</span>
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {currentMovie.description && (
          <p className="text-sm md:text-lg text-white/85 line-clamp-2 md:line-clamp-3 mb-4 md:mb-8 max-w-2xl leading-relaxed drop-shadow">
            {currentMovie.description}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="gap-2 text-base font-semibold tv-focus px-8 py-6 shadow-xl hover:shadow-primary/30"
            onClick={() => onPlay(currentMovie)}
          >
            <Play className="w-5 h-5 fill-current" />
            Play Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-base font-semibold tv-focus px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
            onClick={() => onMoreInfo(currentMovie)}
          >
            <Info className="w-5 h-5" />
            More Info
          </Button>
        </div>

        {/* Dot Indicators with Progress Bar */}
        {hasMultiple && (
          <div className="flex flex-col gap-3 mt-6">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {movies.map((movie, index) => (
                <button
                  key={movie.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "w-8 bg-white" 
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to ${movie.title}`}
                />
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/80 rounded-full transition-all duration-75 ease-linear"
                style={{ width: isAutoPlaying ? `${progress}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
