import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

// Format date relative
export function formatDateRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  
  return formatDistanceToNow(d, { addSuffix: true });
}

// Format time
export function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

// Format session date and time
export function formatSessionDateTime(date: string, startTime: string, endTime: string) {
  const d = parseISO(date);
  const dateStr = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d');
  return `${dateStr} • ${formatTime(startTime)} - ${formatTime(endTime)}`;
}

// Get initials from name
export function getInitials(firstName: string, lastName?: string) {
  if (lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return firstName.slice(0, 2).toUpperCase();
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string | Date) {
  const today = new Date();
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Day of week names
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Get day name from number
export function getDayName(dayOfWeek: number) {
  return DAYS_OF_WEEK[dayOfWeek];
}

// Status colors and labels
export const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-primary', textColor: 'text-primary' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-accent', textColor: 'text-accent' },
  COMPLETED: { label: 'Completed', color: 'bg-success', textColor: 'text-success' },
  CANCELLED: { label: 'Cancelled', color: 'bg-destructive', textColor: 'text-destructive' },
  PENDING: { label: 'Pending', color: 'bg-warning', textColor: 'text-warning' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-primary', textColor: 'text-primary' },
  NO_SHOW: { label: 'No Show', color: 'bg-muted', textColor: 'text-muted-foreground' },
};

// Metric category colors
export const CATEGORY_COLORS = {
  TECHNICAL: { bg: 'bg-blue-500/20', text: 'text-blue-400', fill: '#3b82f6' },
  PHYSICAL: { bg: 'bg-green-500/20', text: 'text-green-400', fill: '#22c55e' },
  TACTICAL: { bg: 'bg-purple-500/20', text: 'text-purple-400', fill: '#a855f7' },
  MENTAL: { bg: 'bg-orange-500/20', text: 'text-orange-400', fill: '#f97316' },
};

// Session type config
export const SESSION_TYPE_CONFIG = {
  INDIVIDUAL: { label: 'Individual', icon: 'User' },
  GROUP: { label: 'Group', icon: 'Users' },
  ASSESSMENT: { label: 'Assessment', icon: 'ClipboardCheck' },
  TRIAL: { label: 'Trial', icon: 'Target' },
};

// Achievement icons
export const ACHIEVEMENT_ICONS = {
  MILESTONE: '🏆',
  SKILL: '⚡',
  ATTENDANCE: '📅',
  IMPROVEMENT: '📈',
  SPECIAL: '⭐',
};

// Format number with suffix
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
