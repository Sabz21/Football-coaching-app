'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, User, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const POSITIONS = [
  { value: 'Gardien', labelFr: 'Gardien', labelEn: 'Goalkeeper' },
  { value: 'Défenseur Central', labelFr: 'Défenseur Central', labelEn: 'Center Back' },
  { value: 'Latéral Droit', labelFr: 'Latéral Droit', labelEn: 'Right Back' },
  { value: 'Latéral Gauche', labelFr: 'Latéral Gauche', labelEn: 'Left Back' },
  { value: 'Milieu Défensif', labelFr: 'Milieu Défensif', labelEn: 'Defensive Mid' },
  { value: 'Milieu Central', labelFr: 'Milieu Central', labelEn: 'Central Mid' },
  { value: 'Milieu Offensif', labelFr: 'Milieu Offensif', labelEn: 'Attacking Mid' },
  { value: 'Ailier Droit', labelFr: 'Ailier Droit', labelEn: 'Right Winger' },
  { value: 'Ailier Gauche', labelFr: 'Ailier Gauche', labelEn: 'Left Winger' },
  { value: 'Attaquant', labelFr: 'Attaquant', labelEn: 'Forward' },
];

export default function EditPlayerPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    number: '',
    birthDate: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Fetch player
  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/players/${id}`);
      return res.data;
    },
  });

  // Initialize form when player loads
  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        position: player.position || '',
        number: player.number?.toString() || '',
        birthDate: player.birthDate ? player.birthDate.split('T')[0] : '',
        email: player.email || '',
        phone: player.phone || '',
        notes: player.notes || '',
      });
    }
  }, [player]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/players/${id}`, {
        ...data,
        number: data.number ? parseInt(data.number) : null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player', id] });
      router.push(`/players/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Erreur lors de la mise à jour' : 'Failed to update player'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      router.push('/players');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Erreur lors de la suppression' : 'Failed to delete player'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(locale === 'fr' ? 'Le prénom et le nom sont requis' : 'First and last name are required');
      return;
    }

    updateMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Modifier le joueur' : 'Edit Player'}
          </h1>
          <p className="text-muted-foreground">
            {player?.firstName} {player?.lastName}
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
              <User className="w-5 h-5" />
              {locale === 'fr' ? 'Informations personnelles' : 'Personal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Prénom' : 'First Name'} *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Nom' : 'Last Name'} *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Date de naissance' : 'Birth Date'}
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateField('birthDate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Téléphone' : 'Phone'}
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'fr' ? 'Informations football' : 'Football Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => updateField('position', pos.value)}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      formData.position === pos.value 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {locale === 'fr' ? pos.labelFr : pos.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Numéro de maillot' : 'Jersey Number'}
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={formData.number}
                onChange={(e) => updateField('number', e.target.value)}
                className="max-w-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
              placeholder={locale === 'fr' ? 'Notes sur le joueur...' : 'Notes about the player...'}
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Supprimer' : 'Delete'}
          </Button>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending 
                ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...') 
                : (locale === 'fr' ? 'Enregistrer' : 'Save')}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                {locale === 'fr' ? 'Confirmer la suppression' : 'Confirm Deletion'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'fr' 
                  ? `Êtes-vous sûr de vouloir supprimer ${player?.firstName} ${player?.lastName} ? Cette action est irréversible.`
                  : `Are you sure you want to delete ${player?.firstName} ${player?.lastName}? This action cannot be undone.`}
              </p>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending 
                    ? (locale === 'fr' ? 'Suppression...' : 'Deleting...') 
                    : (locale === 'fr' ? 'Supprimer' : 'Delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
