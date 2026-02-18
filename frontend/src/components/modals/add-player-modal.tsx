'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { playersApi } from '@/lib/api';
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

const playerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  position: z.string().optional(),
  preferredFoot: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  notes: z.string().optional(),
  sendTo: z.enum(['parent', 'player']),
  recipientEmail: z.string().email('Valid email required'),
  recipientPhone: z.string().optional(),
  notificationMethod: z.enum(['email', 'sms']),
});

type PlayerForm = z.infer<typeof playerSchema>;

interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddPlayerModal({ open, onClose }: AddPlayerModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
    trigger,
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      sendTo: 'parent',
      notificationMethod: 'email',
    },
    mode: 'onChange',
  });

  const sendTo = watch('sendTo');
  const notificationMethod = watch('notificationMethod');

  const createMutation = useMutation({
    mutationFn: async (data: PlayerForm) => {
      const playerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        position: data.position || undefined,
        preferredFoot: data.preferredFoot || undefined,
        height: data.height ? Number(data.height) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        notes: data.notes,
      };
      return playersApi.create(playerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
  });

  const onSubmit = (data: PlayerForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setSuccess(false);
    onClose();
  };

  const handleNextStep = async () => {
    const fieldsToValidate = ['firstName', 'lastName', 'dateOfBirth'] as const;
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep(2);
    }
  };

  const positions = [
    { value: 'Goalkeeper', label: t('positions.goalkeeper') },
    { value: 'Defender', label: t('positions.defender') },
    { value: 'Midfielder', label: t('positions.midfielder') },
    { value: 'Forward', label: t('positions.forward') },
    { value: 'Winger', label: t('positions.winger') },
    { value: 'Striker', label: t('positions.striker') },
  ];

  // Success Screen
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Player Created!</h3>
            <p className="text-muted-foreground">
              {t('addPlayer.successMessage')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addPlayer.title')}</DialogTitle>
          <DialogDescription>{t('addPlayer.subtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}
            >
              1
            </div>
            <div className={cn('w-16 h-1 rounded', step >= 2 ? 'bg-primary' : 'bg-secondary')} />
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}
            >
              2
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('addPlayer.personalInfo')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.firstName')} *</label>
                  <Input 
                    {...register('firstName')} 
                    placeholder="John"
                    error={errors.firstName?.message as string} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.lastName')} *</label>
                  <Input 
                    {...register('lastName')} 
                    placeholder="Doe"
                    error={errors.lastName?.message as string} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('addPlayer.dateOfBirth')} *</label>
                <Input 
                  type="date" 
                  {...register('dateOfBirth')} 
                  error={errors.dateOfBirth?.message as string} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.position')}</label>
                  <select
                    {...register('position')}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">-- Select --</option>
                    {positions.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.preferredFoot')}</label>
                  <select
                    {...register('preferredFoot')}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">-- Select --</option>
                    <option value="Left">{t('addPlayer.left')}</option>
                    <option value="Right">{t('addPlayer.right')}</option>
                    <option value="Both">{t('addPlayer.both')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.height')}</label>
                  <Input 
                    type="number" 
                    {...register('height')} 
                    placeholder="145"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('addPlayer.weight')}</label>
                  <Input 
                    type="number" 
                    {...register('weight')} 
                    placeholder="40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('addPlayer.notes')}</label>
                <textarea
                  {...register('notes')}
                  className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Any additional notes about the player..."
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={handleNextStep}>
                  {t('common.next')} →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">{t('addPlayer.loginCredentials')}</h3>

              {/* Send To Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('addPlayer.sendTo')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('sendTo', 'parent')}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      sendTo === 'parent'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <User className="w-5 h-5 mb-2 text-primary" />
                    <p className="font-medium text-sm">{t('addPlayer.sendToParent')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('sendTo', 'player')}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      sendTo === 'player'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <User className="w-5 h-5 mb-2 text-primary" />
                    <p className="font-medium text-sm">{t('addPlayer.sendToPlayer')}</p>
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {sendTo === 'parent' ? t('addPlayer.parentEmail') : t('addPlayer.playerEmail')} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...register('recipientEmail')}
                    type="email"
                    className="pl-10"
                    placeholder="email@example.com"
                    error={errors.recipientEmail?.message as string}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {sendTo === 'parent' ? t('addPlayer.parentPhone') : t('addPlayer.playerPhone')} ({t('common.optional')})
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    {...register('recipientPhone')}
                    type="tel"
                    className="pl-10"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              {/* Notification Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('addPlayer.notificationMethod')}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('notificationMethod', 'email')}
                    className={cn(
                      'flex-1 p-3 rounded-lg border-2 transition-all',
                      notificationMethod === 'email'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Mail className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-xs">{t('addPlayer.viaEmail')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('notificationMethod', 'sms')}
                    className={cn(
                      'flex-1 p-3 rounded-lg border-2 transition-all',
                      notificationMethod === 'sms'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Phone className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-xs">{t('addPlayer.viaSMS')}</p>
                  </button>
                </div>
              </div>

              {createMutation.isError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {t('common.error')}: {(createMutation.error as any)?.response?.data?.error || 'Something went wrong'}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  ← {t('common.back')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? t('addPlayer.creating') : t('common.save')}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
