import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '??';
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

export function formatDateTime(date: string | Date, time?: string): string {
  const dateStr = formatDate(date);
  if (time) {
    return `${dateStr} at ${formatTime(time)}`;
  }
  return dateStr;
}

export function getAge(dateOfBirth: string | Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getMatchResult(goalsFor?: number | null, goalsAgainst?: number | null): 'win' | 'draw' | 'loss' | null {
  if (goalsFor === null || goalsFor === undefined || goalsAgainst === null || goalsAgainst === undefined) {
    return null;
  }
  if (goalsFor > goalsAgainst) return 'win';
  if (goalsFor < goalsAgainst) return 'loss';
  return 'draw';
}

export function getResultColor(result: 'win' | 'draw' | 'loss' | null): string {
  switch (result) {
    case 'win': return 'text-green-500';
    case 'draw': return 'text-yellow-500';
    case 'loss': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

export function getResultBadgeColor(result: 'win' | 'draw' | 'loss' | null): string {
  switch (result) {
    case 'win': return 'bg-green-500/20 text-green-500';
    case 'draw': return 'bg-yellow-500/20 text-yellow-500';
    case 'loss': return 'bg-red-500/20 text-red-500';
    default: return 'bg-muted text-muted-foreground';
  }
}
