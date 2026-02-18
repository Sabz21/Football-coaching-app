'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Trophy, TrendingUp, Mail, Phone } from 'lucide-react';
import { playersApi, performanceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceRadarChart, MetricCategoryProgress } from '@/components/performance/performance-chart';
import { calculateAge, getInitials, formatDate, ACHIEVEMENT_ICONS, CATEGORY_COLORS } from '@/lib/utils';
import { MetricCategory } from '@/types';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => playersApi.getById(playerId),
  });

  const { data: latestMetrics } = useQuery({
    queryKey: ['player-metrics', playerId],
    queryFn: () => performanceApi.getLatestMetrics(playerId),
    enabled: !!playerId,
  });

  if (isLoading) {
    return <PlayerDetailSkeleton />;
  }

  if (!player) {
    return <div>Player not found</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Players
      </Button>

      {/* Player Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage src={player.avatar} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {getInitials(player.firstName, player.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">
                  {player.firstName} {player.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                  <span>{calculateAge(player.dateOfBirth)} years old</span>
                  {player.position && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary">{player.position}</Badge>
                    </>
                  )}
                  {player.preferredFoot && (
                    <>
                      <span>•</span>
                      <span>{player.preferredFoot} foot</span>
                    </>
                  )}
                </div>
                {player.parent && (
                  <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Parent</p>
                    <p className="font-medium">
                      {player.parent.user.firstName} {player.parent.user.lastName}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {player.parent.user.email}
                      </span>
                      {player.parent.user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {player.parent.user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:w-48">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Calendar className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{player._count?.sessionReports || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Trophy className="w-6 h-6 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{player._count?.achievements || 0}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            {latestMetrics && Object.keys(latestMetrics).length > 0 && (
              <PerformanceRadarChart data={latestMetrics} />
            )}

            {/* Metrics by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skill Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {latestMetrics &&
                  Object.entries(latestMetrics).map(([category, metrics]) => (
                    <MetricCategoryProgress
                      key={category}
                      category={category as MetricCategory}
                      metrics={metrics as any[]}
                    />
                  ))}
                {(!latestMetrics || Object.keys(latestMetrics).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No performance data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {player.sessionReports && player.sessionReports.length > 0 ? (
                <div className="space-y-3">
                  {player.sessionReports.map((report: any) => (
                    <div key={report.id} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {formatDate(report.session?.date || report.createdAt)}
                        </span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Effort: {report.effortRating}/10</Badge>
                          <Badge variant="secondary">Focus: {report.focusRating}/10</Badge>
                        </div>
                      </div>
                      {report.playerFeedback && (
                        <p className="text-sm text-muted-foreground">{report.playerFeedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No session history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {player.achievements && player.achievements.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {player.achievements.map((achievement: any) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50"
                    >
                      <div className="text-3xl">
                        {ACHIEVEMENT_ICONS[achievement.type as keyof typeof ACHIEVEMENT_ICONS] || '🏅'}
                      </div>
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description || formatDate(achievement.earnedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No achievements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlayerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-32 bg-secondary rounded animate-pulse" />
      <div className="h-48 bg-card rounded-xl border animate-pulse" />
      <div className="h-96 bg-card rounded-xl border animate-pulse" />
    </div>
  );
}
