import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Movie } from '@/types/database';
import { withPermanentCache } from '@/lib/cache';

interface MovieWithViews extends Movie {
  view_count: number;
  weekly_views: number;
}

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useTrendingMovies(limit = 10) {
  return useQuery({
    queryKey: ['trending-movies', limit],
    queryFn: withPermanentCache<MovieWithViews[]>(`trending-movies-${limit}`, async () => {
      const { data: viewsData, error: viewsError } = await supabase
        .from('movie_views')
        .select('movie_id, view_count, weekly_views')
        .order('weekly_views', { ascending: false })
        .limit(limit);

      if (viewsError) throw viewsError;
      if (!viewsData || viewsData.length === 0) {
        const { data: latestMovies, error: latestError } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (latestError) throw latestError;
        return (latestMovies || []).map(m => ({ ...m, view_count: 0, weekly_views: 0 })) as MovieWithViews[];
      }

      const movieIds = viewsData.map((v: any) => v.movie_id);
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);
      if (moviesError) throw moviesError;

      const movieMap = new Map((movies || []).map(m => [m.id, m]));
      return viewsData
        .map((v: any) => {
          const movie = movieMap.get(v.movie_id);
          if (!movie) return null;
          return { ...movie, view_count: v.view_count, weekly_views: v.weekly_views };
        })
        .filter(Boolean) as MovieWithViews[];
    }),
    ...QUERY_OPTS,
  });
}

export function useMostViewedMovies(limit = 10) {
  return useQuery({
    queryKey: ['most-viewed-movies', limit],
    queryFn: withPermanentCache<MovieWithViews[]>(`most-viewed-movies-${limit}`, async () => {
      const { data: viewsData, error: viewsError } = await supabase
        .from('movie_views')
        .select('movie_id, view_count, weekly_views')
        .order('view_count', { ascending: false })
        .limit(limit);
      if (viewsError) throw viewsError;
      if (!viewsData || viewsData.length === 0) return [];

      const movieIds = viewsData.map((v: any) => v.movie_id);
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', movieIds);
      if (moviesError) throw moviesError;

      const movieMap = new Map((movies || []).map(m => [m.id, m]));
      return viewsData
        .map((v: any) => {
          const movie = movieMap.get(v.movie_id);
          if (!movie) return null;
          return { ...movie, view_count: v.view_count, weekly_views: v.weekly_views };
        })
        .filter(Boolean) as MovieWithViews[];
    }),
    ...QUERY_OPTS,
  });
}

// Admin analytics — not cached (admin needs live data)
export function useViewAnalytics() {
  return useQuery({
    queryKey: ['view-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_views')
        .select('movie_id, view_count, weekly_views, last_viewed_at')
        .order('view_count', { ascending: false })
        .limit(50);
      if (error) throw error;
      const totalViews = (data || []).reduce((sum, m: any) => sum + m.view_count, 0);
      const weeklyViews = (data || []).reduce((sum, m: any) => sum + m.weekly_views, 0);
      return { topMovies: data || [], totalViews, weeklyViews };
    },
    staleTime: 5 * 60 * 1000,
  });
}
