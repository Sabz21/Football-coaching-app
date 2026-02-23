'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Star,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MainLayout } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';

type TabType = 'overview' | 'coaches' | 'players' | 'subscriptions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: overview } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/admin/overview');
      return data;
    },
  });

  const { data: coaches } = useQuery({
    queryKey: ['admin', 'coaches'],
    queryFn: async () => {
      const { data } = await api.get('/admin/coaches');
      return data;
    },
    enabled: activeTab === 'coaches' || activeTab === 'overview',
  });

  const { data: players } = useQuery({
    queryKey: ['admin', 'players'],
    queryFn: async () => {
      const { data } = await api.get('/admin/players');
      return data;
    },
    enabled: activeTab === 'players',
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'coaches', label: 'Coaches', icon: UserCheck },
    { id: 'players', label: 'All Players', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  ];

  const stats = [
    {
      title: 'Total Coaches',
      value: overview?.totalCoaches || 0,
      icon: UserCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Players',
      value: overview?.totalPlayers || 0,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Active Subscriptions',
      value: overview?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Sessions',
      value: overview?.totalSessions || 0,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Active</span>;
      case 'trial':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Trial</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">Expired</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-500">Unknown</span>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all coaches, players, and subscriptions
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-xl', stat.bgColor)}>
                        <stat.icon className={cn('w-6 h-6', stat.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Coaches */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Coaches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coaches?.slice(0, 5).map((coach: any) => (
                    <div
                      key={coach.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(coach.firstName, coach.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {coach.firstName} {coach.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{coach.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{coach.playersCount} players</p>
                          {coach.avgRating && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {coach.avgRating}
                            </p>
                          )}
                        </div>
                        {getSubscriptionBadge(coach.subscription?.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coaches Tab */}
        {activeTab === 'coaches' && (
          <Card>
            <CardHeader>
              <CardTitle>All Coaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Coach</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Players</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rating</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subscription</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaches?.map((coach: any) => (
                      <tr key={coach.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(coach.firstName, coach.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{coach.firstName} {coach.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{coach.email}</td>
                        <td className="py-3 px-4">{coach.playersCount}</td>
                        <td className="py-3 px-4">
                          {coach.avgRating ? (
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              {coach.avgRating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getSubscriptionBadge(coach.subscription?.status)}</td>
                        <td className="py-3 px-4">
                          {coach.isActive ? (
                            <span className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500">
                              <Ban className="w-4 h-4" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <Card>
            <CardHeader>
              <CardTitle>All Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Player</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Coach</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Parent</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sessions</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players?.map((player: any) => (
                      <tr key={player.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(player.firstName, player.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.firstName} {player.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {player.coach ? (
                            `${player.coach.user.firstName} ${player.coach.user.lastName}`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {player.parent ? (
                            <div>
                              <p>{player.parent.user.firstName} {player.parent.user.lastName}</p>
                              <p className="text-xs text-muted-foreground">{player.parent.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{player._count?.sessionReports || 0}</td>
                        <td className="py-3 px-4">
                          {player.isActive ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Active</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Subscriptions - Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Stripe integration for coach subscriptions will be available soon.
                Coaches will need to subscribe to use the platform.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium mb-2">Planned Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monthly/Yearly subscription plans</li>
                  <li>• Free trial period</li>
                  <li>• Invoice management</li>
                  <li>• Payment history</li>
                  <li>• Auto-renewal settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
