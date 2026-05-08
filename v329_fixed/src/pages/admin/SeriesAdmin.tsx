import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, ArrowLeft, ChevronDown, ChevronRight, 
  X, Play, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useMovie } from '@/hooks/useMovies';
import { 
  useSeasonsWithEpisodes, 
  useCreateSeason, 
  useUpdateSeason, 
  useDeleteSeason,
  useCreateEpisode,
  useUpdateEpisode,
  useDeleteEpisode
} from '@/hooks/useSeasons';
import type { Season, SeasonInsert, Episode, EpisodeInsert } from '@/types/database';
import { toast } from 'sonner';

const defaultSeason: Omit<SeasonInsert, 'movie_id'> = {
  season_number: 1,
  title: '',
};

const defaultEpisode: Omit<EpisodeInsert, 'season_id'> = {
  episode_number: 1,
  title: '',
  description: '',
  duration: '',
  air_date: '',
  thumbnail_url: '',
  stream_url: '',
  mx_player_url: '',
  telegram_url: '',
  mega_url: '',
  download_url: '',
};

export default function SeriesAdmin() {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { data: movie, isLoading: movieLoading } = useMovie(movieId || '');
  const { data: seasons, isLoading: seasonsLoading } = useSeasonsWithEpisodes(movieId || '');
  
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const deleteSeason = useDeleteSeason();
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const deleteEpisode = useDeleteEpisode();

  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  
  // Season modal state
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonFormData, setSeasonFormData] = useState(defaultSeason);
  
  // Episode modal state
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [episodeFormData, setEpisodeFormData] = useState(defaultEpisode);
  const [currentSeasonId, setCurrentSeasonId] = useState<string>('');
  
  // Delete state
  const [deleteSeasonOpen, setDeleteSeasonOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
  const [deleteEpisodeOpen, setDeleteEpisodeOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<Episode | null>(null);

  const toggleSeason = (seasonId: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  };

  // Season handlers
  const openCreateSeasonModal = () => {
    const nextSeasonNumber = (seasons?.length || 0) + 1;
    setEditingSeason(null);
    setSeasonFormData({ ...defaultSeason, season_number: nextSeasonNumber });
    setShowSeasonModal(true);
  };

  const openEditSeasonModal = (season: Season) => {
    setEditingSeason(season);
    setSeasonFormData({
      season_number: season.season_number,
      title: season.title || '',
    });
    setShowSeasonModal(true);
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieId) return;

    try {
      if (editingSeason) {
        await updateSeason.mutateAsync({ 
          id: editingSeason.id, 
          movieId,
          ...seasonFormData 
        });
        toast.success('Season updated');
      } else {
        await createSeason.mutateAsync({ 
          movie_id: movieId, 
          ...seasonFormData 
        });
        toast.success('Season created');
      }
      setShowSeasonModal(false);
    } catch (error) {
      toast.error('Failed to save season');
    }
  };

  const handleDeleteSeason = async () => {
    if (!seasonToDelete || !movieId) return;
    try {
      await deleteSeason.mutateAsync({ id: seasonToDelete.id, movieId });
      toast.success('Season deleted');
      setDeleteSeasonOpen(false);
      setSeasonToDelete(null);
    } catch (error) {
      toast.error('Failed to delete season');
    }
  };

  // Episode handlers
  const openCreateEpisodeModal = (seasonId: string, currentEpisodeCount: number) => {
    setCurrentSeasonId(seasonId);
    setEditingEpisode(null);
    setEpisodeFormData({ 
      ...defaultEpisode, 
      episode_number: currentEpisodeCount + 1 
    });
    setShowEpisodeModal(true);
  };

  const openEditEpisodeModal = (episode: Episode) => {
    setCurrentSeasonId(episode.season_id);
    setEditingEpisode(episode);
    setEpisodeFormData({
      episode_number: episode.episode_number,
      title: episode.title,
      description: episode.description || '',
      duration: episode.duration || '',
      air_date: episode.air_date || '',
      thumbnail_url: episode.thumbnail_url || '',
      stream_url: episode.stream_url || '',
      mx_player_url: episode.mx_player_url || '',
      telegram_url: episode.telegram_url || '',
      mega_url: episode.mega_url || '',
      download_url: episode.download_url || '',
    });
    setShowEpisodeModal(true);
  };

  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeasonId) return;

    try {
      if (editingEpisode) {
        await updateEpisode.mutateAsync({ 
          id: editingEpisode.id, 
          seasonId: currentSeasonId,
          ...episodeFormData 
        });
        toast.success('Episode updated');
      } else {
        await createEpisode.mutateAsync({ 
          season_id: currentSeasonId, 
          ...episodeFormData 
        });
        toast.success('Episode created');
      }
      setShowEpisodeModal(false);
    } catch (error) {
      toast.error('Failed to save episode');
    }
  };

  const handleDeleteEpisode = async () => {
    if (!episodeToDelete) return;
    try {
      await deleteEpisode.mutateAsync({ 
        id: episodeToDelete.id, 
        seasonId: episodeToDelete.season_id 
      });
      toast.success('Episode deleted');
      setDeleteEpisodeOpen(false);
      setEpisodeToDelete(null);
    } catch (error) {
      toast.error('Failed to delete episode');
    }
  };

  // NOTE: Thumbnail uploads were removed to avoid Supabase Storage usage.
  // Use external image URLs instead (stored in episodes.thumbnail_url).

  if (movieLoading || seasonsLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!movie) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Series not found</p>
        <Button onClick={() => navigate('/admin/movies')}>Back to Movies</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/admin/movies')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{movie.title}</h1>
          <p className="text-muted-foreground text-sm">Manage Seasons & Episodes</p>
        </div>
      </div>

      {/* Add Season Button */}
      <div className="mb-6">
        <Button onClick={openCreateSeasonModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Season
        </Button>
      </div>

      {/* Seasons List */}
      <div className="space-y-4">
        {seasons && seasons.length > 0 ? (
          seasons.map((season) => (
            <Card key={season.id} className="glass">
              <Collapsible 
                open={expandedSeasons.has(season.id)}
                onOpenChange={() => toggleSeason(season.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSeasons.has(season.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <CardTitle className="text-lg">
                          Season {season.season_number}
                          {season.title && `: ${season.title}`}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          ({season.episodes.length} episodes)
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditSeasonModal(season)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSeasonToDelete(season);
                            setDeleteSeasonOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {/* Add Episode Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-4 gap-2"
                      onClick={() => openCreateEpisodeModal(season.id, season.episodes.length)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Episode
                    </Button>

                    {/* Episodes List */}
                    {season.episodes.length > 0 ? (
                      <div className="space-y-2">
                        {season.episodes.map((episode) => (
                          <div 
                            key={episode.id}
                            className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                          >
                            {/* Thumbnail */}
                            <div className="w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              {episode.thumbnail_url ? (
                                <img 
                                  src={episode.thumbnail_url} 
                                  alt={episode.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Play className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                Ep {episode.episode_number}: {episode.title}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                {episode.duration && <span>{episode.duration}</span>}
                                {episode.stream_url && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <Play className="w-3 h-3" /> Stream
                                  </span>
                                )}
                                {episode.telegram_url && (
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> TG
                                  </span>
                                )}
                                {episode.mega_url && (
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> MEGA
                                  </span>
                                )}
                                {episode.download_url && (
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> DL
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditEpisodeModal(episode)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEpisodeToDelete(episode);
                                  setDeleteEpisodeOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No episodes yet. Add your first episode!
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        ) : (
          <Card className="glass">
            <CardContent className="p-8 text-center text-muted-foreground">
              No seasons yet. Add your first season!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Season Modal */}
      <Dialog open={showSeasonModal} onOpenChange={setShowSeasonModal}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>
              {editingSeason ? 'Edit Season' : 'Add New Season'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSeasonSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="season_number">Season Number *</Label>
              <Input
                id="season_number"
                type="number"
                min="1"
                value={seasonFormData.season_number}
                onChange={(e) => setSeasonFormData(prev => ({
                  ...prev,
                  season_number: parseInt(e.target.value) || 1
                }))}
                required
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season_title">Title (optional)</Label>
              <Input
                id="season_title"
                value={seasonFormData.title || ''}
                onChange={(e) => setSeasonFormData(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                placeholder="e.g., The Beginning"
                className="bg-muted"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowSeasonModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSeason.isPending || updateSeason.isPending}>
                {createSeason.isPending || updateSeason.isPending ? 'Saving...' : 'Save Season'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Episode Modal */}
      <Dialog open={showEpisodeModal} onOpenChange={setShowEpisodeModal}>
        <DialogContent className="max-w-2xl glass p-0 flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)', top: '1rem', bottom: '1rem', transform: 'translateX(-50%)' }}>
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>
              {editingEpisode ? 'Edit Episode' : 'Add New Episode'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEpisodeSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="episode_number">Episode Number *</Label>
                <Input
                  id="episode_number"
                  type="number"
                  min="1"
                  value={episodeFormData.episode_number}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    episode_number: parseInt(e.target.value) || 1
                  }))}
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="episode_title">Title *</Label>
                <Input
                  id="episode_title"
                  value={episodeFormData.title}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  required
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={episodeFormData.duration || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    duration: e.target.value
                  }))}
                  placeholder="e.g., 45 min"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="air_date">Air Date</Label>
                <Input
                  id="air_date"
                  type="date"
                  value={episodeFormData.air_date || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    air_date: e.target.value
                  }))}
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="episode_description">Description</Label>
              <Textarea
                id="episode_description"
                value={episodeFormData.description || ''}
                onChange={(e) => setEpisodeFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className="bg-muted"
                rows={2}
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div className="flex items-center gap-4">
                {episodeFormData.thumbnail_url && (
                  <div className="relative">
                    <img
                      src={episodeFormData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-24 h-14 object-cover rounded border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-5 h-5"
                      onClick={() => setEpisodeFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <Input
                value={episodeFormData.thumbnail_url || ''}
                onChange={(e) => setEpisodeFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="Paste thumbnail image URL (no Supabase storage)..."
                className="bg-muted"
              />
            </div>

            {/* Streaming & Download Links */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="font-medium text-sm text-foreground">🔗 Streaming & Download Links</h4>
              
              <div className="space-y-2">
                <Label htmlFor="ep_stream_url">Stream URL (Main Server)</Label>
                <Input
                  id="ep_stream_url"
                  value={episodeFormData.stream_url || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    stream_url: e.target.value
                  }))}
                  placeholder="https://..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep_mx_player_url">External Server URL</Label>
                <Input
                  id="ep_mx_player_url"
                  value={(episodeFormData as any).mx_player_url || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    mx_player_url: e.target.value
                  }))}
                  placeholder="https://... (opens in browser)"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep_telegram_url">Telegram URL</Label>
                <Input
                  id="ep_telegram_url"
                  value={episodeFormData.telegram_url || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    telegram_url: e.target.value
                  }))}
                  placeholder="https://t.me/..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep_mega_url">MEGA URL</Label>
                <Input
                  id="ep_mega_url"
                  value={episodeFormData.mega_url || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    mega_url: e.target.value
                  }))}
                  placeholder="https://mega.nz/..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ep_download_url">Download Link</Label>
                <Input
                  id="ep_download_url"
                  value={episodeFormData.download_url || ''}
                  onChange={(e) => setEpisodeFormData(prev => ({
                    ...prev,
                    download_url: e.target.value
                  }))}
                  placeholder="http://..."
                  className="bg-muted"
                />
              </div>
              </div>
            </div>

            {/* Pinned footer */}
            <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setShowEpisodeModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEpisode.isPending || updateEpisode.isPending}>
                {createEpisode.isPending || updateEpisode.isPending ? 'Saving...' : 'Save Episode'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Season Confirmation */}
      <AlertDialog open={deleteSeasonOpen} onOpenChange={setDeleteSeasonOpen}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Season {seasonToDelete?.season_number}? 
              This will also delete all episodes in this season. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Episode Confirmation */}
      <AlertDialog open={deleteEpisodeOpen} onOpenChange={setDeleteEpisodeOpen}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{episodeToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEpisode}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
