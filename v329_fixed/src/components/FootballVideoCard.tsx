import { Play, Trophy, Wifi, Crown, Download } from 'lucide-react';
import { proxyImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FootballVideo } from '@/hooks/useFootball';

interface FootballVideoCardProps {
  video: FootballVideo;
  onPlay: (v: FootballVideo) => void;
  onDownload: (v: FootballVideo) => void;
}

export function FootballVideoCard({ video, onPlay, onDownload }: FootballVideoCardProps) {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-border group">
      <div
        className="relative aspect-video bg-muted cursor-pointer"
        onClick={() => onPlay(video)}
      >
        {video.thumbnail_url ? (
          <img src={proxyImageUrl(video.thumbnail_url)} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white" fill="white" />
        </div>
        <div className="absolute top-2 left-2 flex gap-1">
          {video.is_live && (
            <Badge variant="destructive" className="text-[10px] h-5">
              <Wifi className="w-3 h-3 mr-0.5" />
              LIVE
            </Badge>
          )}
          {video.is_premium && (
            <Badge className="text-[10px] h-5 bg-cg-gold text-black">
              <Crown className="w-3 h-3 mr-0.5" />
              Premium
            </Badge>
          )}
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium line-clamp-2">{video.title}</p>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-[10px]">{video.category}</Badge>
          {video.download_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(video);
              }}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
