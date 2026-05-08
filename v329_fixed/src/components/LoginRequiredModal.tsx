import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function LoginRequiredModal({ open, onOpenChange, feature }: LoginRequiredModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl bg-background border-border text-center p-8">
        {/* Lock icon - matching reference: red/primary lock in a light pink circle */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          {t('loginRequired')}
        </h2>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed px-2">
          {feature
            ? `'${feature}' feature ကို အသုံးပြုရန် Login ဝင်ရန် (သို့) အကောင့်သစ်ဖွင့်ရန် လိုအပ်ပါသည်။`
            : t('loginRequiredDesc')}
        </p>

        <div className="flex items-center gap-4 justify-center">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="px-8 text-base font-medium"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleRegister}
            className="px-8 text-base font-semibold rounded-xl"
          >
            {t('registerNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
