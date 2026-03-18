'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Users, Search, User } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

export default function PlayersPage() {
  const { locale } = useI18n();
  const [search, setSearch] = useState('');

  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/players');
      return res.data;
    },
  });

  const filteredPlayers = players?.filter((player: any) => {
    const searchLower = search.toLowerCase();
    return (
      player.firstName?.toLowerCase().includes(searchLower) ||
      player.lastName?.toLowerCase().includes(searchLower) ||
      player.position?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const positionGroups = {
    'Gardien': filteredPlayers.filter((p: any) => p.position?.toLowerCase().includes('gardien') || p.position?.toLowerCase().includes('goalkeeper')),
    'Défenseur': filteredPlayers.filter((p: any) => p.position?.toLowerCase().includes('défenseur') || p.position?.toLowerCase().includes('defender')),
    'Milieu': filteredPlayers.filter((p: any) => p.position?.toLowerCase().includes('milieu') || p.position?.toLowerCase().includes('midfielder')),
    'Attaquant': filteredPlayers.filter((p: any) => p.position?.toLowerCase().includes('attaquant') || p.position?.toLowerCase().includes('forward') || p.position?.toLowerCase().includes('striker')),
    'Autre': filteredPlayers.filter((p: any) => {
      const pos = p.position?.toLowerCase() || '';
      return !pos.includes('gardien') && !pos.includes('goalkeeper') &&
             !pos.includes('défenseur') && !pos.includes('defender') &&
             !pos.includes('milieu') && !pos.includes('midfielder') &&
             !pos.includes('attaquant') && !pos.includes('forward') && !pos.includes('striker');
    }),
  };

  const positionLabels: Record<string, { fr: string; en: string }> = {
    'Gardien': { fr: 'Gardiens', en: 'Goalkeepers' },
    'Défenseur': { fr: 'Défenseurs', en: 'Defenders' },
    'Milieu': { fr: 'Milieux', en: 'Midfielders' },
    'Attaquant': { fr: 'Attaquants', en: 'Forwards' },
    'Autre': { fr: 'Autres', en: 'Others' },
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Joueurs' : 'Players'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Gérez vos joueurs et leurs profils' : 'Manage your players and their profiles'}
          </p>
        </div>
        <Link href="/players/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouveau joueur' : 'New Player'}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={locale === 'fr' ? 'Rechercher un joueur...' : 'Search players...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{players?.length || 0}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'fr' ? 'Joueurs' : 'Players'}
              </p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(positionGroups).slice(0, 3).map(([key, group]) => (
          <Card key={key}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{group.length}</p>
                <p className="text-sm text-muted-foreground">
                  {locale === 'fr' ? positionLabels[key].fr : positionLabels[key].en}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(positionGroups).map(([key, group]) => {
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {locale === 'fr' ? positionLabels[key].fr : positionLabels[key].en} ({group.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.map((player: any) => (
                    <Link key={player.id} href={`/players/${player.id}`}>
                      <Card className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {getInitials(player.firstName, player.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {player.position || (locale === 'fr' ? 'Position non définie' : 'Position not set')}
                              </p>
                              {player.age && (
                                <p className="text-xs text-muted-foreground">
                                  {player.age} {locale === 'fr' ? 'ans' : 'years old'}
                                </p>
                              )}
                            </div>
                            {player.number && (
                              <Badge variant="secondary" className="text-lg font-bold">
                                {player.number}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {search 
                ? (locale === 'fr' ? 'Aucun résultat' : 'No results') 
                : (locale === 'fr' ? 'Aucun joueur' : 'No players yet')}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {search 
                ? (locale === 'fr' ? 'Essayez une autre recherche' : 'Try a different search')
                : (locale === 'fr' ? 'Ajoutez votre premier joueur' : 'Add your first player')}
            </p>
            {!search && (
              <Link href="/players/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Nouveau joueur' : 'New Player'}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
