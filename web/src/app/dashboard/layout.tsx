'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              SplitTab
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/groups"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Groups
              </Link>
              <Link
                href="/expenses"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Expenses
              </Link>
              <Link
                href="/settlements"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Settlements
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2025 SplitTab. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
