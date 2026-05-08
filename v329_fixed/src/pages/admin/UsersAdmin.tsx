import { useState } from 'react';
import { Search, Crown, User, Shield, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';

type PremiumDuration = 'monthly' | 'yearly' | 'lifetime';

interface UserWithRole {
  user_id: string;
  role: AppRole;
  created_at: string;
  email: string | null;
  display_name: string | null;
  premium_type: string | null;
  premium_expires_at: string | null;
}

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PremiumDuration>('monthly');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      // Get all profiles first (open SELECT policy - always works)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, created_at');

      if (profilesError) throw profilesError;

      // Get all user roles (requires admin RLS policy)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at, premium_type, premium_expires_at');

      // Build a map of user_id -> role data for fast lookup
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r]));

      // Merge: use profiles as the source of truth for user list
      // profiles.user_id is the auth user id (matches user_roles.user_id)
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile: any) => {
        const roleData = roleMap.get(profile.user_id);
        return {
          user_id: profile.user_id,
          role: (roleData?.role as AppRole) || 'free_user',
          created_at: roleData?.created_at || profile.created_at,
          email: profile.email || null,
          display_name: profile.display_name || null,
          premium_type: roleData?.premium_type || null,
          premium_expires_at: roleData?.premium_expires_at || null,
        };
      });

      return usersWithRoles;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // If downgrading from premium, clear premium fields
      if (newRole === 'free_user') {
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: newRole,
            premium_type: null,
            premium_expires_at: null,
          } as any, { onConflict: 'user_id' });

        if (error) throw error;
      } else if (newRole === 'admin') {
        // Admin role - just update role
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: newRole } as any, { onConflict: 'user_id' });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const grantPremium = useMutation({
    mutationFn: async ({ userId, duration }: { userId: string; duration: PremiumDuration }) => {
      const now = new Date();
      let expiresAt: Date | null = null;

      if (duration === 'monthly') {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (duration === 'yearly') {
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
      // lifetime = null expires_at

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'premium',
          premium_type: duration,
          premium_expires_at: expiresAt?.toISOString() || null,
        } as any, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setPremiumDialogOpen(false);
      setSelectedUser(null);
      toast.success('Premium access granted');
    },
    onError: (error) => {
      toast.error('Failed to grant premium: ' + error.message);
    },
  });

  const handleRoleChange = (user: UserWithRole, newRole: AppRole) => {
    if (newRole === 'premium') {
      // Open dialog to select duration
      setSelectedUser(user);
      setPremiumDialogOpen(true);
    } else {
      updateRole.mutate({ userId: user.user_id, newRole });
    }
  };

  const handleGrantPremium = () => {
    if (selectedUser) {
      grantPremium.mutate({ userId: selectedUser.user_id, duration: selectedDuration });
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-cg-gold" />;
      case 'premium':
        return <Crown className="w-4 h-4 text-cg-premium" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPremiumStatus = (user: UserWithRole) => {
    if (user.role !== 'premium') return null;

    if (user.premium_type === 'lifetime') {
      return (
        <span className="text-xs text-cg-gold flex items-center gap-1">
          <Crown className="w-3 h-3" /> Lifetime
        </span>
      );
    }

    if (user.premium_expires_at) {
      const expiresAt = new Date(user.premium_expires_at);
      const isExpired = expiresAt < new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (isExpired) {
        return (
          <span className="text-xs text-destructive flex items-center gap-1">
            <Clock className="w-3 h-3" /> Expired
          </span>
        );
      }

      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {daysLeft} days left
        </span>
      );
    }

    return null;
  };

  const getDurationLabel = (duration: PremiumDuration) => {
    switch (duration) {
      case 'monthly':
        return '1 Month';
      case 'yearly':
        return '1 Year';
      case 'lifetime':
        return 'Lifetime';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted"
        />
      </div>

      {/* Users List - Card layout on mobile, Table on desktop */}
      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-border">
                {filteredUsers.map((user) => (
                  <div key={user.user_id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getRoleIcon(user.role)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{user.display_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email || 'N/A'}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-cg-gold/20 text-cg-gold'
                            : user.role === 'premium'
                            ? 'bg-cg-premium/20 text-cg-premium'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                        {getPremiumStatus(user) && <span className="ml-2">{getPremiumStatus(user)}</span>}
                      </div>
                      <Select
                        value={user.role}
                        onValueChange={(value: AppRole) => handleRoleChange(user, value)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="free_user">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span>{user.display_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-cg-gold/20 text-cg-gold'
                                : user.role === 'premium'
                                ? 'bg-cg-premium/20 text-cg-premium'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {user.role === 'admin' ? 'Admin' : user.role === 'premium' ? 'Premium' : 'Free'}
                          </span>
                        </TableCell>
                        <TableCell>{getPremiumStatus(user)}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(value: AppRole) => handleRoleChange(user, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="free_user">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Duration Dialog */}
      <Dialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-cg-gold" />
              Grant Premium Access
            </DialogTitle>
            <DialogDescription>
              Select the premium duration for {selectedUser?.display_name || selectedUser?.email || 'this user'}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 my-4">
            {(['monthly', 'yearly', 'lifetime'] as PremiumDuration[]).map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedDuration === duration
                    ? 'border-cg-gold bg-cg-gold/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <p className="font-semibold">{getDurationLabel(duration)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {duration === 'monthly' && '30 days'}
                  {duration === 'yearly' && '365 days'}
                  {duration === 'lifetime' && 'Never expires'}
                </p>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPremiumDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantPremium}
              disabled={grantPremium.isPending}
              className="bg-cg-gold text-black hover:bg-cg-gold/90"
            >
              {grantPremium.isPending ? 'Granting...' : 'Grant Premium'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
