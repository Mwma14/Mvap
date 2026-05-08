import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Admin-only hook — fetches pending request count.
// No polling; admin will see fresh count when they navigate to the admin panel.
export function usePendingRequestCount() {
  const { data: count = 0 } = useQuery({
    queryKey: ['pending-premium-requests-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('premium_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests count:', error);
        return 0;
      }
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — admin panel only
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // No refetchInterval — removed 30s polling that caused egress
  });

  return count;
}
