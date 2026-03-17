'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trophy, Calendar, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getMatchResult, getResultBadgeColor } from '@/lib/utils';

export default function TeamMatchesPage() {
  const { teamId } = useParams();
  const { t, locale } = useI18n();

  // Fetch team info
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Fetch matches
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const res = await api.get('/matches', { params: { teamId } });
      return res.data;
    },
  });

  const upcomingMatches = matches?.filter((m: any) => m.status !== 'COMPLETED') || [];
  const completedMatches = matches?.filter((m: any) => m.status === 'COMPLETED') || [];

  // Calculate stats
  const stats = {
    played: completedMatches.length,
    wins: completedMatches.filter((m: any) => (m.goalsFor || 0) > (m.goalsAgainst || 0)).length,
    draws: completedMatches.filter((m: any) => m.goalsFor === m.goalsAgainst).length,
    losses: completedMatches.filter((m: any) => (m.goalsFor || 0) < (m.goalsAgainst || 0)).length,
    goalsFor: completedMatches.reduce((sum: number, m: any) => sum + (m.goalsFor || 0), 0),
    goalsAgainst: completedMatches.reduce((sum: number, m: any) => sum + (m.goalsAgainst || 0), 0),
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Matchs' : 'Matches'} - {team?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'fr' ? 'Gérez les matchs de votre équipe' : 'Manage your team matches'}
          </p>
        </div>
        <Link href={`/team/${teamId}/matches/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouveau match' : 'New Match'}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.played}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Joués' : 'Played'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Victoires' : 'Wins'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.draws}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Nuls' : 'Draws'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Défaites' : 'Losses'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.goalsFor}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Buts +' : 'Goals For'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.goalsAgainst}</p>
            <p className="text-xs text-muted-foreground">{locale === 'fr' ? 'Buts -' : 'Goals Against'}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches?.length > 0 ? (
        <div className="space-y-8">
          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {locale === 'fr' ? 'À venir' : 'Upcoming'}
              </h2>
              <div className="space-y-3">
                {upcomingMatches.map((match: any) => (
                  <Link key={match.id} href={`/team/${teamId}/matches/${match.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{formatDate(match.date)}</span>
                                {match.time && <span>{formatTime(match.time)}</span>}
                                {match.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {match.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {match.isHome ? (locale === 'fr' ? 'Dom' : 'Home') : (locale === 'fr' ? 'Ext' : 'Away')}
                            </Badge>
                            {match.competition && (
                              <Badge variant="secondary">{match.competition}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {locale === 'fr' ? 'Terminés' : 'Completed'}
              </h2>
              <div className="space-y-3">
                {completedMatches.map((match: any) => {
                  const result = getMatchResult(match.goalsFor, match.goalsAgainst);
                  return (
                    <Link key={match.id} href={`/team/${teamId}/matches/${match.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(match.date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getResultBadgeColor(result)}>
                                {match.goalsFor} - {match.goalsAgainst}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {locale === 'fr' ? 'Aucun match' : 'No matches yet'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {locale === 'fr' ? 'Planifiez votre premier match' : 'Schedule your first match'}
            </p>
            <Link href={`/team/${teamId}/matches/new`} className="mt-4">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Nouveau match' : 'New Match'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
