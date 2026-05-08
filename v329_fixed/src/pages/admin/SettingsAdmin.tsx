import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Settings, Save, Loader2, Megaphone, ChevronDown, CreditCard, Phone, Tv, Plus, Trash2, Globe, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSiteSettings, useUpdateSiteSettings, AdminContacts, SubscriptionPrices, AnnouncementSettings, LiveTvSource } from '@/hooks/useSiteSettings';
import { TelegramIcon, ViberIcon } from '@/components/ContactIcons';
import { Mail } from 'lucide-react';

export default function SettingsAdmin() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  // Contact form state
  const [contacts, setContacts] = useState<AdminContacts>({
    telegram: { handle: '', url: '' },
    viber: { number: '', url: '' },
    email: { address: '', url: '' },
  });

  // Pricing form state
  const [prices, setPrices] = useState<SubscriptionPrices>({
    monthly: { mmk: 0, usd: 0, label: '1 Month' },
    yearly: { mmk: 0, usd: 0, label: '1 Year' },
    lifetime: { mmk: 0, usd: 0, label: 'Lifetime' },
  });

  // Announcement form state
  const [announcement, setAnnouncement] = useState<AnnouncementSettings>({
    enabled: false,
    text: '',
    bgColor: '#e50914',
    textColor: '#ffffff',
    speed: 'normal',
    opacity: 100,
  });

  // Live TV Sources state
  const [liveTvSources, setLiveTvSources] = useState<LiveTvSource[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Telegram Bot API URL state
  const [telegramBotApiUrl, setTelegramBotApiUrl] = useState('');

  // Collapsible states for mobile
  const [openSections, setOpenSections] = useState({
    announcement: true,
    contacts: false,
    prices: false,
    liveTv: true,
    telegram: false,
  });

  const initialLoadDone = useRef(false);

  // Load settings into form when fetched (only on initial load)
  useEffect(() => {
    if (!settings || initialLoadDone.current) return;
    initialLoadDone.current = true;
    if (settings.adminContacts) {
      setContacts(settings.adminContacts);
    }
    if (settings.subscriptionPrices) {
      setPrices(settings.subscriptionPrices);
    }
    if (settings.announcement) {
      setAnnouncement(settings.announcement);
    }
    if (settings.liveTvSources) {
      const sources = settings.liveTvSources;
      setLiveTvSources(Array.isArray(sources) ? sources : []);
    }
    if (settings.telegramBotApiUrl !== undefined) {
      setTelegramBotApiUrl(settings.telegramBotApiUrl);
    }
  }, [settings]);

  const handleSaveContacts = () => {
    // Auto-generate URLs from handles/numbers
    const updatedContacts = {
      telegram: {
        handle: contacts.telegram.handle,
        url: `https://t.me/${contacts.telegram.handle.replace('@', '')}`,
      },
      viber: {
        number: contacts.viber.number,
        url: `viber://chat?number=${contacts.viber.number}`,
      },
      email: {
        address: contacts.email.address,
        url: `mailto:${contacts.email.address}?subject=Premium%20Subscription%20Inquiry`,
      },
    };
    updateSettings.mutate({ key: 'admin_contacts', value: updatedContacts });
  };

  const handleSavePrices = () => {
    updateSettings.mutate({ key: 'subscription_prices', value: prices });
  };

  const handleSaveAnnouncement = () => {
    updateSettings.mutate({ key: 'announcement', value: announcement });
  };

  // Live TV Sources helpers
  function parseCategoryFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 3) {
        const type = segments[segments.length - 3];
        const country = segments[segments.length - 2];
        const formattedType = type.replace(/([a-z])([A-Z])/g, '$1 $2');
        return `${formattedType} - ${country}`;
      }
      if (segments.length >= 2) {
        const type = segments[segments.length - 2];
        return type.replace(/([a-z])([A-Z])/g, '$1 $2');
      }
      return 'Other';
    } catch {
      return 'Invalid URL';
    }
  }

  const handleAddSource = () => {
    if (!newSourceUrl.trim()) return;
    setLiveTvSources([...liveTvSources, { url: newSourceUrl.trim(), enabled: true }]);
    setNewSourceUrl('');
  };

  const handleRemoveSource = (index: number) => {
    setLiveTvSources(liveTvSources.filter((_, i) => i !== index));
  };

  const handleToggleSource = (index: number) => {
    setLiveTvSources(liveTvSources.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSaveLiveTvSources = () => {
    updateSettings.mutate({ key: 'live_tv_sources', value: liveTvSources });
  };

  const handleSaveTelegramBotApiUrl = () => {
    updateSettings.mutate({ key: 'telegram_bot_api_url', value: telegramBotApiUrl.trim() });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="w-full box-border">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 flex items-center gap-2">
        <Settings className="w-5 h-5 sm:w-8 sm:h-8" />
        Site Settings
      </h1>

      <div className="space-y-3 w-full">
        {/* Announcement Banner - Collapsible */}
        <Collapsible 
          open={openSections.announcement} 
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, announcement: open }))}
          className="w-full"
        >
          <Card className="glass border-cineverse-red/30 w-full box-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-cineverse-red" />
                    Announcement Banner
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.announcement ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="announcement-enabled" className="text-sm font-medium">
                      Enable Banner
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show scrolling announcement
                    </p>
                  </div>
                  <Switch
                    id="announcement-enabled"
                    checked={announcement.enabled}
                    onCheckedChange={(checked) =>
                      setAnnouncement({ ...announcement, enabled: checked })
                    }
                  />
                </div>

                {/* Announcement Text */}
                <div className="space-y-2">
                  <Label htmlFor="announcement-text" className="text-sm">Announcement Text</Label>
                  <Input
                    id="announcement-text"
                    value={announcement.text}
                    onChange={(e) =>
                      setAnnouncement({ ...announcement, text: e.target.value })
                    }
                    placeholder="Enter your message..."
                    className="text-sm"
                  />
                </div>

                {/* Colors - Stack on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="announcement-bg" className="text-sm">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="announcement-bg"
                        type="color"
                        value={announcement.bgColor}
                        onChange={(e) =>
                          setAnnouncement({ ...announcement, bgColor: e.target.value })
                        }
                        className="w-10 h-10 p-1 cursor-pointer shrink-0"
                      />
                      <Input
                        value={announcement.bgColor}
                        onChange={(e) =>
                          setAnnouncement({ ...announcement, bgColor: e.target.value })
                        }
                        className="flex-1 min-w-0 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement-text-color" className="text-sm">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="announcement-text-color"
                        type="color"
                        value={announcement.textColor}
                        onChange={(e) =>
                          setAnnouncement({ ...announcement, textColor: e.target.value })
                        }
                        className="w-10 h-10 p-1 cursor-pointer shrink-0"
                      />
                      <Input
                        value={announcement.textColor}
                        onChange={(e) =>
                          setAnnouncement({ ...announcement, textColor: e.target.value })
                        }
                        className="flex-1 min-w-0 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label htmlFor="announcement-speed" className="text-sm">Scroll Speed</Label>
                  <Select
                    value={announcement.speed}
                    onValueChange={(value: 'slow' | 'normal' | 'fast') =>
                      setAnnouncement({ ...announcement, speed: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="announcement-opacity" className="text-sm">Opacity</Label>
                    <span className="text-xs text-muted-foreground">{announcement.opacity ?? 100}%</span>
                  </div>
                  <Slider
                    id="announcement-opacity"
                    value={[announcement.opacity ?? 100]}
                    onValueChange={(value) =>
                      setAnnouncement({ ...announcement, opacity: value[0] })
                    }
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Preview */}
                {announcement.text && (
                  <div className="space-y-2">
                    <Label className="text-sm">Preview</Label>
                    <div 
                      className="overflow-hidden rounded-lg py-2"
                      style={{ 
                        backgroundColor: announcement.bgColor,
                        color: announcement.textColor,
                        opacity: (announcement.opacity ?? 100) / 100
                      }}
                    >
                      <div className="whitespace-nowrap animate-marquee">
                        <span className="mx-8 text-xs font-medium">{announcement.text}</span>
                        <span className="mx-8 text-xs font-medium">{announcement.text}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveAnnouncement}
                  disabled={updateSettings.isPending}
                  className="w-full bg-cineverse-red hover:bg-cineverse-red/90"
                  size="sm"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Announcement
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Admin Contacts - Collapsible */}
        <Collapsible 
          open={openSections.contacts} 
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, contacts: open }))}
          className="w-full"
        >
          <Card className="glass w-full box-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Admin Contacts
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.contacts ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
                {/* Telegram */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center shrink-0">
                    <TelegramIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="telegram-handle" className="text-xs text-muted-foreground">Telegram</Label>
                    <Input
                      id="telegram-handle"
                      value={contacts.telegram.handle}
                      onChange={(e) =>
                        setContacts({
                          ...contacts,
                          telegram: { ...contacts.telegram, handle: e.target.value },
                        })
                      }
                      placeholder="@username"
                      className="text-sm h-9"
                    />
                  </div>
                </div>

                {/* Viber */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#7360f2] flex items-center justify-center shrink-0">
                    <ViberIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="viber-number" className="text-xs text-muted-foreground">Viber</Label>
                    <Input
                      id="viber-number"
                      value={contacts.viber.number}
                      onChange={(e) =>
                        setContacts({
                          ...contacts,
                          viber: { ...contacts.viber, number: e.target.value },
                        })
                      }
                      placeholder="09xxxxxxxxx"
                      className="text-sm h-9"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EA4335] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="email-address" className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      id="email-address"
                      type="email"
                      value={contacts.email.address}
                      onChange={(e) =>
                        setContacts({
                          ...contacts,
                          email: { ...contacts.email, address: e.target.value },
                        })
                      }
                      placeholder="email@example.com"
                      className="text-sm h-9"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveContacts}
                  disabled={updateSettings.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Contacts
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Subscription Prices - Collapsible */}
        <Collapsible 
          open={openSections.prices} 
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, prices: open }))}
          className="w-full"
        >
          <Card className="glass w-full box-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Prices
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.prices ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
                {/* Monthly */}
                <div className="p-3 bg-muted rounded-lg space-y-3 overflow-hidden">
                  <h3 className="font-medium text-sm">Monthly</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="monthly-mmk" className="text-xs">MMK</Label>
                      <Input
                        id="monthly-mmk"
                        type="number"
                        value={prices.monthly.mmk}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            monthly: { ...prices.monthly, mmk: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="monthly-usd" className="text-xs">USD</Label>
                      <Input
                        id="monthly-usd"
                        type="number"
                        step="0.01"
                        value={prices.monthly.usd}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            monthly: { ...prices.monthly, usd: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Yearly */}
                <div className="p-3 bg-muted rounded-lg space-y-3 overflow-hidden">
                  <h3 className="font-medium text-sm">Yearly</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="yearly-mmk" className="text-xs">MMK</Label>
                      <Input
                        id="yearly-mmk"
                        type="number"
                        value={prices.yearly.mmk}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            yearly: { ...prices.yearly, mmk: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="yearly-usd" className="text-xs">USD</Label>
                      <Input
                        id="yearly-usd"
                        type="number"
                        step="0.01"
                        value={prices.yearly.usd}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            yearly: { ...prices.yearly, usd: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Lifetime */}
                <div className="p-3 bg-muted rounded-lg space-y-3 overflow-hidden">
                  <h3 className="font-medium text-sm">Lifetime</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="lifetime-mmk" className="text-xs">MMK</Label>
                      <Input
                        id="lifetime-mmk"
                        type="number"
                        value={prices.lifetime.mmk}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            lifetime: { ...prices.lifetime, mmk: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label htmlFor="lifetime-usd" className="text-xs">USD</Label>
                      <Input
                        id="lifetime-usd"
                        type="number"
                        step="0.01"
                        value={prices.lifetime.usd}
                        onChange={(e) =>
                          setPrices({
                            ...prices,
                            lifetime: { ...prices.lifetime, usd: Number(e.target.value) },
                          })
                        }
                        className="text-sm h-9 w-full"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSavePrices}
                  disabled={updateSettings.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Prices
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        {/* Live TV Sources - Collapsible */}
        <Collapsible 
          open={openSections.liveTv} 
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, liveTv: open }))}
          className="w-full"
        >
          <Card className="glass w-full box-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5" />
                    Live TV Sources
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.liveTv ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
                {/* Current sources */}
                {liveTvSources.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No sources added yet</p>
                ) : (
                  <div className="space-y-3">
                    {liveTvSources.map((source, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            {parseCategoryFromUrl(source.url)}
                          </Badge>
                          <div className="flex-1" />
                          <Switch
                            checked={source.enabled}
                            onCheckedChange={() => handleToggleSource(index)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSource(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">{source.url}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new source */}
                <div className="space-y-2">
                  <Label className="text-sm">Add Source URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://raw.githubusercontent.com/..."
                      className="text-sm flex-1 min-w-0"
                    />
                    <Button size="sm" variant="outline" onClick={handleAddSource} disabled={!newSourceUrl.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {newSourceUrl.trim() && (
                    <Badge variant="outline" className="text-xs">
                      Preview: {parseCategoryFromUrl(newSourceUrl)}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleSaveLiveTvSources}
                  disabled={updateSettings.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Sources
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Telegram Bot API - Collapsible */}
        <Collapsible 
          open={openSections.telegram} 
          onOpenChange={(open) => setOpenSections(prev => ({ ...prev, telegram: open }))}
          className="w-full"
        >
          <Card className="glass w-full box-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors px-3 py-3 sm:px-6 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Telegram Bot API
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.telegram ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0 px-3 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="telegram-bot-api-url" className="text-sm">Custom Local Bot API Server URL</Label>
                  <Input
                    id="telegram-bot-api-url"
                    value={telegramBotApiUrl}
                    onChange={(e) => setTelegramBotApiUrl(e.target.value)}
                    placeholder="http://your-vps:8081"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a custom Local Bot API Server URL to stream files larger than 20MB. Leave empty to use the default Telegram API (20MB limit).
                  </p>
                </div>

                <Badge variant={telegramBotApiUrl.trim() ? 'default' : 'secondary'} className="text-xs">
                  {telegramBotApiUrl.trim() ? '✅ Custom server configured' : '⚠️ Using default API (20MB limit)'}
                </Badge>

                <Button
                  onClick={handleSaveTelegramBotApiUrl}
                  disabled={updateSettings.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Telegram API URL
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}