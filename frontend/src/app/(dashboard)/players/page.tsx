'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Search, Filter, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, getInitials, getAge } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
  });

  // Filter players
  const filteredPlayers = players?.filter((player: any) => {
    const matchesSearch =
      player.firstName.toLowerCase().includes(search.toLowerCase()) ||
      player.lastName.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  }) || [];

  // Get unique positions for filter
  const positions = [...new Set(players?.map((p: any) => p.position).filter(Boolean) || [])];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground mt-1">
            Manage your players and track their progress
          </p>
        </div>
        <Link href="/players/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={positionFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPositionFilter(null)}
          >
            All
          </Button>
          {positions.map((position: string) => (
            <Button
              key={position}
              variant={positionFilter === position ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPositionFilter(position)}
            >
              {position}
            </Button>
          ))}
        </div>
      </div>

      {/* Players Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player: any) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {getInitials(player.firstName, player.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {player.firstName} {player.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {player.position && (
                          <Badge variant="secondary">{player.position}</Badge>
                        )}
                        {player.dateOfBirth && (
                          <span className="text-sm text-muted-foreground">
                            {getAge(player.dateOfBirth)} yrs
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{player._count?.sessions || 0} sessions</span>
                        <span>{player._count?.notes || 0} notes</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-1">No players found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Add your first player to get started'}
            </p>
            <Link href="/players/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {filteredPlayers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredPlayers.length} of {players?.length || 0} players
        </p>
      )}
    </div>
  );
}
