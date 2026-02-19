'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { sessionsApi, bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RatePlayerModal } from '@/components/modals/rate-player-modal';
import { formatDate, formatTime, getInitials } from '@/lib/utils';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const sessionId = params.id as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [playerToRate, setPlayerToRate] = useState<any>(null);

  const isCoach = user?.role === 'COACH';

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.getById(sessionId),
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => sessionsApi.update(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      setIsEditing(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => sessionsApi.cancel(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      setShowCancelDialog(false);
      router.push('/sessions');
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: bookingsApi.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: () => sessionsApi.updateStatus(sessionId, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 bg-secondary rounded animate-pulse" />
        <div className="h-64 bg-card rounded-xl border animate-pulse" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6 animate-in">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">{t('sessions.sessionNotFound')}</h3>
            <p className="text-muted-foreground">{t('sessions.sessionNotFoundDesc')}</p>
            <Button className="mt-4" onClick={() => router.push('/sessions')}>
              {t('sessions.backToSessions')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'destructive';
      case 'IN_PROGRESS': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('sessions.backToSessions')}
        </Button>
        
        {isCoach && session.status === 'SCHEDULED' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('sessions.cancelSession')}
            </Button>
          </div>
        )}
      </div>

      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{t('sessions.trainingSession')}</CardTitle>
              <Badge 
                variant={getStatusBadgeVariant(session.status)}
                className="mt-2"
              >
                {t(`status.${session.status.toLowerCase()}`)}
              </Badge>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {t(`newSession.${session.type.toLowerCase()}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('newSession.date')}</p>
                <p className="font-medium">{formatDate(session.date, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('newSession.startTime')}</p>
                <p className="font-medium">{formatTime(session.startTime)} - {formatTime(session.endTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('newSession.location')}</p>
                <p className="font-medium">{session.location}</p>
              </div>
            </div>
          </div>

          {session.notes && (
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">{t('newSession.notes')}</p>
              <p>{session.notes}</p>
            </div>
          )}

          {/* Complete Session Button */}
          {isCoach && session.status === 'SCHEDULED' && (
            <Button 
              className="w-full" 
              variant="success"
              onClick={() => completeSessionMutation.mutate()}
              disabled={completeSessionMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('sessions.markComplete')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bookings / Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t('sessions.participants')} ({session.bookings?.length || 0}/{session.maxParticipants})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.bookings && session.bookings.length > 0 ? (
            <div className="space-y-3">
              {session.bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={booking.player?.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {booking.player 
                          ? getInitials(booking.player.firstName, booking.player.lastName)
                          : '?'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {booking.player?.firstName} {booking.player?.lastName}
                      </p>
                      {booking.parent?.user && (
                        <p className="text-sm text-muted-foreground">
                          {t('players.parent')}: {booking.parent.user.firstName} {booking.parent.user.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED' ? 'success' :
                        booking.status === 'PENDING' ? 'warning' :
                        'secondary'
                      }
                    >
                      {t(`status.${booking.status.toLowerCase()}`)}
                    </Badge>
                    
                    {/* Actions for pending bookings */}
                    {isCoach && booking.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => confirmBookingMutation.mutate(booking.id)}
                          disabled={confirmBookingMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Rate Player Button - Only for completed sessions */}
                    {isCoach && session.status === 'COMPLETED' && booking.status === 'CONFIRMED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPlayerToRate(booking.player)}
                        className="gap-1"
                      >
                        <Star className="w-4 h-4" />
                        {t('ratePlayer.rateButton')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('sessions.noParticipants')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sessions.editSession')}</DialogTitle>
            <DialogDescription>{t('sessions.editSessionDesc')}</DialogDescription>
          </DialogHeader>
          <EditSessionForm
            session={session}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
            t={t}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {t('sessions.cancelSession')}
            </DialogTitle>
            <DialogDescription>
              {t('sessions.cancelSessionConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              {t('sessions.keepSession')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('common.loading') : t('sessions.yesCancelSession')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rate Player Modal */}
      {playerToRate && (
        <RatePlayerModal
          open={!!playerToRate}
          onClose={() => setPlayerToRate(null)}
          sessionId={sessionId}
          player={playerToRate}
        />
      )}
    </div>
  );
}

function EditSessionForm({ 
  session, 
  onSubmit, 
  onCancel, 
  isLoading,
  t
}: { 
  session: any; 
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
  t: (key: string) => string;
}) {
  const [formData, setFormData] = useState({
    date: session.date.split('T')[0],
    startTime: session.startTime,
    endTime: session.endTime,
    location: session.location,
    maxParticipants: session.maxParticipants,
    notes: session.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('newSession.date')}</label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('newSession.startTime')}</label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('newSession.endTime')}</label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('newSession.location')}</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('newSession.maxParticipants')}</label>
        <Input
          type="number"
          min={1}
          value={formData.maxParticipants}
          onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('newSession.notes')}</label>
        <textarea
          className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
