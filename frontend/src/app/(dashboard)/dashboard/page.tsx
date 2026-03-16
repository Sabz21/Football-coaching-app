'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, UsersRound, Trophy, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, formatDate, formatTime, getMatchResult, getResultBadgeColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch today's sessions
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'today'],
    queryFn: async () => {
      const res = await api.get('/sessions', {
        params: { from: todayStr, to: todayStr },
      });
      return res.data;
    },
  });

  // Fetch players count
  const { data: players } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    },
  });

  // Fetch upcoming matches
  const { data: matches } = useQuery({
    queryKey: ['matches', 'upcoming'],
    queryFn: async () => {
      const res = await api.get('/matches', {
        params: { from: todayStr },
      });
      return res.data;
    },
  });

  const upcomingMatches = matches?.slice(0, 3) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your coaching today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/calendar">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </Link>
          <Link href="/players/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sessions</p>
                <p className="text-3xl font-bold mt-1">{sessions?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-3xl font-bold mt-1">{players?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teams</p>
                <p className="text-3xl font-bold mt-1">{teams?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <UsersRound className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Matches</p>
                <p className="text-3xl font-bold mt-1">{upcomingMatches.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Today's Sessions</CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {sessions?.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((session: any) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{session.title || 'Training Session'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)} • {session.location}
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {session.players?.slice(0, 3).map((sp: any) => (
                        <Avatar key={sp.player.id} className="w-8 h-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(sp.player.firstName, sp.player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {session.players?.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                          +{session.players.length - 3}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No sessions scheduled for today</p>
                <Link href="/calendar">
                  <Button variant="link" className="mt-2">
                    Schedule a session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Matches</CardTitle>
            <Link href="/matches">
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match: any) => {
                  const result = getMatchResult(match.goalsFor, match.goalsAgainst);
                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                          </p>
                          {match.status === 'COMPLETED' && (
                            <Badge className={getResultBadgeColor(result)}>
                              {match.goalsFor} - {match.goalsAgainst}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(match.date)} {match.time && `• ${formatTime(match.time)}`}
                        </p>
                      </div>
                      <Badge variant="outline">{match.team?.name}</Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming matches</p>
                <Link href="/matches/new">
                  <Button variant="link" className="mt-2">
                    Schedule a match
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
