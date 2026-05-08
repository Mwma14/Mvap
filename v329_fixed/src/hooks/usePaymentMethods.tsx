import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { toast } from 'sonner';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  gradient: string;
  text_color: string;
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

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: withPermanentCache<PaymentMethod[]>('payment-methods', async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as PaymentMethod[];
    }),
    ...QUERY_OPTS,
  });
}

export function useUpsertPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (method: Partial<PaymentMethod> & { name: string; account_number: string; account_name: string }) => {
      if (method.id) {
        const { error } = await supabaseAdmin.from('payment_methods').update(method).eq('id', method.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('payment_methods').insert(method);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateStore('payment-methods');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateStore('payment-methods');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
