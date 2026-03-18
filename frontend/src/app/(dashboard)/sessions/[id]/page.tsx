'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Save, Calendar, Clock, MapPin, User, Target, Dumbbell, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

const SESSION_TYPES: Record<string, { labelFr: string; labelEn: string; emoji: string }> = {
  INDIVIDUAL: { labelFr: 'Individuel', labelEn: 'Individual', emoji: '👤' },
  GROUP: { labelFr: 'Groupe', labelEn: 'Group', emoji: '👥' },
  PHYSICAL: { labelFr: 'Physique', labelEn: 'Physical', emoji: '💪' },
  TECHNICAL: { labelFr: 'Technique', labelEn: 'Technical', emoji: '⚽' },
  TACTICAL: { labelFr: 'Tactique', labelEn: 'Tactical', emoji: '📋' },
};

export default function SessionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Fetch session
  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const res = await api.get(`/sessions/${id}`);
      return res.data;
    },
  });

  // Initialize form data when session loads
  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        date: session.date ? session.date.split('T')[0] : '',
        time: session.time || '',
        duration: session.duration || 60,
        type: session.type || 'INDIVIDUAL',
        location: session.location || '',
        objectives: session.objectives || '',
        exercises: session.exercises || '',
        notes: session.notes || '',
        feedback: session.feedback || '',
      });
    }
  }, [session]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/sessions/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.push('/sessions');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Échec de la suppression' : 'Failed to delete'));
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

  const getTypeInfo = (type: string) => {
    return SESSION_TYPES[type] || SESSION_TYPES.INDIVIDUAL;
  };

  const isPast = session?.date && new Date(session.date) < new Date();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          {locale === 'fr' ? 'Séance non trouvée' : 'Session not found'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'fr' ? 'Retour' : 'Back'}
        </Button>
      </div>
    );
  }

  const typeInfo = getTypeInfo(session.type);

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
              {session.title || (locale === 'fr' ? 'Séance' : 'Session')}
            </h1>
            <p className="text-muted-foreground">{formatDate(session.date)}</p>
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
          {/* Edit Form */}
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
                  {locale === 'fr' ? 'Titre' : 'Title'}
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
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
                    {locale === 'fr' ? 'Durée (min)' : 'Duration (min)'}
                  </label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => updateField('duration', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {locale === 'fr' ? 'Lieu' : 'Location'}
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {locale === 'fr' ? 'Contenu' : 'Content'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Objectifs' : 'Objectives'}
                </label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
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
                  value={formData.exercises}
                  onChange={(e) => updateField('exercises', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>

              {isPast && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {locale === 'fr' ? 'Feedback après séance' : 'Post-session Feedback'}
                  </label>
                  <textarea
                    className="w-full min-h-[80px] rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none"
                    value={formData.feedback}
                    onChange={(e) => updateField('feedback', e.target.value)}
                  />
                </div>
              )}
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
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Session Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                  {typeInfo.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{session.title}</h2>
                  <Badge className="mt-1">
                    {locale === 'fr' ? typeInfo.labelFr : typeInfo.labelEn}
                  </Badge>
                </div>
                <Badge className={`ml-auto ${isPast ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {isPast 
                    ? (locale === 'fr' ? 'Terminée' : 'Completed') 
                    : (locale === 'fr' ? 'À venir' : 'Upcoming')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(session.date)}</span>
                </div>
                {session.time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatTime(session.time)}</span>
                  </div>
                )}
                {session.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    <span>{session.duration} min</span>
                  </div>
                )}
                {session.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{session.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Player */}
          {session.player && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {locale === 'fr' ? 'Joueur' : 'Player'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/players/${session.player.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(session.player.firstName, session.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.player.firstName} {session.player.lastName}</p>
                      <p className="text-sm text-muted-foreground">{session.player.position}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {(session.objectives || session.exercises || session.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {locale === 'fr' ? 'Contenu' : 'Content'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.objectives && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {locale === 'fr' ? 'Objectifs' : 'Objectives'}
                    </p>
                    <p className="whitespace-pre-wrap">{session.objectives}</p>
                  </div>
                )}
                {session.exercises && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {locale === 'fr' ? 'Exercices' : 'Exercises'}
                    </p>
                    <p className="whitespace-pre-wrap">{session.exercises}</p>
                  </div>
                )}
                {session.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {session.feedback && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === 'fr' ? 'Feedback' : 'Feedback'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{session.feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                  ? 'Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.'
                  : 'Are you sure you want to delete this session? This action cannot be undone.'}
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
