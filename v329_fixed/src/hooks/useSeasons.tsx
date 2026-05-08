import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import type { Season, SeasonInsert, SeasonUpdate, SeasonWithEpisodes, Episode, EpisodeInsert, EpisodeUpdate } from '@/types/database';
import { withPermanentCache, invalidateStore, invalidateStoreByPrefix } from '@/lib/cache';

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

// ─── Season hooks ─────────────────────────────────────────────────────────────

export function useSeasons(movieId: string) {
  return useQuery({
    queryKey: ['seasons', movieId],
    queryFn: withPermanentCache<Season[]>(`seasons-${movieId}`, async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('movie_id', movieId)
        .order('season_number', { ascending: true });
      if (error) throw error;
      return data as Season[];
    }),
    enabled: !!movieId,
    ...QUERY_OPTS,
  });
}

export function useSeasonsWithEpisodes(movieId: string) {
  return useQuery({
    queryKey: ['seasons-with-episodes', movieId],
    queryFn: withPermanentCache<SeasonWithEpisodes[]>(`seasons-with-episodes-${movieId}`, async () => {
      const { data: seasons, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .eq('movie_id', movieId)
        .order('season_number', { ascending: true });
      if (seasonsError) throw seasonsError;

      const seasonsWithEpisodes: SeasonWithEpisodes[] = await Promise.all(
        (seasons || []).map(async season => {
          const { data: episodes, error: episodesError } = await supabase
            .from('episodes')
            .select('*')
            .eq('season_id', season.id)
            .order('episode_number', { ascending: true });
          if (episodesError) throw episodesError;
          return { ...season, episodes: episodes as Episode[] };
        })
      );
      return seasonsWithEpisodes;
    }),
    enabled: !!movieId,
    ...QUERY_OPTS,
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (season: SeasonInsert) => {
      const { data, error } = await supabaseAdmin.from('seasons').insert(season).select().single();
      if (error) throw error;
      return data as Season;
    },
    onSuccess: data => {
      invalidateStore(`seasons-${data.movie_id}`);
      invalidateStore(`seasons-with-episodes-${data.movie_id}`);
      queryClient.invalidateQueries({ queryKey: ['seasons', data.movie_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes', data.movie_id] });
    },
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, movieId, ...season }: SeasonUpdate & { id: string; movieId: string }) => {
      const { data, error } = await supabaseAdmin.from('seasons').update(season).eq('id', id).select().single();
      if (error) throw error;
      return { ...data, movieId } as Season & { movieId: string };
    },
    onSuccess: data => {
      invalidateStore(`seasons-${data.movieId}`);
      invalidateStore(`seasons-with-episodes-${data.movieId}`);
      queryClient.invalidateQueries({ queryKey: ['seasons', data.movieId] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes', data.movieId] });
    },
  });
}

export function useDeleteSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, movieId }: { id: string; movieId: string }) => {
      const { error } = await supabaseAdmin.from('seasons').delete().eq('id', id);
      if (error) throw error;
      return { movieId };
    },
    onSuccess: data => {
      invalidateStore(`seasons-${data.movieId}`);
      invalidateStore(`seasons-with-episodes-${data.movieId}`);
      queryClient.invalidateQueries({ queryKey: ['seasons', data.movieId] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes', data.movieId] });
    },
  });
}

// ─── Episode hooks ────────────────────────────────────────────────────────────

export function useEpisodes(seasonId: string) {
  return useQuery({
    queryKey: ['episodes', seasonId],
    queryFn: withPermanentCache<Episode[]>(`episodes-${seasonId}`, async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('season_id', seasonId)
        .order('episode_number', { ascending: true });
      if (error) throw error;
      return data as Episode[];
    }),
    enabled: !!seasonId,
    ...QUERY_OPTS,
  });
}

export function useCreateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (episode: EpisodeInsert) => {
      const { data, error } = await supabaseAdmin.from('episodes').insert(episode).select().single();
      if (error) throw error;
      return data as Episode;
    },
    onSuccess: data => {
      invalidateStore(`episodes-${data.season_id}`);
      invalidateStoreByPrefix('seasons-with-episodes');
      queryClient.invalidateQueries({ queryKey: ['episodes', data.season_id] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes'] });
    },
  });
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seasonId, ...episode }: EpisodeUpdate & { id: string; seasonId: string }) => {
      const { data, error } = await supabaseAdmin.from('episodes').update(episode).eq('id', id).select().single();
      if (error) throw error;
      return { ...data, seasonId } as Episode & { seasonId: string };
    },
    onSuccess: data => {
      invalidateStore(`episodes-${data.seasonId}`);
      invalidateStoreByPrefix('seasons-with-episodes');
      queryClient.invalidateQueries({ queryKey: ['episodes', data.seasonId] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes'] });
    },
  });
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seasonId }: { id: string; seasonId: string }) => {
      const { error } = await supabaseAdmin.from('episodes').delete().eq('id', id);
      if (error) throw error;
      return { seasonId };
    },
    onSuccess: data => {
      invalidateStore(`episodes-${data.seasonId}`);
      invalidateStoreByPrefix('seasons-with-episodes');
      queryClient.invalidateQueries({ queryKey: ['episodes', data.seasonId] });
      queryClient.invalidateQueries({ queryKey: ['seasons-with-episodes'] });
    },
  });
}
