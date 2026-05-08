import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Play, Tv, ChevronDown, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LiveTvPlayer } from '@/components/LiveTvPlayer';
import { FadeIn } from '@/components/FadeIn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFavoriteChannels, useToggleFavoriteChannel } from '@/hooks/useFavoriteChannels';
import { useAuth } from '@/hooks/useAuth';
import { useActiveDirectChannels } from '@/hooks/useDirectChannels';

// Route live-tv-proxy through Vercel (free, no Supabase egress)
const SUPABASE_FUNCTIONS_URL = 'https://proxies-lake.vercel.app/functions/v1';

interface Channel {
  name: string;
  logo: string;
  url: string;
  group: string;
  source?: string;
}

interface SourceResult {
  category: string;
  channels: Record<string, Channel[]>;
}

const CHANNELS_PER_GROUP = 12;

export default function TvChannels() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});
  const [showFavorites, setShowFavorites] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { favorites } = useFavoriteChannels();
  const toggleFavorite = useToggleFavoriteChannel();
  const { data: directChannels } = useActiveDirectChannels();

  const favoriteUrls = useMemo(() => new Set(favorites.map(f => f.channel_url)), [favorites]);

  // Step 1: Fetch the list of source URLs with labels (lightweight)
  const { data: sourceEntries, isLoading: isLoadingSources, isError: isSourcesError, refetch: refetchSources } = useQuery({
    queryKey: ['live-tv-source-list'],
    queryFn: async () => {
        const res = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/live-tv-proxy?listSources=true`
      );
      if (!res.ok) throw new Error('Failed to fetch source list');
      const json = await res.json();
      const raw = json.sources || [];
      // Handle both old format (string[]) and new format ({url, label}[])
      return raw.map((s: any) => typeof s === 'string' ? { url: s, label: '' } : { url: s.url, label: s.label || '' }) as { url: string; label: string }[];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Step 2: Reorder sources so Myanmar TV loads first
  const BATCH_SIZE = 5;
  const [loadedBatch, setLoadedBatch] = useState(1);

  const orderedSourceEntries = useMemo(() => {
    if (!sourceEntries) return [];
    const myanmar: typeof sourceEntries = [];
    const rest: typeof sourceEntries = [];
    for (const entry of sourceEntries) {
      if (entry.label === 'Myanmar TV') myanmar.push(entry);
      else rest.push(entry);
    }
    return [...myanmar, ...rest];
  }, [sourceEntries]);

  const sourceQueries = useQueries({
    queries: orderedSourceEntries.map((entry, index) => ({
      queryKey: ['live-tv-source', entry.url],
      queryFn: async (): Promise<SourceResult> => {
        const labelParam = entry.label ? `&label=${encodeURIComponent(entry.label)}` : '';
        const res = await fetch(
          `${SUPABASE_FUNCTIONS_URL}/live-tv-proxy?sourceUrl=${encodeURIComponent(entry.url)}${labelParam}`
        );
        if (!res.ok) throw new Error(`Failed to fetch source: ${entry.url}`);
        const json = await res.json();
        return { category: json.category, channels: json.channels };
      },
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      enabled: index < loadedBatch * BATCH_SIZE,
    })),
  });

  // Reset batch when source list changes (e.g. admin adds new sources)
  const sourceCount = sourceEntries?.length ?? 0;
  useEffect(() => {
    setLoadedBatch(1);
  }, [sourceCount]);

  // Only count queries within the enabled range to avoid disabled queries inflating the count
  const enabledCount = Math.min(loadedBatch * BATCH_SIZE, sourceCount);
  const loadedCount = sourceQueries.slice(0, enabledCount).filter(q => !q.isLoading).length;

  // Load next batch when current batch finishes
  useEffect(() => {
    if (sourceCount === 0) return;
    if (loadedCount >= enabledCount && enabledCount < sourceCount) {
      setLoadedBatch(prev => prev + 1);
    }
  }, [loadedCount, enabledCount, sourceCount]);

  // Broken channels
  const [localBroken, setLocalBroken] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('broken_channels') || '[]');
    } catch { return []; }
  });

  const { data: brokenChannels } = useQuery({
    queryKey: ['broken-channels'],
    queryFn: async () => {
      const { data } = await supabase.from('broken_channels').select('channel_url');
      const urls = (data || []).map(r => r.channel_url);
      localStorage.setItem('broken_channels', JSON.stringify(urls));
      return urls;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const brokenUrls = useMemo(() => {
    return new Set([...(brokenChannels || []), ...localBroken]);
  }, [brokenChannels, localBroken]);

  const reportBroken = useMutation({
    mutationFn: async ({ url, name }: { url: string; name: string }) => {
      await supabase.from('broken_channels').upsert(
        { channel_url: url, channel_name: name, reported_by: user?.id },
        { onConflict: 'channel_url' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broken-channels'] });
    },
  });

  // Collect loaded sources into a map
  const loadedSources = useMemo(() => {
    const map: Record<string, SourceResult> = {};
    sourceQueries.forEach((q) => {
      if (q.data && Object.keys(q.data.channels).length > 0) {
        map[q.data.category] = q.data;
      }
    });

    // Merge direct channels from tv_channels table
    if (directChannels && directChannels.length > 0) {
      const grouped: Record<string, Channel[]> = {};
      for (const dc of directChannels) {
        if (!dc.stream_url) continue;
        const cat = dc.category || 'Direct Channels';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          name: dc.name,
          url: dc.stream_url,
          logo: dc.thumbnail_url || '',
          group: cat,
          source: 'direct',
        });
      }
      for (const [cat, channels] of Object.entries(grouped)) {
        const key = `⚡ ${cat}`;
        if (map[key]) {
          map[key].channels[cat] = [...(map[key].channels[cat] || []), ...channels];
        } else {
          map[key] = { category: key, channels: { [cat]: channels } };
        }
      }
    }

    return map;
  }, [sourceQueries, directChannels]);

  // Only flatten for search — lazy computation
  const allChannels = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const channels: (Channel & { sourceCategory: string })[] = [];
    for (const [category, source] of Object.entries(loadedSources)) {
      for (const group of Object.values(source.channels)) {
        for (const ch of group) {
          if (ch.source === 'direct' || !brokenUrls.has(ch.url)) {
            channels.push({ ...ch, sourceCategory: category });
          }
        }
      }
    }
    return channels;
  }, [loadedSources, brokenUrls, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.sourceCategory.toLowerCase().includes(q)
    );
  }, [allChannels, searchQuery]);

  const favoriteChannelsList = useMemo(() => {
    return favorites.map(f => ({
      name: f.channel_name,
      url: f.channel_url,
      logo: f.channel_logo || '',
      group: f.channel_group || '',
      sourceCategory: f.source_category || '',
    }));
  }, [favorites]);

  // Total channel count from loaded sources
  const totalChannels = useMemo(() => {
    let count = 0;
    for (const source of Object.values(loadedSources)) {
      for (const group of Object.values(source.channels)) {
        count += group.filter(ch => ch.source === 'direct' || !brokenUrls.has(ch.url)).length;
      }
    }
    return count;
  }, [loadedSources, brokenUrls]);

  const someLoading = sourceQueries.some(q => q.isLoading);
  const isLoading = isLoadingSources || (sourceEntries && sourceEntries.length > 0 && sourceQueries.every(q => q.isLoading)) || (someLoading && Object.keys(loadedSources).length === 0);
  const isError = isSourcesError && !sourceEntries;

  const handlePlay = useCallback((channel: Channel) => {
    setActiveChannel(channel);
  }, []);

  const handleStreamError = (url: string, name: string) => {
    setLocalBroken(prev => {
      const updated = [...prev, url];
      localStorage.setItem('broken_channels', JSON.stringify(updated));
      return updated;
    });
    if (user) {
      reportBroken.mutate({ url, name });
    }
    setTimeout(() => setActiveChannel(null), 2000);
  };

  const handleToggleFavorite = useCallback((channel: Channel & { sourceCategory?: string }) => {
    if (!user) return;
    toggleFavorite.mutate({
      channel: {
        name: channel.name,
        url: channel.url,
        logo: channel.logo,
        group: channel.group,
        sourceCategory: (channel as any).sourceCategory,
      },
      isFavorite: favoriteUrls.has(channel.url),
    });
  }, [user, toggleFavorite, favoriteUrls]);

  const toggleSource = (key: string) => {
    setOpenSources((prev) => {
      const isOpening = !prev[key];
      if (isOpening) setExpandedGroups({});
      return { [key]: isOpening };
    });
  };

  const toggleGroupExpand = useCallback((key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      {/* Header */}
      <div className="pt-16 px-4 pb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1 text-center pr-10">
          {t('tvChannels')}
        </h1>
      </div>

      {/* Sticky Inline Player - stays at top when scrolling, key forces remount on channel change */}
      {activeChannel && (
        <div className="sticky top-16 z-40 px-4 bg-background pb-2">
          <LiveTvPlayer
            key={activeChannel.url}
            url={activeChannel.url}
            channelName={activeChannel.name}
            onClose={() => setActiveChannel(null)}
            onError={handleStreamError}
          />
        </div>
      )}

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchChannels')}
            className="pl-12 h-14 rounded-xl border-border text-base"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          {totalChannels > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalChannels} channels{someLoading ? ' (loading more...)' : ' available'}
            </p>
          )}
          {user && (
            <Button
              variant={showFavorites ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setShowFavorites(!showFavorites); setSearchQuery(''); }}
              className="gap-1.5 ml-auto"
            >
              <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
              Favorites {favorites.length > 0 && `(${favorites.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <LoadingSpinner message="Loading channels..." />
        ) : isError ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tv className="w-16 h-16 text-destructive mb-4" />
              <p className="text-foreground font-semibold mb-2">Failed to load channels</p>
              <p className="text-sm text-muted-foreground mb-4">Please check your connection and try again</p>
              <Button onClick={() => refetchSources()} variant="outline">
                Retry
              </Button>
            </div>
          </FadeIn>
        ) : showFavorites ? (
          <FadeIn>
            {favoriteChannelsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No favorite channels yet</p>
                <p className="text-xs text-muted-foreground mt-1">Tap the heart icon on any channel to save it</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Favorites ({favoriteChannelsList.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {favoriteChannelsList.map((channel, idx) => (
                    <ChannelCard
                      key={`fav-${channel.url}-${idx}`}
                      channel={channel}
                      isActive={activeChannel?.url === channel.url}
                      onPlay={handlePlay}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                      showFavorite={!!user}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeIn>
        ) : filteredChannels !== null ? (
          <FadeIn>
            {filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Tv className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No channels found</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Results ({filteredChannels.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredChannels.map((channel, idx) => (
                    <ChannelCard
                      key={`${channel.name}-${idx}`}
                      channel={channel}
                      isActive={activeChannel?.url === channel.url}
                      onPlay={handlePlay}
                      isFavorite={favoriteUrls.has(channel.url)}
                      onToggleFavorite={handleToggleFavorite}
                      showFavorite={!!user}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeIn>
        ) : Object.keys(loadedSources).length === 0 && !someLoading ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Tv className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noChannels')}</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn>
            <div className="space-y-4">
              {Object.entries(loadedSources).sort(([a], [b]) => {
                // Pin "Myanmar TV" to the top
                if (a === 'Myanmar TV') return -1;
                if (b === 'Myanmar TV') return 1;
                return a.localeCompare(b);
              }).map(([sourceCategory, sourceData]) => {
                const channelCount = Object.values(sourceData.channels)
                  .flat()
                  .filter(c => c.source === 'direct' || !brokenUrls.has(c.url)).length;
                if (channelCount === 0) return null;
                return (
                  <Collapsible
                    key={sourceCategory}
                    open={openSources[sourceCategory] ?? false}
                    onOpenChange={() => toggleSource(sourceCategory)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-2">
                          <Tv className="w-5 h-5 text-primary" />
                          <span className="font-bold text-foreground text-sm sm:text-base">{sourceCategory}</span>
                          <span className="text-xs text-muted-foreground">({channelCount})</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSources[sourceCategory] ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-6 pt-4">
                        {Object.entries(sourceData.channels).map(([group, channels]) => {
                          const validChannels = channels.filter(c => c.source === 'direct' || !brokenUrls.has(c.url));
                          if (validChannels.length === 0) return null;
                          const groupKey = `${sourceCategory}::${group}`;
                          const isExpanded = expandedGroups[groupKey] ?? false;
                          const displayChannels = validChannels.length > CHANNELS_PER_GROUP && !isExpanded
                            ? validChannels.slice(0, CHANNELS_PER_GROUP)
                            : validChannels;
                          const hasMore = validChannels.length > CHANNELS_PER_GROUP && !isExpanded;
                          return (
                            <div key={group}>
                              <h3 className="text-sm font-semibold text-muted-foreground mb-3 pl-1">
                                {group} ({validChannels.length})
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {displayChannels.map((channel, idx) => (
                                  <ChannelCard
                                    key={`${channel.name}-${idx}`}
                                    channel={channel}
                                    isActive={activeChannel?.url === channel.url}
                                    onPlay={handlePlay}
                                    isFavorite={favoriteUrls.has(channel.url)}
                                    onToggleFavorite={handleToggleFavorite}
                                    showFavorite={!!user}
                                  />
                                ))}
                              </div>
                              {hasMore && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleGroupExpand(groupKey)}
                                  className="w-full mt-2 text-primary"
                                >
                                  Show all {validChannels.length} channels
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              {someLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading more sources...</span>
                </div>
              )}
            </div>
          </FadeIn>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

const ChannelCard = React.memo(function ChannelCard({
  channel,
  isActive,
  onPlay,
  isFavorite,
  onToggleFavorite,
  showFavorite,
}: {
  channel: Channel;
  isActive: boolean;
  onPlay: (c: Channel) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (c: Channel) => void;
  showFavorite?: boolean;
}) {
  return (
    <div className={`text-left group relative ${isActive ? 'ring-2 ring-primary rounded-xl' : ''}`}>
      <button
        onClick={() => onPlay(channel)}
        className="w-full text-left"
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border mb-2">
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-full h-full object-contain bg-white p-2"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-lg font-bold text-muted-foreground">
                {channel.name[0]}
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
              <Play className="w-6 h-6 text-black fill-black" />
            </div>
          </div>
        </div>
      </button>
      {showFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(channel);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      )}
      <p className="text-sm font-medium text-foreground truncate">{channel.name}</p>
    </div>
  );
});
