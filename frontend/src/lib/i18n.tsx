'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'fr';

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.calendar': 'Calendar',
    'nav.players': 'Players',
    'nav.teams': 'Teams',
    'nav.matches': 'Matches',
    'nav.settings': 'Settings',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.today': 'Today',
    'common.week': 'Week',
    'common.month': 'Month',
    
    // Auth
    'auth.login': 'Sign in',
    'auth.register': 'Sign up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.phone': 'Phone',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.welcomeBack': 'Welcome back',
    'auth.signInTo': 'Sign in to your Vertex account',
    'auth.createAccount': 'Create account',
    'auth.startManaging': 'Start managing your coaching business',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.todaySessions': "Today's Sessions",
    'dashboard.totalPlayers': 'Total Players',
    'dashboard.teams': 'Teams',
    'dashboard.upcomingMatches': 'Upcoming Matches',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.noSessions': 'No sessions scheduled for today',
    'dashboard.noMatches': 'No upcoming matches',
    'dashboard.scheduleSession': 'Schedule a session',
    'dashboard.scheduleMatch': 'Schedule a match',
    
    // Players
    'players.title': 'Players',
    'players.subtitle': 'Manage your players and track their progress',
    'players.addPlayer': 'Add Player',
    'players.searchPlayers': 'Search players...',
    'players.noPlayers': 'No players found',
    'players.addFirst': 'Add your first player to get started',
    'players.sessions': 'sessions',
    'players.notes': 'notes',
    'players.years': 'yrs',
    'players.basicInfo': 'Basic Information',
    'players.basicInfoDesc': "Player's personal details (all fields required)",
    'players.footballInfo': 'Football Information',
    'players.footballInfoDesc': 'Position and physical attributes',
    'players.position': 'Position',
    'players.preferredFoot': 'Preferred Foot',
    'players.height': 'Height (cm)',
    'players.weight': 'Weight (kg)',
    'players.jersey': 'Jersey #',
    'players.dateOfBirth': 'Date of Birth',
    'players.createPlayer': 'Create Player',
    'players.editPlayer': 'Edit Player',
    'players.deletePlayer': 'Delete Player',
    'players.deleteConfirm': 'Are you sure you want to delete this player? This action cannot be undone.',
    'players.activityTimeline': 'Activity Timeline',
    'players.addNote': 'Add a note about this player...',
    'players.noNotes': 'No notes yet',
    'players.addFirstNote': 'Add your first note above',
    
    // Sessions
    'sessions.title': 'Sessions',
    'sessions.newSession': 'New Session',
    'sessions.sessionDetails': 'Session Details',
    'sessions.sessionTitle': 'Session Title',
    'sessions.date': 'Date',
    'sessions.startTime': 'Start Time',
    'sessions.endTime': 'End Time',
    'sessions.location': 'Location',
    'sessions.type': 'Type',
    'sessions.objectives': 'Objectives',
    'sessions.notes': 'Notes',
    'sessions.selectPlayers': 'Select Players',
    'sessions.playersSelected': 'player(s) selected',
    'sessions.individual': 'Individual',
    'sessions.group': 'Group',
    'sessions.assessment': 'Assessment',
    'sessions.trial': 'Trial',
    'sessions.scheduled': 'Scheduled',
    'sessions.completed': 'Completed',
    'sessions.cancelled': 'Cancelled',
    'sessions.completeReport': 'Complete & Report',
    'sessions.sessionReport': 'Session Report',
    'sessions.rating': 'Rating',
    'sessions.playerFeedback': 'Player Feedback',
    'sessions.present': 'Present',
    'sessions.absent': 'Absent',
    
    // Teams
    'teams.title': 'Teams',
    'teams.subtitle': 'Manage your teams and track their performance',
    'teams.createTeam': 'Create Team',
    'teams.noTeams': 'No teams yet',
    'teams.createFirst': 'Create your first team to start tracking matches',
    'teams.teamName': 'Team Name',
    'teams.category': 'Category',
    'teams.season': 'Season',
    'teams.formation': 'Formation',
    'teams.players': 'players',
    'teams.matches': 'matches',
    'teams.addPlayers': 'Add Players',
    'teams.removePlayer': 'Remove player from team?',
    'teams.squad': 'Squad',
    'teams.recentMatches': 'Recent Matches',
    'teams.stats': 'Stats',
    'teams.played': 'Played',
    'teams.wins': 'Wins',
    'teams.draws': 'Draws',
    'teams.losses': 'Losses',
    'teams.goalDiff': 'Goal Diff',
    
    // Matches
    'matches.title': 'Matches',
    'matches.subtitle': 'Schedule and track your team matches',
    'matches.addMatch': 'Add Match',
    'matches.noMatches': 'No matches found',
    'matches.scheduleFirst': 'Schedule your first match',
    'matches.upcoming': 'Upcoming',
    'matches.completed': 'Completed',
    'matches.opponent': 'Opponent',
    'matches.home': 'Home',
    'matches.away': 'Away',
    'matches.venue': 'Venue',
    'matches.kickoff': 'Kick-off Time',
    'matches.competition': 'Competition',
    'matches.preMatchNotes': 'Pre-match Notes',
    'matches.postMatchNotes': 'Post-match Notes',
    'matches.recordResult': 'Record Result',
    'matches.manOfTheMatch': 'Man of the Match',
    'matches.playerStats': 'Player Statistics',
    'matches.goals': 'Goals',
    'matches.assists': 'Assists',
    'matches.minutes': 'Min',
    'matches.starter': 'Starter',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account settings',
    'settings.profile': 'Profile',
    'settings.profileDesc': 'Update your personal information',
    'settings.security': 'Security',
    'settings.securityDesc': 'Update your password',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose your preferred language',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmNewPassword': 'Confirm New Password',
    'settings.updatePassword': 'Update Password',
    'settings.saveChanges': 'Save Changes',
    'settings.emailCannotChange': 'Email cannot be changed',
    
    // Note types
    'noteType.general': 'General',
    'noteType.sessionReport': 'Session Report',
    'noteType.performance': 'Performance',
    'noteType.injury': 'Injury',
    'noteType.goal': 'Goal',
    'noteType.important': 'Important',
    
    // Positions
    'position.goalkeeper': 'Goalkeeper',
    'position.rightBack': 'Right Back',
    'position.leftBack': 'Left Back',
    'position.centerBack': 'Center Back',
    'position.defensiveMidfielder': 'Defensive Midfielder',
    'position.centralMidfielder': 'Central Midfielder',
    'position.attackingMidfielder': 'Attacking Midfielder',
    'position.rightWinger': 'Right Winger',
    'position.leftWinger': 'Left Winger',
    'position.striker': 'Striker',
    
    // Foot
    'foot.right': 'Right',
    'foot.left': 'Left',
    'foot.both': 'Both',
  },
  
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.calendar': 'Calendrier',
    'nav.players': 'Joueurs',
    'nav.teams': 'Équipes',
    'nav.matches': 'Matchs',
    'nav.settings': 'Paramètres',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.all': 'Tous',
    'common.loading': 'Chargement...',
    'common.noResults': 'Aucun résultat',
    'common.required': 'Obligatoire',
    'common.optional': 'Optionnel',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.today': "Aujourd'hui",
    'common.week': 'Semaine',
    'common.month': 'Mois',
    
    // Auth
    'auth.login': 'Se connecter',
    'auth.register': "S'inscrire",
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.firstName': 'Prénom',
    'auth.lastName': 'Nom',
    'auth.phone': 'Téléphone',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.noAccount': "Vous n'avez pas de compte ?",
    'auth.hasAccount': 'Vous avez déjà un compte ?',
    'auth.welcomeBack': 'Bon retour',
    'auth.signInTo': 'Connectez-vous à votre compte Vertex',
    'auth.createAccount': 'Créer un compte',
    'auth.startManaging': 'Commencez à gérer votre activité de coach',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.todaySessions': "Séances d'aujourd'hui",
    'dashboard.totalPlayers': 'Total Joueurs',
    'dashboard.teams': 'Équipes',
    'dashboard.upcomingMatches': 'Matchs à venir',
    'dashboard.recentActivity': 'Activité récente',
    'dashboard.quickActions': 'Actions rapides',
    'dashboard.noSessions': "Pas de séances prévues aujourd'hui",
    'dashboard.noMatches': 'Pas de matchs à venir',
    'dashboard.scheduleSession': 'Planifier une séance',
    'dashboard.scheduleMatch': 'Planifier un match',
    
    // Players
    'players.title': 'Joueurs',
    'players.subtitle': 'Gérez vos joueurs et suivez leur progression',
    'players.addPlayer': 'Ajouter un joueur',
    'players.searchPlayers': 'Rechercher des joueurs...',
    'players.noPlayers': 'Aucun joueur trouvé',
    'players.addFirst': 'Ajoutez votre premier joueur pour commencer',
    'players.sessions': 'séances',
    'players.notes': 'notes',
    'players.years': 'ans',
    'players.basicInfo': 'Informations de base',
    'players.basicInfoDesc': 'Détails personnels du joueur (tous les champs obligatoires)',
    'players.footballInfo': 'Informations football',
    'players.footballInfoDesc': 'Poste et attributs physiques',
    'players.position': 'Poste',
    'players.preferredFoot': 'Pied préféré',
    'players.height': 'Taille (cm)',
    'players.weight': 'Poids (kg)',
    'players.jersey': 'Numéro',
    'players.dateOfBirth': 'Date de naissance',
    'players.createPlayer': 'Créer le joueur',
    'players.editPlayer': 'Modifier le joueur',
    'players.deletePlayer': 'Supprimer le joueur',
    'players.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer ce joueur ? Cette action est irréversible.',
    'players.activityTimeline': 'Historique',
    'players.addNote': 'Ajouter une note sur ce joueur...',
    'players.noNotes': 'Pas encore de notes',
    'players.addFirstNote': 'Ajoutez votre première note ci-dessus',
    
    // Sessions
    'sessions.title': 'Séances',
    'sessions.newSession': 'Nouvelle séance',
    'sessions.sessionDetails': 'Détails de la séance',
    'sessions.sessionTitle': 'Titre de la séance',
    'sessions.date': 'Date',
    'sessions.startTime': 'Heure de début',
    'sessions.endTime': 'Heure de fin',
    'sessions.location': 'Lieu',
    'sessions.type': 'Type',
    'sessions.objectives': 'Objectifs',
    'sessions.notes': 'Notes',
    'sessions.selectPlayers': 'Sélectionner les joueurs',
    'sessions.playersSelected': 'joueur(s) sélectionné(s)',
    'sessions.individual': 'Individuel',
    'sessions.group': 'Groupe',
    'sessions.assessment': 'Évaluation',
    'sessions.trial': 'Essai',
    'sessions.scheduled': 'Planifiée',
    'sessions.completed': 'Terminée',
    'sessions.cancelled': 'Annulée',
    'sessions.completeReport': 'Terminer et rapport',
    'sessions.sessionReport': 'Rapport de séance',
    'sessions.rating': 'Note',
    'sessions.playerFeedback': 'Feedback joueurs',
    'sessions.present': 'Présent',
    'sessions.absent': 'Absent',
    
    // Teams
    'teams.title': 'Équipes',
    'teams.subtitle': 'Gérez vos équipes et suivez leurs performances',
    'teams.createTeam': 'Créer une équipe',
    'teams.noTeams': "Pas encore d'équipe",
    'teams.createFirst': 'Créez votre première équipe pour suivre les matchs',
    'teams.teamName': "Nom de l'équipe",
    'teams.category': 'Catégorie',
    'teams.season': 'Saison',
    'teams.formation': 'Formation',
    'teams.players': 'joueurs',
    'teams.matches': 'matchs',
    'teams.addPlayers': 'Ajouter des joueurs',
    'teams.removePlayer': "Retirer le joueur de l'équipe ?",
    'teams.squad': 'Effectif',
    'teams.recentMatches': 'Matchs récents',
    'teams.stats': 'Statistiques',
    'teams.played': 'Joués',
    'teams.wins': 'Victoires',
    'teams.draws': 'Nuls',
    'teams.losses': 'Défaites',
    'teams.goalDiff': 'Diff. buts',
    
    // Matches
    'matches.title': 'Matchs',
    'matches.subtitle': 'Planifiez et suivez vos matchs',
    'matches.addMatch': 'Ajouter un match',
    'matches.noMatches': 'Aucun match trouvé',
    'matches.scheduleFirst': 'Planifiez votre premier match',
    'matches.upcoming': 'À venir',
    'matches.completed': 'Terminés',
    'matches.opponent': 'Adversaire',
    'matches.home': 'Domicile',
    'matches.away': 'Extérieur',
    'matches.venue': 'Lieu',
    'matches.kickoff': 'Coup d\'envoi',
    'matches.competition': 'Compétition',
    'matches.preMatchNotes': 'Notes avant-match',
    'matches.postMatchNotes': 'Notes après-match',
    'matches.recordResult': 'Enregistrer le résultat',
    'matches.manOfTheMatch': 'Homme du match',
    'matches.playerStats': 'Statistiques joueurs',
    'matches.goals': 'Buts',
    'matches.assists': 'Passes D.',
    'matches.minutes': 'Min',
    'matches.starter': 'Titulaire',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Gérez les paramètres de votre compte',
    'settings.profile': 'Profil',
    'settings.profileDesc': 'Mettez à jour vos informations personnelles',
    'settings.security': 'Sécurité',
    'settings.securityDesc': 'Changez votre mot de passe',
    'settings.language': 'Langue',
    'settings.languageDesc': 'Choisissez votre langue préférée',
    'settings.currentPassword': 'Mot de passe actuel',
    'settings.newPassword': 'Nouveau mot de passe',
    'settings.confirmNewPassword': 'Confirmer le nouveau mot de passe',
    'settings.updatePassword': 'Mettre à jour',
    'settings.saveChanges': 'Enregistrer',
    'settings.emailCannotChange': "L'email ne peut pas être modifié",
    
    // Note types
    'noteType.general': 'Général',
    'noteType.sessionReport': 'Rapport de séance',
    'noteType.performance': 'Performance',
    'noteType.injury': 'Blessure',
    'noteType.goal': 'Objectif',
    'noteType.important': 'Important',
    
    // Positions
    'position.goalkeeper': 'Gardien',
    'position.rightBack': 'Arrière droit',
    'position.leftBack': 'Arrière gauche',
    'position.centerBack': 'Défenseur central',
    'position.defensiveMidfielder': 'Milieu défensif',
    'position.centralMidfielder': 'Milieu central',
    'position.attackingMidfielder': 'Milieu offensif',
    'position.rightWinger': 'Ailier droit',
    'position.leftWinger': 'Ailier gauche',
    'position.striker': 'Attaquant',
    
    // Foot
    'foot.right': 'Droit',
    'foot.left': 'Gauche',
    'foot.both': 'Les deux',
  },
};

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && (saved === 'en' || saved === 'fr')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const translation = translations[locale][key as TranslationKey];
    return translation || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
