'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { BarChart3, Trophy, Target, Hand, Star, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

type CompetitionFilter = 'all' | 'friendly' | 'league' | 'cup';

export default function TeamStatsPage() {
  const { teamId } = useParams();
  const { locale } = useI18n();
  const [filter, setFilter] = useState<CompetitionFilter>('all');

  // Fetch team info
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Fetch all matches with stats
  const { data: matches } = useQuery({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const res = await api.get('/matches', { params: { teamId } });
      return res.data;
    },
  });

  // Filter matches by competition type
  const filteredMatches = matches?.filter((m: any) => {
    if (m.status !== 'COMPLETED') return false;
    if (filter === 'all') return true;
    return m.competition === filter;
  }) || [];

  // Calculate player stats from filtered matches
  const calculatePlayerStats = () => {
    const statsMap: Record<string, {
      player: any;
      matches: number;
      goals: number;
      assists: number;
      motm: number;
    }> = {};

    filteredMatches.forEach((match: any) => {
      // Count MOTM
      if (match.manOfTheMatchId) {
        if (!statsMap[match.manOfTheMatchId]) {
          const player = team?.players?.find((tp: any) => tp.player.id === match.manOfTheMatchId)?.player;
          if (player) {
            statsMap[match.manOfTheMatchId] = {
              player,
              matches: 0,
              goals: 0,
              assists: 0,
              motm: 0,
            };
          }
        }
        if (statsMap[match.manOfTheMatchId]) {
          statsMap[match.manOfTheMatchId].motm++;
        }
      }

      // Count goals and assists
      match.playerStats?.forEach((ps: any) => {
        if (!statsMap[ps.playerId]) {
          statsMap[ps.playerId] = {
            player: ps.player,
            matches: 0,
            goals: 0,
            assists: 0,
            motm: 0,
          };
        }
        statsMap[ps.playerId].matches++;
        statsMap[ps.playerId].goals += ps.goals || 0;
        statsMap[ps.playerId].assists += ps.assists || 0;
      });
    });

    return Object.values(statsMap);
  };

  const playerStats = calculatePlayerStats();

  // Sort functions
  const topScorers = [...playerStats].sort((a, b) => b.goals - a.goals).filter(p => p.goals > 0);
  const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists).filter(p => p.assists > 0);
  const topMOTM = [...playerStats].sort((a, b) => b.motm - a.motm).filter(p => p.motm > 0);
  const mostMatches = [...playerStats].sort((a, b) => b.matches - a.matches);

  const filterOptions: { value: CompetitionFilter; labelFr: string; labelEn: string }[] = [
    { value: 'all', labelFr: 'Tous', labelEn: 'All' },
    { value: 'friendly', labelFr: 'Amical', labelEn: 'Friendly' },
    { value: 'league', labelFr: 'Championnat', labelEn: 'League' },
    { value: 'cup', labelFr: 'Coupe', labelEn: 'Cup' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Statistiques' : 'Statistics'} - {team?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'fr' ? 'Classement des joueurs par statistiques' : 'Player rankings by statistics'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {locale === 'fr' ? 'Filtrer par compétition' : 'Filter by competition'}
              </span>
            </div>
            <div className="flex gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {locale === 'fr' ? option.labelFr : option.labelEn}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {filteredMatches.length} {locale === 'fr' ? 'matchs joués' : 'matches played'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Scorers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              {locale === 'fr' ? 'Meilleurs buteurs' : 'Top Scorers'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScorers.length > 0 ? (
              <div className="space-y-3">
                {topScorers.slice(0, 10).map((stat, index) => (
                  <div
                    key={stat.player.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(stat.player.firstName, stat.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{stat.player.firstName} {stat.player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{stat.player.position}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500 text-lg px-3">
                      {stat.goals}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {locale === 'fr' ? 'Aucun buteur' : 'No scorers'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Assists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand className="w-5 h-5 text-blue-500" />
              {locale === 'fr' ? 'Meilleurs passeurs' : 'Top Assists'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topAssists.length > 0 ? (
              <div className="space-y-3">
                {topAssists.slice(0, 10).map((stat, index) => (
                  <div
                    key={stat.player.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(stat.player.firstName, stat.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{stat.player.firstName} {stat.player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{stat.player.position}</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-500 text-lg px-3">
                      {stat.assists}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {locale === 'fr' ? 'Aucun passeur' : 'No assists'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Man of the Match */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {locale === 'fr' ? 'Hommes du match' : 'Man of the Match'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMOTM.length > 0 ? (
              <div className="space-y-3">
                {topMOTM.slice(0, 10).map((stat, index) => (
                  <div
                    key={stat.player.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-600">
                        {getInitials(stat.player.firstName, stat.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{stat.player.firstName} {stat.player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{stat.player.position}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-600 text-lg px-3">
                      {stat.motm} ⭐
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {locale === 'fr' ? 'Aucune donnée' : 'No data'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Most Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              {locale === 'fr' ? 'Matchs joués' : 'Matches Played'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostMatches.length > 0 ? (
              <div className="space-y-3">
                {mostMatches.slice(0, 10).map((stat, index) => (
                  <div
                    key={stat.player.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                  >
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(stat.player.firstName, stat.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{stat.player.firstName} {stat.player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{stat.player.position}</p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-500 text-lg px-3">
                      {stat.matches}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {locale === 'fr' ? 'Aucune donnée' : 'No data'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
