'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Simple translations - EN only for now (easy to add FR later)
const translations: Record<string, Record<string, string>> = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.search': 'Search...',
  'common.noResults': 'No results found',
  
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.calendar': 'Calendar',
  'nav.players': 'Players',
  'nav.sessions': 'Sessions',
  'nav.teams': 'Teams',
  'nav.matches': 'Matches',
  'nav.settings': 'Settings',
  
  // Dashboard
  'dashboard.welcome': 'Welcome back',
  'dashboard.todaySessions': "Today's Sessions",
  'dashboard.upcomingMatches': 'Upcoming Matches',
  'dashboard.totalPlayers': 'Total Players',
  'dashboard.totalTeams': 'Teams',
  'dashboard.recentNotes': 'Recent Notes',
  
  // Players
  'players.title': 'Players',
  'players.addPlayer': 'Add Player',
  'players.noPlayers': 'No players yet',
  
  // Sessions
  'sessions.title': 'Sessions',
  'sessions.newSession': 'New Session',
  'sessions.noSessions': 'No sessions scheduled',
  
  // Teams
  'teams.title': 'Teams',
  'teams.addTeam': 'Add Team',
  'teams.noTeams': 'No teams yet',
  
  // Matches
  'matches.title': 'Matches',
  'matches.addMatch': 'Add Match',
  'matches.noMatches': 'No matches scheduled',
  
  // Settings
  'settings.title': 'Settings',
  'settings.profile': 'Profile',
  'settings.security': 'Security',
};

interface I18nContextType {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => translations[key] || key,
  locale: 'en',
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved) setLocale(saved);
  }, []);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  const handleSetLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale: handleSetLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
