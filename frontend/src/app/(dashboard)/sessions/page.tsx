'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { SessionCard } from '@/components/sessions/session-card';
import { NewSessionModal } from '@/components/modals/new-session-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime } from '@/lib/utils';

export default function SessionsPage() {
  const { user } = useAuthStore();
  const { t, language } = useI18n();
  const router = useRouter();
  const isCoach = user?.role === 'COACH';
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Get locale for date-fns
  const getLocale = () => {
    switch (language) {
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', weekStart.toISOString()],
    queryFn: () =>
      sessionsApi.getAll({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      }),
  });

  const getSessionsForDay = (date: Date) => {
    if (!sessions) return [];
    return sessions.filter((session: any) => isSameDay(new Date(session.date), date));
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('sessions.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isCoach ? t('sessions.subtitle') : t('sessions.subtitleParent')}
          </p>
        </div>
        {isCoach && (
          <Button onClick={() => setShowNewSessionModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('sessions.newSession')}
          </Button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'd MMM', { locale: getLocale() })} - {format(weekEnd, 'd MMM yyyy', { locale: getLocale() })}
          </h2>
          <Button
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={() => setCurrentWeek(new Date())}
          >
            {t('sessions.goToToday')}
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-7">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-64 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-7">
          {weekDays.map((day) => {
            const daySessions = getSessionsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={day.toISOString()} className={cn(isToday && 'ring-2 ring-primary')}>
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase">
                      {format(day, 'EEE', { locale: getLocale() })}
                    </p>
                    <p className={cn('text-2xl font-bold', isToday && 'text-primary')}>
                      {format(day, 'd')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySessions.length > 0 ? (
                    daySessions.map((session: any) => (
                      <div
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)}
                        className="p-2 rounded-lg bg-primary/10 border-l-2 border-primary text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                      >
                        <p className="font-medium">{formatTime(session.startTime)}</p>
                        <p className="text-muted-foreground truncate">{session.location}</p>
                        {session._count && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {session._count.bookings}/{session.maxParticipants}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {t('sessions.noSessions')}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upcoming Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('sessions.allSessionsThisWeek')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session: any) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="cursor-pointer"
                >
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('sessions.noSessionsThisWeek')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Session Modal */}
      <NewSessionModal open={showNewSessionModal} onClose={() => setShowNewSessionModal(false)} />
    </div>
  );
}
