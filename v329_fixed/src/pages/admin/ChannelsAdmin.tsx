import { useState, useEffect, useRef } from 'react';
import { Tv, Plus, Trash2, Globe, Save, Loader2, ExternalLink, Pencil, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings, useUpdateSiteSettings, LiveTvSource } from '@/hooks/useSiteSettings';

function parseCategoryFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 3) {
      const type = segments[segments.length - 3];
      const country = segments[segments.length - 2];
      const formattedType = type.replace(/([a-z])([A-Z])/g, '$1 $2');
      return `${formattedType} - ${country}`;
    }
    if (segments.length >= 2) {
      const type = segments[segments.length - 2];
      return type.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    return 'Other';
  } catch {
    return 'Invalid URL';
  }
}

export default function ChannelsAdmin() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const [sources, setSources] = useState<LiveTvSource[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (settings?.liveTvSources && !initialLoadDone.current) {
      const s = settings.liveTvSources;
      setSources(Array.isArray(s) ? s : []);
      initialLoadDone.current = true;
    }
  }, [settings]);

  const [newSourceLabel, setNewSourceLabel] = useState('');

  const handleAdd = () => {
    if (!newSourceUrl.trim()) return;
    const newSource: LiveTvSource = { url: newSourceUrl.trim(), enabled: true };
    if (newSourceLabel.trim()) newSource.label = newSourceLabel.trim();
    setSources([...sources, newSource]);
    setNewSourceUrl('');
    setNewSourceLabel('');
  };

  const handleRemove = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleToggle = (index: number) => {
    setSources(sources.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditUrl(sources[index].url);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editUrl.trim()) return;
    setSources(sources.map((s, i) => i === editingIndex ? { ...s, url: editUrl.trim() } : s));
    setEditingIndex(null);
    setEditUrl('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditUrl('');
  };

  const handleSave = () => {
    updateSettings.mutate({ key: 'live_tv_sources', value: sources });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalChannelSources = sources.length;
  const enabledSources = sources.filter(s => s.enabled).length;

  return (
    <div className="w-full box-border">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 flex items-center gap-2">
        <Tv className="w-5 h-5 sm:w-8 sm:h-8" />
        Live TV Channels
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
      <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Sources</p>
            <p className="text-2xl font-bold">{totalChannelSources}</p>
          </CardContent>
        </Card>
      <Card className="bg-card border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active Sources</p>
            <p className="text-2xl font-bold text-primary">{enabledSources}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add New Source */}
      <Card className="bg-card border border-border mb-6">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Source
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Source URL (JSON or M3U)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://...LiveTV.json or playlist.m3u8"
                className="text-sm flex-1 min-w-0"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Label (optional - custom category name)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
                placeholder="e.g. Myanmar TV, Sports HD"
                className="text-sm flex-1 min-w-0"
              />
              <Button size="sm" onClick={handleAdd} disabled={!newSourceUrl.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          {newSourceUrl.trim() && (
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {newSourceLabel.trim() ? `Label: ${newSourceLabel.trim()}` : newSourceUrl.trim().toLowerCase().includes('.m3u') ? 'M3U Playlist' : `Auto-category: ${parseCategoryFromUrl(newSourceUrl)}`}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Source List */}
      <Card className="bg-card border border-border">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Channel Sources ({sources.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <Tv className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sources added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a JSON or M3U playlist URL above to get started</p>
            </div>
          ) : (
            sources.map((source, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge variant={source.enabled ? 'default' : 'secondary'} className="shrink-0 text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {source.label || (source.url.toLowerCase().includes('.m3u') ? 'M3U Playlist' : parseCategoryFromUrl(source.url))}
                    </Badge>
                    <Badge variant={source.enabled ? 'outline' : 'secondary'} className="text-xs">
                      {source.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => handleToggle(index)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(index)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {editingIndex === index ? (
                  <div className="flex gap-2">
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="text-xs flex-1 min-w-0"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1" title={source.url}>{source.url}</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}

          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full"
            size="sm"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
