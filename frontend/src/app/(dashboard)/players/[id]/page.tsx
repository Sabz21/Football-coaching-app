'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, Target, Trophy, Clock, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, getInitials } from '@/lib/utils';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { locale } = useI18n();

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/players/${id}`);
      return res.data;
    },
  });

  // Fetch player notes
  const { data: notes } = useQuery({
    queryKey: ['notes', 'player', id],
    queryFn: async () => {
      const res = await api.get('/notes', { params: { playerId: id } });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <Card><CardContent className="p-6"><div className="h-40 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          {locale === 'fr' ? 'Joueur non trouvé' : 'Player not found'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'fr' ? 'Retour' : 'Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={player.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(player.firstName, player.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {player.firstName} {player.lastName}
              </h1>
              <p className="text-muted-foreground">{player.position}</p>
            </div>
          </div>
        </div>
        <Link href={`/players/${id}/edit`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Modifier' : 'Edit'}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {locale === 'fr' ? 'Informations' : 'Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? 'Position' : 'Position'}
                </p>
                <p className="font-medium">{player.position || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? 'Numéro' : 'Number'}
                </p>
                <p className="font-medium">{player.number || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? 'Date de naissance' : 'Birth Date'}
                </p>
                <p className="font-medium">
                  {player.birthDate ? formatDate(player.birthDate) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? 'Âge' : 'Age'}
                </p>
                <p className="font-medium">
                  {player.age ? `${player.age} ${locale === 'fr' ? 'ans' : 'years'}` : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{player.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? 'Téléphone' : 'Phone'}
                </p>
                <p className="font-medium">{player.phone || '-'}</p>
              </div>
            </div>

            {player.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="whitespace-pre-wrap">{player.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Statistiques' : 'Statistics'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <span className="text-sm">{locale === 'fr' ? 'Matchs joués' : 'Matches Played'}</span>
                <span className="text-xl font-bold">{player.matchesPlayed || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <span className="text-sm">{locale === 'fr' ? 'Buts' : 'Goals'}</span>
                <span className="text-xl font-bold">{player.goals || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <span className="text-sm">{locale === 'fr' ? 'Passes D' : 'Assists'}</span>
                <span className="text-xl font-bold">{player.assists || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10">
                <span className="text-sm">{locale === 'fr' ? 'Homme du match' : 'MOTM'}</span>
                <span className="text-xl font-bold text-yellow-500">{player.manOfMatch || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {notes && notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {locale === 'fr' ? 'Notes de suivi' : 'Follow-up Notes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notes.map((note: any) => (
                <div key={note.id} className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{note.category || 'General'}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
