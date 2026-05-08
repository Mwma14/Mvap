import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useCastMember, useActorFilmography } from '@/hooks/useCast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ActorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: actor, isLoading: actorLoading } = useCastMember(id || '');
  const { data: filmography, isLoading: filmoLoading } = useActorFilmography(id || '');

  const isLoading = actorLoading || filmoLoading;

  const movies = filmography?.filter((f: any) => f.movie?.content_type === 'movie') || [];
  const series = filmography?.filter((f: any) => f.movie?.content_type === 'series') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner message="Loading actor..." />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Actor Not Found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const renderMovieGrid = (items: any[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item: any) => (
        <div
          key={item.id}
          className="cursor-pointer group"
          onClick={() => navigate(`/movie/${item.movie.id}`)}
        >
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
            {item.movie.poster_url ? (
              <img
                src={item.movie.poster_url}
                alt={item.movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Poster
              </div>
            )}
            {/* Rating badge */}
            {item.movie.average_rating > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-medium">
                  {Number(item.movie.average_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-foreground truncate">
            {item.movie.title}
            {item.movie.year && (
              <span className="text-muted-foreground"> ({item.movie.year})</span>
            )}
          </p>
          {item.character_name && (
            <p className="text-xs text-muted-foreground truncate">
              as {item.character_name}
            </p>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <div className="col-span-2 text-center py-8 text-muted-foreground">
          No content found
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      {/* Header */}
      <div className="pt-16 px-4 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-foreground mb-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-4 mb-6">
          {actor.photo_url ? (
            <img
              src={actor.photo_url}
              alt={actor.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary">
              <span className="text-2xl font-bold text-muted-foreground">
                {actor.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{actor.name}</h1>
            <p className="text-sm text-muted-foreground">
              {(filmography || []).length} {(filmography || []).length === 1 ? 'title' : 'titles'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="movies" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="movies">
              Movies ({movies.length})
            </TabsTrigger>
            <TabsTrigger value="series">
              Series ({series.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="movies" className="mt-4">
            {renderMovieGrid(movies)}
          </TabsContent>
          <TabsContent value="series" className="mt-4">
            {renderMovieGrid(series)}
          </TabsContent>
        </Tabs>
      </div>

      <MobileBottomNav />
    </div>
  );
}
