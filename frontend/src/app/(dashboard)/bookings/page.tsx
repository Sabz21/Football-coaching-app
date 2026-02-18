'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, X, Clock, AlertCircle } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, formatTime, getInitials, STATUS_CONFIG } from '@/lib/utils';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isCoach = user?.role === 'COACH';

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => (isCoach ? bookingsApi.getPending() : bookingsApi.getAll({ upcoming: true })),
  });

  const confirmMutation = useMutation({
    mutationFn: bookingsApi.confirm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          {isCoach ? 'Review and manage booking requests' : 'Your session bookings'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Player Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={booking.player?.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {booking.player
                          ? getInitials(booking.player.firstName, booking.player.lastName)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {booking.player?.firstName} {booking.player?.lastName}
                      </p>
                      {isCoach && booking.parent?.user && (
                        <p className="text-sm text-muted-foreground">
                          Parent: {booking.parent.user.firstName} {booking.parent.user.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(booking.session?.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(booking.session?.startTime)} - {formatTime(booking.session?.endTime)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.session?.location}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED'
                          ? 'success'
                          : booking.status === 'PENDING'
                          ? 'warning'
                          : booking.status === 'CANCELLED'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG]?.label || booking.status}
                    </Badge>

                    {isCoach && booking.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => confirmMutation.mutate(booking.id)}
                          disabled={confirmMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelMutation.mutate(booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {!isCoach && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No bookings</h3>
            <p className="text-muted-foreground text-center">
              {isCoach ? 'No pending booking requests' : 'You have no upcoming bookings'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
