'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Crown,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles: ('COACH' | 'PARENT' | 'PLAYER' | 'ADMIN')[];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: ['COACH', 'PARENT', 'PLAYER', 'ADMIN'],
  },
  {
    href: '/admin',
    labelKey: 'nav.admin',
    icon: Crown,
    roles: ['ADMIN', 'COACH'],
    adminOnly: true,
  },
  {
    href: '/coaches',
    labelKey: 'nav.coaches',
    icon: Search,
    roles: ['PARENT', 'PLAYER'],
  },
  {
    href: '/players',
    labelKey: 'nav.players',
    icon: Users,
    roles: ['COACH'],
  },
  {
    href: '/sessions',
    labelKey: 'nav.sessions',
    icon: Calendar,
    roles: ['COACH', 'PARENT'],
  },
  {
    href: '/bookings',
    labelKey: 'nav.bookings',
    icon: ClipboardList,
    roles: ['COACH', 'PARENT'],
  },
  {
    href: '/performance',
    labelKey: 'nav.performance',
    icon: TrendingUp,
    roles: ['COACH', 'PARENT', 'PLAYER'],
  },
  {
    href: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    roles: ['COACH', 'PARENT', 'PLAYER', 'ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { t, isRTL } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Check if user is admin (for demo, check email)
  const isAdmin = user?.email === 'admin@elitecoach.com';

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (item.adminOnly && !isAdmin && user.role !== 'COACH') return false;
    return item.roles.includes(user.role as any);
  });

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={cn(
          "fixed top-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border",
          isRTL ? "right-4" : "left-4"
        )}
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
          'fixed top-0 z-40 h-screen w-64 bg-card border-border transition-transform duration-300 lg:translate-x-0',
          isRTL ? 'right-0 border-l' : 'left-0 border-r',
          isOpen 
            ? 'translate-x-0' 
            : isRTL 
              ? 'translate-x-full' 
              : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Elite Coach</h1>
              <p className="text-xs text-muted-foreground">Pro Training</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
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
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    item.adminOnly && 'border border-dashed border-primary/30'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {t(item.labelKey)}
                  {isActive && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full bg-primary",
                      isRTL ? "mr-auto" : "ml-auto"
                    )} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
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
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role?.toLowerCase()}
                </p>
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
        </div>
      </aside>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isRTL } = useI18n();
  
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar />
      <main className={cn(
        "lg:pl-64",
        isRTL && "lg:pl-0 lg:pr-64"
      )}>
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
