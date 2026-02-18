'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Search } from 'lucide-react';
import { playersApi, performanceApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials, CATEGORY_COLORS } from '@/lib/utils';
import { MetricCategory } from '@/types';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const isCoach = user?.role === 'COACH';
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: playersData } = useQuery({
    queryKey: ['players', search],
    queryFn: () => playersApi.getAll({ search: search || undefined }),
    enabled: isCoach,
  });

  const { data: metrics } = useQuery({
    queryKey: ['player-metrics-latest', selectedPlayer],
    queryFn: () => performanceApi.getLatestMetrics(selectedPlayer!),
    enabled: !!selectedPlayer,
  });

  const { data: progress } = useQuery({
    queryKey: ['player-progress', selectedPlayer],
    queryFn: () => performanceApi.getProgressSummary(selectedPlayer!),
    enabled: !!selectedPlayer,
  });

  // For parents, show their children's performance
  const { data: parentData } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const data = await fetch('/api/users/dashboard/parent').then(r => r.json());
      return data;
    },
    enabled: !isCoach,
  });

  const players = isCoach ? playersData?.players : parentData?.children;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze player development
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Player List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {isCoach ? 'Players' : 'Children'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCoach && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players && players.length > 0 ? (
                players.map((player: any) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                      selectedPlayer === player.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {player.position || 'No position'}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No players found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPlayer ? (
            <>
              {/* Progress Overview */}
              {progress && progress.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      30-Day Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {progress.map((item: any) => (
                        <div key={item.category} className="p-4 rounded-lg bg-secondary/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">
                              {item.category.toLowerCase()}
                            </span>
                            {item.change !== null && (
                              <Badge
                                variant={item.change >= 0 ? 'success' : 'destructive'}
                                className="text-xs"
                              >
                                {item.change >= 0 ? '+' : ''}
                                {item.change.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                          {item.currentAverage !== null ? (
                            <>
                              <p className="text-2xl font-bold">
                                {Math.round(item.currentAverage)}
                              </p>
                              <Progress
                                value={item.currentAverage}
                                className="mt-2 h-2"
                                indicatorClassName={cn(
                                  CATEGORY_COLORS[item.category as MetricCategory]?.bg.replace('/20', '')
                                )}
                              />
                            </>
                          ) : (
                            <p className="text-muted-foreground">No data</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Metrics */}
              {metrics && Object.keys(metrics).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {Object.entries(metrics).map(([category, categoryMetrics]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium mb-3 capitalize flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                CATEGORY_COLORS[category as MetricCategory]?.bg.replace('/20', '')
                              )}
                            />
                            {category.toLowerCase()}
                          </h4>
                          <div className="space-y-3">
                            {(categoryMetrics as any[]).map((metric) => (
                              <div key={metric.id}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">{metric.name}</span>
                                  <span className="font-medium">
                                    {Math.round(Number(metric.value))}
                                    {metric.unit && (
                                      <span className="text-muted-foreground ml-0.5">
                                        {metric.unit}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <Progress value={Number(metric.value)} className="h-1.5" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <TrendingUp className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Select a Player</h3>
                <p className="text-muted-foreground text-center">
                  Choose a player from the list to view their performance data
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
