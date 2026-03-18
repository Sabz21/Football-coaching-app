'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, UsersRound, Trophy, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TeamsPage() {
  const { locale } = useI18n();

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
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'fr' ? 'Équipes' : 'Teams'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'fr' ? 'Gérez vos équipes et leurs effectifs' : 'Manage your teams and squads'}
          </p>
        </div>
        <Link href="/teams/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Nouvelle équipe' : 'New Team'}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams?.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <UsersRound className="w-7 h-7 text-primary" />
                    </div>
                    {team.category && (
                      <Badge variant="secondary">{team.category}</Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{team.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {team.season || (locale === 'fr' ? 'Saison en cours' : 'Current season')}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UsersRound className="w-4 h-4" />
                      {team._count?.players || team.players?.length || 0} {locale === 'fr' ? 'joueurs' : 'players'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {team._count?.matches || 0} {locale === 'fr' ? 'matchs' : 'matches'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UsersRound className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">
              {locale === 'fr' ? 'Aucune équipe' : 'No teams yet'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              {locale === 'fr' ? 'Créez votre première équipe' : 'Create your first team'}
            </p>
            <Link href="/teams/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Nouvelle équipe' : 'New Team'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
