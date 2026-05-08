import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Eye, EyeOff, Moon, Sun, AlertTriangle, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CineverseLogo } from '@/components/CineverseLogo';
import type { UserDevice } from '@/hooks/useDevices';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);
  const [blockedDevices, setBlockedDevices] = useState<UserDevice[]>([]);
  const [blockedMaxDevices, setBlockedMaxDevices] = useState(1);
  const [blockedUserId, setBlockedUserId] = useState<string | null>(null);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);

  useEffect(() => {
    if (user && !authLoading && !showDeviceLimitModal && !isCheckingDevices) {
      navigate(returnUrl || '/welcome');
    }
  }, [user, authLoading, navigate, showDeviceLimitModal, isCheckingDevices]);

  // Helper to get or create device ID
  function getDeviceId(): string {
    const key = 'cineverse_device_id';
    let deviceId = localStorage.getItem(key);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(key, deviceId);
    }
    return deviceId;
  }

  function parseDeviceName(): string {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Linux')) os = 'Linux';
    return `${browser} on ${os}`;
  }

  const checkAndRegisterDevice = async (userId: string): Promise<'allowed' | 'blocked'> => {
    const deviceId = getDeviceId();
    const deviceName = parseDeviceName();

    // Get user role info
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('max_devices, role')
      .eq('user_id', userId)
      .maybeSingle();

    const userRole = roleData?.role;
    const userMaxDevices = roleData?.max_devices ?? 1;
    const isAdminRole = userRole === 'admin';
    const isPremiumRole = userRole === 'premium';

    // Free users: skip device tracking
    if (!isAdminRole && !isPremiumRole) return 'allowed';

    // Admin: unlimited devices, just register
    if (isAdminRole) {
      await supabase.from('user_devices').upsert(
        { user_id: userId, device_id: deviceId, device_name: deviceName, last_active_at: new Date().toISOString() },
        { onConflict: 'user_id,device_id' }
      );
      return 'allowed';
    }

    // Premium: check if this device already registered
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existingDevice) {
      // Already registered, update and allow
      await supabase.from('user_devices')
        .update({ last_active_at: new Date().toISOString(), device_name: deviceName })
        .eq('id', existingDevice.id);
      return 'allowed';
    }

    // New device - check limit
    const { data: currentDevices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    const currentList = (currentDevices || []) as UserDevice[];

    if (currentList.length >= userMaxDevices) {
      // BLOCKED - keep signed in so they can delete devices via RLS
      setBlockedDevices(currentList);
      setBlockedMaxDevices(userMaxDevices);
      setBlockedUserId(userId);
      setShowDeviceLimitModal(true);
      return 'blocked';
    }

    // Under limit - register
    await supabase.from('user_devices').insert({
      user_id: userId, device_id: deviceId, device_name: deviceName,
      last_active_at: new Date().toISOString(),
    });
    return 'allowed';
  };

  const handleRemoveBlockedDevice = async (deviceDbId: string) => {
    await supabase.from('user_devices').delete().eq('id', deviceDbId);
    setBlockedDevices(prev => prev.filter(d => d.id !== deviceDbId));
    toast.success('Device removed successfully.');

    // Now try to register this device since a slot is free
    if (blockedUserId) {
      const deviceId = getDeviceId();
      const deviceName = parseDeviceName();
      await supabase.from('user_devices').insert({
        user_id: blockedUserId, device_id: deviceId, device_name: deviceName,
        last_active_at: new Date().toISOString(),
      });
      setShowDeviceLimitModal(false);
      setBlockedUserId(null);
      toast.success('Welcome back!');
      navigate(returnUrl || '/welcome');
    }
  };

  const handleDeviceLimitClose = async () => {
    // User closed modal without removing a device - sign out
    setShowDeviceLimitModal(false);
    setBlockedUserId(null);
    await supabase.auth.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created! Please check your email to verify.');
        }
      } else {
        setIsCheckingDevices(true);
        const { error } = await signIn(email, password);
        if (error) {
          setIsCheckingDevices(false);
          toast.error('Invalid email or password');
        } else {
          // Check device limits before navigating
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const deviceCheckResult = await checkAndRegisterDevice(session.user.id);
            if (deviceCheckResult === 'blocked') {
              setIsCheckingDevices(false);
              return;
            }
          }
          setIsCheckingDevices(false);
          toast.success('Welcome back!');
          navigate(returnUrl || '/welcome');
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with theme toggle */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>
        
        {/* Animated logo */}
        <CineverseLogo />
        
        <LanguageToggle className="!text-foreground !border-foreground/30 hover:!bg-foreground/10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 max-w-md mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {t('loginTitle')}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {t('loginSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground font-medium">
                {t('displayName')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder={t('yourName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-11 h-12 bg-card border-border rounded-xl text-foreground"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-card border-border rounded-xl text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              {t('password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-card border-border rounded-xl pr-11 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? t('loading') : isSignUp ? t('createAccount') : t('login')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-semibold rounded-xl border-border"
            onClick={() => navigate('/', { state: { guestBrowse: true } })}
          >
            {t('browseFirst')}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">{t('or')}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Toggle Sign Up / Sign In */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-border"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? t('signInLink') : t('signUpLink')}
        </Button>

        {/* Account toggle text */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {isSignUp ? t('hasAccount') : t('noAccount')}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? t('signInLink') : t('signUpLink')}
          </button>
        </p>

        {/* Follow us */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('followUs')}</p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {t('version')} 1.0.0
        </p>
      </div>

      {/* Device Limit Modal */}
      <Dialog open={showDeviceLimitModal} onOpenChange={(open) => {
        if (!open) handleDeviceLimitClose();
      }}>
        <DialogContent className="sm:max-w-sm rounded-2xl bg-background border-border p-6">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Device Limit Reached</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your plan allows a maximum of {blockedMaxDevices} device{blockedMaxDevices > 1 ? 's' : ''}. 
              Remove a device below to log in on this device.
            </p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {blockedDevices.map((device) => (
              <div key={device.id} className="border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{device.device_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last active: {new Date(device.last_active_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveBlockedDevice(device.id)}
                  className="p-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
