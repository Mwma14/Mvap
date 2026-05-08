import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PremiumRequest {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_duration: string;
  plan_price: string;
  transaction_id: string;
  screenshot_url: string | null;
  payment_method: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_email?: string;
}

export function usePremiumRequests(statusFilter?: string) {
  return useQuery({
    queryKey: ['premium-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('premium_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user emails for each request
      const userIds = [...new Set((data as PremiumRequest[]).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

      return (data as PremiumRequest[]).map(r => ({
        ...r,
        user_email: emailMap.get(r.user_id) || 'Unknown',
      }));
    },
  });
}

export function useUserPremiumRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-premium-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('premium_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PremiumRequest[];
    },
    enabled: !!userId,
  });
}

export function useSubmitPremiumRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      user_id: string;
      plan_id: string | null;
      plan_duration: string;
      plan_price: string;
      transaction_id: string;
      screenshot_url: string | null;
      premium_type?: string;
      payment_method?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('premium_requests')
        .insert(request)
        .select()
        .single();
      if (error) throw error;

      // Notify all admins (server-side) without requiring a service_role key in the client.
      // NOTE: Requires the SQL migration that adds notify_admins_new_premium_request().
      await supabase.rpc('notify_admins_new_premium_request', { _request_id: data.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-premium-requests'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useApprovePremiumRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, adminId }: { requestId: string; adminId: string }) => {
      const { error } = await supabase.rpc('approve_premium_request', {
        _request_id: requestId,
        _admin_id: adminId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-requests'] });
      toast.success('Request approved! User premium updated.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDenyPremiumRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, adminId, reason }: { requestId: string; adminId: string; reason: string }) => {
      const { error } = await supabase.rpc('deny_premium_request', {
        _request_id: requestId,
        _admin_id: adminId,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-requests'] });
      toast.success('Request denied.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
