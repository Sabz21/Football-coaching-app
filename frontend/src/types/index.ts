// User & Auth Types
export type Role = 'COACH' | 'PARENT' | 'PLAYER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  createdAt: string;
  coachProfile?: CoachProfile;
  parentProfile?: ParentProfile;
  playerProfile?: PlayerProfile;
}

export interface CoachProfile {
  id: string;
  bio?: string;
  specializations: string[];
  experience?: number;
  certifications: string[];
  hourlyRate?: number;
}

export interface ParentProfile {
  id: string;
  address?: string;
  children?: Player[];
}

export interface PlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  dateOfBirth: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Player Types
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  avatar?: string;
  position?: string;
  preferredFoot?: 'Left' | 'Right' | 'Both';
  height?: number;
  weight?: number;
  notes?: string;
  isActive: boolean;
  parentId?: string;
  coachId?: string;
  parent?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  coach?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    sessionReports: number;
    achievements: number;
    bookings: number;
  };
  performanceMetrics?: PerformanceMetric[];
  achievements?: Achievement[];
  sessionReports?: SessionReport[];
}

// Session Types
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SessionType = 'INDIVIDUAL' | 'GROUP' | 'ASSESSMENT' | 'TRIAL';

export interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: SessionType;
  status: SessionStatus;
  maxParticipants: number;
  notes?: string;
  coachId: string;
  coach?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  bookings?: Booking[];
  _count?: {
    bookings: number;
    sessionReports: number;
  };
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  isRecurring: boolean;
  specificDate?: string;
  maxPlayers: number;
  isActive: boolean;
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Booking {
  id: string;
  sessionId: string;
  playerId: string;
  parentId: string;
  status: BookingStatus;
  notes?: string;
  bookedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  session?: Session;
  player?: Player;
  parent?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
}

// Performance Types
export type MetricCategory = 'TECHNICAL' | 'PHYSICAL' | 'TACTICAL' | 'MENTAL';

export interface PerformanceMetric {
  id: string;
  playerId: string;
  category: MetricCategory;
  name: string;
  value: number;
  unit?: string;
  measuredAt: string;
  notes?: string;
}

export interface SessionReport {
  id: string;
  sessionId: string;
  playerId: string;
  coachId: string;
  effortRating: number;
  focusRating: number;
  technicalRating: number;
  highlights?: string;
  improvements?: string;
  coachNotes?: string;
  playerFeedback?: string;
  drillsCompleted: string[];
  focusAreas: string[];
  attendance: boolean;
  createdAt: string;
  session?: Session;
  player?: Player;
  coach?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export type AchievementType = 'MILESTONE' | 'SKILL' | 'ATTENDANCE' | 'IMPROVEMENT' | 'SPECIAL';

export interface Achievement {
  id: string;
  playerId: string;
  type: AchievementType;
  name: string;
  description?: string;
  icon?: string;
  earnedAt: string;
}

export interface MetricDefinition {
  id: string;
  category: MetricCategory;
  name: string;
  description?: string;
  unit?: string;
  minValue: number;
  maxValue: number;
}

// Dashboard Types
export interface CoachDashboardStats {
  totalPlayers: number;
  activePlayers: number;
  upcomingSessions: number;
  pendingBookings: number;
  completedSessions: number;
}

export interface CoachDashboard {
  stats: CoachDashboardStats;
  todaySessions: Session[];
  recentReports: SessionReport[];
}

export interface ParentDashboard {
  children: Player[];
  upcomingBookings: Booking[];
  stats: {
    totalChildren: number;
    completedSessions: number;
    upcomingBookingsCount: number;
  };
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  details?: any;
}
