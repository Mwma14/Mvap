import { useState } from 'react';
import { Trophy, Plus, Trash2, Edit, Loader2, Save, Video, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useFootballVideos,
  useCreateFootballVideo,
  useUpdateFootballVideo,
  useDeleteFootballVideo,
  FootballVideo,
} from '@/hooks/useFootball';
import { toast } from 'sonner';

const defaultForm = {
  title: '',
  thumbnail_url: '',
  stream_url: '',
  download_url: '',
  category: 'Highlights',
  is_premium: false,
  is_live: false,
  show_in_highlights: false,
  show_in_replay: false,
};

export default function FootballAdmin() {
  const { data: videos, isLoading } = useFootballVideos();
  const createVideo = useCreateFootballVideo();
  const updateVideo = useUpdateFootballVideo();
  const deleteVideo = useDeleteFootballVideo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<FootballVideo | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingVideo(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (video: FootballVideo) => {
    setEditingVideo(video);
    setForm({
      title: video.title,
      thumbnail_url: video.thumbnail_url || '',
      stream_url: video.stream_url || '',
      download_url: video.download_url || '',
      category: video.category,
      is_premium: video.is_premium,
      is_live: video.is_live,
      show_in_highlights: video.show_in_highlights,
      show_in_replay: video.show_in_replay,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      if (editingVideo) {
        await updateVideo.mutateAsync({
          id: editingVideo.id,
          ...form,
          thumbnail_url: form.thumbnail_url || null,
          stream_url: form.stream_url || null,
          download_url: form.download_url || null,
        });
        toast.success('Video updated');
      } else {
        await createVideo.mutateAsync({
          ...form,
          thumbnail_url: form.thumbnail_url || null,
          stream_url: form.stream_url || null,
          download_url: form.download_url || null,
        });
        toast.success('Video created');
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVideo.mutateAsync(deleteId);
      toast.success('Video deleted');
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading football videos..." />;

  const liveCount = videos?.filter(v => v.is_live).length || 0;
  const highlightCount = videos?.filter(v => !v.is_live).length || 0;

  return (
    <div className="w-full box-border">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 sm:w-8 sm:h-8" />
          ဘောလုံး (Football)
        </h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{videos?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Live</p>
            <p className="text-2xl font-bold text-primary">{liveCount}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Highlights</p>
            <p className="text-2xl font-bold">{highlightCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Video List */}
      <Card className="glass">
        <CardContent className="p-0">
          {!videos || videos.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No football videos yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {videos.map((video) => (
                <div key={video.id} className="p-3 sm:p-4 flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {video.category}
                      </Badge>
                      {video.is_live && (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          <Wifi className="w-3 h-3 mr-0.5" />
                          LIVE
                        </Badge>
                      )}
                      {video.is_premium && (
                        <Badge className="text-[10px] h-5 bg-cg-gold text-black">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(video)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(video.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Video' : 'Add Football Video'}</DialogTitle>
            <DialogDescription>
              {editingVideo ? 'Update the video details below.' : 'Fill in the details to add a new football video.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Match title..." />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Stream URL</Label>
              <Input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Download URL</Label>
              <Input value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Highlights, Premier League..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>Live Stream</Label>
              <Switch checked={form.is_live} onCheckedChange={(v) => setForm({ ...form, is_live: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show in Highlights</Label>
              <Switch checked={form.show_in_highlights} onCheckedChange={(v) => setForm({ ...form, show_in_highlights: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show in Replay</Label>
              <Switch checked={form.show_in_replay} onCheckedChange={(v) => setForm({ ...form, show_in_replay: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Premium Only</Label>
              <Switch checked={form.is_premium} onCheckedChange={(v) => setForm({ ...form, is_premium: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createVideo.isPending || updateVideo.isPending}>
              {(createVideo.isPending || updateVideo.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {editingVideo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>Are you sure you want to delete this video? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVideo.isPending}>
              {deleteVideo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
