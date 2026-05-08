import { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Film, Users, LayoutDashboard, ArrowLeft, Tags, Settings, BarChart3, Menu, ChevronRight, Image, CreditCard, Shield, MessageSquare, Tv, Trophy, WifiOff, Link2, Send } from 'lucide-react';
import { usePendingRequestCount } from '@/hooks/usePendingRequests';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingRequestCount = usePendingRequestCount();

  // Redirect if not admin
  if (!isLoading && (!user || !isAdmin)) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 md:px-8 text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/movies', label: 'Movies', icon: Film },
    { path: '/admin/categories', label: 'Categories', icon: Tags },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/slides', label: 'Slides', icon: Image },
    { path: '/admin/payment-settings', label: 'Payments', icon: CreditCard },
    { path: '/admin/premium-requests', label: 'Premium Req', icon: Shield },
    { path: '/admin/movie-requests', label: 'Movie Req', icon: MessageSquare },
    { path: '/admin/channels', label: 'Channels', icon: Tv },
    { path: '/admin/football', label: 'Football', icon: Trophy },
    { path: '/admin/direct-channels', label: 'Direct Ch.', icon: Link2 },
    { path: '/admin/broken-channels', label: 'Broken Ch.', icon: WifiOff },
    { path: '/admin/telegram-files', label: 'Telegram', icon: Send },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPage = navItems.find(item => isActive(item.path, item.exact)) || navItems[0];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <div className="pt-20 flex w-full max-w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-5rem)] fixed left-0 top-20 glass border-r border-border p-4">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-cg-gold">Admin Dashboard</h2>
            <p className="text-xs text-muted-foreground">Manage your platform</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.path === '/admin/premium-requests' && pendingRequestCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mt-auto justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site
          </Button>
        </aside>

        {/* Mobile Header with Navigation */}
        <div className="md:hidden fixed left-0 right-0 z-40 bg-background border-b border-border px-3 py-2" style={{ top: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center justify-between">
            {/* Current Page Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-card">
                  <currentPage.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{currentPage.label}</span>
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover z-40">
                {navItems.map((item) => (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`gap-3 cursor-pointer ${
                      isActive(item.path, item.exact) ? 'bg-accent' : ''
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.path === '/admin/premium-requests' && pendingRequestCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')} className="gap-3 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Full Menu Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <SheetHeader>
                  <SheetTitle className="text-cg-gold">Admin Panel</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path, item.exact)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium flex-1">{item.label}</span>
                      {item.path === '/admin/premium-requests' && pendingRequestCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </Link>
                  ))}
                </nav>
                <div className="absolute bottom-6 left-6 right-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full justify-start"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Site
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-3 md:p-8 mt-14 md:mt-0 w-full min-w-0 overflow-x-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
