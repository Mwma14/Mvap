import { useSiteSettings } from '@/hooks/useSiteSettings';

export function AnnouncementBanner() {
  const { data: settings } = useSiteSettings();
  const announcement = settings?.announcement;

  if (!announcement?.enabled || !announcement?.text) {
    return null;
  }

  const speedClass = {
    slow: 'animate-marquee-slow',
    normal: 'animate-marquee',
    fast: 'animate-marquee-fast',
  }[announcement.speed || 'normal'];

  return (
    <div 
      className="fixed top-14 left-0 right-0 z-40 overflow-hidden py-2"
      style={{ 
        backgroundColor: announcement.bgColor || '#e50914',
        color: announcement.textColor || '#ffffff',
        opacity: (announcement.opacity ?? 100) / 100
      }}
    >
      <div className="flex whitespace-nowrap">
        <div className={`flex ${speedClass}`}>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
        </div>
        <div className={`flex ${speedClass}`} aria-hidden="true">
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
          <span className="mx-8 text-sm font-medium">{announcement.text}</span>
        </div>
      </div>
    </div>
  );
}
