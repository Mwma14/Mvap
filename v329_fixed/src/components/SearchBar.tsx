import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/types/database';

interface SearchBarProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export function SearchBar({ movies, onMovieClick }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = movies.filter((movie) =>
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 8));
    } else {
      setResults([]);
    }
  }, [query, movies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMovieSelect = (movie: Movie) => {
    onMovieClick(movie);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {isOpen ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              className="w-[200px] md:w-[300px] pl-9 pr-8 bg-background/95 backdrop-blur-sm border-border"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <Search className="w-5 h-5" />
        </Button>
      )}

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[350px] bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleMovieSelect(movie)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
              >
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">{movie.title[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">{movie.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {movie.year && <span>{movie.year}</span>}
                    {movie.category && <span>• {movie.category}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[350px] bg-card border border-border rounded-lg shadow-2xl p-4 z-50">
          <p className="text-muted-foreground text-sm text-center">No movies found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
