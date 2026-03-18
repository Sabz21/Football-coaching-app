'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Trophy, MapPin, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/utils';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TeamCalendarPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { locale } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const months = locale === 'fr' ? MONTHS_FR : MONTHS_EN;
  const days = locale === 'fr' ? DAYS_FR : DAYS_EN;

  // Fetch team
  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Fetch matches
  const { data: matches } = useQuery({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const res = await api.get('/matches', { params: { teamId } });
      return res.data;
    },
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getMatchesForDay = (day: number) => {
    if (!matches) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return matches.filter((m: any) => m.date?.startsWith(dateStr));
  };

  const upcomingMatches = matches
    ?.filter((m: any) => new Date(m.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) || [];

  const today = new Date();
  const isToday = (day: number) => 
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getCompetitionBadge = (match: any) => {
    if (match.competitionType === 'LEAGUE') return { label: locale === 'fr' ? 'Champ.' : 'League', color: 'bg-blue-500/20 text-blue-500' };
    if (match.competitionType === 'CUP') return { label: locale === 'fr' ? 'Coupe' : 'Cup', color: 'bg-yellow-500/20 text-yellow-500' };
    return { label: locale === 'fr' ? 'Amical' : 'Friendly', color: 'bg-gray-500/20 text-gray-500' };
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Calendrier' : 'Calendar'} - {team?.name}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Gérez les matchs de votre équipe' : 'Manage your team matches'}
          </p>
        </div>
        <Link href={`/team/${teamId}/matches/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouveau match' : 'New Match'}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[160px] text-center">
                {months[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              {locale === 'fr' ? "Aujourd'hui" : 'Today'}
            </Button>
          </CardHeader>
          <CardContent>
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {[...Array(startDay)].map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1 rounded-lg bg-muted/30" />
              ))}

              {/* Days of the month */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayMatches = getMatchesForDay(day);

                return (
                  <div
                    key={day}
                    className={`h-24 p-1 rounded-lg border transition-colors ${
                      isToday(day) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-transparent hover:bg-secondary/50'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayMatches.slice(0, 2).map((match: any) => (
                        <Link
                          key={match.id}
                          href={`/team/${teamId}/matches/${match.id}`}
                          className="block text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate hover:bg-primary/20 transition-colors"
                        >
                          {match.isHome ? 'vs' : '@'} {match.opponent}
                        </Link>
                      ))}
                      {dayMatches.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayMatches.length - 2}
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
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {locale === 'fr' ? 'Prochains matchs' : 'Upcoming Matches'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match: any) => {
                  const badge = getCompetitionBadge(match);
                  return (
                    <Link
                      key={match.id}
                      href={`/team/${teamId}/matches/${match.id}`}
                      className="block p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">
                          {match.isHome ? 'vs' : '@'} {match.opponent}
                        </p>
                        <Badge className={badge.color}>{badge.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(match.date)}
                        </span>
                        {match.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {match.location}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {locale === 'fr' ? 'Aucun match à venir' : 'No upcoming matches'}
              </p>
            )}

            <Link href={`/team/${teamId}/matches`} className="block mt-4">
              <Button variant="outline" className="w-full">
                {locale === 'fr' ? 'Voir tous les matchs' : 'View all matches'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
