import { useState, useMemo } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Film, Check, X, Loader2, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MovieRequest {
  id: string;
  user_id: string;
  title: string;
  content_type: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupedRequest {
  title: string;
  content_type: string;
  count: number;
  requests: MovieRequest[];
  latestDate: string;
  statuses: string[];
}

export default function MovieRequestsAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-movie-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('movie_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MovieRequest[];
    },
  });

  // Group requests by title (case-insensitive)
  const groupedRequests = useMemo(() => {
    if (!requests) return [];

    const groups: Record<string, GroupedRequest> = {};

    for (const req of requests) {
      const key = req.title.toLowerCase().trim();
      if (!groups[key]) {
        groups[key] = {
          title: req.title,
          content_type: req.content_type,
          count: 0,
          requests: [],
          latestDate: req.created_at,
          statuses: [],
        };
      }
      groups[key].count++;
      groups[key].requests.push(req);
      groups[key].statuses.push(req.status);
      if (new Date(req.created_at) > new Date(groups[key].latestDate)) {
        groups[key].latestDate = req.created_at;
      }
    }

    return Object.values(groups).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [requests]);

  // Approve all requests for a grouped title and notify all users
  const approveMutation = useMutation({
    mutationFn: async (group: GroupedRequest) => {
      if (!user) throw new Error('Not authenticated');

      const pendingRequests = group.requests.filter(r => r.status === 'pending');
      if (pendingRequests.length === 0) return;

      // Update all pending requests for this title to approved
      const ids = pendingRequests.map(r => r.id);
      const { error: updateError } = await supabase
        .from('movie_requests')
        .update({ status: 'approved', admin_note: 'Approved by admin' })
        .in('id', ids);

      if (updateError) throw updateError;

      // Send notifications to all unique users who requested this title
      const uniqueUserIds = [...new Set(pendingRequests.map(r => r.user_id))];
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        title: 'Request Approved ✅',
        message: `Your request for "${group.title}" has been approved! It will be added soon.`,
        type: 'success',
        reference_type: 'movie_request',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movie-requests'] });
      toast.success('All requests approved and users notified!');
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Failed to approve requests');
    },
  });

  // Deny all requests for a grouped title and notify all users
  const denyMutation = useMutation({
    mutationFn: async ({ group, reason }: { group: GroupedRequest; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      const pendingRequests = group.requests.filter(r => r.status === 'pending');
      if (pendingRequests.length === 0) return;

      const ids = pendingRequests.map(r => r.id);
      const { error: updateError } = await supabase
        .from('movie_requests')
        .update({ status: 'rejected', admin_note: reason || 'Request denied' })
        .in('id', ids);

      if (updateError) throw updateError;

      // Notify all unique requesting users
      const uniqueUserIds = [...new Set(pendingRequests.map(r => r.user_id))];
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        title: 'Request Denied ❌',
        message: `Your request for "${group.title}" was denied. ${reason ? `Reason: ${reason}` : ''}`,
        type: 'error',
        reference_type: 'movie_request',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Failed to send notifications:', notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movie-requests'] });
      setShowDenyDialog(false);
      setDenyReason('');
      setSelectedGroup(null);
      toast.success('All requests denied and users notified.');
    },
    onError: (error) => {
      console.error('Deny error:', error);
      toast.error('Failed to deny requests');
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPending = (group: GroupedRequest) =>
    group.requests.some(r => r.status === 'pending');

  if (isLoading) {
    return <LoadingSpinner message="Loading requests..." />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <Film className="w-5 h-5 sm:w-8 sm:h-8" />
          Movie Requests
        </h1>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Denied</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groupedRequests.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center text-muted-foreground">
            No {statusFilter === 'all' ? '' : statusFilter} movie requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedRequests.map((group) => (
            <Card key={group.title.toLowerCase()} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowDetailDialog(true);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate text-foreground">{group.title}</p>
                      {group.count > 1 && (
                        <Badge className="bg-primary/20 text-primary border-0 shrink-0">
                          <Users className="w-3 h-3 mr-1" />
                          {group.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {group.content_type} • {new Date(group.latestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasPending(group) ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => approveMutation.mutate(group)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowDenyDialog(true);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      statusBadge(group.requests[0]?.status || 'pending')
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog - shows all individual requesters */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGroup?.title}
              {selectedGroup && selectedGroup.count > 1 && (
                <Badge className="bg-primary/20 text-primary border-0">
                  {selectedGroup.count} requests
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.content_type} • All users who requested this title
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-3">
              {selectedGroup.requests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {req.user_id.slice(0, 8)}...
                    </p>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleString()}
                  </p>
                  {req.admin_note && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{req.admin_note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>
              This will deny all {selectedGroup?.count || 0} request(s) for "{selectedGroup?.title}" and notify all users.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for denial..."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDenyDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedGroup && denyMutation.mutate({ group: selectedGroup, reason: denyReason })}
              disabled={denyMutation.isPending}
            >
              {denyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deny All ({selectedGroup?.requests.filter(r => r.status === 'pending').length || 0})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
