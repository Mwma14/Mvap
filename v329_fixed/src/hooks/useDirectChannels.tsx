import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export interface DirectChannel {
  id: string;
  name: string;
  stream_url: string | null;
  thumbnail_url: string | null;
  category: string;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

function invalidateChannelStore() {
  invalidateStore('direct-channels-all');
  invalidateStore('direct-channels-active');
}

export function useDirectChannels() {
  return useQuery({
    queryKey: ['direct-channels'],
    queryFn: withPermanentCache<DirectChannel[]>('direct-channels-all', async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as DirectChannel[];
    }),
    ...QUERY_OPTS,
  });
}

export function useActiveDirectChannels() {
  return useQuery({
    queryKey: ['direct-channels-active'],
    queryFn: withPermanentCache<DirectChannel[]>('direct-channels-active', async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as DirectChannel[];
    }),
    ...QUERY_OPTS,
  });
}

export function useDirectChannelMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    invalidateChannelStore();
    queryClient.invalidateQueries({ queryKey: ['direct-channels'] });
    queryClient.invalidateQueries({ queryKey: ['direct-channels-active'] });
  };

  const addChannel = useMutation({
    mutationFn: async (channel: {
      name: string;
      stream_url: string;
      thumbnail_url?: string;
      category: string;
    }) => {
      const { error } = await supabaseAdmin
        .from('tv_channels')
        .insert({ ...channel, is_active: true });
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateChannel = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DirectChannel> & { id: string }) => {
      const { error } = await supabaseAdmin.from('tv_channels').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('tv_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  return { addChannel, updateChannel, deleteChannel };
}
