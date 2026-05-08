import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { toast } from 'sonner';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export interface PricingPlan {
  id: string;
  duration: string;
  duration_days: number;
  price: string;
  platinum_price: string | null;
  display_order: number;
  is_active: boolean;
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

export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing-plans'],
    queryFn: withPermanentCache<PricingPlan[]>('pricing-plans', async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as PricingPlan[];
    }),
    ...QUERY_OPTS,
  });
}

export function useUpsertPricingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<PricingPlan> & { duration: string; price: string }) => {
      if (plan.id) {
        const { error } = await supabaseAdmin.from('pricing_plans').update(plan).eq('id', plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('pricing_plans').insert(plan);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateStore('pricing-plans');
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePricingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('pricing_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateStore('pricing-plans');
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
