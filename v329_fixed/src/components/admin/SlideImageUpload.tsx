import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SlideImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export default function SlideImageUpload({ imageUrl, onImageChange }: SlideImageUploadProps) {
  const handleRemove = () => {
    onImageChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={imageUrl}
          onChange={(e) => onImageChange(e.target.value)}
          placeholder="Image URL or upload below..."
          className="text-sm flex-1"
        />
        {imageUrl && (
          <Button type="button" variant="ghost" size="icon" onClick={handleRemove} className="shrink-0 h-10 w-10">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Use an external image URL (recommended) to avoid Supabase Storage usage.
      </p>

      {imageUrl && (
        <div className="rounded-lg overflow-hidden border border-border h-32">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
