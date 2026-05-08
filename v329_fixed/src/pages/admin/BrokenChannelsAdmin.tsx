import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { Trash2, Search, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BrokenChannel {
  id: string;
  channel_url: string;
  channel_name: string | null;
  created_at: string;
}

export default function BrokenChannelsAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['broken-channels-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broken_channels')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BrokenChannel[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('broken_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broken-channels-admin'] });
      queryClient.invalidateQueries({ queryKey: ['broken-channels'] });
      toast.success('Channel unblocked');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseAdmin.from('broken_channels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broken-channels-admin'] });
      queryClient.invalidateQueries({ queryKey: ['broken-channels'] });
      toast.success('All channels unblocked');
    },
  });

  const filtered = search.trim()
    ? channels.filter(c =>
        (c.channel_name || '').toLowerCase().includes(search.toLowerCase()) ||
        c.channel_url.toLowerCase().includes(search.toLowerCase())
      )
    : channels;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broken Channels</h1>
          <p className="text-sm text-muted-foreground">
            {channels.length} blocked channel{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        {channels.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Unblock all channels? They will reappear for all users.')) {
                deleteAllMutation.mutate();
              }
            }}
            disabled={deleteAllMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Unblock All
          </Button>
        )}
      </div>

      {channels.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search broken channels..."
            className="pl-10"
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : channels.length === 0 ? (
        <div className="text-center py-16">
          <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No broken channels reported</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(channel => (
            <div
              key={channel.id}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {channel.channel_name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{channel.channel_url}</p>
                <p className="text-xs text-muted-foreground">
                  Reported: {new Date(channel.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(channel.id)}
                disabled={deleteMutation.isPending}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}