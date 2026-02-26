'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const translations: Record<string, Record<string, Record<string, string>>> = {
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      all: "All",
      showing: "Showing",
      of: "of",
      noResults: "No results found",
    },
    nav: {
      dashboard: "Dashboard",
      players: "Players",
      sessions: "Sessions",
      bookings: "Bookings",
      performance: "Performance",
      settings: "Settings",
      admin: "Admin",
      coaches: "Find Coaches",
    },
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      totalPlayers: "Total Players",
      activePlayers: "active",
      upcomingSessions: "Upcoming Sessions",
      thisWeek: "this week",
      pendingBookings: "Pending Bookings",
      awaitingConfirmation: "awaiting confirmation",
      completedSessions: "Completed Sessions",
      allTime: "all time",
      todaySessions: "Today's Sessions",
      noSessionsToday: "No sessions today",
      recentReports: "Recent Reports",
      noRecentReports: "No recent reports",
    },
    players: {
      title: "Players",
      subtitle: "Manage your players",
      addPlayer: "Add Player",
      noPlayers: "No players found",
      searchPlayers: "Search players...",
      showing: "Showing",
      of: "of",
      sessions: "sessions",
      achievements: "achievements",
    },
    sessions: {
      title: "Sessions",
      subtitle: "Manage your training sessions",
      createSession: "Create Session",
      newSession: "New Session",
      noSessions: "No sessions found",
      goToToday: "Go to today",
      allSessionsThisWeek: "All Sessions This Week",
      noSessionsThisWeek: "No sessions this week",
    },
    bookings: {
      title: "Bookings",
      subtitle: "Manage booking requests",
      noBookings: "No bookings found",
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
    },
    performance: {
      title: "Performance",
      subtitle: "Track player progress",
    },
    admin: {
      title: "Admin Dashboard",
      subtitle: "Manage coaches and view platform statistics",
      overview: "Overview",
      coaches: "Coaches",
      allPlayers: "All Players",
      subscriptions: "Subscriptions",
      totalCoaches: "Total Coaches",
      totalPlayers: "Total Players",
      totalSessions: "Total Sessions",
      avgRating: "Avg. Coach Rating",
      outOf: "out of 5.0",
      active: "active",
      leaderboard: "Leaderboard",
      tierSystem: "Tier System",
      allCoaches: "All Coaches",
      searchCoaches: "Search coaches...",
      viewProfile: "View Profile",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account settings",
      profile: "Profile",
      profileDesc: "Update your personal information",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      security: "Security",
      securityDesc: "Manage your password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      changePassword: "Change Password",
      preferences: "Preferences",
      preferencesDesc: "Customize your experience",
      language: "Language",
      notifications: "Notifications",
    },
  },
  fr: {
    common: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      add: "Ajouter",
      search: "Rechercher",
      filter: "Filtrer",
      all: "Tous",
      showing: "Affichage",
      of: "sur",
      noResults: "Aucun résultat trouvé",
    },
    nav: {
      dashboard: "Tableau de bord",
      players: "Joueurs",
      sessions: "Séances",
      bookings: "Réservations",
      performance: "Performance",
      settings: "Paramètres",
      admin: "Admin",
      coaches: "Trouver un Coach",
    },
    dashboard: {
      title: "Tableau de bord",
      welcome: "Bienvenue",
      totalPlayers: "Total joueurs",
      activePlayers: "actifs",
      upcomingSessions: "Séances à venir",
      thisWeek: "cette semaine",
      pendingBookings: "Réservations en attente",
      awaitingConfirmation: "en attente",
      completedSessions: "Séances terminées",
      allTime: "au total",
      todaySessions: "Séances aujourd'hui",
      noSessionsToday: "Aucune séance aujourd'hui",
      recentReports: "Rapports récents",
      noRecentReports: "Aucun rapport récent",
    },
    players: {
      title: "Joueurs",
      subtitle: "Gérer vos joueurs",
      addPlayer: "Ajouter un joueur",
      noPlayers: "Aucun joueur trouvé",
      searchPlayers: "Rechercher des joueurs...",
      showing: "Affichage",
      of: "sur",
      sessions: "séances",
      achievements: "accomplissements",
    },
    sessions: {
      title: "Séances",
      subtitle: "Gérer vos séances d'entraînement",
      createSession: "Créer une séance",
      newSession: "Nouvelle séance",
      noSessions: "Aucune séance trouvée",
      goToToday: "Aller à aujourd'hui",
      allSessionsThisWeek: "Toutes les séances cette semaine",
      noSessionsThisWeek: "Aucune séance cette semaine",
    },
    bookings: {
      title: "Réservations",
      subtitle: "Gérer les demandes de réservation",
      noBookings: "Aucune réservation trouvée",
      pending: "En attente",
      confirmed: "Confirmée",
      cancelled: "Annulée",
    },
    performance: {
      title: "Performance",
      subtitle: "Suivre la progression des joueurs",
    },
    admin: {
      title: "Admin",
      subtitle: "Gérer les coachs et voir les statistiques",
      overview: "Vue d'ensemble",
      coaches: "Coachs",
      allPlayers: "Tous les joueurs",
      subscriptions: "Abonnements",
      totalCoaches: "Total coachs",
      totalPlayers: "Total joueurs",
      totalSessions: "Total séances",
      avgRating: "Note moyenne",
      outOf: "sur 5.0",
      active: "actifs",
      leaderboard: "Classement",
      tierSystem: "Système de niveaux",
      allCoaches: "Tous les coachs",
      searchCoaches: "Rechercher des coachs...",
      viewProfile: "Voir le profil",
    },
    settings: {
      title: "Paramètres",
      subtitle: "Gérer les paramètres du compte",
      profile: "Profil",
      profileDesc: "Mettre à jour vos informations personnelles",
      firstName: "Prénom",
      lastName: "Nom",
      email: "Email",
      phone: "Téléphone",
      security: "Sécurité",
      securityDesc: "Gérer votre mot de passe",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      changePassword: "Changer le mot de passe",
      preferences: "Préférences",
      preferencesDesc: "Personnaliser votre expérience",
      language: "Langue",
      notifications: "Notifications",
    },
  },
};

export type Locale = 'en' | 'fr';

interface I18nContextType {
  locale: Locale;
  language: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const languages: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

const defaultT = (key: string): string => {
  const parts = key.split('.');
  if (parts.length !== 2) return key;
  const [section, item] = parts;
  const en = translations['en'];
  if (en?.[section]?.[item]) return en[section][item];
  return key;
};

const defaultContext: I18nContextType = {
  locale: 'en',
  language: 'en',
  setLocale: () => {},
  t: defaultT,
};

const I18nContext = createContext<I18nContextType>(defaultContext);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'en' || saved === 'fr') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const parts = key.split('.');
    if (parts.length !== 2) return key;
    const [section, item] = parts;
    const localeData = translations[locale];
    const enData = translations['en'];
    if (localeData?.[section]?.[item]) return localeData[section][item];
    if (enData?.[section]?.[item]) return enData[section][item];
    return key;
  };

  return (
    <I18nContext.Provider value={{ locale, language: locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}

// Admin email constant - export for use in sidebar
export const ADMIN_EMAIL = 'jcsabbagh02@gmail.com';