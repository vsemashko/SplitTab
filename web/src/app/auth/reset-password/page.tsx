'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordFormData, getPasswordStrength } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api-client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  const password = watch('password');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await apiClient.post('/auth/reset-password', {
        token: data.token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex-col space-y-4">
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
            <Link href="/auth/login" className="mx-auto">
              <Button variant="ghost">Back to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been reset successfully.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              You will be redirected to the login page in a few seconds...
            </p>
          </CardContent>

          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isSubmitting}
                className={errors.password ? 'border-red-500' : ''}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                onFocus={() => setShowPasswordStrength(true)}
                autoFocus
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {showPasswordStrength && password && passwordStrength && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            passwordStrength.strength === 'weak' && level === 1 && 'bg-red-500',
                            passwordStrength.strength === 'medium' && level <= 2 && 'bg-orange-500',
                            passwordStrength.strength === 'strong' && 'bg-green-500',
                            ((passwordStrength.strength === 'weak' && level > 1) ||
                              (passwordStrength.strength === 'medium' && level > 2)) &&
                              'bg-gray-200 dark:bg-gray-700'
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        passwordStrength.strength === 'weak' && 'text-red-500',
                        passwordStrength.strength === 'medium' && 'text-orange-500',
                        passwordStrength.strength === 'strong' && 'text-green-500'
                      )}
                    >
                      {passwordStrength.strength === 'weak' && 'Weak'}
                      {passwordStrength.strength === 'medium' && 'Medium'}
                      {passwordStrength.strength === 'strong' && 'Strong'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isSubmitting}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-red-500" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </CardContent>

          <CardFooter>
            <Link href="/auth/login" className="mx-auto">
              <Button variant="ghost" type="button" disabled={isSubmitting}>
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
