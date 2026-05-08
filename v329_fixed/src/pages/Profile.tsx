import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Crown, ArrowLeft, LogOut, Clock, CreditCard, Database } from 'lucide-react';
import { CacheStatusPanel } from '@/components/CacheStatusPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { ContactIcons } from '@/components/ContactIcons';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [showCache, setShowCache] = useState(false);
  const { user, profile, role, premiumExpiresAt, premiumType, isLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: settings } = useSiteSettings();
  const contacts = settings?.adminContacts;
  const prices = settings?.subscriptionPrices;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  if (!isLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToHome')}
        </Button>

        <h1 className="text-3xl font-bold mb-8">{t('myProfile')}</h1>

        {/* Profile Card */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('accountInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Avatar'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.display_name || 'User'}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="border-t border-border my-4" />

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('email')}</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('memberSince')}</p>
                <p className="font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-cg-gold" />
              {t('subscriptionStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {role === 'admin'
                    ? t('administrator')
                    : role === 'premium'
                    ? `${premiumType ? premiumType.charAt(0).toUpperCase() + premiumType.slice(1) : 'Premium'} Member`
                    : t('freeUser')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {role === 'admin'
                    ? 'Full access to all features and admin dashboard'
                    : role === 'premium'
                    ? 'Unlimited access to all content'
                    : 'Limited access to content'}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  role === 'admin'
                    ? 'bg-cg-gold/20 text-cg-gold'
                    : role === 'premium'
                    ? 'bg-cg-premium/20 text-cg-premium'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="font-semibold uppercase text-sm">
                  {role === 'admin' ? 'Admin' : role === 'premium' ? (premiumType ? premiumType.charAt(0).toUpperCase() + premiumType.slice(1) : 'Premium') : 'Free'}
                </span>
              </div>
            </div>

            {role === 'premium' && premiumType !== 'lifetime' && premiumExpiresAt && (
              <div className="mt-4 p-3 bg-cg-premium/10 rounded-lg border border-cg-premium/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cg-premium" />
                  <span className="text-sm font-medium">
                    {(() => {
                      const expiresDate = new Date(premiumExpiresAt);
                      const now = new Date();
                      const daysLeft = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      if (daysLeft <= 0) return 'Subscription expired';
                      return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
                    })()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Expires on {new Date(premiumExpiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {role === 'premium' && premiumType === 'lifetime' && (
              <div className="mt-4 p-3 bg-cg-gold/10 rounded-lg border border-cg-gold/20">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-cg-gold" />
                  <span className="text-sm font-medium text-cg-gold">Lifetime Premium</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlimited access forever
                </p>
              </div>
            )}

            {role === 'free_user' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-cg-gold/10 to-cg-premium/10 rounded-lg border border-cg-gold/20">
                <p className="text-sm font-medium text-foreground mb-3">
                  🎬 {t('upgradeToPremium')}
                </p>

                {prices && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 bg-background/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{prices.monthly.label}</p>
                      <p className="text-sm font-bold text-cg-gold">{prices.monthly.mmk.toLocaleString()} MMK</p>
                      <p className="text-xs text-muted-foreground">${prices.monthly.usd}</p>
                    </div>
                    <div className="p-2 bg-background/50 rounded-lg text-center border border-cg-gold">
                      <p className="text-xs text-muted-foreground">{prices.yearly.label}</p>
                      <p className="text-sm font-bold text-cg-gold">{prices.yearly.mmk.toLocaleString()} MMK</p>
                      <p className="text-xs text-muted-foreground">${prices.yearly.usd}</p>
                    </div>
                    <div className="p-2 bg-background/50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{prices.lifetime.label}</p>
                      <p className="text-sm font-bold text-cg-gold">{prices.lifetime.mmk.toLocaleString()} MMK</p>
                      <p className="text-xs text-muted-foreground">${prices.lifetime.usd}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => navigate('/premium-renewal')}
                  className="w-full mb-3"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('renewPremium')}
                </Button>

                <p className="text-xs text-muted-foreground mb-4">
                  Contact us:
                </p>
                <ContactIcons
                  telegramUrl={contacts?.telegram.url}
                  viberUrl={contacts?.viber.url}
                  emailUrl={contacts?.email.url}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cache Status Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowCache(true)}
          className="w-full mt-4 border-blue-700/40 text-blue-300 hover:bg-blue-900/20"
        >
          <Database className="w-4 h-4 mr-2" />
          App Cache Status
        </Button>

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLogout}
          className="w-full mt-3"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout')}
        </Button>

        {showCache && <CacheStatusPanel onClose={() => setShowCache(false)} />}

      {/* Follow us & Version */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('followUs')}</p>
          <div className="flex items-center justify-center gap-6">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">{t('version')} 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
