import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { FilterProvider } from "@/contexts/FilterContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DownloadProvider } from "@/contexts/DownloadContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DevicePresenceMonitor } from "@/components/DevicePresenceMonitor";
import { RealtimeSyncProvider } from "@/components/RealtimeSyncProvider";
import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { initPermanentStore } from "@/lib/cache";
import { useNetworkRefresh } from "@/hooks/useNetworkRefresh";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MovieDetails from "./pages/MovieDetails";
import ActorDetail from "./pages/ActorDetail";
import Profile from "./pages/Profile";
import Watchlist from "./pages/Watchlist";
import History from "./pages/History";
import PremiumRenewal from "./pages/PremiumRenewal";
import MovieRequest from "./pages/MovieRequest";
import TvChannels from "./pages/TvChannels";
import Browse from "./pages/Browse";
import SearchPage from "./pages/Search";
import Welcome from "./pages/Welcome";
import Downloads from "./pages/Downloads";
import Watch from "./pages/Watch";
import Support from "./pages/Support";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MoviesAdmin from "./pages/admin/MoviesAdmin";
import SeriesAdmin from "./pages/admin/SeriesAdmin";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import Analytics from "./pages/admin/Analytics";
import SlidesAdmin from "./pages/admin/SlidesAdmin";
import PaymentSettingsAdmin from "./pages/admin/PaymentSettingsAdmin";
import PremiumRequestsAdmin from "./pages/admin/PremiumRequestsAdmin";
import MovieRequestsAdmin from "./pages/admin/MovieRequestsAdmin";
import ChannelsAdmin from "./pages/admin/ChannelsAdmin";
import FootballAdmin from "./pages/admin/FootballAdmin";
import BrokenChannelsAdmin from "./pages/admin/BrokenChannelsAdmin";
import DirectChannelsAdmin from "./pages/admin/DirectChannelsAdmin";
import TelegramFilesAdmin from "./pages/admin/TelegramFilesAdmin";
import Football from "./pages/Football";
import FootballHighlights from "./pages/FootballHighlights";
import NotFound from "./pages/NotFound";

// Initialize permanent local store on app start (wipes cache if app version changed)
initPermanentStore();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,   // 10 minutes default stale time
      gcTime: 1000 * 60 * 60,      // 60 minutes in-memory cache
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,  // Prevent refetch when switching tabs
      refetchOnMount: false,        // Use cache-first; hooks override when needed
      refetchOnReconnect: false,    // Prevent refetch on network reconnect
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('Query error:', query.queryKey, error);
    },
  }),
});

function NetworkRefreshMonitor() {
  useNetworkRefresh();
  return null;
}

function StatusBarManager() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Immersive mode: hide status bar completely
      StatusBar.setOverlaysWebView({ overlay: true });
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.hide();
    }
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <FilterProvider>
            <DownloadProvider>
            <StatusBarManager />
            <NetworkRefreshMonitor />
            <DevicePresenceMonitor />
            <RealtimeSyncProvider />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/movie/:id" element={<MovieDetails />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/browse/:filter" element={<Browse />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
                  <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
                  <Route path="/watch" element={<Watch />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/ask-ai" element={<Support />} />
                  <Route path="/actor/:id" element={<ActorDetail />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                  <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/premium-renewal" element={<ProtectedRoute><PremiumRenewal /></ProtectedRoute>} />
                  <Route path="/request" element={<ProtectedRoute><MovieRequest /></ProtectedRoute>} />
                  
                  <Route path="/football" element={<Football />} />
                  <Route path="/football-highlights" element={<FootballHighlights />} />
                  <Route path="/tv-channels" element={<ProtectedRoute><TvChannels /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="movies" element={<MoviesAdmin />} />
                    <Route path="series/:movieId" element={<SeriesAdmin />} />
                    <Route path="categories" element={<CategoriesAdmin />} />
                    <Route path="users" element={<UsersAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                    <Route path="slides" element={<SlidesAdmin />} />
                    <Route path="payment-settings" element={<PaymentSettingsAdmin />} />
                    <Route path="premium-requests" element={<PremiumRequestsAdmin />} />
                    <Route path="movie-requests" element={<MovieRequestsAdmin />} />
                    <Route path="channels" element={<ChannelsAdmin />} />
                    <Route path="football" element={<FootballAdmin />} />
                    <Route path="direct-channels" element={<DirectChannelsAdmin />} />
                    <Route path="broken-channels" element={<BrokenChannelsAdmin />} />
                    <Route path="telegram-files" element={<TelegramFilesAdmin />} />
                    <Route path="analytics" element={<Analytics />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
            </DownloadProvider>
          </FilterProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
