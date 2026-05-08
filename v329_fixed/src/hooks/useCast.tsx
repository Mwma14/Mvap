import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import type { CastMember } from '@/types/database';
import { withPermanentCache, invalidateStore, invalidateStoreByPrefix } from '@/lib/cache';

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useCastMembers() {
  return useQuery({
    queryKey: ['cast-members'],
    queryFn: withPermanentCache<CastMember[]>('cast-members-all', async () => {
      const { data, error } = await supabase.from('cast_members').select('*').order('name');
      if (error) throw error;
      return data as CastMember[];
    }),
    ...QUERY_OPTS,
  });
}

export function useMovieCast(movieId: string) {
  return useQuery({
    queryKey: ['movie-cast', movieId],
    queryFn: withPermanentCache(`movie-cast-${movieId}`, async () => {
      const { data, error } = await supabase
        .from('movie_cast')
        .select('*, cast_members(*)')
        .eq('movie_id', movieId)
        .order('display_order');
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        movie_id: item.movie_id,
        cast_member_id: item.cast_member_id,
        character_name: item.character_name,
        display_order: item.display_order,
        created_at: item.created_at,
        cast_member: item.cast_members as CastMember,
      }));
    }),
    enabled: !!movieId,
    ...QUERY_OPTS,
  });
}

export function useCastMember(castMemberId: string) {
  return useQuery({
    queryKey: ['cast-member', castMemberId],
    queryFn: withPermanentCache<CastMember>(`cast-member-${castMemberId}`, async () => {
      const { data, error } = await supabase
        .from('cast_members')
        .select('*')
        .eq('id', castMemberId)
        .single();
      if (error) throw error;
      return data as CastMember;
    }),
    enabled: !!castMemberId,
    ...QUERY_OPTS,
  });
}

export function useActorFilmography(castMemberId: string) {
  return useQuery({
    queryKey: ['actor-filmography', castMemberId],
    queryFn: withPermanentCache(`actor-filmography-${castMemberId}`, async () => {
      const { data, error } = await supabase
        .from('movie_cast')
        .select('*, movies(*)')
        .eq('cast_member_id', castMemberId)
        .order('display_order');
      if (error) throw error;
      return (data || []).map((item: any) => ({ ...item, movie: item.movies }));
    }),
    enabled: !!castMemberId,
    ...QUERY_OPTS,
  });
}

export function useSaveMovieCast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movieId,
      castEntries,
    }: {
      movieId: string;
      castEntries: {
        name: string;
        character_name: string;
        photo_url: string | null;
        existing_cast_member_id?: string;
      }[];
    }) => {
      const { error: deleteError } = await supabaseAdmin.from('movie_cast').delete().eq('movie_id', movieId);
      if (deleteError) throw deleteError;

      for (let i = 0; i < castEntries.length; i++) {
        const entry = castEntries[i];
        let castMemberId = entry.existing_cast_member_id;

        if (castMemberId) {
          const { error: updateError } = await supabaseAdmin
            .from('cast_members')
            .update({ photo_url: entry.photo_url, name: entry.name })
            .eq('id', castMemberId);
          if (updateError) throw updateError;
        } else {
          const { data: existing } = await supabaseAdmin
            .from('cast_members')
            .select('id')
            .eq('name', entry.name)
            .maybeSingle();

          if (existing) {
            castMemberId = existing.id;
            if (entry.photo_url) {
              await supabaseAdmin.from('cast_members').update({ photo_url: entry.photo_url }).eq('id', castMemberId);
            }
          } else {
            const { data: newMember, error: insertError } = await supabaseAdmin
              .from('cast_members')
              .insert({ name: entry.name, photo_url: entry.photo_url })
              .select('id')
              .single();
            if (insertError) throw insertError;
            castMemberId = newMember.id;
          }
        }

        const { error: linkError } = await supabaseAdmin.from('movie_cast').insert({
          movie_id: movieId,
          cast_member_id: castMemberId,
          character_name: entry.character_name || null,
          display_order: i,
        });
        if (linkError) throw linkError;
      }
    },
    onSuccess: (_, variables) => {
      invalidateStore(`movie-cast-${variables.movieId}`);
      invalidateStore('cast-members-all');
      invalidateStoreByPrefix('cast-member-');
      queryClient.invalidateQueries({ queryKey: ['movie-cast', variables.movieId] });
      queryClient.invalidateQueries({ queryKey: ['cast-members'] });
    },
  });
}

// NOTE: Cast photo uploads were removed to avoid using Supabase Storage.
// Use external image URLs instead (stored as plain text in cast_members.photo_url).
