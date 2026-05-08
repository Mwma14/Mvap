import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Search, Link2, Unlink, Trash2, FileVideo, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useMovies } from '@/hooks/useMovies';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Badge } from '@/components/ui/badge';

// FIXED: Use hardcoded Supabase project URL (same as client.ts).
// import.meta.env.VITE_SUPABASE_URL is undefined in production APK builds
// because no .env file is bundled, causing stream URLs to be "undefined/functions/..."
const SUPABASE_PROJECT_URL = "https://twwudowfdvxsepwpnetr.supabase.co";

interface TelegramFile {
  id: string;
  file_id: string;
  file_unique_id: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  message_id: number | null;
  channel_id: string | null;
  movie_id: string | null;
  created_at: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function TelegramFilesAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<TelegramFile | null>(null);
  const [movieSearch, setMovieSearch] = useState('');

  const { data: movies } = useMovies();
  const { data: siteSettings } = useSiteSettings();
  const hasCustomBotApi = !!(siteSettings?.telegramBotApiUrl?.trim());

  const { data: files, isLoading } = useQuery({
    queryKey: ['telegram-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_files' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TelegramFile[];
    },
  });

  const linkMovie = useMutation({
    mutationFn: async ({ fileId, movieId }: { fileId: string; movieId: string }) => {
      const streamUrl = `${SUPABASE_PROJECT_URL}/functions/v1/telegram-stream?file_id=${
        files?.find(f => f.id === fileId)?.file_id
      }`;

      // Update telegram_files to link to movie
      const { error: linkError } = await supabase
        .from('telegram_files' as any)
        .update({ movie_id: movieId } as any)
        .eq('id', fileId);
      if (linkError) throw linkError;

      // Update movie's stream_url to point to telegram-stream
      const { error: movieError } = await supabase
        .from('movies')
        .update({ stream_url: streamUrl })
        .eq('id', movieId);
      if (movieError) throw movieError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-files'] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('File linked to movie successfully');
      setLinkModalOpen(false);
      setSelectedFile(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const unlinkMovie = useMutation({
    mutationFn: async (fileId: string) => {
      const file = files?.find(f => f.id === fileId);
      if (file?.movie_id) {
        await supabaseAdmin.from('movies').update({ stream_url: null }).eq('id', file.movie_id);
      }
      const { error } = await supabase
        .from('telegram_files' as any)
        .update({ movie_id: null } as any)
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-files'] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('File unlinked');
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabaseAdmin.from('telegram_files' as any).delete().eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-files'] });
      toast.success('File deleted');
    },
  });

  const filteredFiles = files?.filter(
    f => !search || f.file_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovies = movies?.filter(
    m => !movieSearch || m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );

  const getLinkedMovieName = (movieId: string | null) => {
    if (!movieId) return null;
    return movies?.find(m => m.id === movieId)?.title || 'Unknown';
  };

  const webhookUrl = `${SUPABASE_PROJECT_URL}/functions/v1/telegram-bot`;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Telegram Files</h1>
        <Badge variant={hasCustomBotApi ? 'default' : 'secondary'} className="text-xs w-fit">
          {hasCustomBotApi ? '✅ Custom Bot API Server' : '⚠️ Default API (20MB limit)'}
        </Badge>
      </div>

      {/* Webhook URL info */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-1">Bot Webhook URL</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
              {webhookUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast.success('Copied!');
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Set this as your Telegram bot webhook: <code className="text-xs">
              https://api.telegram.org/bot{'<TOKEN>'}/setWebhook?url={encodeURIComponent(webhookUrl)}
            </code>
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted"
        />
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredFiles && filteredFiles.length > 0 ? (
            <>
              {/* Mobile layout */}
              <div className="md:hidden divide-y divide-border">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <FileVideo className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.file_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(file.file_size)} • {file.mime_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        {file.movie_id && (
                          <p className="text-xs text-primary mt-1">
                            🎬 {getLinkedMovieName(file.movie_id)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.movie_id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unlinkMovie.mutate(file.id)}
                          className="flex-1"
                        >
                          <Unlink className="w-3 h-3 mr-1" /> Unlink
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedFile(file); setLinkModalOpen(true); }}
                          className="flex-1"
                        >
                          <Link2 className="w-3 h-3 mr-1" /> Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFile.mutate(file.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Movie</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileVideo className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[200px]">{file.file_name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatSize(file.file_size)}</TableCell>
                        <TableCell className="text-xs">{file.mime_type}</TableCell>
                        <TableCell>
                          {file.movie_id ? (
                            <span className="text-primary text-sm">
                              {getLinkedMovieName(file.movie_id)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(file.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {file.movie_id ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => unlinkMovie.mutate(file.id)}
                                title="Unlink"
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedFile(file);
                                  setLinkModalOpen(true);
                                }}
                                title="Link to movie"
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFile.mutate(file.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No Telegram files yet. Send a video to your bot to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Movie Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link to Movie</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Linking: <strong>{selectedFile?.file_name}</strong>
          </p>
          <Input
            placeholder="Search movies..."
            value={movieSearch}
            onChange={(e) => setMovieSearch(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredMovies?.map((movie) => (
              <button
                key={movie.id}
                onClick={() => {
                  if (selectedFile) {
                    linkMovie.mutate({ fileId: selectedFile.id, movieId: movie.id });
                  }
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                {movie.poster_url && (
                  <img src={movie.poster_url} className="w-8 h-12 rounded object-cover" alt="" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">{movie.year}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
