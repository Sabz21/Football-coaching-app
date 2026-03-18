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
  const { locale, setLocale } = useI18n();
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
      setProfileMessage(locale === 'fr' ? 'Profil mis à jour avec succès' : 'Profile updated successfully');
      setTimeout(() => setProfileMessage(''), 3000);
    },
    onError: (err: any) => {
      setProfileMessage(err.response?.data?.error || (locale === 'fr' ? 'Échec de la mise à jour' : 'Failed to update profile'));
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.put('/auth/password', data);
    },
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage(locale === 'fr' ? 'Mot de passe mis à jour avec succès' : 'Password updated successfully');
      setTimeout(() => setPasswordMessage(''), 3000);
    },
    onError: (err: any) => {
      setPasswordMessage(err.response?.data?.error || (locale === 'fr' ? 'Échec de la mise à jour du mot de passe' : 'Failed to update password'));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage(locale === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordMessage(locale === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères' : 'Password must be at least 6 characters');
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
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === 'fr' ? 'Paramètres' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'fr' ? 'Gérez les paramètres de votre compte' : 'Manage your account settings'}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {locale === 'fr' ? 'Profil' : 'Profile'}
          </CardTitle>
          <CardDescription>
            {locale === 'fr' ? 'Mettez à jour vos informations personnelles' : 'Update your personal information'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Prénom' : 'First Name'}
                </label>
                <Input
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {locale === 'fr' ? 'Nom' : 'Last Name'}
                </label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                {locale === 'fr' ? "L'email ne peut pas être modifié" : 'Email cannot be changed'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Téléphone' : 'Phone'}
              </label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {profileMessage && (
              <p className={`text-sm ${profileMessage.includes('succès') || profileMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {profileMessage}
              </p>
            )}

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending 
                ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...') 
                : (locale === 'fr' ? 'Enregistrer' : 'Save Changes')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {locale === 'fr' ? 'Sécurité' : 'Security'}
          </CardTitle>
          <CardDescription>
            {locale === 'fr' ? 'Mettez à jour votre mot de passe' : 'Update your password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Mot de passe actuel' : 'Current Password'}
              </label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Nouveau mot de passe' : 'New Password'}
              </label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Confirmer le nouveau mot de passe' : 'Confirm New Password'}
              </label>
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.includes('succès') || passwordMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {passwordMessage}
              </p>
            )}

            <Button type="submit" disabled={updatePasswordMutation.isPending}>
              <Lock className="w-4 h-4 mr-2" />
              {updatePasswordMutation.isPending 
                ? (locale === 'fr' ? 'Mise à jour...' : 'Updating...') 
                : (locale === 'fr' ? 'Mettre à jour le mot de passe' : 'Update Password')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {locale === 'fr' ? 'Langue' : 'Language'}
          </CardTitle>
          <CardDescription>
            {locale === 'fr' ? "Choisissez la langue de l'interface" : 'Choose the interface language'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setLocale('fr')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                locale === 'fr' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-xl">🇫🇷</span>
              Français
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                locale === 'en' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-xl">🇬🇧</span>
              English
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
