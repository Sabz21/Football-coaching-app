import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Session, Booking } from '@/types';
import { cn, formatDate, formatTime, STATUS_CONFIG } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface SessionCardProps {
  session: Session;
  showBookings?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SessionCard({
  session,
  showBookings = true,
  onClick,
  className,
}: SessionCardProps) {
  const statusConfig = STATUS_CONFIG[session.status];

  return (
    <div
      className={cn(
        'session-card cursor-pointer hover:bg-card/80 transition-colors',
        session.status === 'SCHEDULED' && 'session-card-scheduled',
        session.status === 'COMPLETED' && 'session-card-completed',
        session.status === 'CANCELLED' && 'session-card-cancelled',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {formatDate(session.date, 'EEE, MMM d')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </span>
          </div>
        </div>
        <Badge
          variant={
            session.status === 'COMPLETED'
              ? 'success'
              : session.status === 'CANCELLED'
              ? 'destructive'
              : 'default'
          }
        >
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{session.location}</span>
      </div>

      {showBookings && session.bookings && session.bookings.length > 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <div className="flex -space-x-2">
            {session.bookings.slice(0, 3).map((booking) => (
              <Avatar key={booking.id} className="w-7 h-7 border-2 border-card">
                <AvatarImage src={booking.player?.avatar} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {booking.player
                    ? getInitials(booking.player.firstName, booking.player.lastName)
                    : '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {session.bookings.length > 3 && (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-medium border-2 border-card">
                +{session.bookings.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {session.bookings.length}/{session.maxParticipants} spots filled
          </span>
        </div>
      )}

      {(!session.bookings || session.bookings.length === 0) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            0/{session.maxParticipants} spots filled
          </span>
        </div>
      )}
    </div>
  );
}
