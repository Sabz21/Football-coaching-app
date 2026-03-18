'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trophy, Calendar, Clock, MapPin, Edit2, Users, Target, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

const COMPETITION_TYPES = [
  { value: 'FRIENDLY', labelFr: 'Amical', labelEn: 'Friendly' },
  { value: 'LEAGUE', labelFr: 'Championnat', labelEn: 'League' },
  { value: 'CUP', labelFr: 'Coupe', labelEn: 'Cup' },
];

const CUP_ROUNDS = [
  { value: 'GROUP', labelFr: 'Phase de poule', labelEn: 'Group Stage' },
  { value: 'ROUND_OF_16', labelFr: '16e de finale', labelEn: 'Round of 16' },
  { value: 'QUARTER', labelFr: 'Quarts de finale', labelEn: 'Quarter Finals' },
  { value: 'SEMI', labelFr: 'Demi-finale', labelEn: 'Semi Final' },
  { value: 'FINAL', labelFr: 'Finale', labelEn: 'Final' },
];

export default function TeamMatchDetailPage() {
  const router = useRouter();
  const { teamId, matchId } = useParams();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [scorers, setScorers] = useState<Array<{ playerId: string; goals: number; assists: number }>>([]);
  const [manOfMatch, setManOfMatch] = useState<string | null>(null);

  // Fetch match
  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const res = await api.get(`/matches/${matchId}`);
      return res.data;
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

  // Initialize form data when match loads
  useEffect(() => {
    if (match) {
      setFormData({
        opponent: match.opponent || '',
        date: match.date ? match.date.split('T')[0] : '',
        time: match.time || '',
        location: match.location || '',
        isHome: match.isHome ?? true,
        competitionType: match.competitionType || 'FRIENDLY',
        cupRound: match.cupRound || '',
        leagueMatchday: match.leagueMatchday || '',
        goalsFor: match.goalsFor ?? '',
        goalsAgainst: match.goalsAgainst ?? '',
        status: match.status || 'SCHEDULED',
        preMatchNotes: match.preMatchNotes || '',
        postMatchNotes: match.postMatchNotes || '',
      });
      setManOfMatch(match.manOfMatchId || null);
      if (match.scorers) {
        setScorers(match.scorers);
      }
    }
  }, [match]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/matches/${matchId}`, {
        ...data,
        scorers,
        manOfMatchId: manOfMatch,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['matches', teamId] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update match');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateScorer = (playerId: string, field: 'goals' | 'assists', value: number) => {
    setScorers(prev => {
      const existing = prev.find(s => s.playerId === playerId);
      if (existing) {
        return prev.map(s => s.playerId === playerId ? { ...s, [field]: value } : s);
      } else {
        return [...prev, { playerId, goals: field === 'goals' ? value : 0, assists: field === 'assists' ? value : 0 }];
      }
    });
  };

  const getCompetitionLabel = () => {
    const type = COMPETITION_TYPES.find(c => c.value === match?.competitionType);
    if (!type) return locale === 'fr' ? 'Amical' : 'Friendly';
    
    let label = locale === 'fr' ? type.labelFr : type.labelEn;
    
    if (match?.competitionType === 'CUP' && match?.cupRound) {
      const round = CUP_ROUNDS.find(r => r.value === match.cupRound);
      if (round) {
        label += ` - ${locale === 'fr' ? round.labelFr : round.labelEn}`;
      }
    }
    
    if (match?.competitionType === 'LEAGUE' && match?.leagueMatchday) {
      label += ` - ${locale === 'fr' ? 'J' : 'MD'}${match.leagueMatchday}`;
    }
    
    return label;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{locale === 'fr' ? 'Match non trouvé' : 'Match not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'fr' ? 'Retour' : 'Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {match.isHome ? 'vs' : '@'} {match.opponent}
            </h1>
            <p className="text-muted-foreground">{formatDate(match.date)}</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Modifier' : 'Edit'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {locale === 'fr' ? 'Détails du match' : 'Match Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Adversaire' : 'Opponent'} *
                </label>
                <Input
                  value={formData.opponent}
                  onChange={(e) => updateField('opponent', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'fr' ? 'Heure' : 'Time'}</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateField('time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'fr' ? 'Lieu' : 'Location'}</label>
                <Input
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'fr' ? 'Domicile / Extérieur' : 'Home / Away'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('isHome', true)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      formData.isHome ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {locale === 'fr' ? '🏠 Domicile' : '🏠 Home'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('isHome', false)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      !formData.isHome ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {locale === 'fr' ? '✈️ Extérieur' : '✈️ Away'}
                  </button>
                </div>
              </div>

              {/* Competition Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'fr' ? 'Type de compétition' : 'Competition Type'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {COMPETITION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField('competitionType', type.value)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        formData.competitionType === type.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {locale === 'fr' ? type.labelFr : type.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cup Round */}
              {formData.competitionType === 'CUP' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'fr' ? 'Tour de coupe' : 'Cup Round'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CUP_ROUNDS.map((round) => (
                      <button
                        key={round.value}
                        type="button"
                        onClick={() => updateField('cupRound', round.value)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          formData.cupRound === round.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {locale === 'fr' ? round.labelFr : round.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* League Matchday */}
              {formData.competitionType === 'LEAGUE' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'fr' ? 'Journée' : 'Matchday'}</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    placeholder={locale === 'fr' ? 'Numéro de journée (1-60)' : 'Matchday number (1-60)'}
                    value={formData.leagueMatchday}
                    onChange={(e) => updateField('leagueMatchday', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score & Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {locale === 'fr' ? 'Résultat' : 'Result'}
              </CardTitle>
              <CardDescription>
                {locale === 'fr' ? 'Score final du match' : 'Final match score'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'fr' ? 'Statut' : 'Status'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('status', 'SCHEDULED')}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      formData.status === 'SCHEDULED' ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-border hover:border-blue-500/50'
                    }`}
                  >
                    {locale === 'fr' ? 'Prévu' : 'Scheduled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('status', 'IN_PROGRESS')}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      formData.status === 'IN_PROGRESS' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-border hover:border-yellow-500/50'
                    }`}
                  >
                    {locale === 'fr' ? 'En cours' : 'In Progress'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('status', 'COMPLETED')}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      formData.status === 'COMPLETED' ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-border hover:border-green-500/50'
                    }`}
                  >
                    {locale === 'fr' ? 'Terminé' : 'Completed'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'fr' ? 'Buts marqués' : 'Goals For'}</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.goalsFor}
                    onChange={(e) => updateField('goalsFor', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'fr' ? 'Buts encaissés' : 'Goals Against'}</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.goalsAgainst}
                    onChange={(e) => updateField('goalsAgainst', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scorers & Assists */}
          {team?.players && team.players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {locale === 'fr' ? 'Buteurs & Passeurs' : 'Scorers & Assists'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {team.players.map((tp: any) => {
                    const player = tp.player || tp;
                    const scorer = scorers.find(s => s.playerId === player.id);
                    return (
                      <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {getInitials(player.firstName, player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                          <p className="text-xs text-muted-foreground">{player.position}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">⚽</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-14 h-8 text-center text-sm"
                              value={scorer?.goals || 0}
                              onChange={(e) => updateScorer(player.id, 'goals', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">🅰️</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-14 h-8 text-center text-sm"
                              value={scorer?.assists || 0}
                              onChange={(e) => updateScorer(player.id, 'assists', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Man of the Match */}
          {team?.players && team.players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {locale === 'fr' ? 'Homme du match' : 'Man of the Match'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {team.players.map((tp: any) => {
                    const player = tp.player || tp;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setManOfMatch(manOfMatch === player.id ? null : player.id)}
                        className={`p-3 rounded-xl border text-center transition-colors ${
                          manOfMatch === player.id 
                            ? 'border-yellow-500 bg-yellow-500/10' 
                            : 'border-border hover:border-yellow-500/50'
                        }`}
                      >
                        <Avatar className="w-10 h-10 mx-auto mb-1">
                          <AvatarFallback className={`text-sm ${manOfMatch === player.id ? 'bg-yellow-500/20 text-yellow-600' : 'bg-primary/20 text-primary'}`}>
                            {getInitials(player.firstName, player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium truncate">{player.firstName}</p>
                        {manOfMatch === player.id && <Star className="w-3 h-3 text-yellow-500 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'fr' ? 'Notes' : 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'fr' ? 'Notes après-match' : 'Post-match Notes'}</label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                  value={formData.postMatchNotes}
                  onChange={(e) => updateField('postMatchNotes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              {locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending 
                ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...') 
                : (locale === 'fr' ? 'Enregistrer' : 'Save')}
            </Button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Match Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {match.isHome ? (locale === 'fr' ? 'Domicile' : 'Home') : (locale === 'fr' ? 'Extérieur' : 'Away')}
                    </p>
                    <h2 className="text-2xl font-bold">{match.isHome ? 'vs' : '@'} {match.opponent}</h2>
                  </div>
                </div>
                {match.status === 'COMPLETED' && (
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      {match.goalsFor} - {match.goalsAgainst}
                    </div>
                    <Badge className={
                      match.goalsFor > match.goalsAgainst ? 'bg-green-500/20 text-green-500' :
                      match.goalsFor < match.goalsAgainst ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }>
                      {match.goalsFor > match.goalsAgainst ? (locale === 'fr' ? 'Victoire' : 'Win') :
                       match.goalsFor < match.goalsAgainst ? (locale === 'fr' ? 'Défaite' : 'Loss') :
                       (locale === 'fr' ? 'Nul' : 'Draw')}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(match.date)}</span>
                </div>
                {match.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatTime(match.time)}</span>
                  </div>
                )}
                {match.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{match.location}</span>
                  </div>
                )}
                <div>
                  <Badge variant="secondary">{getCompetitionLabel()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scorers */}
          {match.scorers && match.scorers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {locale === 'fr' ? 'Buteurs & Passeurs' : 'Scorers & Assists'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {match.scorers.filter((s: any) => s.goals > 0 || s.assists > 0).map((scorer: any) => (
                    <div key={scorer.playerId} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials(scorer.player?.firstName || '', scorer.player?.lastName || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{scorer.player?.firstName} {scorer.player?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {scorer.goals > 0 && (
                          <span className="flex items-center gap-1">
                            ⚽ {scorer.goals}
                          </span>
                        )}
                        {scorer.assists > 0 && (
                          <span className="flex items-center gap-1">
                            🅰️ {scorer.assists}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Man of the Match */}
          {match.manOfMatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {locale === 'fr' ? 'Homme du match' : 'Man of the Match'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-600">
                      {getInitials(match.manOfMatch.firstName, match.manOfMatch.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{match.manOfMatch.firstName} {match.manOfMatch.lastName}</p>
                    <p className="text-sm text-muted-foreground">{match.manOfMatch.position}</p>
                  </div>
                  <Star className="w-6 h-6 text-yellow-500 ml-auto" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {match.postMatchNotes && (
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fr' ? 'Notes' : 'Notes'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{match.postMatchNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
