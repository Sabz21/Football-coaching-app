'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Save, Globe } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { locale, setLocale, t } = useI18n();
  
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profile) => {
      const res = await api.put('/auth/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      setProfileMessage('Profile updated successfully');
      setTimeout(() => setProfileMessage(''), 3000);
    },
    onError: (err: any) => {
      setProfileMessage(err.response?.data?.error || 'Failed to update profile');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.put('/auth/password', data);
    },
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password updated successfully');
      setTimeout(() => setPasswordMessage(''), 3000);
    },
    onError: (err: any) => {
      setPasswordMessage(err.response?.data?.error || 'Failed to update password');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>{t('settings.languageDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setLocale('en')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                locale === 'en'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className="font-medium">English</p>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
            </button>
            <button
              onClick={() => setLocale('fr')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                locale === 'fr'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">🇫🇷</span>
              <div className="text-left">
                <p className="font-medium">Français</p>
                <p className="text-xs text-muted-foreground">French</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.profileDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.firstName')}</label>
                <Input
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.lastName')}</label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.email')}</label>
              <Input value={user?.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">{t('settings.emailCannotChange')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.phone')}</label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>

            {profileMessage && (
              <p className={`text-sm ${profileMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {profileMessage}
              </p>
            )}

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? t('common.loading') : t('settings.saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {t('settings.security')}
          </CardTitle>
          <CardDescription>{t('settings.securityDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.currentPassword')}</label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.newPassword')}</label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('settings.confirmNewPassword')}</label>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {passwordMessage}
              </p>
            )}

            <Button type="submit" disabled={updatePasswordMutation.isPending}>
              <Lock className="w-4 h-4 mr-2" />
              {updatePasswordMutation.isPending ? t('common.loading') : t('settings.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
