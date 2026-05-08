import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { useToast } from '@/hooks/use-toast';
import { withPermanentCache, invalidateStore } from '@/lib/cache';

export interface AdminContacts {
  telegram: { handle: string; url: string };
  viber: { number: string; url: string };
  email: { address: string; url: string };
}

export interface SubscriptionPrice {
  mmk: number;
  usd: number;
  label: string;
}

export interface SubscriptionPrices {
  monthly: SubscriptionPrice;
  yearly: SubscriptionPrice;
  lifetime: SubscriptionPrice;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  speed: 'slow' | 'normal' | 'fast';
  opacity: number;
}

export interface LiveTvSource {
  url: string;
  enabled: boolean;
  label?: string;
}

const QUERY_OPTS = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: withPermanentCache('site-settings', async () => {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach(item => {
        try {
          settings[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        } catch {
          settings[item.key] = item.value;
        }
      });

      return {
        adminContacts: settings['admin_contacts'] as AdminContacts | undefined,
        subscriptionPrices: settings['subscription_prices'] as SubscriptionPrices | undefined,
        announcement: settings['announcement'] as AnnouncementSettings | undefined,
        liveTvSources: (Array.isArray(settings['live_tv_sources']) ? settings['live_tv_sources'] : []) as LiveTvSource[],
        telegramBotApiUrl: (settings['telegram_bot_api_url'] as string) || '',
      };
    }),
    ...QUERY_OPTS,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      // Use upsert so it works even if the row doesn't exist yet (new database)
      const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert({ key, value: serialized }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateStore('site-settings');
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Settings Updated', description: 'Site settings have been saved successfully.' });
    },
    onError: error => {
      toast({ title: 'Update Failed', description: (error as Error).message, variant: 'destructive' });
    },
  });
}
