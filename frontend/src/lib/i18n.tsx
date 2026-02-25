'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const translations: Record<string, Record<string, Record<string, string>>> = {
  en: {
    common: { loading: "Loading...", error: "Error", save: "Save", cancel: "Cancel" },
    nav: { dashboard: "Dashboard", players: "Players", sessions: "Sessions", bookings: "Bookings", performance: "Performance", settings: "Settings", admin: "Admin" },
    dashboard: { title: "Dashboard", welcome: "Welcome back", totalPlayers: "Total Players", activePlayers: "active", upcomingSessions: "Upcoming Sessions", thisWeek: "this week", pendingBookings: "Pending Bookings", awaitingConfirmation: "awaiting confirmation", completedSessions: "Completed Sessions", allTime: "all time", todaySessions: "Today's Sessions", noSessionsToday: "No sessions today", recentReports: "Recent Reports", noRecentReports: "No recent reports" },
    players: { title: "Players", addPlayer: "Add Player", noPlayers: "No players found" },
    sessions: { title: "Sessions", createSession: "Create Session", noSessions: "No sessions found" },
    bookings: { title: "Bookings", noBookings: "No bookings found" },
    admin: { title: "Admin Dashboard", overview: "Overview", coaches: "Coaches", allPlayers: "All Players", subscriptions: "Subscriptions" },
    settings: { title: "Settings", profile: "Profile", language: "Language" },
  },
  fr: {
    common: { loading: "Chargement...", error: "Erreur", save: "Enregistrer", cancel: "Annuler" },
    nav: { dashboard: "Tableau de bord", players: "Joueurs", sessions: "Séances", bookings: "Réservations", performance: "Performance", settings: "Paramètres", admin: "Admin" },
    dashboard: { title: "Tableau de bord", welcome: "Bienvenue", totalPlayers: "Total joueurs", activePlayers: "actifs", upcomingSessions: "Séances à venir", thisWeek: "cette semaine", pendingBookings: "Réservations en attente", awaitingConfirmation: "en attente", completedSessions: "Séances terminées", allTime: "au total", todaySessions: "Séances aujourd'hui", noSessionsToday: "Aucune séance aujourd'hui", recentReports: "Rapports récents", noRecentReports: "Aucun rapport récent" },
    players: { title: "Joueurs", addPlayer: "Ajouter un joueur", noPlayers: "Aucun joueur trouvé" },
    sessions: { title: "Séances", createSession: "Créer une séance", noSessions: "Aucune séance trouvée" },
    bookings: { title: "Réservations", noBookings: "Aucune réservation trouvée" },
    admin: { title: "Admin", overview: "Vue d'ensemble", coaches: "Coachs", allPlayers: "Tous les joueurs", subscriptions: "Abonnements" },
    settings: { title: "Paramètres", profile: "Profil", language: "Langue" },
  },
  ar: {
    common: { loading: "..." /* ... */ },
    nav: { dashboard: "..." /* ... */ },
    // ...
  },
};

type Locale = 'en' | 'fr' | 'ar';

interface I18nContextType {
  locale: Locale;
  language: Locale; // alias
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const languages: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
];

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved === 'en' || saved === 'fr' || saved === 'ar') setLocaleState(saved);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const parts = key.split('.');
    if (parts.length !== 2) return key;
    const section = parts[0];
    const item = parts[1];
    const localeTranslations = translations[locale];
    const enTranslations = translations['en'];
    
    if (localeTranslations && localeTranslations[section] && localeTranslations[section][item]) {
      return localeTranslations[section][item];
    }
    if (enTranslations && enTranslations[section] && enTranslations[section][item]) {
      return enTranslations[section][item];
    }
    return key;
  };

  const contextValue: I18nContextType = {
    locale,
    language: locale,
    setLocale,
    t,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'en',
      language: 'en',
      setLocale: () => {},
      t: (key: string) => {
        const parts = key.split('.');
        if (parts.length !== 2) return key;
        const section = parts[0];
        const item = parts[1];
        const enTranslations = translations['en'];
        if (enTranslations && enTranslations[section] && enTranslations[section][item]) {
          return enTranslations[section][item];
        }
        return key;
      },
    };
  }
  return context;
}