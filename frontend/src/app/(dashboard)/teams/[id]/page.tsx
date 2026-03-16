'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Users,
  Trophy,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;

  const [showAddPlayers, setShowAddPlayers] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Fetch team
  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}`);
      return res.data;
    },
  });

  // Fetch all players (for adding to team)
  const { data: allPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
    enabled: showAddPlayers,
  });

  // Add players mutation
  const addPlayersMutation = useMutation({
    mutationFn: async (playerIds: string[]) => {
      return api.post(`/teams/${teamId}/players`, { playerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setShowAddPlayers(false);
      setSelectedPlayers([]);
    },
  });

  // Remove player mutation
  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return api.delete(`/teams/${teamId}/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Team not found</p>
        <Link href="/teams">
          <Button variant="link">Back to teams</Button>
        </Link>
      </div>
    );
  }

  // Players already in team
  const teamPlayerIds = team.players?.map((tp: any) => tp.player.id) || [];
  const availablePlayers = allPlayers?.filter((p: any) => !teamPlayerIds.includes(p.id)) || [];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {team.category && <Badge variant="secondary">{team.category}</Badge>}
            {team.season && <span className="text-muted-foreground">{team.season}</span>}
            {team.formation && (
              <Badge variant="outline">Formation: {team.formation}</Badge>
            )}
          </div>
        </div>
        <Link href={`/matches/new?teamId=${teamId}`}>
          <Button>
            <Trophy className="w-4 h-4 mr-2" />
            New Match
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {team.stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{team.stats.played}</p>
                <p className="text-sm text-muted-foreground">Played</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{team.stats.wins}</p>
                <p className="text-sm text-muted-foreground">Wins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{team.stats.draws}</p>
                <p className="text-sm text-muted-foreground">Draws</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{team.stats.losses}</p>
                <p className="text-sm text-muted-foreground">Losses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className={cn(
                  "text-3xl font-bold",
                  team.stats.goalDifference > 0 ? "text-green-500" : team.stats.goalDifference < 0 ? "text-red-500" : ""
                )}>
                  {team.stats.goalDifference > 0 ? '+' : ''}{team.stats.goalDifference}
                </p>
                <p className="text-sm text-muted-foreground">Goal Diff</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Players */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Squad ({team.players?.length || 0})
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddPlayers(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Players
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {team.players?.length > 0 ? (
                <div className="space-y-2">
                  {team.players.map((tp: any) => (
                    <div
                      key={tp.player.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(tp.player.firstName, tp.player.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Link
                          href={`/players/${tp.player.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {tp.player.firstName} {tp.player.lastName}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {tp.position && <span>{tp.position}</span>}
                          {tp.jerseyNumber && <span>#{tp.jerseyNumber}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tp.isCaptain && (
                          <Badge className="bg-yellow-500/20 text-yellow-500">Captain</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm('Remove player from team?')) {
                              removePlayerMutation.mutate(tp.player.id);
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No players in this team</p>
                  <Button variant="link" onClick={() => setShowAddPlayers(true)}>
                    Add players
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.matches?.length > 0 ? (
                <div className="space-y-3">
                  {team.matches.slice(0, 5).map((match: any) => {
                    const isWin = match.goalsFor > match.goalsAgainst;
                    const isDraw = match.goalsFor === match.goalsAgainst;
                    const isLoss = match.goalsFor < match.goalsAgainst;

                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          match.status !== 'COMPLETED' ? "bg-muted" :
                          isWin ? "bg-green-500/20" : isDraw ? "bg-yellow-500/20" : "bg-red-500/20"
                        )}>
                          {match.status !== 'COMPLETED' ? (
                            <Minus className="w-4 h-4 text-muted-foreground" />
                          ) : isWin ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : isDraw ? (
                            <Minus className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {match.isHome ? 'vs' : '@'} {match.opponent}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(match.date).toLocaleDateString()}
                          </p>
                        </div>
                        {match.status === 'COMPLETED' && (
                          <span className="font-bold">
                            {match.goalsFor}-{match.goalsAgainst}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No matches yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Players Modal */}
      {showAddPlayers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Players to Team</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAddPlayers(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Select players to add ({selectedPlayers.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {availablePlayers.length > 0 ? (
                <div className="space-y-2">
                  {availablePlayers.map((player: any) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayers((prev) =>
                          prev.includes(player.id)
                            ? prev.filter((id) => id !== player.id)
                            : [...prev, player.id]
                        );
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                        selectedPlayers.includes(player.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(player.firstName, player.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {player.firstName} {player.lastName}
                        </p>
                        {player.position && (
                          <p className="text-sm text-muted-foreground">{player.position}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>All players are already in this team</p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddPlayers(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addPlayersMutation.mutate(selectedPlayers)}
                disabled={selectedPlayers.length === 0 || addPlayersMutation.isPending}
              >
                {addPlayersMutation.isPending ? 'Adding...' : `Add ${selectedPlayers.length} Players`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
