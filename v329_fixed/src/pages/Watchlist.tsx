import { ArrowLeft, Bookmark, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MovieCard } from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist, useRemoveFromWatchlist } from '@/hooks/useMovies';
import { useToast } from '@/hooks/use-toast';

const Watchlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: watchlist, isLoading } = useWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();

  const handleRemove = async (movieId: string, movieTitle: string) => {
    try {
      await removeFromWatchlist.mutateAsync(movieId);
      toast({
        title: "Removed from Watchlist",
        description: `${movieTitle} has been removed from your watchlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center mobile-nav-spacing">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view your watchlist</p>
          <Link to="/auth" className="text-primary hover:underline">Sign In</Link>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />
      
      <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Watchlist</h1>
              <p className="text-sm text-muted-foreground">
                {watchlist?.length || 0} movie{watchlist?.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Loading watchlist..." />
        ) : watchlist && watchlist.length > 0 ? (
          <FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.map((item) => (
              <div key={item.id} className="relative group">
                <MovieCard
                  movie={item.movie}
                  onClick={() => navigate(`/movie/${item.movie.id}`)}
                />
                {/* Remove button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.movie.id, item.movie.title);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          </FadeIn>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies you want to watch later
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Movies
            </Link>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Watchlist;
