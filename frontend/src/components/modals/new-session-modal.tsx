'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sessionsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const sessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['INDIVIDUAL', 'GROUP', 'ASSESSMENT', 'TRIAL']),
  maxParticipants: z.number().min(1).max(50),
  notes: z.string().optional(),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewSessionModal({ open, onClose }: NewSessionModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      type: 'INDIVIDUAL',
      maxParticipants: 1,
    },
  });

  const sessionType = watch('type');

  const createMutation = useMutation({
    mutationFn: sessionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      reset();
      onClose();
    },
  });

  const onSubmit = (data: SessionForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const sessionTypes = [
    { value: 'INDIVIDUAL', label: t('newSession.individual'), icon: '👤', defaultMax: 1 },
    { value: 'GROUP', label: t('newSession.group'), icon: '👥', defaultMax: 6 },
    { value: 'ASSESSMENT', label: t('newSession.assessment'), icon: '📋', defaultMax: 1 },
    { value: 'TRIAL', label: t('newSession.trial'), icon: '🎯', defaultMax: 1 },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('newSession.title')}</DialogTitle>
          <DialogDescription>{t('newSession.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Session Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('newSession.sessionType')}</label>
            <div className="grid grid-cols-4 gap-2">
              {sessionTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setValue('type', type.value as any);
                    setValue('maxParticipants', type.defaultMax);
                  }}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    sessionType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-xl block mb-1">{type.icon}</span>
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('newSession.date')}
              </label>
              <Input type="date" {...register('date')} error={errors.date?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {t('newSession.startTime')}
              </label>
              <Input type="time" {...register('startTime')} error={errors.startTime?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {t('newSession.endTime')}
              </label>
              <Input type="time" {...register('endTime')} error={errors.endTime?.message} />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {t('newSession.location')}
            </label>
            <Input
              {...register('location')}
              placeholder={t('newSession.locationPlaceholder')}
              error={errors.location?.message}
            />
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Users className="w-4 h-4" />
              {t('newSession.maxParticipants')}
            </label>
            <Input
              type="number"
              min={1}
              max={50}
              {...register('maxParticipants', { valueAsNumber: true })}
              error={errors.maxParticipants?.message}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('newSession.notes')}</label>
            <textarea
              {...register('notes')}
              className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder={t('newSession.notesPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('newSession.creating') : t('common.save')}
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive text-center">
              {t('common.error')}: {(createMutation.error as any)?.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
