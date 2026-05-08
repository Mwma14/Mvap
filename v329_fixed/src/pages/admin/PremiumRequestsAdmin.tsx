import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Shield, Check, X, Loader2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
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
import {
  usePremiumRequests,
  useApprovePremiumRequest,
  useDenyPremiumRequest,
  PremiumRequest,
} from '@/hooks/usePremiumRequests';

export default function PremiumRequestsAdmin() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<PremiumRequest | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyDialog, setShowDenyDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: requests, isLoading } = usePremiumRequests(statusFilter);
  const approveMutation = useApprovePremiumRequest();
  const denyMutation = useDenyPremiumRequest();

  const handleApprove = (request: PremiumRequest) => {
    if (!user) return;
    approveMutation.mutate({ requestId: request.id, adminId: user.id });
  };

  const handleDeny = () => {
    if (!user || !selectedRequest) return;
    denyMutation.mutate(
      { requestId: selectedRequest.id, adminId: user.id, reason: denyReason || 'Request denied' },
      {
        onSuccess: () => {
          setShowDenyDialog(false);
          setDenyReason('');
          setSelectedRequest(null);
        },
      }
    );
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading requests..." />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 sm:w-8 sm:h-8" />
          Premium Requests
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
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!requests || requests.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center text-muted-foreground">
            No {statusFilter === 'all' ? '' : statusFilter} requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{request.user_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(request as any).premium_type ? `${((request as any).premium_type as string).charAt(0).toUpperCase() + ((request as any).premium_type as string).slice(1)} • ` : ''}{request.plan_duration} • {request.plan_price}
                      {request.payment_method && ` • ${request.payment_method}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      TxID: {request.transaction_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {statusBadge(request.status)}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            onClick={() => handleApprove(request)}
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
                              setSelectedRequest(request);
                              setShowDenyDialog(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>Premium renewal request information</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">User</p>
                <p className="text-sm font-medium">{selectedRequest.user_email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan Type</p>
                <p className="text-sm font-medium capitalize">{(selectedRequest as any)?.premium_type || 'gold'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm">{selectedRequest.plan_duration} — {selectedRequest.plan_price}</p>
              </div>
              {selectedRequest.payment_method && (
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium">{selectedRequest.payment_method}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono">{selectedRequest.transaction_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                {statusBadge(selectedRequest.status)}
              </div>
              {selectedRequest.screenshot_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Screenshot</p>
                  <img src={selectedRequest.screenshot_url} alt="Payment screenshot" className="w-full rounded-lg border border-border" />
                </div>
              )}
              {selectedRequest.admin_note && (
                <div>
                  <p className="text-xs text-muted-foreground">Admin Note</p>
                  <p className="text-sm">{selectedRequest.admin_note}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>Provide a reason for denying this request</DialogDescription>
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
              onClick={handleDeny}
              disabled={denyMutation.isPending}
            >
              {denyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Deny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
