import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FadeIn } from '@/components/FadeIn';
import { History as HistoryIcon, Trash2, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useWatchHistory, useClearHistory, useRemoveFromHistory } from '@/hooks/useWatchHistory';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function History() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: history, isLoading } = useWatchHistory(50);
  const clearHistory = useClearHistory();
  const removeFromHistory = useRemoveFromHistory();

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      <Navbar />

      <div className="pt-24 px-4 md:px-8 lg:px-16 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Watch History</h1>
            </div>

            {history && history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Watch History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all items from your watch history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearHistory.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Content */}
          {isLoading || authLoading ? (
            <LoadingSpinner message="Loading history..." />
          ) : !history || history.length === 0 ? (
            <FadeIn>
              <div className="text-center py-20">
                <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Watch History</h2>
                <p className="text-muted-foreground mb-6">
                  Movies you watch will appear here
                </p>
                <Button onClick={() => navigate('/')}>Browse Movies</Button>
              </div>
            </FadeIn>
          ) : (
            <FadeIn>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors group"
                >
                  {/* Poster */}
                  <button
                    onClick={() => navigate(`/movie/${item.movie_id}`)}
                    className="relative flex-shrink-0 w-24 h-36 overflow-hidden rounded"
                  >
                    {item.movie.poster_url ? (
                      <img
                        src={item.movie.poster_url}
                        alt={item.movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">{item.movie.title[0]}</span>
                      </div>
                    )}
                    
                    {/* Progress bar */}
                    {item.duration && item.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min((item.progress / item.duration) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{item.movie.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.movie.year} • {item.movie.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Watched {formatDistanceToNow(new Date(item.last_watched_at), { addSuffix: true })}
                    </p>
                    {item.duration && item.progress >= item.duration * 0.9 && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-cg-success/20 text-cg-success rounded">
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromHistory.mutate(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors self-start opacity-0 group-hover:opacity-100"
                    aria-label="Remove from history"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            </FadeIn>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
