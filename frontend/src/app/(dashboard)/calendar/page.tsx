'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ViewMode = 'month' | 'week';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return { start, end };
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    }
  }, [currentDate, viewMode]);

  // Fetch sessions for the current range
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const res = await api.get('/sessions', {
        params: {
          from: dateRange.start.toISOString(),
          to: dateRange.end.toISOString(),
        },
      });
      return res.data;
    },
  });

  // Get sessions for a specific day
  const getSessionsForDay = (date: Date) => {
    if (!sessions) return [];
    return sessions.filter((session: any) => isSameDay(new Date(session.date), date));
  };

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  const goToPrevious = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };
  const goToNext = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  // Generate days for the view
  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              )}
            >
              Month
            </button>
          </div>
          <Link href="/sessions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-xl font-semibold">
          {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "MMMM d - ")}
          {viewMode === 'week' && format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd, yyyy')}
        </h2>
        <div className="w-32" /> {/* Spacer for centering */}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className={cn(
            'grid grid-cols-7',
            viewMode === 'week' ? 'min-h-[500px]' : ''
          )}>
            {days.map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'border-b border-r border-border p-2 cursor-pointer transition-colors hover:bg-secondary/50',
                    viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[100px]',
                    !isCurrentMonth && 'bg-muted/30',
                    isSelected && 'bg-primary/10',
                    index % 7 === 6 && 'border-r-0'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1',
                      isToday(day) && 'bg-primary text-primary-foreground',
                      !isToday(day) && !isCurrentMonth && 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Sessions */}
                  <div className="space-y-1">
                    {daySessions.slice(0, viewMode === 'week' ? 5 : 3).map((session: any) => (
                      <Link
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block p-1.5 rounded-lg bg-primary/20 text-primary text-xs truncate hover:bg-primary/30 transition-colors"
                      >
                        {formatTime(session.startTime)} {session.title || 'Session'}
                      </Link>
                    ))}
                    {daySessions.length > (viewMode === 'week' ? 5 : 3) && (
                      <p className="text-xs text-muted-foreground px-1">
                        +{daySessions.length - (viewMode === 'week' ? 5 : 3)} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getSessionsForDay(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getSessionsForDay(selectedDate).map((session: any) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-1 h-12 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{session.title || 'Training Session'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">{session.location}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.players?.length || 0} players
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No sessions scheduled</p>
                <Link href={`/sessions/new?date=${selectedDate.toISOString()}`}>
                  <Button variant="link" className="mt-2">
                    Schedule a session
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
