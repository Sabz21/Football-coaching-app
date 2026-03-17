'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Calendar,
  UsersRound,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Triangle,
  UserCircle,
  Shield,
  ChevronDown,
  Check,
  Dumbbell,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

type AppMode = 'private' | 'team';

interface TeamSelection {
  id: string;
  name: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>('private');
  const [selectedTeam, setSelectedTeam] = useState<TeamSelection | null>(null);
  const [showTeamSelector, setShowTeamSelector] = useState(false);

  // Fetch teams for the team selector
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    },
  });

  // Load mode and team from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('vertex-mode') as AppMode;
    const savedTeam = localStorage.getItem('vertex-team');
    
    if (savedMode) setMode(savedMode);
    if (savedTeam) {
      try {
        setSelectedTeam(JSON.parse(savedTeam));
      } catch {}
    }
  }, []);

  // Save mode and team to localStorage
  const switchMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem('vertex-mode', newMode);
    setShowTeamSelector(false);
    
    if (newMode === 'private') {
      router.push('/calendar');
    } else if (newMode === 'team' && selectedTeam) {
      router.push(`/team/${selectedTeam.id}/calendar`);
    } else if (newMode === 'team' && teams?.length > 0) {
      // Auto-select first team if none selected
      selectTeam(teams[0]);
    }
  };

  const selectTeam = (team: any) => {
    const selection = { id: team.id, name: team.name };
    setSelectedTeam(selection);
    localStorage.setItem('vertex-team', JSON.stringify(selection));
    setShowTeamSelector(false);
    router.push(`/team/${team.id}/calendar`);
  };

  // Navigation items based on mode
  const getNavItems = () => {
    if (mode === 'private') {
      return [
        { 
          href: '/calendar', 
          label: locale === 'fr' ? 'Calendrier' : 'Calendar', 
          icon: CalendarDays 
        },
        { 
          href: '/sessions', 
          label: locale === 'fr' ? 'Séances' : 'Sessions', 
          icon: Dumbbell 
        },
      ];
    } else if (selectedTeam) {
      return [
        { 
          href: `/team/${selectedTeam.id}/calendar`, 
          label: locale === 'fr' ? 'Calendrier' : 'Calendar', 
          icon: CalendarDays 
        },
        { 
          href: `/team/${selectedTeam.id}/matches`, 
          label: locale === 'fr' ? 'Matchs' : 'Matches', 
          icon: Trophy 
        },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  // Common items (always visible)
  const commonItems = [
    { href: '/players', label: t('nav.players'), icon: Users },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400">
            <Triangle className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Vertex</h1>
            <p className="text-xs text-muted-foreground">Football Coach</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => switchMode('private')}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'private'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <UserCircle className="w-4 h-4" />
              {locale === 'fr' ? 'Coach Privé' : 'Private Coach'}
            </button>
            <button
              onClick={() => switchMode('team')}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'team'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="w-4 h-4" />
              {locale === 'fr' ? 'Équipes' : 'Teams'}
            </button>
          </div>

          {/* Team Selector (only in team mode) */}
          {mode === 'team' && (
            <div className="mt-3 relative">
              <button
                onClick={() => setShowTeamSelector(!showTeamSelector)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UsersRound className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">
                    {selectedTeam?.name || (locale === 'fr' ? 'Sélectionner...' : 'Select team...')}
                  </span>
                </div>
                <ChevronDown className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  showTeamSelector && 'rotate-180'
                )} />
              </button>

              {/* Team Dropdown */}
              {showTeamSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  {teams?.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {teams.map((team: any) => (
                        <button
                          key={team.id}
                          onClick={() => selectTeam(team)}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors',
                            selectedTeam?.id === team.id && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                              <UsersRound className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{team.name}</p>
                              <p className="text-xs text-muted-foreground">{team.category}</p>
                            </div>
                          </div>
                          {selectedTeam?.id === team.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {locale === 'fr' ? 'Aucune équipe' : 'No teams yet'}
                      <Link href="/teams/new" className="block mt-2">
                        <Button size="sm" variant="outline" className="w-full">
                          {locale === 'fr' ? 'Créer une équipe' : 'Create team'}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {/* Mode-specific navigation */}
          {navItems.length > 0 && (
            <div className="space-y-1">
              <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {mode === 'private' 
                  ? (locale === 'fr' ? 'Coaching Privé' : 'Private Coaching')
                  : selectedTeam?.name || (locale === 'fr' ? 'Équipe' : 'Team')
                }
              </p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Separator */}
          <div className="my-4 border-t border-border" />

          {/* Common navigation */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {locale === 'fr' ? 'Général' : 'General'}
            </p>
            {commonItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user ? getInitials(user.firstName, user.lastName) : '??'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">Coach</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
