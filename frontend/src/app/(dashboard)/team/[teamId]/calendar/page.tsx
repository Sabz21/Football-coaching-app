'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatDate, getMatchResult, getResultBadgeColor } from '@/lib/utils';

export default function TeamCalendarPage() {
  const { teamId } = useParams();
  const { t, locale } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get start and end of month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch team info
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Fetch matches for the month
  const { data: matches } = useQuery({
    queryKey: ['matches', teamId, currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const res = await api.get('/matches', {
        params: {
          teamId,
          from: startOfMonth.toISOString(),
          to: endOfMonth.toISOString(),
        },
      });
      return res.data;
    },
  });

  // Get days in month
  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get matches for a specific day
  const getMatchesForDay = (day: number) => {
    if (!matches) return [];
    return matches.filter((match: any) => {
      const matchDate = new Date(match.date);
      return (
        matchDate.getDate() === day &&
        matchDate.getMonth() === currentDate.getMonth() &&
        matchDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const monthNames = locale === 'fr'
    ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = locale === 'fr'
    ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Calendrier' : 'Calendar'} - {team?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'fr' ? 'Matchs et événements de l\'équipe' : 'Team matches and events'}
          </p>
        </div>
        <Link href={`/team/${teamId}/matches/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouveau match' : 'New Match'}
          </Button>
        </Link>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={goToToday}>
              {t('common.today')}
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Empty cells */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="p-2 min-h-[100px]" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const dayMatches = getMatchesForDay(day);
              return (
                <div
                  key={day}
                  className={`p-2 min-h-[100px] border rounded-lg ${
                    isToday(day) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayMatches.slice(0, 2).map((match: any) => {
                      const result = getMatchResult(match.goalsFor, match.goalsAgainst);
                      return (
                        <Link key={match.id} href={`/team/${teamId}/matches/${match.id}`}>
                          <div className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 bg-yellow-500/20 text-yellow-600">
                            {match.isHome ? 'vs' : '@'} {match.opponent}
                            {match.status === 'COMPLETED' && ` (${match.goalsFor}-${match.goalsAgainst})`}
                          </div>
                        </Link>
                      );
                    })}
                    {dayMatches.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayMatches.length - 2} {locale === 'fr' ? 'autres' : 'more'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Matches */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {locale === 'fr' ? 'Prochains matchs' : 'Upcoming Matches'}
          </h3>
          {matches?.filter((m: any) => m.status !== 'COMPLETED').length > 0 ? (
            <div className="space-y-3">
              {matches
                .filter((m: any) => m.status !== 'COMPLETED')
                .slice(0, 5)
                .map((match: any) => (
                  <Link key={match.id} href={`/team/${teamId}/matches/${match.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">
                          {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{formatDate(match.date)}</span>
                          {match.time && <span>{formatTime(match.time)}</span>}
                          {match.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {match.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {match.isHome ? (locale === 'fr' ? 'Domicile' : 'Home') : (locale === 'fr' ? 'Extérieur' : 'Away')}
                      </Badge>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {locale === 'fr' ? 'Aucun match à venir' : 'No upcoming matches'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
