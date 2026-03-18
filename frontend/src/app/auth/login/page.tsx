'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Triangle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved) setLocale(saved);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || (locale === 'fr' ? 'Échec de la connexion' : 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400">
              <Triangle className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {locale === 'fr' ? 'Bon retour' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {locale === 'fr' ? 'Connectez-vous à votre compte Vertex' : 'Sign in to your Vertex account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'fr' ? 'Mot de passe' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                {locale === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (locale === 'fr' ? 'Connexion...' : 'Signing in...') 
                : (locale === 'fr' ? 'Se connecter' : 'Sign in')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {locale === 'fr' ? "Pas encore de compte ? " : "Don't have an account? "}
              <Link href="/auth/register" className="text-primary hover:underline">
                {locale === 'fr' ? "S'inscrire" : 'Sign up'}
              </Link>
            </p>
          </form>

          {/* Language Switcher */}
          <div className="mt-6 pt-4 border-t flex justify-center gap-2">
            <button
              onClick={() => {
                setLocale('fr');
                localStorage.setItem('locale', 'fr');
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                locale === 'fr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => {
                setLocale('en');
                localStorage.setItem('locale', 'en');
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                locale === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
