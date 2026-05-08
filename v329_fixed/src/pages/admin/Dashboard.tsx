import { Film, Users, Crown, TrendingUp, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMovies } from '@/hooks/useMovies';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { BulkImport } from '@/components/admin/BulkImport';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: movies } = useMovies();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      const total = data?.length || 0;
      const premium = data?.filter(u => u.role === 'premium').length || 0;
      const admins = data?.filter(u => u.role === 'admin').length || 0;

      return { total, premium, admins };
    },
  });

  // Check if all movies are currently free
  const allMoviesFree = movies?.every(m => !m.is_premium) ?? false;

  const toggleAllMoviesFree = useMutation({
    mutationFn: async (makeFree: boolean) => {
      const { error } = await supabase
        .from('movies')
        .update({ is_premium: !makeFree })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;
    },
    onSuccess: (_, makeFree) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast({
        title: makeFree ? "All Movies Free" : "Premium Restored",
        description: makeFree 
          ? "All movies are now accessible to everyone." 
          : "Movies premium status has been restored.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update movies. Please try again.",
        variant: "destructive",
      });
    },
  });

  const stats = [
    {
      title: 'Total Movies',
      value: movies?.length || 0,
      icon: Film,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Users',
      value: usersData?.total || 0,
      icon: Users,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    {
      title: 'Premium Users',
      value: usersData?.premium || 0,
      icon: Crown,
      color: 'text-cg-gold',
      bgColor: 'bg-cg-gold/10',
    },
    {
      title: 'Premium Movies',
      value: movies?.filter(m => m.is_premium).length || 0,
      icon: TrendingUp,
      color: 'text-cg-premium',
      bgColor: 'bg-cg-premium/10',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Settings */}
      <Card className="glass mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-cg-gold" />
            Global Premium Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="all-free-toggle" className="text-base font-medium">
                All Movies Free
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all content becomes accessible to free users
              </p>
            </div>
            <div className="flex items-center gap-3">
              {toggleAllMoviesFree.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id="all-free-toggle"
                checked={allMoviesFree}
                onCheckedChange={(checked) => toggleAllMoviesFree.mutate(checked)}
                disabled={toggleAllMoviesFree.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/admin/movies"
              className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Film className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold">Manage Movies</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, or delete movies
              </p>
            </Link>
            <Link
              to="/admin/users"
              className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Users className="w-8 h-8 text-accent-foreground mb-2" />
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View and upgrade user accounts
              </p>
            </Link>
            <Link
              to="/admin/analytics"
              className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-cg-premium mb-2" />
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track views and engagement
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <BulkImport />
    </div>
  );
}
