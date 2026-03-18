'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UsersRound, Calendar, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CATEGORIES = [
  { value: 'U7', label: 'U7' },
  { value: 'U8', label: 'U8' },
  { value: 'U9', label: 'U9' },
  { value: 'U10', label: 'U10' },
  { value: 'U11', label: 'U11' },
  { value: 'U12', label: 'U12' },
  { value: 'U13', label: 'U13' },
  { value: 'U14', label: 'U14' },
  { value: 'U15', label: 'U15' },
  { value: 'U16', label: 'U16' },
  { value: 'U17', label: 'U17' },
  { value: 'U18', label: 'U18' },
  { value: 'U19', label: 'U19' },
  { value: 'U20', label: 'U20' },
  { value: 'U21', label: 'U21' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Vétéran', label: 'Vétéran' },
];

const FORMATIONS = [
  { value: '4-4-2', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'] },
  { value: '4-3-3', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'] },
  { value: '3-5-2', positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'] },
  { value: '4-2-3-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LW', 'CAM', 'RW', 'ST'] },
  { value: '5-3-2', positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'] },
  { value: '4-1-4-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST'] },
];

export default function NewTeamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    season: '',
    formation: '4-4-2',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/teams', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      // Switch to team mode
      localStorage.setItem('vertex-mode', 'team');
      localStorage.setItem('vertex-team', JSON.stringify({ id: data.id, name: data.name }));
      router.push(`/team/${data.id}/calendar`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Erreur lors de la création' : 'Failed to create team'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError(locale === 'fr' ? 'Le nom de l\'équipe est requis' : 'Team name is required');
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
            {locale === 'fr' ? 'Nouvelle Équipe' : 'New Team'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Créer une nouvelle équipe' : 'Create a new team'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5" />
              {locale === 'fr' ? 'Informations de l\'équipe' : 'Team Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Nom de l\'équipe' : 'Team Name'} *
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Ex: FC Vertex U15' : 'Ex: FC Vertex U15'}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Catégorie' : 'Category'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => updateField('category', cat.value)}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      formData.category === cat.value 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {locale === 'fr' ? 'Saison' : 'Season'}
              </label>
              <Input
                placeholder="2024-2025"
                value={formData.season}
                onChange={(e) => updateField('season', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Formation par défaut' : 'Default Formation'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' 
                ? 'Choisissez la formation tactique de votre équipe' 
                : 'Choose your team\'s tactical formation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {FORMATIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => updateField('formation', f.value)}
                  className={`px-4 py-4 rounded-xl border text-center transition-all ${
                    formData.formation === f.value 
                      ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg font-bold">{f.value}</span>
                </button>
              ))}
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
              : (locale === 'fr' ? 'Créer l\'équipe' : 'Create Team')}
          </Button>
        </div>
      </form>
    </div>
  );
}
