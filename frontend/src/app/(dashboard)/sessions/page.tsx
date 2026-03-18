'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Calendar, Clock, User, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

export default function SessionsPage() {
  const { locale } = useI18n();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    },
  });

  const now = new Date();
  const upcomingSessions = sessions
    ?.filter((s: any) => new Date(s.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  
  const pastSessions = sessions
    ?.filter((s: any) => new Date(s.date) < now)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Séances' : 'Sessions'}
          </h1>
          <p className="text-muted-foreground">
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sessions?.length || 0}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Séances totales' : 'Total Sessions'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'À venir' : 'Upcoming'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pastSessions.length}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Terminées' : 'Completed'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {locale === 'fr' ? 'Séances à venir' : 'Upcoming Sessions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session: any) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {session.title || (locale === 'fr' ? 'Séance' : 'Session')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.date)}
                          </span>
                          {session.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(session.time)}
                            </span>
                          )}
                        </div>
                      </div>
                      {session.player && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(session.player.firstName, session.player.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium hidden sm:block">
                            {session.player.firstName}
                          </span>
                        </div>
                      )}
                      <Badge className="bg-blue-500/20 text-blue-500">
                        {locale === 'fr' ? 'À venir' : 'Upcoming'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  {locale === 'fr' ? 'Séances passées' : 'Past Sessions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastSessions.slice(0, 10).map((session: any) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {session.title || (locale === 'fr' ? 'Séance' : 'Session')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(session.date)}
                          </span>
                        </div>
                      </div>
                      {session.player && (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                              {getInitials(session.player.firstName, session.player.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <Badge variant="secondary">
                        {locale === 'fr' ? 'Terminée' : 'Completed'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {sessions?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Dumbbell className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">
                  {locale === 'fr' ? 'Aucune séance' : 'No sessions yet'}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  {locale === 'fr' ? 'Créez votre première séance d\'entraînement' : 'Create your first training session'}
                </p>
                <Link href="/sessions/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Nouvelle séance' : 'New Session'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
