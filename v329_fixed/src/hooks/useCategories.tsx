import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export interface Category {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}
export interface CategoryInsert { name: string; display_order?: number; }
export interface CategoryUpdate { name?: string; display_order?: number; }

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: withPermanentCache<Category[]>('categories-all', async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Category[];
    }),
    ...QUERY_OPTS,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await supabaseAdmin.from('categories').insert(category).select().single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      invalidateStore('categories-all');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabaseAdmin.from('categories').update(category).eq('id', id).select().single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      invalidateStore('categories-all');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateStore('categories-all');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
