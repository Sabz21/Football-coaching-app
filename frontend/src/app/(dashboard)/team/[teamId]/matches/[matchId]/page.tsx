'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trophy, Calendar, Clock, MapPin, Users, Star, Target, Hand } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatTime, getInitials, getMatchResult, getResultBadgeColor } from '@/lib/utils';

export default function TeamMatchDetailPage() {
  const { teamId, matchId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [error, setError] = useState('');

  // Result form state
  const [resultData, setResultData] = useState({
    goalsFor: 0,
    goalsAgainst: 0,
    manOfTheMatchId: '',
    postMatchNotes: '',
  });

  // Player stats state
  const [playerStats, setPlayerStats] = useState<Record<string, { goals: number; assists: number }>>({});

  // Fetch match
  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const res = await api.get(`/matches/${matchId}`);
      return res.data;
    },
    onSuccess: (data: any) => {
      setResultData({
        goalsFor: data.goalsFor || 0,
        goalsAgainst: data.goalsAgainst || 0,
        manOfTheMatchId: data.manOfTheMatchId || '',
        postMatchNotes: data.postMatchNotes || '',
      });
      // Initialize player stats
      const stats: Record<string, { goals: number; assists: number }> = {};
      data.playerStats?.forEach((ps: any) => {
        stats[ps.playerId] = { goals: ps.goals || 0, assists: ps.assists || 0 };
      });
      setPlayerStats(stats);
    },
  });

  // Fetch team players
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Update result mutation
  const updateResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/matches/${matchId}/result`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      setShowResultForm(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update result');
    },
  });

  const handleSaveResult = () => {
    // Build player stats array
    const statsArray = Object.entries(playerStats)
      .filter(([_, stats]) => stats.goals > 0 || stats.assists > 0)
      .map(([playerId, stats]) => ({
        playerId,
        goals: stats.goals,
        assists: stats.assists,
      }));

    updateResultMutation.mutate({
      ...resultData,
      playerStats: statsArray,
    });
  };

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists', value: number) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId] || { goals: 0, assists: 0 },
        [field]: Math.max(0, value),
      },
    }));
  };

  const getCompetitionLabel = () => {
    if (!match) return '';
    if (match.competition === 'friendly') return locale === 'fr' ? 'Amical' : 'Friendly';
    if (match.competition === 'league') {
      return `${locale === 'fr' ? 'Championnat' : 'League'} - ${locale === 'fr' ? 'J' : 'MD'}${match.competitionRound || ''}`;
    }
    if (match.competition === 'cup') {
      const rounds: Record<string, Record<string, string>> = {
        group: { fr: 'Phase de poules', en: 'Group Stage' },
        r16: { fr: '16e de finale', en: 'Round of 16' },
        qf: { fr: 'Quarts de finale', en: 'Quarter-finals' },
        sf: { fr: 'Demi-finale', en: 'Semi-final' },
        final: { fr: 'Finale', en: 'Final' },
      };
      return `${locale === 'fr' ? 'Coupe' : 'Cup'} - ${rounds[match.competitionRound]?.[locale] || match.competitionRound}`;
    }
    return match.competition;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{locale === 'fr' ? 'Match non trouvé' : 'Match not found'}</p>
      </div>
    );
  }

  const result = getMatchResult(match.goalsFor, match.goalsAgainst);
  const teamPlayers = team?.players?.map((tp: any) => tp.player) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {match.isHome ? 'vs' : '@'} {match.opponent}
          </h1>
          <p className="text-muted-foreground">{formatDate(match.date)}</p>
        </div>
        {match.status !== 'COMPLETED' && (
          <Button onClick={() => setShowResultForm(true)}>
            <Trophy className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Enregistrer résultat' : 'Record Result'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Match Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {match.isHome ? `${team?.name} vs ${match.opponent}` : `${match.opponent} vs ${team?.name}`}
                </p>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(match.date)}
                  </span>
                  {match.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(match.time)}
                    </span>
                  )}
                  {match.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {match.status === 'COMPLETED' ? (
                <div className="text-4xl font-bold">
                  <span className={result === 'win' ? 'text-green-500' : result === 'loss' ? 'text-red-500' : 'text-yellow-500'}>
                    {match.goalsFor}
                  </span>
                  <span className="text-muted-foreground mx-2">-</span>
                  <span>{match.goalsAgainst}</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {locale === 'fr' ? 'À venir' : 'Upcoming'}
                </Badge>
              )}
              <div className="mt-2 flex gap-2 justify-end">
                <Badge variant="outline">
                  {match.isHome ? (locale === 'fr' ? 'Domicile' : 'Home') : (locale === 'fr' ? 'Extérieur' : 'Away')}
                </Badge>
                {match.competition && (
                  <Badge variant="secondary">{getCompetitionLabel()}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Form Modal */}
      {showResultForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Enregistrer le résultat' : 'Record Result'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Entrez le score et les statistiques du match' : 'Enter the score and match statistics'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{team?.name}</p>
                <Input
                  type="number"
                  min="0"
                  className="w-24 text-center text-2xl font-bold"
                  value={resultData.goalsFor}
                  onChange={(e) => setResultData({ ...resultData, goalsFor: parseInt(e.target.value) || 0 })}
                />
              </div>
              <span className="text-2xl text-muted-foreground">-</span>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{match.opponent}</p>
                <Input
                  type="number"
                  min="0"
                  className="w-24 text-center text-2xl font-bold"
                  value={resultData.goalsAgainst}
                  onChange={(e) => setResultData({ ...resultData, goalsAgainst: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Player Stats */}
            <div className="space-y-3">
              <p className="font-medium">{locale === 'fr' ? 'Buteurs & Passeurs' : 'Scorers & Assists'}</p>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {teamPlayers.map((player: any) => (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium text-sm">
                      {player.firstName} {player.lastName}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          className="w-16 text-center"
                          value={playerStats[player.id]?.goals || 0}
                          onChange={(e) => updatePlayerStat(player.id, 'goals', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Hand className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          className="w-16 text-center"
                          value={playerStats[player.id]?.assists || 0}
                          onChange={(e) => updatePlayerStat(player.id, 'assists', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Man of the Match */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Homme du match' : 'Man of the Match'}
              </label>
              <select
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={resultData.manOfTheMatchId}
                onChange={(e) => setResultData({ ...resultData, manOfTheMatchId: e.target.value })}
              >
                <option value="">{locale === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                {teamPlayers.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.firstName} {player.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Match Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Notes après-match' : 'Post-match Notes'}
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                placeholder={locale === 'fr' ? 'Analyse du match...' : 'Match analysis...'}
                value={resultData.postMatchNotes}
                onChange={(e) => setResultData({ ...resultData, postMatchNotes: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowResultForm(false)}>
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button onClick={handleSaveResult} disabled={updateResultMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateResultMutation.isPending 
                  ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...') 
                  : (locale === 'fr' ? 'Enregistrer' : 'Save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Stats (if completed) */}
      {match.status === 'COMPLETED' && (
        <>
          {/* Man of the Match */}
          {match.manOfTheMatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {locale === 'fr' ? 'Homme du match' : 'Man of the Match'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-600">
                      {getInitials(match.manOfTheMatch.firstName, match.manOfTheMatch.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{match.manOfTheMatch.firstName} {match.manOfTheMatch.lastName}</p>
                    <p className="text-sm text-muted-foreground">{match.manOfTheMatch.position}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Stats */}
          {match.playerStats?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {locale === 'fr' ? 'Statistiques joueurs' : 'Player Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.playerStats
                    .filter((ps: any) => ps.goals > 0 || ps.assists > 0)
                    .map((ps: any) => (
                      <div key={ps.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {getInitials(ps.player.firstName, ps.player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 font-medium">
                          {ps.player.firstName} {ps.player.lastName}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          {ps.goals > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-green-500" />
                              {ps.goals}
                            </span>
                          )}
                          {ps.assists > 0 && (
                            <span className="flex items-center gap-1">
                              <Hand className="w-4 h-4 text-blue-500" />
                              {ps.assists}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Match Notes */}
          {match.postMatchNotes && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fr' ? 'Notes après-match' : 'Post-match Notes'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{match.postMatchNotes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Pre Match Notes */}
      {match.preMatchNotes && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'fr' ? 'Notes avant-match' : 'Pre-match Notes'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{match.preMatchNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
