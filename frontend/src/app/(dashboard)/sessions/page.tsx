'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Dumbbell, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

const SESSION_TYPE_COLORS: Record<string, string> = {
  INDIVIDUAL: 'bg-blue-500/20 text-blue-500',
  GROUP: 'bg-green-500/20 text-green-500',
  ASSESSMENT: 'bg-purple-500/20 text-purple-500',
  TRIAL: 'bg-yellow-500/20 text-yellow-500',
};

const SESSION_TYPE_LABELS: Record<string, Record<string, string>> = {
  INDIVIDUAL: { en: 'Individual', fr: 'Individuel' },
  GROUP: { en: 'Group', fr: 'Groupe' },
  ASSESSMENT: { en: 'Assessment', fr: 'Évaluation' },
  TRIAL: { en: 'Trial', fr: 'Essai' },
};

export default function SessionsPage() {
  const { locale } = useI18n();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingSessions = sessions?.filter((s: any) => new Date(s.date) >= today) || [];
  const pastSessions = sessions?.filter((s: any) => new Date(s.date) < today) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Séances' : 'Sessions'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'fr' ? 'Gérez vos séances d\'entraînement privées' : 'Manage your private training sessions'}
          </p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouvelle séance' : 'New Session'}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions?.length > 0 ? (
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {locale === 'fr' ? 'À venir' : 'Upcoming'}
              </h2>
              <div className="space-y-3">
                {upcomingSessions.map((session: any) => (
                  <Link key={session.id} href={`/sessions/${session.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{session.title || 'Training Session'}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{formatDate(session.date)}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </span>
                                {session.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {session.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {session.players?.length > 0 && (
                              <div className="flex -space-x-2">
                                {session.players.slice(0, 3).map((sp: any) => (
                                  <Avatar key={sp.player.id} className="w-8 h-8 border-2 border-background">
                                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                      {getInitials(sp.player.firstName, sp.player.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {session.players.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                    +{session.players.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            <Badge className={SESSION_TYPE_COLORS[session.type] || 'bg-secondary'}>
                              {SESSION_TYPE_LABELS[session.type]?.[locale] || session.type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <Dumbbell className="w-5 h-5" />
                {locale === 'fr' ? 'Passées' : 'Past'}
              </h2>
              <div className="space-y-3">
                {pastSessions.slice(0, 10).map((session: any) => (
                  <Link key={session.id} href={`/sessions/${session.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer opacity-75 hover:opacity-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                              <Dumbbell className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold">{session.title || 'Training Session'}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>{formatDate(session.date)}</span>
                                {session.players?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {session.players.length} {locale === 'fr' ? 'joueurs' : 'players'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.status === 'COMPLETED' && (
                              <Badge variant="outline" className="text-green-500 border-green-500/30">
                                {locale === 'fr' ? 'Terminée' : 'Completed'}
                              </Badge>
                            )}
                            <Badge className={SESSION_TYPE_COLORS[session.type] || 'bg-secondary'}>
                              {SESSION_TYPE_LABELS[session.type]?.[locale] || session.type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {locale === 'fr' ? 'Aucune séance' : 'No sessions yet'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {locale === 'fr' ? 'Planifiez votre première séance' : 'Schedule your first session'}
            </p>
            <Link href="/sessions/new" className="mt-4">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Nouvelle séance' : 'New Session'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
