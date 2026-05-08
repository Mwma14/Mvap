import { useState } from 'react';
import { Plus, Pencil, Trash2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDirectChannels, useDirectChannelMutations, DirectChannel } from '@/hooks/useDirectChannels';
import { useToast } from '@/hooks/use-toast';
import { BulkChannelImport } from '@/components/admin/BulkChannelImport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DirectChannelsAdmin() {
  const { data: channels, isLoading } = useDirectChannels();
  const { addChannel, updateChannel, deleteChannel } = useDirectChannelMutations();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DirectChannel | null>(null);
  const [form, setForm] = useState({ name: '', stream_url: '', thumbnail_url: '', category: 'Entertainment' });

  const resetForm = () => {
    setForm({ name: '', stream_url: '', thumbnail_url: '', category: 'Entertainment' });
    setEditing(null);
  };

  const openEdit = (ch: DirectChannel) => {
    setEditing(ch);
    setForm({
      name: ch.name,
      stream_url: ch.stream_url || '',
      thumbnail_url: ch.thumbnail_url || '',
      category: ch.category,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.stream_url.trim()) {
      toast({ title: 'Name and Stream URL are required', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updateChannel.mutateAsync({
          id: editing.id,
          name: form.name,
          stream_url: form.stream_url,
          thumbnail_url: form.thumbnail_url || null,
          category: form.category,
        });
        toast({ title: 'Channel updated' });
      } else {
        await addChannel.mutateAsync({
          name: form.name,
          stream_url: form.stream_url,
          thumbnail_url: form.thumbnail_url || undefined,
          category: form.category,
        });
        toast({ title: 'Channel added' });
      }
      setDialogOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel?')) return;
    try {
      await deleteChannel.mutateAsync(id);
      toast({ title: 'Channel deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (ch: DirectChannel) => {
    await updateChannel.mutateAsync({ id: ch.id, is_active: !ch.is_active });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Direct Channels</h1>
          <p className="text-sm text-muted-foreground">Add .m3u8 or .mp4 stream links directly</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Channel' : 'Add Channel'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Channel name" />
              </div>
              <div>
                <Label>Stream URL *</Label>
                <Input value={form.stream_url} onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))} placeholder="https://example.com/stream.m3u8 or .mp4" />
              </div>
              <div>
                <Label>Logo URL (optional)</Label>
                <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://example.com/logo.png" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Entertainment" />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addChannel.isPending || updateChannel.isPending}>
                {editing ? 'Update' : 'Add'} Channel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Import */}
      <div className="mb-6">
        <BulkChannelImport />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !channels?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tv className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No direct channels yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Channel" to get started</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stream URL</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map(ch => (
                  <TableRow key={ch.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {ch.thumbnail_url && <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded object-contain bg-white" />}
                        {ch.name}
                      </div>
                    </TableCell>
                    <TableCell>{ch.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={ch.stream_url || ''}>
                      {ch.stream_url}
                    </TableCell>
                    <TableCell>
                      <Switch checked={ch.is_active ?? true} onCheckedChange={() => handleToggleActive(ch)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ch)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(ch.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {channels.map(ch => (
              <div key={ch.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {ch.thumbnail_url && <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded object-contain bg-white shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">{ch.category}</p>
                    </div>
                  </div>
                  <Switch checked={ch.is_active ?? true} onCheckedChange={() => handleToggleActive(ch)} />
                </div>
                <p className="text-xs text-muted-foreground truncate" title={ch.stream_url || ''}>{ch.stream_url}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(ch)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive gap-1" onClick={() => handleDelete(ch.id)}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
