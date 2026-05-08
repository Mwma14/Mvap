import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  invalidateStoreByPrefix,
  invalidateStore,
  clearAllPermanentStore,
} from '@/lib/cache';

// Maps each DB table to:
//   queryKeys — React Query keys to invalidate
//   storePrefixes — permanent localStorage prefixes to clear
const TABLE_MAP: Record<string, { queryKeys: string[]; storePrefixes: string[] }> = {
  movies: {
    queryKeys: ['movies', 'movie', 'trending-movies', 'most-viewed-movies', 'related-movies', 'featured-all'],
    storePrefixes: ['movies', 'movie-detail', 'trending', 'most-viewed', 'related-movies'],
  },
  site_settings: {
    queryKeys: ['site-settings', 'live-tv-source-list'],
    storePrefixes: ['site-settings'],
  },
  categories: {
    queryKeys: ['categories'],
    storePrefixes: ['categories'],
  },
  tv_channels: {
    queryKeys: ['channels', 'broken-channels', 'direct-channels', 'direct-channels-active'],
    storePrefixes: ['direct-channels'],
  },
  football_videos: {
    queryKeys: ['football-videos', 'football-categories'],
    storePrefixes: ['football'],
  },
  info_slides: {
    queryKeys: ['info-slides', 'info-slides-admin'],
    storePrefixes: ['info-slides'],
  },
  pricing_plans: {
    queryKeys: ['pricing-plans'],
    storePrefixes: ['pricing-plans'],
  },
  payment_methods: {
    queryKeys: ['payment-methods'],
    storePrefixes: ['payment-methods'],
  },
  seasons: {
    queryKeys: ['seasons', 'seasons-with-episodes', 'episodes'],
    storePrefixes: ['seasons', 'episodes'],
  },
  episodes: {
    queryKeys: ['episodes', 'seasons-with-episodes'],
    storePrefixes: ['episodes', 'seasons-with-episodes'],
  },
  cast_members: {
    queryKeys: ['cast-members', 'movie-cast', 'actor-filmography'],
    storePrefixes: ['cast'],
  },
  movie_cast: {
    queryKeys: ['movie-cast', 'actor-filmography'],
    storePrefixes: ['movie-cast', 'actor-filmography'],
  },
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const appVersionRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Seed app_version from localStorage cache (no DB call on startup)
    // It will be set when site_settings data is first loaded by useSiteSettings hook
    try {
      const raw = localStorage.getItem('pls:site-settings');
      if (raw) {
        const entry = JSON.parse(raw);
        const settings = entry?.data;
        if (settings?.app_version) appVersionRef.current = settings.app_version;
      }
    } catch {
      // silent — will be set on first site_settings change event
    }

    function invalidateAll(table: string) {
      const entry = TABLE_MAP[table];
      if (!entry) return;

      // 1. Clear permanent localStorage store
      entry.storePrefixes.forEach(prefix => invalidateStoreByPrefix(prefix));

      // 2. Invalidate React Query in-memory cache
      entry.queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
    }

    function handleVersionCheck(payload: any) {
      const record = payload.new as { key?: string; value?: string } | undefined;
      if (!record || record.key !== 'app_version') return;
      if (appVersionRef.current && record.value && record.value !== appVersionRef.current) {
        // Clear ALL permanent store on version bump
        clearAllPermanentStore();
        queryClient.clear();
        toast({
          title: '🔄 New Update Available',
          description: 'A new version is available. Tap to refresh.',
          duration: Infinity,
          action: (
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              Refresh
            </button>
          ),
        });
      }
    }

    const channel = supabase
      .channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, () => invalidateAll('movies'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        invalidateAll('site_settings');
        handleVersionCheck(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => invalidateAll('categories'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_channels' }, () => invalidateAll('tv_channels'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'football_videos' }, () => invalidateAll('football_videos'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'info_slides' }, () => invalidateAll('info_slides'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_plans' }, () => invalidateAll('pricing_plans'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => invalidateAll('payment_methods'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, () => invalidateAll('seasons'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'episodes' }, () => invalidateAll('episodes'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_members' }, () => invalidateAll('cast_members'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movie_cast' }, () => invalidateAll('movie_cast'))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      initializedRef.current = false;
    };
  }, [queryClient, toast]);
}
