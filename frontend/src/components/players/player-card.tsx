import Link from 'next/link';
import { ChevronRight, Trophy, Calendar } from 'lucide-react';
import { Player } from '@/types';
import { cn, calculateAge, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PlayerCardProps {
  player: Player;
  showStats?: boolean;
  className?: string;
}

export function PlayerCard({ player, showStats = true, className }: PlayerCardProps) {
  const age = calculateAge(player.dateOfBirth);

  return (
    <Link
      href={`/players/${player.id}`}
      className={cn(
        'block p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 border-2 border-border">
          <AvatarImage src={player.avatar} />
          <AvatarFallback className="bg-primary/20 text-primary text-lg">
            {getInitials(player.firstName, player.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {player.firstName} {player.lastName}
            </h3>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>{age} years</span>
            {player.position && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
                  {player.position}
                </Badge>
              </>
            )}
          </div>

          {showStats && player._count && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{player._count.sessionReports} sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span>{player._count.achievements} achievements</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance preview */}
      {player.performanceMetrics && player.performanceMetrics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3">
            {player.performanceMetrics.slice(0, 2).map((metric) => (
              <div key={metric.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{metric.name}</span>
                  <span className="font-medium">{Math.round(Number(metric.value))}</span>
                </div>
                <Progress value={Number(metric.value)} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

// Compact version for lists
export function PlayerCardCompact({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
    >
      <Avatar className="w-10 h-10">
        <AvatarImage src={player.avatar} />
        <AvatarFallback className="bg-primary/20 text-primary text-sm">
          {getInitials(player.firstName, player.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {player.firstName} {player.lastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {player.position || 'No position set'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
