'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Star,
  Edit,
  Save,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, getInitials, formatDate, formatTime, getMatchResult, getResultBadgeColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const matchId = params.id as string;

  const [showResultForm, setShowResultForm] = useState(false);
  const [resultData, setResultData] = useState({
    goalsFor: 0,
    goalsAgainst: 0,
    manOfTheMatchId: '',
    postMatchNotes: '',
    playerStats: [] as any[],
  });

  // Fetch match
  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const res = await api.get(`/matches/${matchId}`);
      return res.data;
    },
  });

  // Initialize player stats when match loads
  const initializePlayerStats = () => {
    if (match?.team?.players) {
      const stats = match.team.players.map((tp: any) => ({
        playerId: tp.player.id,
        playerName: `${tp.player.firstName} ${tp.player.lastName}`,
        minutesPlayed: 0,
        isStarter: false,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        rating: 6,
      }));
      setResultData((prev) => ({ ...prev, playerStats: stats }));
    }
  };

  // Save result mutation
  const saveResultMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/matches/${matchId}/result`, resultData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      setShowResultForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Match not found</p>
        <Link href="/matches">
          <Button variant="link">Back to matches</Button>
        </Link>
      </div>
    );
  }

  const result = getMatchResult(match.goalsFor, match.goalsAgainst);
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {match.isHome ? 'vs' : '@'} {match.opponent}
            </h1>
            {isCompleted && (
              <Badge className={cn("text-lg px-3 py-1", getResultBadgeColor(result))}>
                {match.goalsFor} - {match.goalsAgainst}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {match.team?.name} • {formatDate(match.date)}
          </p>
        </div>
        {!isCompleted && (
          <Button onClick={() => { initializePlayerStats(); setShowResultForm(true); }}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Record Result
          </Button>
        )}
      </div>

      {/* Match Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatDate(match.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="text-sm text-muted-foreground">Date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{match.time ? formatTime(match.time) : 'TBD'}</p>
                <p className="text-sm text-muted-foreground">Kick-off</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium truncate">{match.location || 'TBD'}</p>
                <p className="text-sm text-muted-foreground">{match.isHome ? 'Home' : 'Away'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{match.competition || 'Match'}</p>
                <p className="text-sm text-muted-foreground">Competition</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Man of the Match */}
      {isCompleted && match.manOfTheMatch && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Man of the Match</p>
                <p className="font-semibold text-lg">
                  {match.manOfTheMatch.firstName} {match.manOfTheMatch.lastName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Player Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Player Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {match.playerStats?.length > 0 ? (
              <div className="space-y-2">
                {match.playerStats.map((ps: any) => (
                  <div
                    key={ps.player.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(ps.player.firstName, ps.player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {ps.player.firstName} {ps.player.lastName}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {ps.goals > 0 && <span>⚽ {ps.goals}</span>}
                        {ps.assists > 0 && <span>🅰️ {ps.assists}</span>}
                        {ps.yellowCards > 0 && <span>🟨 {ps.yellowCards}</span>}
                        {ps.redCards > 0 && <span>🟥 {ps.redCards}</span>}
                        <span>{ps.minutesPlayed}'</span>
                      </div>
                    </div>
                    {ps.rating && (
                      <Badge variant="outline">{Number(ps.rating).toFixed(1)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No player stats recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <div className="space-y-6">
          {match.preMatchNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pre-Match Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{match.preMatchNotes}</p>
              </CardContent>
            </Card>
          )}

          {match.postMatchNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post-Match Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{match.postMatchNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Result Form Modal */}
      {showResultForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Record Match Result</CardTitle>
              <CardDescription>Enter the final score and player statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{match.team?.name}</p>
                  <Input
                    type="number"
                    min="0"
                    className="text-center text-2xl font-bold h-14"
                    value={resultData.goalsFor}
                    onChange={(e) => setResultData({ ...resultData, goalsFor: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="text-center text-2xl font-bold text-muted-foreground">-</div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{match.opponent}</p>
                  <Input
                    type="number"
                    min="0"
                    className="text-center text-2xl font-bold h-14"
                    value={resultData.goalsAgainst}
                    onChange={(e) => setResultData({ ...resultData, goalsAgainst: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Man of the Match */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Man of the Match
                </label>
                <select
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={resultData.manOfTheMatchId}
                  onChange={(e) => setResultData({ ...resultData, manOfTheMatchId: e.target.value })}
                >
                  <option value="">Select player</option>
                  {match.team?.players?.map((tp: any) => (
                    <option key={tp.player.id} value={tp.player.id}>
                      {tp.player.firstName} {tp.player.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Stats */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Player Statistics</label>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {resultData.playerStats.map((ps, index) => (
                    <div key={ps.playerId} className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{ps.playerName}</span>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={ps.isStarter}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].isStarter = e.target.checked;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                          Starter
                        </label>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Min</label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            className="h-8 text-sm"
                            value={ps.minutesPlayed}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].minutesPlayed = parseInt(e.target.value) || 0;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Goals</label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-sm"
                            value={ps.goals}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].goals = parseInt(e.target.value) || 0;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Assists</label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8 text-sm"
                            value={ps.assists}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].assists = parseInt(e.target.value) || 0;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">🟨</label>
                          <Input
                            type="number"
                            min="0"
                            max="2"
                            className="h-8 text-sm"
                            value={ps.yellowCards}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].yellowCards = parseInt(e.target.value) || 0;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Rating</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="0.5"
                            className="h-8 text-sm"
                            value={ps.rating}
                            onChange={(e) => {
                              const newStats = [...resultData.playerStats];
                              newStats[index].rating = parseFloat(e.target.value) || 6;
                              setResultData({ ...resultData, playerStats: newStats });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-match Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Post-Match Notes</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                  placeholder="Match summary, key moments, areas to improve..."
                  value={resultData.postMatchNotes}
                  onChange={(e) => setResultData({ ...resultData, postMatchNotes: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowResultForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveResultMutation.mutate()} disabled={saveResultMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveResultMutation.isPending ? 'Saving...' : 'Save Result'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
