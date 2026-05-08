import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'mm' : 'en')}
      className={cn(
        "text-xs font-bold px-2 h-7 rounded-full border !text-white hover:!text-white hover:bg-white/15 active:bg-white/25 transition-colors",
        className
      )}
    >
      {language === 'en' ? 'MM' : 'EN'}
    </Button>
  );
}
