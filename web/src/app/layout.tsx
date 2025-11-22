import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'SplitTab - Smart Expense Splitting',
    template: '%s | SplitTab',
  },
  description: 'Split expenses with friends and family, the smart way.',
  keywords: ['expense splitting', 'bill sharing', 'group expenses', 'money management'],
  authors: [{ name: 'SplitTab Team' }],
  creator: 'SplitTab',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://splittab.com',
    title: 'SplitTab - Smart Expense Splitting',
    description: 'Split expenses with friends and family, the smart way.',
    siteName: 'SplitTab',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SplitTab - Smart Expense Splitting',
    description: 'Split expenses with friends and family, the smart way.',
    creator: '@splittab',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
