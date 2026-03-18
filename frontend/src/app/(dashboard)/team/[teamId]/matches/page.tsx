'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trophy, Calendar, MapPin, ArrowLeft, Filter } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate} from '@/lib/utils';

const COMPETITION_FILTERS = [
  { value: 'ALL', labelFr: 'Tous', labelEn: 'All' },
  { value: 'FRIENDLY', labelFr: 'Amical', labelEn: 'Friendly' },
  { value: 'LEAGUE', labelFr: 'Championnat', labelEn: 'League' },
  { value: 'CUP', labelFr: 'Coupe', labelEn: 'Cup' },
];

export default function TeamMatchesPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { locale } = useI18n();
  const [filter, setFilter] = useState('ALL');

  // Fetch team
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

  const filteredMatches = matches?.filter((m: any) => 
    filter === 'ALL' || m.competitionType === filter
  ) || [];

  const upcomingMatches = filteredMatches
    .filter((m: any) => m.status !== 'COMPLETED')
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedMatches = filteredMatches
    .filter((m: any) => m.status === 'COMPLETED')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCompetitionBadge = (match: any) => {
    if (match.competitionType === 'LEAGUE') {
      const label = locale === 'fr' ? `Champ. J${match.leagueMatchday || ''}` : `League MD${match.leagueMatchday || ''}`;
      return { label, color: 'bg-blue-500/20 text-blue-500' };
    }
    if (match.competitionType === 'CUP') {
      return { label: locale === 'fr' ? 'Coupe' : 'Cup', color: 'bg-yellow-500/20 text-yellow-500' };
    }
    return { label: locale === 'fr' ? 'Amical' : 'Friendly', color: 'bg-gray-500/20 text-gray-500' };
  };

  const getResultBadge = (match: any) => {
    if (match.status !== 'COMPLETED') return null;
    const goalsFor = match.goalsFor ?? 0;
    const goalsAgainst = match.goalsAgainst ?? 0;
    if (goalsFor > goalsAgainst) return { label: locale === 'fr' ? 'Victoire' : 'Win', color: 'bg-green-500/20 text-green-500' };
    if (goalsFor < goalsAgainst) return { label: locale === 'fr' ? 'Défaite' : 'Loss', color: 'bg-red-500/20 text-red-500' };
    return { label: locale === 'fr' ? 'Nul' : 'Draw', color: 'bg-yellow-500/20 text-yellow-500' };
  };

  // Stats
  const completed = matches?.filter((m: any) => m.status === 'COMPLETED') || [];
  const wins = completed.filter((m: any) => (m.goalsFor ?? 0) > (m.goalsAgainst ?? 0)).length;
  const draws = completed.filter((m: any) => (m.goalsFor ?? 0) === (m.goalsAgainst ?? 0)).length;
  const losses = completed.filter((m: any) => (m.goalsFor ?? 0) < (m.goalsAgainst ?? 0)).length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {locale === 'fr' ? 'Matchs' : 'Matches'} - {team?.name}
            </h1>
            <p className="text-muted-foreground">
              {locale === 'fr' ? 'Tous les matchs de votre équipe' : 'All your team matches'}
            </p>
          </div>
        </div>
        <Link href={`/team/${teamId}/matches/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouveau match' : 'New Match'}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{matches?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'Matchs' : 'Matches'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{wins}</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'Victoires' : 'Wins'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{draws}</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'Nuls' : 'Draws'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{losses}</p>
            <p className="text-sm text-muted-foreground">
              {locale === 'fr' ? 'Défaites' : 'Losses'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {COMPETITION_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === f.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {locale === 'fr' ? f.labelFr : f.labelEn}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {locale === 'fr' ? 'Matchs à venir' : 'Upcoming Matches'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingMatches.map((match: any) => {
                    const badge = getCompetitionBadge(match);
                    return (
                      <Link
                        key={match.id}
                        href={`/team/${teamId}/matches/${match.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {match.isHome ? 'vs' : '@'} {match.opponent}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(match.date)}
                            </span>
                            {match.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {match.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={badge.color}>{badge.label}</Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  {locale === 'fr' ? 'Matchs terminés' : 'Completed Matches'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedMatches.map((match: any) => {
                    const badge = getCompetitionBadge(match);
                    const result = getResultBadge(match);
                    return (
                      <Link
                        key={match.id}
                        href={`/team/${teamId}/matches/${match.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {match.isHome ? 'vs' : '@'} {match.opponent}
                            </p>
                            <span className="font-bold">
                              {match.goalsFor} - {match.goalsAgainst}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(match.date)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={badge.color}>{badge.label}</Badge>
                          {result && <Badge className={result.color}>{result.label}</Badge>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {filteredMatches.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">
                  {locale === 'fr' ? 'Aucun match' : 'No matches yet'}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  {locale === 'fr' ? 'Planifiez votre premier match' : 'Schedule your first match'}
                </p>
                <Link href={`/team/${teamId}/matches/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Nouveau match' : 'New Match'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
