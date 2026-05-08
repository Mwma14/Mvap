import { Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border text-center p-8 rounded-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Award className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          VIP Member Only
        </h2>

        {/* Description in Burmese */}
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          'ဇာတ်ကား ကြည့်ခြင်း' feature ကို{'\n'}
          အသုံးပြုရန် VIP Member ဖြစ်ရန်လို{'\n'}
          အပ်ပါသည်။
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground font-medium text-base hover:text-foreground transition-colors px-4 py-2"
          >
            Cancel
          </button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/premium-renewal');
            }}
            className="rounded-full px-8 py-3 h-auto text-base font-semibold"
          >
            Subscribe Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}