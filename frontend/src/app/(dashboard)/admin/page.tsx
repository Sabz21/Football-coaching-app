'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Star, 
  Award,
  Calendar,
  Search,
  Filter,
  Crown,
  Medal,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials, formatNumber } from '@/lib/utils';

// Tier system configuration
const COACH_TIERS = [
  { name: 'Bronze', minPlayers: 0, minSessions: 0, icon: '🥉', color: 'text-orange-400' },
  { name: 'Silver', minPlayers: 5, minSessions: 20, icon: '🥈', color: 'text-gray-400' },
  { name: 'Gold', minPlayers: 15, minSessions: 50, icon: '🥇', color: 'text-yellow-400' },
  { name: 'Platinum', minPlayers: 30, minSessions: 100, icon: '💎', color: 'text-cyan-400' },
  { name: 'Diamond', minPlayers: 50, minSessions: 200, icon: '👑', color: 'text-purple-400' },
  { name: 'Elite', minPlayers: 100, minSessions: 500, icon: '🏆', color: 'text-primary' },
];

function getCoachTier(players: number, sessions: number) {
  for (let i = COACH_TIERS.length - 1; i >= 0; i--) {
    if (players >= COACH_TIERS[i].minPlayers && sessions >= COACH_TIERS[i].minSessions) {
      return COACH_TIERS[i];
    }
  }
  return COACH_TIERS[0];
}

function getNextTier(players: number, sessions: number) {
  const currentTier = getCoachTier(players, sessions);
  const currentIndex = COACH_TIERS.findIndex(t => t.name === currentTier.name);
  if (currentIndex < COACH_TIERS.length - 1) {
    return COACH_TIERS[currentIndex + 1];
  }
  return null;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  // Check if user is super admin
  // In production, this would be a separate role check
  const isSuperAdmin = user?.email === 'jcsabbagh02@gmail.com';

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // This would be a dedicated admin endpoint
      const response = await api.get('/admin/overview');
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['admin-coaches', search],
    queryFn: async () => {
      const response = await api.get('/admin/coaches', { params: { search } });
      return response.data;
    },
    enabled: isSuperAdmin,
  });

  // Mock data for demo
  const mockStats = {
    totalCoaches: 24,
    totalPlayers: 342,
    totalSessions: 1250,
    totalRevenue: 45600,
    activeCoaches: 18,
    avgRating: 4.7,
  };

  const mockCoaches = [
    { 
      id: '1', 
      firstName: 'Marcus', 
      lastName: 'Williams', 
      email: 'marcus@example.com',
      avatar: null,
      players: 45,
      sessions: 180,
      rating: 4.9,
      reviews: 32,
      revenue: 12500,
    },
    { 
      id: '2', 
      firstName: 'Sarah', 
      lastName: 'Johnson', 
      email: 'sarah@example.com',
      avatar: null,
      players: 28,
      sessions: 95,
      rating: 4.7,
      reviews: 21,
      revenue: 8200,
    },
    { 
      id: '3', 
      firstName: 'David', 
      lastName: 'Chen', 
      email: 'david@example.com',
      avatar: null,
      players: 12,
      sessions: 45,
      rating: 4.5,
      reviews: 15,
      revenue: 4100,
    },
  ];

  const displayCoaches = coaches || mockCoaches;
  const stats = adminStats || mockStats;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="w-8 h-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Manage coaches and view platform statistics</p>
      </div>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Coaches"
          value={stats.totalCoaches}
          subtitle={`${stats.activeCoaches} active`}
          icon={Users}
        />
        <StatCard
          title="Total Players"
          value={formatNumber(stats.totalPlayers)}
          icon={Target}
        />
        <StatCard
          title="Total Sessions"
          value={formatNumber(stats.totalSessions)}
          icon={Calendar}
        />
        <StatCard
          title="Avg. Coach Rating"
          value={stats.avgRating.toFixed(1)}
          subtitle="out of 5.0"
          icon={Star}
        />
      </div>

      <Tabs defaultValue="coaches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="coaches">Coaches</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="tiers">Tier System</TabsTrigger>
        </TabsList>

        {/* Coaches Tab */}
        <TabsContent value="coaches">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Coaches</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search coaches..."
                      className="pl-10 w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayCoaches.map((coach: any) => {
                  const tier = getCoachTier(coach.players, coach.sessions);
                  
                  return (
                    <div
                      key={coach.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={coach.avatar} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(coach.firstName, coach.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {coach.firstName} {coach.lastName}
                            </p>
                            <span className={tier.color}>{tier.icon}</span>
                            <Badge variant="secondary">{tier.name}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{coach.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold">{coach.players}</p>
                          <p className="text-xs text-muted-foreground">Players</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{coach.sessions}</p>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {coach.rating}
                          </p>
                          <p className="text-xs text-muted-foreground">{coach.reviews} reviews</p>
                        </div>
                        <Link href={`/coaches/${coach.id}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Most Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Most Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...displayCoaches]
                    .sort((a: any, b: any) => b.players - a.players)
                    .slice(0, 5)
                    .map((coach: any, index: number) => (
                      <div key={coach.id} className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(coach.firstName, coach.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{coach.firstName} {coach.lastName}</span>
                        <Badge>{coach.players} players</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Highest Rated */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Highest Rated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...displayCoaches]
                    .sort((a: any, b: any) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((coach: any, index: number) => (
                      <div key={coach.id} className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(coach.firstName, coach.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{coach.firstName} {coach.lastName}</span>
                        <Badge className="gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {coach.rating}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tier System Tab */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Coach Tier System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Coaches earn tiers based on their number of players and completed sessions.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {COACH_TIERS.map((tier) => (
                  <div
                    key={tier.name}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{tier.icon}</span>
                      <div>
                        <h3 className={`font-bold ${tier.color}`}>{tier.name}</h3>
                        <p className="text-xs text-muted-foreground">Tier</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Min Players</span>
                        <span className="font-medium">{tier.minPlayers}+</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Min Sessions</span>
                        <span className="font-medium">{tier.minSessions}+</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
