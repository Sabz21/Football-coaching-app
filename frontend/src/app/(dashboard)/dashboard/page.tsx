'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { usersApi } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { SessionCard } from '@/components/sessions/session-card';
import { PlayerCardCompact } from '@/components/players/player-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (user?.role === 'COACH') {
    return <CoachDashboard />;
  }

  if (user?.role === 'PARENT') {
    return <ParentDashboard />;
  }

  return <div>Loading...</div>;
}

function CoachDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['coach-dashboard'],
    queryFn: usersApi.getCoachDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Players"
          value={data?.stats.totalPlayers || 0}
          subtitle={`${data?.stats.activePlayers || 0} active`}
          icon={Users}
        />
        <StatCard
          title="Upcoming Sessions"
          value={data?.stats.upcomingSessions || 0}
          subtitle="This week"
          icon={Calendar}
        />
        <StatCard
          title="Pending Bookings"
          value={data?.stats.pendingBookings || 0}
          subtitle="Awaiting confirmation"
          icon={AlertCircle}
        />
        <StatCard
          title="Completed Sessions"
          value={data?.stats.completedSessions || 0}
          subtitle="All time"
          icon={CheckCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.todaySessions && data.todaySessions.length > 0 ? (
              <div className="space-y-3">
                {data.todaySessions.map((session: any) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sessions scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Session Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentReports && data.recentReports.length > 0 ? (
              <div className="space-y-3">
                {data.recentReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">
                        {report.player.firstName} {report.player.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(report.session.date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Effort: {report.effortRating}/10</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent reports</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: usersApi.getParentDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your children's progress</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Your Children"
          value={data?.stats.totalChildren || 0}
          icon={Users}
        />
        <StatCard
          title="Upcoming Sessions"
          value={data?.stats.upcomingBookingsCount || 0}
          icon={Calendar}
        />
        <StatCard
          title="Completed Sessions"
          value={data?.stats.completedSessions || 0}
          icon={CheckCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Children */}
        <Card>
          <CardHeader>
            <CardTitle>Your Children</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.children && data.children.length > 0 ? (
              <div className="space-y-2">
                {data.children.map((child: any) => (
                  <PlayerCardCompact key={child.id} player={child} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No children registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {booking.player.firstName}
                      </span>
                      <Badge
                        variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(booking.session.date)} • {booking.session.location}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming sessions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-48 bg-secondary rounded animate-pulse" />
        <div className="h-5 w-64 bg-secondary rounded animate-pulse mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
