import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Movie } from '@/types/database';
import { withPermanentCache } from '@/lib/cache';

interface RecommendationResult {
  movie: Movie;
  reason: string;
  basedOnTitle: string;
}

const PERM_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

// Personalized recommendations — user-specific, keep short staleTime
export function useRecommendations(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data: historyData, error: historyError } = await supabase
        .from('watch_history')
        .select('movie_id, movie:movies(*)')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(5);

      if (historyError) throw historyError;
      if (!historyData || historyData.length === 0) return [];

      const watchedMovieIds = new Set(historyData.map(h => h.movie_id));
      const categories = [...new Set(
        historyData.flatMap(h => (h.movie as Movie)?.category || []).filter(Boolean)
      )];
      const directors = [...new Set(
        historyData.map(h => (h.movie as Movie)?.director).filter(Boolean)
      )];

      let query = supabase.from('movies').select('*').limit(limit * 2);

      if (categories.length > 0 && directors.length > 0) {
        query = query.or(`category.ov.{${categories.join(',')}},director.in.(${directors.join(',')})`);
      } else if (categories.length > 0) {
        query = query.overlaps('category', categories);
      }

      const { data: recommendations, error: recError } = await query;
      if (recError) throw recError;

      const results: RecommendationResult[] = [];
      const baseMovie = historyData[0]?.movie as Movie;

      for (const movie of recommendations || []) {
        if (watchedMovieIds.has(movie.id)) continue;
        if (results.length >= limit) break;

        let reason = '';
        const movieCategories = (movie.category as string[]) || [];
        const baseCategories = baseMovie?.category || [];
        const hasCommonCategory = movieCategories.some(c => baseCategories.includes(c));

        if (hasCommonCategory) reason = `Similar to ${baseMovie.title}`;
        else if (movie.director === baseMovie?.director) reason = `Also directed by ${movie.director}`;
        else reason = 'You might like';

        results.push({ movie: movie as Movie, reason, basedOnTitle: baseMovie?.title || '' });
      }

      return results;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// Related movies for a specific movie — permanent cache
export function useRelatedMovies(movieId: string, category?: string[], limit = 10) {
  return useQuery({
    queryKey: ['related-movies', movieId, category, limit],
    queryFn: withPermanentCache<Movie[]>(`related-movies-${movieId}`, async (): Promise<Movie[]> => {
      if (!category || category.length === 0) return [];
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .overlaps('category', category)
        .neq('id', movieId)
        .limit(limit);
      if (error) throw error;
      return (data || []) as Movie[];
    }),
    enabled: !!movieId && !!category,
    ...PERM_OPTS,
  });
}
