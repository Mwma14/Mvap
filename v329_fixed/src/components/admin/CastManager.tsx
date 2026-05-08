import { useState, useRef, useEffect } from 'react';
import { Plus, X, User, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCastMembers } from '@/hooks/useCast';
import type { CastMember } from '@/types/database';

export interface CastEntry {
  name: string;
  character_name: string;
  photo_url: string | null;
  existing_cast_member_id?: string;
}

interface CastManagerProps {
  entries: CastEntry[];
  onChange: (entries: CastEntry[]) => void;
}

export function CastManager({ entries, onChange }: CastManagerProps) {
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<CastMember[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: allCastMembers } = useCastMembers();

  const addEntry = () => {
    onChange([...entries, { name: '', character_name: '', photo_url: null }]);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof CastEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleNameChange = (index: number, value: string) => {
    updateEntry(index, 'name', value);

    if (value.trim().length >= 2 && allCastMembers) {
      const matches = allCastMembers.filter(
        (cm) => cm.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(matches);
      setActiveSearchIndex(index);
    } else {
      setSearchResults([]);
      setActiveSearchIndex(null);
    }
  };

  const selectExistingCast = (index: number, castMember: CastMember) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      name: castMember.name,
      photo_url: castMember.photo_url,
      existing_cast_member_id: castMember.id,
    };
    onChange(updated);
    setSearchResults([]);
    setActiveSearchIndex(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveSearchIndex(null);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoUrlChange = (index: number, url: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], photo_url: url || null };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Cast Members</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Cast
        </Button>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
          No cast members added. Click "Add Cast" to start.
        </p>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {entries.map((entry, index) => (
          <div key={index} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg border border-border">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                {entry.photo_url ? (
                  <img src={entry.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-2 min-w-0 relative">
              {/* Actor Name with auto-suggest */}
              <div className="relative">
                <Input
                  placeholder="Actor name"
                  value={entry.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  onFocus={() => {
                    if (entry.name.trim().length >= 2 && allCastMembers) {
                      const matches = allCastMembers.filter(
                        (cm) => cm.name.toLowerCase().includes(entry.name.toLowerCase())
                      );
                      if (matches.length > 0) {
                        setSearchResults(matches);
                        setActiveSearchIndex(index);
                      }
                    }
                  }}
                  className="bg-background h-8 text-sm"
                />
                {activeSearchIndex === index && searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    {searchResults.map((cm) => (
                      <button
                        key={cm.id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                        onClick={() => selectExistingCast(index, cm)}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {cm.photo_url ? (
                            <img src={cm.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="truncate">{cm.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                placeholder="Character name (optional)"
                value={entry.character_name}
                onChange={(e) => updateEntry(index, 'character_name', e.target.value)}
                className="bg-background h-8 text-sm"
              />

              {/* Photo URL input */}
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Photo URL (optional)"
                  value={entry.photo_url || ''}
                  onChange={(e) => handlePhotoUrlChange(index, e.target.value)}
                  className="bg-background h-7 text-xs"
                />
              </div>
            </div>

            {/* Remove */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8 text-destructive"
              onClick={() => removeEntry(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
