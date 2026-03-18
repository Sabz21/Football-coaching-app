'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Target, Star, Users, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

const COMPETITION_FILTERS = [
  { value: 'ALL', labelFr: 'Tous', labelEn: 'All' },
  { value: 'FRIENDLY', labelFr: 'Amical', labelEn: 'Friendly' },
  { value: 'LEAGUE', labelFr: 'Championnat', labelEn: 'League' },
  { value: 'CUP', labelFr: 'Coupe', labelEn: 'Cup' },
];

interface PlayerStats {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  manOfMatch: number;
}

export default function TeamStatsPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { locale } = useI18n();
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'goals' | 'assists' | 'matchesPlayed' | 'manOfMatch'>('goals');

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

  // Calculate player stats
  const playerStats: PlayerStats[] = (() => {
    if (!matches || !team?.players) return [];

    // Filter matches by competition type
    const filteredMatches = filter === 'ALL' 
      ? matches.filter((m: any) => m.status === 'COMPLETED')
      : matches.filter((m: any) => m.status === 'COMPLETED' && m.competitionType === filter);

    // Build stats map
    const statsMap = new Map<string, PlayerStats>();

    // Initialize all players
    team.players.forEach((tp: any) => {
      const player = tp.player || tp;
      statsMap.set(player.id, {
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position || '',
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        manOfMatch: 0,
      });
    });

    // Aggregate stats from matches
    filteredMatches.forEach((match: any) => {
      // Count goals and assists from scorers
      if (match.scorers) {
        match.scorers.forEach((scorer: any) => {
          const stats = statsMap.get(scorer.playerId);
          if (stats) {
            stats.goals += scorer.goals || 0;
            stats.assists += scorer.assists || 0;
            if (scorer.goals > 0 || scorer.assists > 0) {
              stats.matchesPlayed += 1;
            }
          }
        });
      }

      // Count man of the match
      if (match.manOfMatchId) {
        const stats = statsMap.get(match.manOfMatchId);
        if (stats) {
          stats.manOfMatch += 1;
        }
      }
    });

    // Convert to array and sort
    return Array.from(statsMap.values())
      .sort((a, b) => b[sortBy] - a[sortBy]);
  })();

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Statistiques Joueurs' : 'Player Statistics'} - {team?.name}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Classement et performances des joueurs' : 'Player rankings and performance'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {locale === 'fr' ? 'Type de compétition' : 'Competition Type'}
              </p>
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
            <div>
              <p className="text-sm font-medium mb-2">
                {locale === 'fr' ? 'Trier par' : 'Sort by'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortBy('goals')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    sortBy === 'goals' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  ⚽ {locale === 'fr' ? 'Buts' : 'Goals'}
                </button>
                <button
                  onClick={() => setSortBy('assists')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    sortBy === 'assists' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  🅰️ {locale === 'fr' ? 'Passes D' : 'Assists'}
                </button>
                <button
                  onClick={() => setSortBy('matchesPlayed')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    sortBy === 'matchesPlayed' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  📊 {locale === 'fr' ? 'Matchs' : 'Matches'}
                </button>
                <button
                  onClick={() => setSortBy('manOfMatch')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    sortBy === 'manOfMatch' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  ⭐ {locale === 'fr' ? 'HDM' : 'MOTM'}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {playerStats.reduce((sum, p) => sum + p.goals, 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              ⚽ {locale === 'fr' ? 'Buts totaux' : 'Total Goals'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">
              {playerStats.reduce((sum, p) => sum + p.assists, 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              🅰️ {locale === 'fr' ? 'Passes D totales' : 'Total Assists'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {matches?.filter((m: any) => m.status === 'COMPLETED' && (filter === 'ALL' || m.competitionType === filter)).length || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              📊 {locale === 'fr' ? 'Matchs joués' : 'Matches Played'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {playerStats.reduce((sum, p) => sum + p.manOfMatch, 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              ⭐ {locale === 'fr' ? 'Hommes du match' : 'MOTM Awards'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : playerStats.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Classement' : 'Leaderboard'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-5">{locale === 'fr' ? 'Joueur' : 'Player'}</div>
                <div className="col-span-2 text-center">⚽</div>
                <div className="col-span-2 text-center">🅰️</div>
                <div className="col-span-1 text-center">📊</div>
                <div className="col-span-1 text-center">⭐</div>
              </div>

              {/* Rows */}
              {playerStats.map((player, index) => (
                <div 
                  key={player.playerId} 
                  className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center ${
                    index < 3 ? 'bg-primary/5' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="col-span-1 text-lg font-bold">
                    {getRankBadge(index)}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`text-sm ${index < 3 ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.firstName} {player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-lg font-bold ${sortBy === 'goals' ? 'text-primary' : ''}`}>
                      {player.goals}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-lg font-bold ${sortBy === 'assists' ? 'text-blue-500' : ''}`}>
                      {player.assists}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-lg font-bold ${sortBy === 'matchesPlayed' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {player.matchesPlayed}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-lg font-bold ${sortBy === 'manOfMatch' ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {player.manOfMatch}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {locale === 'fr' ? 'Aucune statistique' : 'No statistics yet'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {locale === 'fr' ? 'Les stats apparaîtront après les premiers matchs' : 'Stats will appear after completed matches'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
