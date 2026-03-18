'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trophy, Calendar, Clock, MapPin, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const COMPETITION_TYPES = [
  { value: 'FRIENDLY', labelFr: 'Amical', labelEn: 'Friendly', emoji: '🤝' },
  { value: 'LEAGUE', labelFr: 'Championnat', labelEn: 'League', emoji: '🏆' },
  { value: 'CUP', labelFr: 'Coupe', labelEn: 'Cup', emoji: '🏅' },
];

const CUP_ROUNDS = [
  { value: 'GROUP', labelFr: 'Phase de poule', labelEn: 'Group Stage' },
  { value: 'ROUND_OF_16', labelFr: '16e de finale', labelEn: 'Round of 16' },
  { value: 'ROUND_OF_8', labelFr: '8e de finale', labelEn: 'Round of 8' },
  { value: 'QUARTER', labelFr: 'Quarts de finale', labelEn: 'Quarter Finals' },
  { value: 'SEMI', labelFr: 'Demi-finale', labelEn: 'Semi Final' },
  { value: 'FINAL', labelFr: 'Finale', labelEn: 'Final' },
];

export default function NewTeamMatchPage() {
  const router = useRouter();
  const { teamId } = useParams();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    opponent: '',
    date: '',
    time: '',
    location: '',
    isHome: true,
    competitionType: 'FRIENDLY',
    cupRound: '',
    leagueMatchday: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/matches', {
        ...data,
        teamId,
        leagueMatchday: data.leagueMatchday ? parseInt(data.leagueMatchday) : null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', teamId] });
      router.push(`/team/${teamId}/matches`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Erreur lors de la création' : 'Failed to create match'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.opponent.trim()) {
      setError(locale === 'fr' ? 'Le nom de l\'adversaire est requis' : 'Opponent name is required');
      return;
    }
    if (!formData.date) {
      setError(locale === 'fr' ? 'La date est requise' : 'Date is required');
      return;
    }

    createMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Nouveau Match' : 'New Match'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Planifier un nouveau match' : 'Schedule a new match'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Informations du match' : 'Match Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Adversaire' : 'Opponent'} *
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Nom de l\'équipe adverse' : 'Opponent team name'}
                value={formData.opponent}
                onChange={(e) => updateField('opponent', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {locale === 'fr' ? 'Heure' : 'Time'}
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateField('time', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {locale === 'fr' ? 'Lieu' : 'Location'}
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Stade, terrain...' : 'Stadium, field...'}
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Domicile / Extérieur' : 'Home / Away'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('isHome', true)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    formData.isHome 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  🏠 {locale === 'fr' ? 'Domicile' : 'Home'}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('isHome', false)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    !formData.isHome 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  ✈️ {locale === 'fr' ? 'Extérieur' : 'Away'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competition Type */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'fr' ? 'Type de compétition' : 'Competition Type'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Sélectionnez le type de match' : 'Select the match type'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {COMPETITION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    updateField('competitionType', type.value);
                    if (type.value !== 'CUP') updateField('cupRound', '');
                    if (type.value !== 'LEAGUE') updateField('leagueMatchday', '');
                  }}
                  className={`px-4 py-4 rounded-xl border text-center transition-all ${
                    formData.competitionType === type.value 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.emoji}</span>
                  <span className="text-sm font-medium">
                    {locale === 'fr' ? type.labelFr : type.labelEn}
                  </span>
                </button>
              ))}
            </div>

            {/* Cup Round Options */}
            {formData.competitionType === 'CUP' && (
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Tour de coupe' : 'Cup Round'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CUP_ROUNDS.map((round) => (
                    <button
                      key={round.value}
                      type="button"
                      onClick={() => updateField('cupRound', round.value)}
                      className={`px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        formData.cupRound === round.value 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border hover:border-primary/50'
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
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Journée de championnat' : 'League Matchday'}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  placeholder={locale === 'fr' ? 'Numéro de journée (1-60)' : 'Matchday number (1-60)'}
                  value={formData.leagueMatchday}
                  onChange={(e) => updateField('leagueMatchday', e.target.value)}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  {locale === 'fr' ? 'Ex: Journée 15 du championnat' : 'Ex: Matchday 15 of the league'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {locale === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending 
              ? (locale === 'fr' ? 'Création...' : 'Creating...') 
              : (locale === 'fr' ? 'Créer le match' : 'Create Match')}
          </Button>
        </div>
      </form>
    </div>
  );
}
