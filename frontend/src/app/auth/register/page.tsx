'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Triangle, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['COACH', 'PARENT']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'PARENT' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 shadow-lg shadow-primary/25">
            <Triangle className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vertex</h1>
            <p className="text-sm text-muted-foreground">Player Development Platform</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start developing champions today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PARENT', 'COACH'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setValue('role', role)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        selectedRole === role
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="block text-2xl mb-1">
                        {role === 'PARENT' ? '👨‍👩‍👧' : '⚽'}
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {role.toLowerCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input {...register('firstName')} placeholder="John" error={errors.firstName?.message} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input {...register('lastName')} placeholder="Doe" error={errors.lastName?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input {...register('email')} type="email" placeholder="you@example.com" error={errors.email?.message} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input {...register('password')} type="password" placeholder="Min. 8 characters" error={errors.password?.message} />
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Create Account <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
