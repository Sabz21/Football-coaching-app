'use client';

import { useQuery } from '@tanstack/react-query';
import { UsersRound, Plus, ChevronRight, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TeamsPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    },
  });

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and track their performance
          </p>
        </div>
        <Link href="/teams/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{team.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {team.category && (
                          <Badge variant="secondary">{team.category}</Badge>
                        )}
                        {team.season && (
                          <span className="text-sm text-muted-foreground">{team.season}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{team._count?.players || 0} players</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      <span>{team._count?.matches || 0} matches</span>
                    </div>
                  </div>

                  {team.formation && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Formation: <span className="text-foreground font-medium">{team.formation}</span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersRound className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start tracking matches
            </p>
            <Link href="/teams/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
