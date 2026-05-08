import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Movie } from '@/types/database';

interface WatchHistoryEntry {
  id: string;
  user_id: string;
  movie_id: string;
  episode_id: string | null;
  progress: number;
  duration: number | null;
  last_watched_at: string;
  created_at: string;
  movie: Movie;
}

interface ContinueWatchingEntry extends WatchHistoryEntry {
  progress_percent: number;
}

// Fetch user's watch history (most recent first)
export function useWatchHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watch-history', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          *,
          movie:movies(id, title, poster_url, content_type, year)
        `)
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as WatchHistoryEntry[];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,   // 2 minutes — history doesn't need instant refresh
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Fetch movies that are in-progress
export function useContinueWatching() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['continue-watching', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          *,
          movie:movies(id, title, poster_url, content_type, year)
        `)
        .eq('user_id', user.id)
        .gt('progress', 30) // Only show if watched more than 30 seconds
        .order('last_watched_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return ((data || []) as any[])
        .map((entry: any) => ({
          ...entry,
          progress_percent: entry.duration
            ? Math.min((entry.progress / entry.duration) * 100, 95)
            : 0,
        }))
        .filter((entry: any) => entry.progress_percent < 95) as ContinueWatchingEntry[];
    },
    enabled: !!user,
    staleTime: 30 * 1000,   // 30 seconds — continue watching needs to be fairly fresh
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Update watch progress
export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      movieId,
      episodeId = null,
      progressSeconds,
      durationSeconds,
    }: {
      movieId: string;
      episodeId?: string | null;
      progressSeconds: number;
      durationSeconds?: number;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // OPTIMIZED: Use upsert instead of select+update/insert.
      // Old approach: 2 DB round-trips (SELECT then UPDATE or INSERT).
      // New approach: 1 DB round-trip (UPSERT).
      // This halves the PostgREST egress from watch progress saves.
      // Requires unique constraint on (user_id, movie_id, episode_id) — see migration.
      const { error } = await supabase
        .from('watch_history')
        .upsert(
          {
            user_id: user.id,
            movie_id: movieId,
            episode_id: episodeId,
            progress: progressSeconds,
            duration: durationSeconds || 0,
            last_watched_at: new Date().toISOString(),
          } as any,
          { onConflict: 'user_id,movie_id,episode_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      // OPTIMIZED: Only invalidate continue-watching (most important for UX).
      // watch-history and recently-watched are less critical and will refresh
      // naturally on next mount — avoids 3x refetch per progress save.
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Mark a movie as completed
export function useMarkCompleted() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      movieId,
      episodeId = null,
    }: {
      movieId: string;
      episodeId?: string | null;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          episode_id: episodeId,
          progress: 0,
          duration: 0,
          last_watched_at: new Date().toISOString(),
        } as any,
        { onConflict: 'user_id,movie_id,episode_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Clear all watch history
export function useClearHistory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}

// Fetch recently watched movies/series (last 5, any progress)
export function useRecentlyWatched(contentType?: 'movie' | 'series', limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recently-watched', user?.id, contentType, limit],
    queryFn: async () => {
      if (!user) return [];

      // OPTIMIZED: Filter by content_type on the DB side instead of overfetching.
      // Old approach: fetched limit*10 rows then filtered client-side (50 rows for limit=5).
      // New approach: push content_type filter to DB, fetch only what we need.
      // Also select only needed columns instead of movie:movies(*).
      let query = supabase
        .from('watch_history')
        .select(`
          *,
          movie:movies(id, title, poster_url, content_type, year)
        `)
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false });

      // Push content_type filter to DB to avoid overfetching
      if (contentType === 'movie') {
        query = (query as any).or('movie.content_type.eq.movie,movie.content_type.is.null');
      } else if (contentType === 'series') {
        query = (query as any).eq('movie.content_type', 'series');
      }

      // Fetch a small buffer (limit + 3) in case a few rows have null movie joins
      const { data, error } = await query.limit(limit + 3);

      if (error) throw error;

      const entries = (data || []) as unknown as WatchHistoryEntry[];
      if (!contentType) return entries.slice(0, limit);

      return entries.filter(e => {
        if (contentType === 'movie') return e.movie?.content_type === 'movie' || !e.movie?.content_type;
        return e.movie?.content_type === contentType;
      }).slice(0, limit);
    },
    enabled: !!user && !!contentType,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Remove a single item from history
export function useRemoveFromHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyId: string) => {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
    },
  });
}
