import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Crown, Sun, Moon, Trash2, Smartphone, Star, Smile, Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import cineverseLogo from '@/assets/cineverse-logo.png';
import { toast } from 'sonner';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, profile, role, premiumExpiresAt, premiumType, isPremium, isAdmin, isLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showDevicesModal, setShowDevicesModal] = useState(false);

  const {
    devices,
    maxDevices,
    removeDevice,
    currentDeviceId,
  } = useDevices(user?.id);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRemoveDevice = async (deviceDbId: string) => {
    await removeDevice(deviceDbId);
    toast.success('Device removed successfully. That device will be signed out automatically.');
  };

  // Map premium_type to display label
  const getPremiumLabel = (type: string | null | undefined): string => {
    if (!type) return 'Premium';
    const lower = type.toLowerCase();
    if (lower === 'gold' || lower.includes('gold')) return 'Gold';
    if (lower === 'platinum' || lower.includes('platinum')) return 'Platinum';
    // Capitalize first letter for any other type
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const planLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'premium'
      ? `${getPremiumLabel(premiumType)} Member`
      : 'Normal Member';

  // Check if user is premium or admin (shows premium welcome)
  const showPremiumView = isPremium || isAdmin;

  // Format expiration date as DD-MM-YYYY
  const expiresFormatted = premiumExpiresAt
    ? (() => {
        const d = new Date(premiumExpiresAt);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar: theme toggle left, logout right */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-9 w-9 text-primary"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-8">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-28 h-28 rounded-full bg-card border-2 border-border flex items-center justify-center overflow-hidden shadow-lg">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={cineverseLogo} alt="MovieKyiMal" className="w-20 h-20 object-contain" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>

        {/* User info */}
        <h2 className="text-2xl font-bold text-foreground mb-1">
          {profile?.display_name || user?.email?.split('@')[0] || 'User'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">{user?.email}</p>

        {/* Plan Card */}
        <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-5 mb-6 shadow-sm">
          {/* Plan row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={cn("w-5 h-5", isAdmin ? "text-amber-500" : "text-primary")} />
              <span className="text-sm text-muted-foreground">Plan</span>
            </div>
            <span
              className={cn(
                'text-base font-bold',
                role === 'admin'
                  ? 'text-amber-500'
                  : role === 'premium'
                  ? 'text-foreground'
                  : 'text-foreground'
              )}
            >
              {planLabel}
            </span>
          </div>

          {/* Divider + Expires row for premium users */}
          {role === 'premium' && expiresFormatted && (
            <>
              <div className="border-t border-border my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Expires on</span>
                </div>
                <span className="text-base font-bold text-foreground">{expiresFormatted}</span>
              </div>
            </>
          )}

          {/* Action Buttons based on role */}
          <div className="mt-5 space-y-3">
            {showPremiumView ? (
              <>
                {/* Premium/Admin: Go to movies */}
                <Button
                  onClick={() => navigate('/')}
                  className="w-full h-12 rounded-2xl font-semibold text-base gap-2 bg-primary hover:bg-primary/90"
                >
                  <Play className="w-5 h-5" />
                  Movie ကြည့်ရန်
                </Button>

                {/* Renewal button (not for admin) */}
                {role === 'premium' && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/premium-renewal')}
                    className="w-full h-12 rounded-2xl font-semibold text-base border-primary text-primary"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    သက်တမ်းတိုးရန်
                  </Button>
                )}

                {/* Active Devices button - only for premium/admin */}
                <Button
                  variant="outline"
                  onClick={() => setShowDevicesModal(true)}
                  className="w-full h-12 rounded-2xl font-semibold text-base border-border text-muted-foreground"
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  အသုံးပြုနေသော device များ
                </Button>
              </>
            ) : (
              <>
                {/* Normal user: Apply for VIP */}
                <Button
                  onClick={() => navigate('/premium-renewal')}
                  className="w-full h-12 rounded-2xl font-semibold text-base gap-2 bg-primary hover:bg-primary/90"
                >
                  <Star className="w-5 h-5" />
                  VIP လျှောက်ရန်
                </Button>

                {/* Browse button */}
                <Button
                  variant="outline"
                  onClick={() => navigate('/', { state: { fromWelcome: true } })}
                  className="w-full h-12 rounded-2xl font-semibold text-base border-border"
                >
                  <Smile className="w-5 h-5 mr-2" />
                  ဘာတွေရှိလဲကြည့်မယ်
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">{t('followUs')}</p>
          <div className="flex items-center justify-center gap-8">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-primary mt-8">
          Version 7.0.0
        </p>
      </div>

      {/* Active Devices Modal */}
      <Dialog open={showDevicesModal} onOpenChange={setShowDevicesModal}>
        <DialogContent className="sm:max-w-sm rounded-2xl bg-background border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-1">Active Devices</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {devices.length} / {isAdmin ? '∞' : maxDevices} devices active
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {devices.map((device) => {
              const isCurrentDevice = device.device_id === currentDeviceId;
              return (
                <div
                  key={device.id}
                  className={cn(
                    "rounded-xl p-4 flex items-center gap-3",
                    isCurrentDevice
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-accent/50"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {device.device_name}
                      {isCurrentDevice && (
                        <span className="ml-2 text-xs text-primary font-normal">(This device)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(device.last_active_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!isCurrentDevice && (
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowDevicesModal(false)}
            className="w-full text-center text-primary font-medium mt-3 py-2"
          >
            Close
          </button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
