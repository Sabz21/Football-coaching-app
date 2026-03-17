'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UsersRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '4-1-4-1', '3-4-3'];

export default function NewTeamPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    season: '',
    formation: '4-3-3',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/teams', data);
      return res.data;
    },
    onSuccess: (data) => {
      // Save the new team as selected and switch to team mode
      localStorage.setItem('vertex-mode', 'team');
      localStorage.setItem('vertex-team', JSON.stringify({ id: data.id, name: data.name }));
      router.push(`/team/${data.id}/calendar`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create team');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(locale === 'fr' ? 'Le nom est obligatoire' : 'Team name is required');
      return;
    }

    createMutation.mutate(formData);
  };

  const updateField = (field: string, value: string) => {
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
            {locale === 'fr' ? 'Nouvelle équipe' : 'New Team'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Créer une nouvelle équipe' : 'Create a new team'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5" />
              {locale === 'fr' ? 'Informations de l\'équipe' : 'Team Information'}
            </CardTitle>
            <CardDescription>
              {locale === 'fr' ? 'Détails de votre équipe' : 'Your team details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Nom de l\'équipe' : 'Team Name'} *
              </label>
              <Input
                placeholder={locale === 'fr' ? 'Ex: U15 Excellence' : 'Ex: U15 Premier'}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Catégorie' : 'Category'}
                </label>
                <Input
                  placeholder={locale === 'fr' ? 'Ex: U15, Seniors...' : 'Ex: U15, Senior...'}
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Saison' : 'Season'}
                </label>
                <Input
                  placeholder="2025-2026"
                  value={formData.season}
                  onChange={(e) => updateField('season', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Formation par défaut' : 'Default Formation'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FORMATIONS.map((formation) => (
                  <button
                    key={formation}
                    type="button"
                    onClick={() => updateField('formation', formation)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.formation === formation
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {formation}
                  </button>
                ))}
              </div>
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
