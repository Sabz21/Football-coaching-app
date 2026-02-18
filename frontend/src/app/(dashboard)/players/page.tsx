'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter } from 'lucide-react';
import { playersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { PlayerCard } from '@/components/players/player-card';
import { AddPlayerModal } from '@/components/modals/add-player-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function PlayersPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['players', search],
    queryFn: () => playersApi.getAll({ search: search || undefined }),
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('players.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('players.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('players.addPlayer')}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('players.searchPlayers')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Players Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : data?.players && data.players.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.players.map((player: any) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">{t('players.noPlayersFound')}</h3>
            <p className="text-muted-foreground text-center">
              {search ? t('players.tryDifferentSearch') : t('players.addFirstPlayer')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination info */}
      {data?.total > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {t('players.showing')} {data.players.length} {t('players.of')} {data.total}
        </p>
      )}

      {/* Add Player Modal */}
      <AddPlayerModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
