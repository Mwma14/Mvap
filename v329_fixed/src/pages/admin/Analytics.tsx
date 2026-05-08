import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Eye, Users, Film, Clock } from 'lucide-react';
import { useViewAnalytics, useMostViewedMovies } from '@/hooks/useTrending';
import { useMovies } from '@/hooks/useMovies';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--cg-gold))', 'hsl(var(--cg-premium))', 'hsl(var(--cg-success))', 'hsl(var(--muted-foreground))'];

export default function Analytics() {
  const { data: viewAnalytics, isLoading: viewsLoading } = useViewAnalytics();
  const { data: mostViewed } = useMostViewedMovies(10);
  const { data: allMovies } = useMovies();

  // Get user engagement stats
  const { data: engagementStats } = useQuery({
    queryKey: ['admin', 'engagement-stats'],
    queryFn: async () => {
      // Get active users (users who watched something in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activeUsers, error: activeError } = await supabase
        .from('watch_history')
        .select('user_id')
        .gte('watched_at', sevenDaysAgo.toISOString());

      if (activeError) throw activeError;

      const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id) || []);

      // Get total watch history entries
      const { count: totalWatches, error: watchError } = await supabase
        .from('watch_history')
        .select('*', { count: 'exact', head: true });

      if (watchError) throw watchError;

      // Get total ratings
      const { count: totalRatings, error: ratingError } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true });

      if (ratingError) throw ratingError;

      return {
        activeUsersLast7Days: uniqueActiveUsers.size,
        totalWatches: totalWatches || 0,
        totalRatings: totalRatings || 0,
      };
    },
  });

  // Calculate category distribution
  const categoryData = allMovies?.reduce((acc, movie) => {
    const categories = movie.category || [];
    categories.forEach((cat: string) => {
      const existing = acc.find(c => c.name === cat);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: cat, value: 1 });
      }
    });
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Most viewed movies chart data
  const viewChartData = mostViewed?.map(movie => ({
    name: movie.title.length > 15 ? movie.title.substring(0, 15) + '...' : movie.title,
    views: movie.view_count,
    weekViews: movie.weekly_views,
  })) || [];

  const stats = [
    {
      title: 'Total Views',
      value: viewAnalytics?.totalViews || 0,
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Weekly Views',
      value: viewAnalytics?.weeklyViews || 0,
      icon: TrendingUp,
      color: 'text-cg-gold',
      bgColor: 'bg-cg-gold/10',
    },
    {
      title: 'Active Users (7d)',
      value: engagementStats?.activeUsersLast7Days || 0,
      icon: Users,
      color: 'text-cg-premium',
      bgColor: 'bg-cg-premium/10',
    },
    {
      title: 'Total Ratings',
      value: engagementStats?.totalRatings || 0,
      icon: Film,
      color: 'text-cg-success',
      bgColor: 'bg-cg-success/10',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Analytics Dashboard</h1>

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
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Viewed Movies Chart */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Viewed Movies
            </CardTitle>
            <CardDescription>Top 10 movies by total views</CardDescription>
          </CardHeader>
          <CardContent>
            {viewChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={viewChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No view data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-cg-gold" />
              Content by Category
            </CardTitle>
            <CardDescription>Distribution of movies across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Views Trend */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cg-premium" />
            Weekly Performance
          </CardTitle>
          <CardDescription>Views this week vs total views for top movies</CardDescription>
        </CardHeader>
        <CardContent>
          {viewChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="views" name="Total Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="weekViews" name="This Week" fill="hsl(var(--cg-gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No view data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
