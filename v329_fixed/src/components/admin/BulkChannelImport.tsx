import { useState, useRef } from 'react';
import { Upload, FileText, X, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDirectChannelMutations } from '@/hooks/useDirectChannels';

interface ParsedChannel {
  name: string;
  stream_url: string;
  thumbnail_url?: string;
}

export function BulkChannelImport() {
  const { toast } = useToast();
  const { addChannel } = useDirectChannelMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('Entertainment');
  const [parsed, setParsed] = useState<ParsedChannel[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n');
      const channels: ParsedChannel[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const parts = trimmed.split('|').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          channels.push({
            name: parts[0],
            stream_url: parts[1],
            thumbnail_url: parts[2] || undefined,
          });
        }
      }

      if (channels.length === 0) {
        toast({ title: 'No valid channels found', description: 'Format: Name | URL | Logo (optional)', variant: 'destructive' });
      }
      setParsed(channels);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    setResult(null);
    let success = 0;
    let failed = 0;

    for (const ch of parsed) {
      try {
        await addChannel.mutateAsync({
          name: ch.name,
          stream_url: ch.stream_url,
          thumbnail_url: ch.thumbnail_url,
          category,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setResult({ success, failed });
    setImporting(false);
    if (success > 0) {
      toast({ title: `Imported ${success} channel${success > 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}` });
    }
    setParsed([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    setParsed([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Bulk Import (.txt)</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload a <code>.txt</code> file with one channel per line:<br />
        <code>Name | URL</code> or <code>Name | URL | Logo URL</code><br />
        Lines starting with <code>#</code> are ignored.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label className="text-xs">Category for imported channels</Label>
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Entertainment"
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Select .txt file</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileSelect}
            className="mt-1"
          />
        </div>
      </div>

      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{parsed.length} channels parsed</p>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {parsed.map((ch, i) => (
              <div key={i} className="px-3 py-2 text-xs flex items-center gap-2">
                <span className="font-medium text-foreground truncate flex-1">{ch.name}</span>
                <span className="text-muted-foreground truncate max-w-[200px]">{ch.stream_url}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : `Import ${parsed.length} Channels`}
          </Button>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-sm">
          {result.success > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <Check className="w-4 h-4" /> {result.success} imported
            </span>
          )}
          {result.failed > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" /> {result.failed} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
