import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ParsedMovie {
  title: string;
  description?: string;
  director?: string;
  actors?: string;
  year?: string;
  category?: string;
  resolution?: string;
  file_size?: string;
  poster_url?: string;
  backdrop_url?: string;
  stream_url?: string;
  telegram_url?: string;
  mega_url?: string;
  is_premium?: string;
  is_featured?: string;
  content_type?: string;
}

interface ImportResult {
  success: boolean;
  title: string;
  error?: string;
}

export function BulkImport() {
  const [parsedData, setParsedData] = useState<ParsedMovie[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCSV = (text: string): ParsedMovie[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const movies: ParsedMovie[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const movie: Record<string, string> = {};
      headers.forEach((header, index) => {
        movie[header] = values[index]?.trim() || '';
      });

      if (movie.title) {
        movies.push(movie as unknown as ParsedMovie);
      }
    }

    return movies;
  };

  // Handle CSV values with quotes and commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResults([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const movies = parseCSV(text);
      setParsedData(movies);

      if (movies.length === 0) {
        toast({
          title: 'Invalid File',
          description: 'No valid movie data found in the CSV file.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'File Parsed',
          description: `Found ${movies.length} movies ready to import.`,
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const importMovies = useMutation({
    mutationFn: async (movies: ParsedMovie[]) => {
      setIsImporting(true);
      const results: ImportResult[] = [];

      for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        setProgress(((i + 1) / movies.length) * 100);

        try {
          const { error } = await supabaseAdmin.from('movies').insert({
            title: movie.title,
            description: movie.description || null,
            director: movie.director || null,
            actors: movie.actors ? movie.actors.split('|').map(a => a.trim()) : [],
            year: movie.year ? parseInt(movie.year) : null,
            category: movie.category ? movie.category.split('|').map(c => c.trim()) : ['Action'],
            resolution: movie.resolution || '1080p',
            file_size: movie.file_size || null,
            poster_url: movie.poster_url || null,
            backdrop_url: movie.backdrop_url || null,
            stream_url: movie.stream_url || null,
            telegram_url: movie.telegram_url || null,
            mega_url: movie.mega_url || null,
            is_premium: movie.is_premium?.toLowerCase() === 'true',
            is_featured: movie.is_featured?.toLowerCase() === 'true',
            content_type: movie.content_type || 'movie',
          } as any);

          if (error) {
            results.push({ success: false, title: movie.title, error: error.message });
          } else {
            results.push({ success: true, title: movie.title });
          }
        } catch (error) {
          results.push({ success: false, title: movie.title, error: String(error) });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setIsImporting(false);
      queryClient.invalidateQueries({ queryKey: ['movies'] });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} movies${failCount > 0 ? `. ${failCount} failed.` : '.'}`,
        variant: failCount > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error) => {
      setIsImporting(false);
      toast({
        title: 'Import Failed',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  const handleImport = () => {
    if (parsedData.length === 0) return;
    importMovies.mutate(parsedData);
  };

  const clearData = () => {
    setParsedData([]);
    setFileName('');
    setImportResults([]);
    setProgress(0);
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-cg-gold" />
          Bulk Import Movies
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import multiple movies at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        {parsedData.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Upload a CSV file with movie data
            </p>
            <div className="text-xs text-muted-foreground mb-4">
              Required columns: <strong>title</strong><br />
              Optional: description, director, actors (pipe-separated), year, category (pipe-separated for multiple), resolution, 
              file_size, poster_url, backdrop_url, stream_url, telegram_url, mega_url, is_premium, is_featured, content_type
            </div>
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button asChild>
                <span className="cursor-pointer gap-2">
                  <Upload className="w-4 h-4" />
                  Choose CSV File
                </span>
              </Button>
            </label>
          </div>
        ) : (
          <>
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-cg-gold" />
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">{parsedData.length} movies found</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearData}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      {importResults.length > 0 && <TableHead>Status</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 10).map((movie, index) => {
                      const result = importResults[index];
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{movie.title}</TableCell>
                          <TableCell>{movie.year || '-'}</TableCell>
                          <TableCell>{movie.category || 'Action'}</TableCell>
                          <TableCell>{movie.content_type || 'movie'}</TableCell>
                          {importResults.length > 0 && (
                            <TableCell>
                              {result ? (
                                result.success ? (
                                  <Check className="w-4 h-4 text-cg-success" />
                                ) : (
                                  <div className="flex items-center gap-1 text-destructive">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs">{result.error}</span>
                                  </div>
                                )
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 10 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t">
                  And {parsedData.length - 10} more...
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={isImporting || parsedData.length === 0}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Import {parsedData.length} Movies
              </Button>
              <Button variant="outline" onClick={clearData} disabled={isImporting}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
