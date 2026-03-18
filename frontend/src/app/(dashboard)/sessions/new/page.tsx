'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Clock, User, Dumbbell, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const SESSION_TYPES = [
  { value: 'INDIVIDUAL', labelFr: 'Individuel', labelEn: 'Individual', emoji: '👤' },
  { value: 'GROUP', labelFr: 'Groupe', labelEn: 'Group', emoji: '👥' },
  { value: 'PHYSICAL', labelFr: 'Physique', labelEn: 'Physical', emoji: '💪' },
  { value: 'TECHNICAL', labelFr: 'Technique', labelEn: 'Technical', emoji: '⚽' },
  { value: 'TACTICAL', labelFr: 'Tactique', labelEn: 'Tactical', emoji: '📋' },
];

export default function NewSessionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    type: 'INDIVIDUAL',
    playerId: '',
    location: '',
    objectives: '',
    exercises: '',
    notes: '',
  });

  // Fetch players
  const { data: players } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sessions', {
        ...data,
        duration: parseInt(data.duration) || 60,
        playerId: data.playerId || null,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.push(`/sessions/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Erreur lors de la création' : 'Failed to create session'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError(locale === 'fr' ? 'Le titre est requis' : 'Title is required');
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
            {locale === 'fr' ? 'Nouvelle Séance' : 'New Session'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? "Planifier une séance d'entraînement" : 'Schedule a training session'}
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
              <Dumbbell className="w-5 h-5" />
              {locale === 'fr' ? 'Informations' : 'Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Titre de la séance' : 'Session Title'} *
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Ex: Travail de finition' : 'Ex: Finishing drills'}
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Durée (minutes)' : 'Duration (minutes)'}
                </label>
                <Input
                  type="number"
                  min="15"
                  max="240"
                  value={formData.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Lieu' : 'Location'}
                </label>
                <Input
                  placeholder={locale === 'fr' ? 'Terrain, salle...' : 'Field, gym...'}
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Type */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'fr' ? 'Type de séance' : 'Session Type'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Choisissez le type de travail' : 'Choose the type of work'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SESSION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('type', type.value)}
                  className={`px-4 py-4 rounded-xl border text-center transition-all ${
                    formData.type === type.value 
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
          </CardContent>
        </Card>

        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {locale === 'fr' ? 'Joueur (optionnel)' : 'Player (optional)'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Associer cette séance à un joueur' : 'Associate this session with a player'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {players && players.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => updateField('playerId', '')}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    !formData.playerId 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium">
                    {locale === 'fr' ? 'Aucun' : 'None'}
                  </p>
                </button>
                {players.map((player: any) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => updateField('playerId', player.id)}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      formData.playerId === player.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Avatar className="w-10 h-10 mx-auto mb-1">
                      <AvatarFallback className={`text-sm ${formData.playerId === player.id ? 'bg-primary/20 text-primary' : 'bg-secondary'}`}>
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium truncate">{player.firstName}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {locale === 'fr' ? 'Aucun joueur disponible' : 'No players available'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {locale === 'fr' ? 'Contenu de la séance' : 'Session Content'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Objectifs' : 'Objectives'}
              </label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                placeholder={locale === 'fr' ? 'Les objectifs de cette séance...' : 'Goals for this session...'}
                value={formData.objectives}
                onChange={(e) => updateField('objectives', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Exercices' : 'Exercises'}
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                placeholder={locale === 'fr' ? 'Liste des exercices prévus...' : 'List of planned exercises...'}
                value={formData.exercises}
                onChange={(e) => updateField('exercises', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                placeholder={locale === 'fr' ? 'Notes supplémentaires...' : 'Additional notes...'}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
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
              : (locale === 'fr' ? 'Créer la séance' : 'Create Session')}
          </Button>
        </div>
      </form>
    </div>
  );
}
