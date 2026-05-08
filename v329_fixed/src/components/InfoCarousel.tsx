import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfoSlides } from '@/hooks/useInfoSlides';
import { proxyImageUrl } from '@/lib/utils';
import { openExternalUrl } from '@/lib/externalLinks';

export function InfoCarousel() {
  const [current, setCurrent] = useState(0);
  const { data: dbSlides, isLoading } = useInfoSlides();
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : [];

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  if (isLoading) {
    return (
      <section className="px-4 md:px-8 pt-20 md:pt-24 pb-4">
        <div className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px] lg:min-h-[360px] bg-muted animate-pulse">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-3">
            <div className="h-6 md:h-8 bg-muted-foreground/20 rounded w-3/5" />
            <div className="h-4 md:h-5 bg-muted-foreground/20 rounded w-2/5" />
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diff = Math.abs(touchStartX.current - touchEndX.current);
    if (diff > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    }
  };

  const handleClick = () => {
    if (isSwiping.current) return;
    if (!slide.redirect_link) return;
    const link = slide.redirect_link;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      openExternalUrl(link);
    } else {
      navigate(link);
    }
  };

  return (
    <section className="px-4 md:px-8 pt-20 md:pt-24 pb-4">
      <div
        className={`relative overflow-hidden rounded-2xl ${slide.redirect_link ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role={slide.redirect_link ? 'link' : undefined}
      >
        {/* Slide */}
        <div
          className={`relative min-h-[220px] md:min-h-[300px] lg:min-h-[360px] flex transition-all duration-500 ${
            slide.image_url ? '' : `bg-gradient-to-br ${slide.bg_color}`
          }`}
        >
          {slide.image_url && (
            <>
              <img
                src={proxyImageUrl(slide.image_url)}
                alt={slide.title || 'Slide'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </>
          )}

          {(slide.title || slide.description) && (
            <div className="relative z-10 flex flex-col justify-end p-6 md:p-10 w-full">
              {slide.title && (
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1.5 drop-shadow-lg">
                  {slide.title}
                </h3>
              )}
              {slide.description && (
                <p className={`text-sm md:text-base lg:text-lg font-medium leading-relaxed drop-shadow ${
                  slide.image_url ? 'text-white/90' : slide.accent_color
                }`}>
                  {slide.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'bg-white w-5' : 'bg-white/40 w-2'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
