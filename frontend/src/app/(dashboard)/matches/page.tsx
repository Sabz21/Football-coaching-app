'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Plus, ChevronRight, Calendar, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, formatDate, formatTime, getMatchResult, getResultBadgeColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MatchesPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await api.get('/matches');
      return res.data;
    },
  });

  const filteredMatches = matches?.filter((match: any) => {
    if (filter === 'upcoming') return match.status === 'SCHEDULED';
    if (filter === 'completed') return match.status === 'COMPLETED';
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and track your team matches
          </p>
        </div>
        <Link href="/matches/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Match
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'upcoming', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Matches List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((match: any) => {
            const result = getMatchResult(match.goalsFor, match.goalsAgainst);

            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Date */}
                      <div className="text-center min-w-[60px]">
                        <p className="text-2xl font-bold">
                          {new Date(match.date).getDate()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(match.date).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                      </div>

                      {/* Match Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {match.isHome ? 'vs' : '@'} {match.opponent}
                          </h3>
                          {match.status === 'COMPLETED' && (
                            <Badge className={getResultBadgeColor(result)}>
                              {match.goalsFor} - {match.goalsAgainst}
                            </Badge>
                          )}
                          {match.status === 'SCHEDULED' && (
                            <Badge variant="outline">Upcoming</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {match.team?.name}
                          </span>
                          {match.time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatTime(match.time)}
                            </span>
                          )}
                          {match.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {match.location}
                            </span>
                          )}
                        </div>

                        {match.manOfTheMatch && (
                          <div className="flex items-center gap-1.5 mt-2 text-sm text-yellow-500">
                            <Star className="w-4 h-4 fill-yellow-500" />
                            MOTM: {match.manOfTheMatch.firstName} {match.manOfTheMatch.lastName}
                          </div>
                        )}
                      </div>

                      {match.competition && (
                        <Badge variant="secondary">{match.competition}</Badge>
                      )}

                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              {filter !== 'all' ? 'Try a different filter' : 'Schedule your first match'}
            </p>
            <Link href="/matches/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Match
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
