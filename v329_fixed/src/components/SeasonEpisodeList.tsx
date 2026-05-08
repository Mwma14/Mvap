import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Film, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeasonsWithEpisodes } from '@/hooks/useSeasons';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServerDrawer } from '@/components/ServerDrawer';
import type { Episode } from '@/types/database';

interface SeasonEpisodeListProps {
  movieId: string;
  isPremium: boolean;
  userIsPremium: boolean;
  onPremiumRequired: () => void;
  movieTitle: string;
  posterUrl: string | null;
  year: number | null;
  resolution: string | null;
  fileSize: string | null;
}

export function SeasonEpisodeList({ 
  movieId, 
  isPremium: _isPremium, 
  userIsPremium, 
  onPremiumRequired,
  movieTitle,
  posterUrl,
  year,
  resolution,
  fileSize,
}: SeasonEpisodeListProps) {
  const { data: seasons, isLoading } = useSeasonsWithEpisodes(movieId);
  const { t } = useLanguage();
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(() => new Set());
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(() => new Set());
  const [downloadEpisode, setDownloadEpisode] = useState<{ episode: Episode; seasonNumber: number } | null>(null);
  const [playEpisode, setPlayEpisode] = useState<{ episode: Episode; seasonNumber: number } | null>(null);

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonId)) next.delete(seasonId);
      else next.add(seasonId);
      return next;
    });
  };

  const toggleEpisode = (episodeId: string) => {
    setExpandedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(episodeId)) next.delete(episodeId);
      else next.add(episodeId);
      return next;
    });
  };

  const handlePlay = (episode: Episode, seasonNumber: number) => {
    if (!userIsPremium) {
      onPremiumRequired();
    } else {
      setPlayEpisode({ episode, seasonNumber });
    }
  };

  const handleEpisodeDownload = (episode: Episode, seasonNumber: number) => {
    if (!userIsPremium) {
      onPremiumRequired();
      return;
    }
    setDownloadEpisode({ episode, seasonNumber });
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) return null;

  const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
  const hasSingleSeason = seasons.length === 1;

  // Build episode title like "Series Name - S1E3"
  const getEpisodeTitle = (ep: Episode, seasonNum: number) =>
    `${movieTitle} - S${seasonNum}E${ep.episode_number}`;

  // Check if episode has any download source
  const hasDownloadSource = (ep: Episode) =>
    !!(ep.download_url || ep.telegram_url || ep.mega_url);

  // Check if episode has any play source
  const hasPlaySource = (ep: Episode) =>
    !!(ep.stream_url || (ep as any).mx_player_url);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-foreground mb-4">
        {hasSingleSeason ? `${t('allEpisodes')} (${totalEpisodes})` : t('seasonsAndEpisodes')}
      </h2>

      <div className="space-y-3">
        {hasSingleSeason ? (
          seasons[0].episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              seasonNumber={seasons[0].season_number}
              isExpanded={expandedEpisodes.has(episode.id)}
              onToggle={() => toggleEpisode(episode.id)}
              onPlay={() => handlePlay(episode, seasons[0].season_number)}
              onDownload={() => handleEpisodeDownload(episode, seasons[0].season_number)}
              hasDownloadSource={hasDownloadSource(episode)}
              hasPlaySource={hasPlaySource(episode)}
            />
          ))
        ) : (
          seasons.map((season) => (
            <div key={season.id} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSeason(season.id)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {expandedSeasons.has(season.id) 
                    ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  }
                  <span className="font-semibold text-foreground truncate">
                    Season {season.season_number}
                    {season.title ? `: ${season.title}` : ''}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                  {season.episodes.length} {t('episodes')}
                </span>
              </button>

              {expandedSeasons.has(season.id) && (
                <div className="border-t border-border bg-background p-3 space-y-3">
                  {season.episodes.map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      episode={episode}
                      seasonNumber={season.season_number}
                      isExpanded={expandedEpisodes.has(episode.id)}
                      onToggle={() => toggleEpisode(episode.id)}
                      onPlay={() => handlePlay(episode, season.season_number)}
                      onDownload={() => handleEpisodeDownload(episode, season.season_number)}
                      hasDownloadSource={hasDownloadSource(episode)}
                      hasPlaySource={hasPlaySource(episode)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ServerDrawer for episode playback — in-app player like movies */}
      {playEpisode && (
        <ServerDrawer
          open={!!playEpisode}
          onOpenChange={(open) => { if (!open) setPlayEpisode(null); }}
          streamUrl={playEpisode.episode.stream_url}
          mxPlayerUrl={(playEpisode.episode as any).mx_player_url}
          type="play"
          movieInfo={{
            movieId: movieId,
            episodeId: playEpisode.episode.id,
            title: getEpisodeTitle(playEpisode.episode, playEpisode.seasonNumber),
            posterUrl,
            year,
            resolution,
            fileSize,
          }}
        />
      )}

      {/* Shared ServerDrawer for episode downloads */}
      {downloadEpisode && (
        <ServerDrawer
          open={!!downloadEpisode}
          onOpenChange={(open) => { if (!open) setDownloadEpisode(null); }}
          downloadUrl={downloadEpisode.episode.download_url}
          telegramUrl={downloadEpisode.episode.telegram_url}
          megaUrl={downloadEpisode.episode.mega_url}
          type="download"
          movieInfo={{
            movieId: `${movieId}-ep${downloadEpisode.episode.episode_number}`,
            title: getEpisodeTitle(downloadEpisode.episode, downloadEpisode.seasonNumber),
            posterUrl,
            year,
            resolution,
            fileSize,
          }}
        />
      )}
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  seasonNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onDownload: () => void;
  hasDownloadSource: boolean;
  hasPlaySource: boolean;
}

function EpisodeCard({ 
  episode, 
  seasonNumber, 
  isExpanded, 
  onToggle, 
  onPlay,
  onDownload,
  hasDownloadSource,
  hasPlaySource,
}: EpisodeCardProps) {

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Main row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-28 h-20 rounded-lg bg-muted shrink-0 flex items-center justify-center overflow-hidden">
          {episode.thumbnail_url ? (
            <img 
              src={episode.thumbnail_url} 
              alt={episode.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Film className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            {seasonNumber}-{episode.episode_number}
            {episode.air_date && ` • ${episode.air_date}`}
          </p>
          <h4 className="font-semibold text-foreground text-sm mt-0.5 line-clamp-2">
            Episode {episode.episode_number}: {episode.title}
          </h4>
          {episode.duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{episode.duration}</span>
            </div>
          )}
        </div>

        {/* Expand icon */}
        {isExpanded 
          ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Description */}
          {episode.description && (
            <p className="text-sm text-muted-foreground">{episode.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {hasPlaySource && (
              <Button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
                size="sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Play
              </Button>
            )}

            {hasDownloadSource && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
