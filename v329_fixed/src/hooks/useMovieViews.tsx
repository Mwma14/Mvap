import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export function useMovieViews(movieId: string) {
  return useQuery({
    queryKey: ['movie-views', movieId],
    queryFn: withPermanentCache<number>(`movie-views-${movieId}`, async () => {
      const { data, error } = await supabase
        .from('movie_views')
        .select('view_count')
        .eq('movie_id', movieId)
        .maybeSingle();
      if (error) throw error;
      return data?.view_count ?? 0;
    }),
    enabled: !!movieId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useIncrementView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase.rpc('increment_view_count', { _movie_id: movieId });
      if (error) throw error;
    },
    onSuccess: (_, movieId) => {
      // Invalidate so the view count refreshes after increment
      invalidateStore(`movie-views-${movieId}`);
      queryClient.invalidateQueries({ queryKey: ['movie-views', movieId] });
    },
  });
}
