import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Monitor, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

type Step = 'history' | 'type' | 'name';

export default function MovieRequest() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('history');
  const [contentType, setContentType] = useState<string>('');
  const [movieName, setMovieName] = useState('');

  // Fetch user's requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['movie-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Submit request mutation
  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('movie_requests').insert({
        user_id: user.id,
        content_type: contentType,
        title: movieName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-requests'] });
      toast({ title: t('requestSubmitted') });
      setStep('history');
      setContentType('');
      setMovieName('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit request.', variant: 'destructive' });
    },
  });

  // Auth is handled by ProtectedRoute

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-cg-success text-white border-0">{t('approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('pending')}</Badge>;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'history':
        return (
          <div className="flex-1 flex flex-col">
            {requestsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner message="Loading requests..." />
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="px-4 space-y-3 pb-24">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{req.title}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{req.content_type}</span>
                      <span>•</span>
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    {req.admin_note && (
                      <p className="text-sm text-muted-foreground mt-2 italic">{req.admin_note}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <Clock className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-6">{t('noRequestsYet')}</p>
                <Button
                  onClick={() => setStep('type')}
                  className="gap-2 rounded-full px-6"
                >
                  <Plus className="w-4 h-4" />
                  {t('addRequest')}
                </Button>
              </div>
            )}

            {/* Floating add button when there are requests */}
            {requests && requests.length > 0 && (
              <div className="fixed bottom-24 right-4 z-20">
                <Button
                  onClick={() => setStep('type')}
                  size="icon"
                  className="w-14 h-14 rounded-full shadow-lg"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'type':
        return (
          <div className="px-4 flex-1 flex flex-col">
            {/* Progress bar */}
            <div className="flex gap-1 mb-8">
              <div className="flex-1 h-1 rounded-full bg-primary" />
              <div className="flex-1 h-1 rounded-full bg-muted" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('chooseContentType')}
            </h2>
            <p className="text-muted-foreground mb-8">{t('movieOrSeries')}</p>

            <div className="space-y-4">
              <button
                onClick={() => { setContentType('movie'); setStep('name'); }}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-colors ${
                  contentType === 'movie' ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <Film className="w-8 h-8 text-foreground" />
                <span className="text-lg font-medium text-foreground">ရုပ်ရှင် (Movie)</span>
              </button>

              <button
                onClick={() => { setContentType('series'); setStep('name'); }}
                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-colors ${
                  contentType === 'series' ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <Monitor className="w-8 h-8 text-foreground" />
                <span className="text-lg font-medium text-foreground">ဇာတ်လမ်းတွဲ (Series)</span>
              </button>
            </div>
          </div>
        );

      case 'name':
        return (
          <div className="px-4 flex-1 flex flex-col">
            {/* Progress bar */}
            <div className="flex gap-1 mb-8">
              <div className="flex-1 h-1 rounded-full bg-primary" />
              <div className="flex-1 h-1 rounded-full bg-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('enterMovieName')}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              {t('dontRequestIfAvailable')}
            </p>

            <Input
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              placeholder={t('movieNamePlaceholder')}
              className="h-14 text-lg border-2 border-primary rounded-xl mb-8"
              maxLength={200}
            />

            <div className="mt-auto pb-8">
              <Button
                onClick={() => submitRequest.mutate()}
                disabled={!movieName.trim() || submitRequest.isPending}
                className="w-full h-14 text-lg font-semibold rounded-xl"
              >
                {submitRequest.isPending ? t('loading') : t('next')}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-nav-spacing flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="pt-16 px-4 pb-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (step === 'name') setStep('type');
            else if (step === 'type') setStep('history');
            else navigate('/');
          }}
          className="text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1 text-center pr-10">
          {t('requestHistory')}
        </h1>
      </div>

      {renderStep()}

      <MobileBottomNav />
    </div>
  );
}
