'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api-client';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setIsSuccess(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent password reset instructions to
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-center">
              <Mail className="mx-auto mb-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{email}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Please check your email and click on the password reset link to continue.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
              }}
            >
              Send to a different email
            </Button>
          </CardContent>

          <CardFooter>
            <Link href="/auth/login" className="mx-auto">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
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
          <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                disabled={isSubmitting}
                className={errors.email ? 'border-red-500' : ''}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoFocus
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </CardContent>

          <CardFooter>
            <Link href="/auth/login" className="mx-auto">
              <Button variant="ghost" className="gap-2" type="button" disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
