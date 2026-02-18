'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Shield, 
  Globe, 
  Bell, 
  Save, 
  Eye, 
  EyeOff,
  Award,
  Briefcase,
  Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n, languages, Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Schemas
const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const coachInfoSchema = z.object({
  bio: z.string().optional(),
  specializations: z.string().optional(),
  experience: z.number().min(0).optional(),
  certifications: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { user, fetchProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const isCoach = user?.role === 'COACH';

  // Profile Form
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  // Coach Info Form
  const coachForm = useForm({
    resolver: zodResolver(coachInfoSchema),
    defaultValues: {
      bio: user?.coachProfile?.bio || '',
      specializations: user?.coachProfile?.specializations?.join(', ') || '',
      experience: user?.coachProfile?.experience || 0,
      certifications: user?.coachProfile?.certifications?.join(', ') || '',
      hourlyRate: user?.coachProfile?.hourlyRate || 0,
    },
  });

  // Password Form
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      fetchProfile();
      setSaveSuccess('profile');
      setTimeout(() => setSaveSuccess(null), 3000);
    },
  });

  const updateCoachInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      // This would need a new API endpoint to update coach profile
      return authApi.updateProfile({
        coachProfile: {
          bio: data.bio,
          specializations: data.specializations.split(',').map((s: string) => s.trim()),
          experience: data.experience,
          certifications: data.certifications.split(',').map((s: string) => s.trim()),
          hourlyRate: data.hourlyRate,
        },
      });
    },
    onSuccess: () => {
      fetchProfile();
      setSaveSuccess('coach');
      setTimeout(() => setSaveSuccess(null), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      // This would need a new API endpoint
      return fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      setSaveSuccess('password');
      setTimeout(() => setSaveSuccess(null), 3000);
    },
  });

  const onProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const onCoachInfoSubmit = (data: any) => {
    updateCoachInfoMutation.mutate(data);
  };

  const onPasswordSubmit = (data: any) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.profile')}</span>
          </TabsTrigger>
          {isCoach && (
            <TabsTrigger value="coach" className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{t('settings.coachInfo')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.security')}</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{t('settings.preferences')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile')}</CardTitle>
              <CardDescription>{t('settings.profileDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.firstName')}</label>
                    <Input {...profileForm.register('firstName')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.lastName')}</label>
                    <Input {...profileForm.register('lastName')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings.email')}</label>
                  <Input {...profileForm.register('email')} type="email" disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('settings.phone')}</label>
                  <Input {...profileForm.register('phone')} type="tel" />
                </div>
                <div className="flex items-center justify-between pt-4">
                  {saveSuccess === 'profile' && (
                    <Badge variant="success" className="gap-1">
                      <Check className="w-3 h-3" />
                      {t('settings.saved')}
                    </Badge>
                  )}
                  <Button type="submit" className="ml-auto" disabled={updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? t('settings.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coach Info Tab */}
        {isCoach && (
          <TabsContent value="coach">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.coachInfo')}</CardTitle>
                <CardDescription>{t('settings.coachInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={coachForm.handleSubmit(onCoachInfoSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.bio')}</label>
                    <textarea
                      {...coachForm.register('bio')}
                      className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      placeholder={t('settings.bioPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('settings.experience')}</label>
                      <Input
                        {...coachForm.register('experience', { valueAsNumber: true })}
                        type="number"
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('settings.hourlyRate')} ($)</label>
                      <Input
                        {...coachForm.register('hourlyRate', { valueAsNumber: true })}
                        type="number"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.specializations')}</label>
                    <Input
                      {...coachForm.register('specializations')}
                      placeholder={t('settings.specializationsPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('settings.certifications')}</label>
                    <Input
                      {...coachForm.register('certifications')}
                      placeholder={t('settings.certificationsPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground">Separate with commas</p>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    {saveSuccess === 'coach' && (
                      <Badge variant="success" className="gap-1">
                        <Check className="w-3 h-3" />
                        {t('settings.saved')}
                      </Badge>
                    )}
                    <Button type="submit" className="ml-auto" disabled={updateCoachInfoMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {updateCoachInfoMutation.isPending ? t('settings.saving') : t('common.save')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.changePassword')}</CardTitle>
              <CardDescription>{t('settings.securityDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.currentPassword')}</label>
                  <div className="relative">
                    <Input
                      {...passwordForm.register('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      error={passwordForm.formState.errors.currentPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.newPassword')}</label>
                  <div className="relative">
                    <Input
                      {...passwordForm.register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.confirmPassword')}</label>
                  <Input
                    {...passwordForm.register('confirmPassword')}
                    type="password"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>
                <div className="flex items-center justify-between pt-4">
                  {saveSuccess === 'password' && (
                    <Badge variant="success" className="gap-1">
                      <Check className="w-3 h-3" />
                      {t('settings.passwordChanged')}
                    </Badge>
                  )}
                  <Button type="submit" className="ml-auto" disabled={changePasswordMutation.isPending}>
                    <Shield className="w-4 h-4 mr-2" />
                    {changePasswordMutation.isPending ? t('settings.saving') : t('auth.changePassword')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t('settings.language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        language === lang.code
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-2xl block mb-2">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('settings.notifications')}
                </CardTitle>
                <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Email notifications for new bookings</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Email notifications for session reminders</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Weekly performance summary</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
