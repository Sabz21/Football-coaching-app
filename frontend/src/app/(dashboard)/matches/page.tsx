'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Trophy, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getMatchResult, getResultBadgeColor } from '@/lib/utils';

export default function MatchesPage() {
  const { t } = useI18n();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await api.get('/matches');
      return res.data;
    },
  });

  const upcomingMatches = matches?.filter((m: any) => m.status !== 'COMPLETED') || [];
  const completedMatches = matches?.filter((m: any) => m.status === 'COMPLETED') || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('matches.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('matches.subtitle')}</p>
        </div>
        <Link href="/matches/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('matches.addMatch')}
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
      ) : matches?.length > 0 ? (
        <div className="space-y-8">
          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('matches.upcoming')}
              </h2>
              <div className="space-y-3">
                {upcomingMatches.map((match: any) => (
                  <Link key={match.id} href={`/matches/${match.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(match.date)} {match.time && `• ${formatTime(match.time)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {match.isHome ? t('matches.home') : t('matches.away')}
                            </Badge>
                            {match.team && (
                              <Badge variant="secondary">{match.team.name}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {t('matches.completed')}
              </h2>
              <div className="space-y-3">
                {completedMatches.map((match: any) => {
                  const result = getMatchResult(match.goalsFor, match.goalsAgainst);
                  return (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {match.isHome ? `vs ${match.opponent}` : `@ ${match.opponent}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(match.date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getResultBadgeColor(result)}>
                                {match.goalsFor} - {match.goalsAgainst}
                              </Badge>
                              {match.team && (
                                <Badge variant="secondary">{match.team.name}</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t('matches.noMatches')}</h3>
            <p className="text-muted-foreground text-sm mt-1">{t('matches.scheduleFirst')}</p>
            <Link href="/matches/new" className="mt-4">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('matches.addMatch')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
