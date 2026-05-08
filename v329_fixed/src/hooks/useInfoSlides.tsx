import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { toast } from 'sonner';
import { withPermanentCache, invalidateStoreByPrefix } from '@/lib/cache';

export interface InfoSlide {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  accent_color: string;
  display_order: number;
  is_active: boolean;
  redirect_link: string;
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

function invalidateSlides(queryClient: ReturnType<typeof useQueryClient>) {
  invalidateStoreByPrefix('info-slides');
  queryClient.invalidateQueries({ queryKey: ['info-slides'] });
  queryClient.invalidateQueries({ queryKey: ['info-slides-admin'] });
}

export function useInfoSlides() {
  return useQuery({
    queryKey: ['info-slides'],
    queryFn: withPermanentCache<InfoSlide[]>('info-slides-active', async () => {
      const { data, error } = await supabase
        .from('info_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as InfoSlide[];
    }),
    ...QUERY_OPTS,
  });
}

export function useAllInfoSlides() {
  return useQuery({
    queryKey: ['info-slides-admin'],
    queryFn: withPermanentCache<InfoSlide[]>('info-slides-all', async () => {
      const { data, error } = await supabase
        .from('info_slides')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as InfoSlide[];
    }),
    ...QUERY_OPTS,
  });
}

export function useCreateInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slide: Omit<InfoSlide, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabaseAdmin.from('info_slides').insert(slide).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateSlides(queryClient); toast.success('Slide created successfully'); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InfoSlide> & { id: string }) => {
      const { data, error } = await supabaseAdmin
        .from('info_slides')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidateSlides(queryClient); toast.success('Slide updated'); },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteInfoSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('info_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateSlides(queryClient); toast.success('Slide deleted'); },
    onError: (error: Error) => toast.error(error.message),
  });
}
