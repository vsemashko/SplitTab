import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard or login based on auth status
  // This will be handled by middleware in production
  redirect('/dashboard');
}
