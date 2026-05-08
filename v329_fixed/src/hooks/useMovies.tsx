import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { useAuth } from '@/hooks/useAuth';
import type { Movie, MovieInsert, MovieUpdate } from '@/types/database';
import {
  withPermanentCache,
  invalidateStore,
  invalidateStoreByPrefix,
} from '@/lib/cache';

// ─── Public read hooks ────────────────────────────────────────────────────────

export function useMovies(category?: string) {
  const storeKey = category ? `movies-cat-${category}` : 'movies-all';
  return useQuery({
    queryKey: ['movies', category],
    queryFn: withPermanentCache<Movie[]>(storeKey, async () => {
      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      if (category) query = query.contains('category', [category]);
      const { data, error } = await query;
      if (error) throw error;
      return data as Movie[];
    }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useFeaturedMovie() {
  return useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: withPermanentCache<Movie | null>('movies-featured-single', async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('is_featured', true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Movie | null;
    }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useFeaturedMovies() {
  return useQuery({
    queryKey: ['movies', 'featured-all'],
    queryFn: withPermanentCache<Movie[]>('movies-featured-all', async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Movie[];
    }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: withPermanentCache<Movie>(`movie-detail-${id}`, async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Movie;
    }),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useMoviesByCategory() {
  return useQuery({
    queryKey: ['movies', 'by-category'],
    queryFn: withPermanentCache<Record<string, Movie[]>>('movies-by-category', async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const grouped = (data as Movie[]).reduce((acc, movie) => {
        const categories =
          movie.category && movie.category.length > 0 ? movie.category : ['Other'];
        categories.forEach(cat => {
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(movie);
        });
        return acc;
      }, {} as Record<string, Movie[]>);
      return grouped;
    }),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// ─── Admin mutation hooks — use service role client to bypass RLS ─────────────

function invalidateAllMovieStore() {
  invalidateStoreByPrefix('movies');
  invalidateStoreByPrefix('movie-detail');
  invalidateStoreByPrefix('trending');
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movie: MovieInsert) => {
      const { data, error } = await supabaseAdmin
        .from('movies')
        .insert(movie as any)
        .select()
        .single();
      if (error) throw error;
      return data as Movie;
    },
    onSuccess: () => {
      invalidateAllMovieStore();
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
    },
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...movie }: MovieUpdate & { id: string }) => {
      const { data, error } = await supabaseAdmin
        .from('movies')
        .update(movie as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Movie;
    },
    onSuccess: data => {
      invalidateAllMovieStore();
      invalidateStore(`movie-detail-${data.id}`);
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie', data.id] });
    },
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('movies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllMovieStore();
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

// ─── User-specific hooks (NOT cached — always fresh per user) ─────────────────

export function useWatchlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('watchlist')
        .select(`id, movie_id, created_at, movie:movies(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; movie_id: string; created_at: string; movie: Movie }>;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useIsInWatchlist(movieId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['watchlist', user?.id, movieId],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!movieId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (movieId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('watchlist')
        .insert({ user_id: user.id, movie_id: movieId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async movieId => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ['watchlist', user.id, movieId] });
      const previousValue = queryClient.getQueryData(['watchlist', user.id, movieId]);
      queryClient.setQueryData(['watchlist', user.id, movieId], true);
      return { previousValue };
    },
    onError: (err, movieId, context) => {
      if (!user) return;
      queryClient.setQueryData(['watchlist', user.id, movieId], context?.previousValue);
    },
    onSettled: (_, __, movieId) => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id, movieId] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (movieId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);
      if (error) throw error;
    },
    onMutate: async movieId => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: ['watchlist', user.id, movieId] });
      const previousValue = queryClient.getQueryData(['watchlist', user.id, movieId]);
      queryClient.setQueryData(['watchlist', user.id, movieId], false);
      return { previousValue };
    },
    onError: (err, movieId, context) => {
      if (!user) return;
      queryClient.setQueryData(['watchlist', user.id, movieId], context?.previousValue);
    },
    onSettled: (_, __, movieId) => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', user.id, movieId] });
    },
  });
}
