import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function Support() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">AI Support</h1>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Bot className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {language === 'mm' ? 'မကြာမီ လာမည်' : 'Coming Soon'}
        </h2>
        <p className="text-muted-foreground max-w-sm mb-2">
          {language === 'mm'
            ? 'AI Support feature ကို မကြာမီ ထည့်သွင်းပေးပါမည်။'
            : 'AI Support feature will be available soon.'}
        </p>
        <div className="flex items-center gap-2 text-muted-foreground/60 mt-4">
          <Construction className="w-4 h-4" />
          <span className="text-sm">Under Development</span>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
