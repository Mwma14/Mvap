import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FavoriteChannel {
  id: string;
  user_id: string;
  channel_name: string;
  channel_url: string;
  channel_logo: string | null;
  channel_group: string | null;
  source_category: string | null;
  created_at: string;
}

export function useFavoriteChannels() {
  const { user } = useAuth();

  const { data: favorites = [], ...rest } = useQuery({
    queryKey: ['favorite-channels', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorite_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FavoriteChannel[];
    },
    enabled: !!user,
  });

  return { favorites, ...rest };
}

export function useToggleFavoriteChannel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      channel,
      isFavorite,
    }: {
      channel: { name: string; url: string; logo?: string; group?: string; sourceCategory?: string };
      isFavorite: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_channels')
          .delete()
          .eq('user_id', user.id)
          .eq('channel_url', channel.url);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorite_channels')
          .insert({
            user_id: user.id,
            channel_name: channel.name,
            channel_url: channel.url,
            channel_logo: channel.logo || null,
            channel_group: channel.group || null,
            source_category: channel.sourceCategory || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-channels'] });
    },
  });
}
