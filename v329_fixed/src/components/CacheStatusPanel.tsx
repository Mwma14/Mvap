import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPermanentStoreStats, clearAllPermanentStore, invalidateStoreByPrefix, type StoreEntryInfo } from '@/lib/cache';
import { useQueryClient } from '@tanstack/react-query';

interface CacheStatusPanelProps {
  onClose?: () => void;
}

function savedAgoLabel(savedAt: number): string {
  const mins = Math.round((Date.now() - savedAt) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CacheStatusPanel({ onClose }: CacheStatusPanelProps) {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState(getPermanentStoreStats());
  const [expanded, setExpanded] = useState(false);

  const refresh = () => setStats(getPermanentStoreStats());

  useEffect(() => { refresh(); }, []);

  const usedPercent = Math.min(100, Math.round((stats.totalSizeKB / 4096) * 100));

  const handleClearAll = () => {
    clearAllPermanentStore();
    queryClient.clear();
    refresh();
  };

  const handleClearMovies = () => {
    invalidateStoreByPrefix('movies');
    invalidateStoreByPrefix('movie-detail');
    invalidateStoreByPrefix('trending');
    invalidateStoreByPrefix('related-movies');
    queryClient.invalidateQueries({ queryKey: ['movies'] });
    queryClient.invalidateQueries({ queryKey: ['trending-movies'] });
    refresh();
  };

  const handleClearChannels = () => {
    invalidateStoreByPrefix('direct-channels');
    queryClient.invalidateQueries({ queryKey: ['direct-channels'] });
    queryClient.invalidateQueries({ queryKey: ['direct-channels-active'] });
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-t-2xl p-5 pb-8 shadow-2xl"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-white font-semibold text-base">Phone Local Store</span>
              <p className="text-xs text-gray-400">Data saved permanently on your phone</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="text-gray-400 hover:text-white transition-colors p-1">
              <RefreshCw className="w-4 h-4" />
            </button>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Saved Items</p>
            <p className="text-white text-xl font-bold">{stats.totalEntries}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-1">Storage Size</p>
            <p className="text-white text-xl font-bold">{stats.totalSizeKB} KB</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Storage used</span>
            <span>{usedPercent}% of 4 MB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${usedPercent > 80 ? 'bg-red-500' : usedPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-3 mb-4 text-xs text-blue-300 space-y-1">
          <p className="font-semibold">📱 Permanent Local Storage</p>
          <p>Movies, channels, and all content are saved permanently on your phone. No internet needed for browsing.</p>
          <p>Data only refreshes when the admin adds, updates, or deletes content.</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
            onClick={handleClearMovies}
          >
            Clear Movies
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
            onClick={handleClearChannels}
          >
            Clear Channels
          </Button>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full text-xs flex items-center gap-2"
          onClick={handleClearAll}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Local Data (Force Re-fetch)
        </Button>

        {/* Expandable entry list */}
        {stats.entries.length > 0 && (
          <div className="mt-3">
            <button
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide' : 'Show'} saved items ({stats.entries.length})
            </button>
            {expanded && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {stats.entries.map((entry: StoreEntryInfo) => (
                  <div key={entry.key} className="flex items-center justify-between text-xs bg-gray-800 rounded-lg px-3 py-1.5">
                    <span className="text-gray-300 truncate max-w-[60%]">{entry.key}</span>
                    <div className="flex items-center gap-2 text-gray-500 shrink-0">
                      <span>{entry.sizeKB} KB</span>
                      <span className="text-green-400">{savedAgoLabel(entry.savedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
