'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { usersApi } from '@/lib/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { SessionCard } from '@/components/sessions/session-card';
import { PlayerCardCompact } from '@/components/players/player-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();

  if (user?.role === 'COACH') {
    return <CoachDashboard />;
  }

  if (user?.role === 'PARENT') {
    return <ParentDashboard />;
  }

  return <div>Loading...</div>;
}

function CoachDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  
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
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
      </div>

      {/* Stats Grid - Now Clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.totalPlayers')}
          value={data?.stats.totalPlayers || 0}
          subtitle={`${data?.stats.activePlayers || 0} ${t('dashboard.activePlayers')}`}
          icon={Users}
          href="/players"
        />
        <StatCard
          title={t('dashboard.upcomingSessions')}
          value={data?.stats.upcomingSessions || 0}
          subtitle={t('dashboard.thisWeek')}
          icon={Calendar}
          href="/sessions"
        />
        <StatCard
          title={t('dashboard.pendingBookings')}
          value={data?.stats.pendingBookings || 0}
          subtitle={t('dashboard.awaitingConfirmation')}
          icon={AlertCircle}
          href="/bookings"
        />
        <StatCard
          title={t('dashboard.completedSessions')}
          value={data?.stats.completedSessions || 0}
          subtitle={t('dashboard.allTime')}
          icon={CheckCircle}
          href="/performance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions - Clickable */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t('dashboard.todaySessions')}
            </CardTitle>
            <Link href="/sessions" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {data?.todaySessions && data.todaySessions.length > 0 ? (
              <div className="space-y-3">
                {data.todaySessions.map((session: any) => (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/sessions/${session.id}`)}
                    className="cursor-pointer"
                  >
                    <SessionCard session={session} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noSessionsToday')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('dashboard.recentReports')}
            </CardTitle>
            <Link href="/performance" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentReports && data.recentReports.length > 0 ? (
              <div className="space-y-3">
                {data.recentReports.map((report: any) => (
                  <Link
                    key={report.id}
                    href={`/players/${report.player.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
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
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.noRecentReports')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  
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
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">Track your children's progress</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Your Children"
          value={data?.stats.totalChildren || 0}
          icon={Users}
          href="/players"
        />
        <StatCard
          title={t('dashboard.upcomingSessions')}
          value={data?.stats.upcomingBookingsCount || 0}
          icon={Calendar}
          href="/bookings"
        />
        <StatCard
          title={t('dashboard.completedSessions')}
          value={data?.stats.completedSessions || 0}
          icon={CheckCircle}
          href="/performance"
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.upcomingSessions')}</CardTitle>
            <Link href="/bookings" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => router.push(`/sessions/${booking.session.id}`)}
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

      {/* Find a Coach Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Find a Coach</h3>
              <p className="text-muted-foreground">Browse coaches, read reviews, and book sessions</p>
            </div>
            <Link
              href="/coaches"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Coaches →
            </Link>
          </div>
        </CardContent>
      </Card>
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
