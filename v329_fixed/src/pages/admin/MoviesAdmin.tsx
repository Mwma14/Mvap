import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Crown, Search, X, Film, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import { useCategories } from '@/hooks/useCategories';
import { useSaveMovieCast } from '@/hooks/useCast';
import { CastManager, type CastEntry } from '@/components/admin/CastManager';
import type { Movie, MovieInsert } from '@/types/database';
import { toast } from 'sonner';

const defaultMovie: MovieInsert = {
  title: '',
  description: '',
  director: '',
  actors: [],
  year: new Date().getFullYear(),
  category: ['Action'],
  resolution: '1080p',
  file_size: '',
  poster_url: '',
  backdrop_url: '',
  stream_url: '',
  telegram_url: '',
  mega_url: '',
  download_url: '',
  mx_player_url: '',
  is_premium: false,
  is_featured: false,
  content_type: 'movie',
};


export default function MoviesAdmin() {
  const navigate = useNavigate();
  const { data: movies, isLoading } = useMovies();
  const { data: categories } = useCategories();
  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();
  const saveMovieCast = useSaveMovieCast();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieInsert>(defaultMovie);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [castEntries, setCastEntries] = useState<CastEntry[]>([]);

  // Fetch poster thumbnail from Streamable without storing anything in Supabase Storage.
  // Streamable provides an oEmbed endpoint with a thumbnail_url.
  const fetchStreamableThumbnail = async (videoUrl: string): Promise<string | null> => {
    if (!videoUrl || !videoUrl.includes('streamable.com')) return null;
    try {
      const oembedUrl = `https://api.streamable.com/oembed.json?url=${encodeURIComponent(videoUrl)}`;
      const res = await fetch(oembedUrl);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.thumbnail_url || null;
    } catch {
      return null;
    }
  };

  const filteredMovies = movies?.filter(
    (movie) =>
      movie.title.toLowerCase().includes(search.toLowerCase()) ||
      movie.category.some(cat => cat.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData(defaultMovie);
    setCastEntries([]);
    setShowModal(true);
  };

  const openEditModal = async (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      director: movie.director || '',
      actors: movie.actors || [],
      year: movie.year || new Date().getFullYear(),
      category: movie.category,
      resolution: movie.resolution || '1080p',
      file_size: movie.file_size || '',
      poster_url: movie.poster_url || '',
      backdrop_url: movie.backdrop_url || '',
      stream_url: movie.stream_url || '',
      telegram_url: movie.telegram_url || '',
      mega_url: movie.mega_url || '',
      download_url: (movie as any).download_url || '',
      mx_player_url: (movie as any).mx_player_url || '',
      is_premium: movie.is_premium,
      is_featured: movie.is_featured,
      content_type: movie.content_type || 'movie',
    });

    // Load existing cast from movie_cast table
    const { data: existingCast } = await supabase
      .from('movie_cast')
      .select('*, cast_members(*)')
      .eq('movie_id', movie.id)
      .order('display_order');

    if (existingCast && existingCast.length > 0) {
      setCastEntries(
        existingCast.map((mc: any) => ({
          name: mc.cast_members?.name || '',
          character_name: mc.character_name || '',
          photo_url: mc.cast_members?.photo_url || null,
          existing_cast_member_id: mc.cast_member_id,
        }))
      );
    } else {
      // Fall back to old actors array
      setCastEntries(
        (movie.actors || []).map((name: string) => ({
          name,
          character_name: '',
          photo_url: null,
        }))
      );
    }

    setShowModal(true);
  };

  const clearImage = (type: 'poster' | 'backdrop') => {
    if (type === 'poster') {
      setFormData(prev => ({ ...prev, poster_url: '' }));
    } else {
      setFormData(prev => ({ ...prev, backdrop_url: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const movieData = {
      ...formData,
      actors: castEntries.map((e) => e.name).filter(Boolean),
    };

    try {
      let movieId: string;
      if (editingMovie) {
        await updateMovie.mutateAsync({ id: editingMovie.id, ...movieData });
        movieId = editingMovie.id;
        toast.success('Movie updated successfully');
      } else {
        const newMovie = await createMovie.mutateAsync(movieData);
        movieId = newMovie.id;
        toast.success('Movie created successfully');
      }

      // Save cast entries to movie_cast table
      if (movieId && castEntries.filter(e => e.name.trim()).length > 0) {
        await saveMovieCast.mutateAsync({
          movieId,
          castEntries: castEntries.filter(e => e.name.trim()),
        });
      }

      setShowModal(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save movie');
    }
  };

  const handleDelete = async () => {
    if (!movieToDelete) return;

    try {
      await deleteMovie.mutateAsync(movieToDelete.id);
      toast.success('Movie deleted successfully');
      setDeleteDialogOpen(false);
      setMovieToDelete(null);
    } catch (error) {
      toast.error('Failed to delete movie');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Movies</h1>
        <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Movie
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted"
        />
      </div>

      {/* Movies List - Card layout on mobile, Table on desktop */}
      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredMovies && filteredMovies.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-border">
                {filteredMovies.map((movie) => (
                  <div key={movie.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {movie.poster_url && (
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-16 h-24 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{movie.title}</h3>
                        <p className="text-xs text-muted-foreground">{movie.resolution} • {movie.year}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            movie.content_type === 'series' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {movie.content_type === 'series' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                            {movie.content_type === 'series' ? 'Series' : 'Movie'}
                          </span>
                          {movie.is_premium && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cg-gold/20 text-cg-gold">
                              <Crown className="w-3 h-3" /> Premium
                            </span>
                          )}
                          {movie.is_featured && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {movie.content_type === 'series' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/series/${movie.id}`)}
                          className="flex-1"
                        >
                          Episodes
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(movie)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMovieToDelete(movie);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovies.map((movie) => (
                      <TableRow key={movie.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {movie.poster_url && (
                              <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-10 h-14 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="truncate max-w-[200px]">{movie.title}</div>
                              <div className="text-xs text-muted-foreground">{movie.resolution}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            movie.content_type === 'series' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {movie.content_type === 'series' ? (
                              <><Tv className="w-3 h-3" /> Series</>
                            ) : (
                              <><Film className="w-3 h-3" /> Movie</>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block max-w-[150px]">{movie.category.join(', ')}</span>
                        </TableCell>
                        <TableCell>{movie.year}</TableCell>
                        <TableCell>
                          {movie.is_premium && (
                            <Crown className="w-4 h-4 text-cg-gold" />
                          )}
                        </TableCell>
                        <TableCell>
                          {movie.is_featured && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              Featured
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {movie.content_type === 'series' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/series/${movie.id}`)}
                              >
                                Episodes
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(movie)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setMovieToDelete(movie);
                                setDeleteDialogOpen(true);
                              }}
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
              No movies found. Add your first movie!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="admin-fullscreen-dialog max-w-2xl !flex !flex-col overflow-hidden glass h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingMovie ? 'Edit Movie' : 'Add New Movie'}
            </DialogTitle>
          </DialogHeader>

          <form id="movie-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 mt-4 pb-4 min-h-0">
            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.content_type === 'movie' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-muted'
                }`}>
                  <input
                    type="radio"
                    name="content_type"
                    value="movie"
                    checked={formData.content_type === 'movie'}
                    onChange={() => setFormData({ ...formData, content_type: 'movie' })}
                    className="sr-only"
                  />
                  <Film className="w-4 h-4" />
                  <span className="font-medium">Movie</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.content_type === 'series' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:bg-muted'
                }`}>
                  <input
                    type="radio"
                    name="content_type"
                    value="series"
                    checked={formData.content_type === 'series'}
                    onChange={() => setFormData({ ...formData, content_type: 'series' })}
                    className="sr-only"
                  />
                  <Tv className="w-4 h-4" />
                  <span className="font-medium">Series</span>
                </label>
              </div>
              {formData.content_type === 'series' && (
                <p className="text-xs text-muted-foreground">
                  After creating, use the "Episodes" button to add seasons and episodes.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md border border-border min-h-[80px]">
                  {categories?.map((cat) => {
                    const isSelected = formData.category?.includes(cat.name);
                    return (
                      <label
                        key={cat.id}
                        className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = formData.category || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, category: [...current, cat.name] });
                            } else {
                              setFormData({ ...formData, category: current.filter(c => c !== cat.name) });
                            }
                          }}
                        />
                        {cat.name}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Select one or more categories</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: parseInt(e.target.value) || null,
                    })
                  }
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <select
                  id="resolution"
                  value={formData.resolution || '1080p'}
                  onChange={(e) =>
                    setFormData({ ...formData, resolution: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-muted border border-border"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K">4K</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="director">Director</Label>
                <Input
                  id="director"
                  value={formData.director || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, director: e.target.value })
                  }
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_size">File Size</Label>
                <Input
                  id="file_size"
                  value={formData.file_size || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, file_size: e.target.value })
                  }
                  placeholder="e.g., 2.5 GB"
                  className="bg-muted"
                />
              </div>
            </div>

            <CastManager entries={castEntries} onChange={setCastEntries} />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-muted"
                rows={3}
              />
            </div>

            {/* Image Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Poster Upload */}
              <div className="space-y-2">
                <Label>Poster Image</Label>
                <div className="space-y-2">
                  {formData.poster_url ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.poster_url}
                        alt="Poster preview"
                        className="w-24 h-36 object-cover rounded border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={() => clearImage('poster')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Input
                      id="poster_url"
                      value={formData.poster_url || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, poster_url: e.target.value })
                      }
                      placeholder="Paste poster image URL (no Supabase storage)..."
                      className="bg-muted text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const thumb = await fetchStreamableThumbnail(formData.stream_url || '');
                        if (thumb) {
                          setFormData(prev => ({ ...prev, poster_url: thumb }));
                          toast.success('Poster set from Streamable thumbnail');
                        } else {
                          toast.error('Streamable thumbnail not found (check Stream URL)');
                        }
                      }}
                      className="shrink-0"
                    >
                      Streamable
                    </Button>
                  </div>
                </div>
              </div>

              {/* Backdrop Upload */}
              <div className="space-y-2">
                <Label>Backdrop Image</Label>
                <div className="space-y-2">
                  {formData.backdrop_url ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.backdrop_url}
                        alt="Backdrop preview"
                        className="w-36 h-20 object-cover rounded border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={() => clearImage('backdrop')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : null}
                  <Input
                    id="backdrop_url"
                    value={formData.backdrop_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, backdrop_url: e.target.value })
                    }
                    placeholder="Paste backdrop image URL (no Supabase storage)..."
                    className="bg-muted text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Other URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="stream_url">Stream URL</Label>
                <Input
                  id="stream_url"
                  value={formData.stream_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, stream_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_url">Telegram URL</Label>
                <Input
                  id="telegram_url"
                  value={formData.telegram_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, telegram_url: e.target.value })
                  }
                  placeholder="https://t.me/..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mega_url">MEGA URL</Label>
                <Input
                  id="mega_url"
                  value={formData.mega_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, mega_url: e.target.value })
                  }
                  placeholder="https://mega.nz/..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="download_url">Download Link</Label>
                <Input
                  id="download_url"
                  value={formData.download_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, download_url: e.target.value })
                  }
                  placeholder="https://download-link..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mx_player_url">External Server URL</Label>
                <Input
                  id="mx_player_url"
                  value={formData.mx_player_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, mx_player_url: e.target.value })
                  }
                  placeholder="e.g. https://av-f2l-bot.avbotz26.workers.dev/watch/..."
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Watch page URL from external server. Will be proxied and played in-app.</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_premium: checked })
                  }
                />
                <Label htmlFor="is_premium">Premium Content</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label htmlFor="is_featured">Featured on Home</Label>
              </div>
            </div>

          </form>

          <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-2 border-t border-border bg-background">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="movie-form"
              disabled={createMovie.isPending || updateMovie.isPending}
              className="w-full sm:w-auto"
            >
              {createMovie.isPending || updateMovie.isPending
                ? 'Saving...'
                : editingMovie
                ? 'Update Movie'
                : 'Create Movie'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{movieToDelete?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
