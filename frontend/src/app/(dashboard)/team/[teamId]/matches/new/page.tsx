'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trophy, Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewTeamMatchPage() {
  const router = useRouter();
  const { teamId } = useParams();
  const { locale } = useI18n();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    opponent: '',
    date: '',
    time: '',
    location: '',
    isHome: true,
    competition: '',
    preMatchNotes: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/matches', { ...data, teamId });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/team/${teamId}/matches/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create match');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.opponent.trim()) {
      setError(locale === 'fr' ? 'L\'adversaire est obligatoire' : 'Opponent is required');
      return;
    }
    if (!formData.date) {
      setError(locale === 'fr' ? 'La date est obligatoire' : 'Date is required');
      return;
    }

    createMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            {locale === 'fr' ? 'Nouveau match' : 'New Match'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Planifier un match pour votre équipe' : 'Schedule a match for your team'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {/* Match Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Détails du match' : 'Match Details'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Informations sur le match' : 'Match information'}
            </CardDescription>
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
                <label className="text-sm font-medium">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Heure' : 'Time'}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    className="pl-10"
                    value={formData.time}
                    onChange={(e) => updateField('time', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Lieu' : 'Location'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={locale === 'fr' ? 'Stade / Terrain' : 'Stadium / Field'}
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
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
                  {locale === 'fr' ? '🏠 Domicile' : '🏠 Home'}
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
                  {locale === 'fr' ? '✈️ Extérieur' : '✈️ Away'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Compétition' : 'Competition'}
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Ligue, Coupe, Amical...' : 'League, Cup, Friendly...'}
                value={formData.competition}
                onChange={(e) => updateField('competition', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Notes avant-match' : 'Pre-match Notes'}
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                placeholder={locale === 'fr' ? 'Tactique, consignes...' : 'Tactics, instructions...'}
                value={formData.preMatchNotes}
                onChange={(e) => updateField('preMatchNotes', e.target.value)}
              />
            </div>
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
