# Web Development Guide

Comprehensive guide for developing the SplitTab web application with Next.js 14.

## Table of Contents

1. [Architecture](#architecture)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Key Concepts](#key-concepts)
5. [Routing](#routing)
6. [Data Fetching](#data-fetching)
7. [State Management](#state-management)
8. [Styling](#styling)
9. [Forms](#forms)
10. [Testing](#testing)
11. [Best Practices](#best-practices)

## Architecture

SplitTab Web uses **Next.js 14 App Router** with modern React patterns:

```
┌────────────────┐
│  App Router    │ ← Next.js routing
│   (RSC/CSC)    │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   Components   │ ← React components
│  (Client/RSC)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│    Contexts    │ ← Global state
│   (Zustand)    │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  API Client    │ ← HTTP requests
│    (Axios)     │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   Backend API  │
└────────────────┘
```

## Project Structure

```
web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── auth/                # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/           # Dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── groups/              # Groups
│   │   ├── expenses/            # Expenses
│   │   ├── settlements/         # Settlements
│   │   └── profile/             # Profile
│   ├── components/              # React components
│   │   ├── ui/                  # Base UI components
│   │   ├── features/            # Feature components
│   │   └── layout/              # Layout components
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities
│   │   ├── api-client.ts       # API client
│   │   └── utils.ts            # Helpers
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   └── styles/                  # Global styles
│       └── globals.css
├── public/                      # Static files
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── tsconfig.json               # TypeScript config
```

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Backend API running

### Setup Steps

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3001`

## Key Concepts

### Server vs Client Components

**Server Components (default):**
```tsx
// app/page.tsx
export default function Page() {
  return <div>Server Component</div>
}
```

**Client Components:**
```tsx
'use client';

import { useState } from 'react';

export default function Page() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### When to Use Each

**Server Components:**
- Fetch data
- Access backend resources
- Keep sensitive information on server
- Reduce JavaScript bundle size

**Client Components:**
- Use React hooks (useState, useEffect)
- Handle browser events
- Use browser-only APIs
- Interactive components

## Routing

### File-based Routing

```
app/
├── page.tsx                 → /
├── dashboard/
│   └── page.tsx            → /dashboard
├── groups/
│   ├── page.tsx            → /groups
│   └── [id]/
│       └── page.tsx        → /groups/123
└── expenses/
    ├── page.tsx            → /expenses
    └── new/
        └── page.tsx        → /expenses/new
```

### Dynamic Routes

```tsx
// app/groups/[id]/page.tsx
export default function GroupPage({ params }: { params: { id: string } }) {
  return <div>Group {params.id}</div>
}
```

### Navigation

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Link component
<Link href="/dashboard">Dashboard</Link>

// Programmatic navigation
const router = useRouter();
router.push('/dashboard');
```

### Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>Navigation</nav>
      <main>{children}</main>
    </div>
  );
}
```

## Data Fetching

### Using API Client

```tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await apiClient.get<User>('/users/me');
        setUser(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Error loading user</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### React Query (Recommended)

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.get<User>('/users/me'),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {user?.name}!</div>;
}
```

## State Management

### Context API

```tsx
// contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### Zustand (Alternative)

```tsx
import { create } from 'zustand';

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Usage
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

## Styling

### Tailwind CSS

**Utility classes:**
```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold">Title</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click
  </button>
</div>
```

**Responsive design:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

**Dark mode:**
```tsx
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  Content
</div>
```

### CSS Modules

```tsx
// styles/Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
}

// Component
import styles from './Button.module.css';

export default function Button() {
  return <button className={styles.button}>Click</button>;
}
```

### Utility Function

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
)} />
```

## Forms

### React Hook Form + Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Testing

### Jest + React Testing Library

```tsx
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/button';

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Best Practices

### 1. Component Organization

```tsx
// Good: Small, focused components
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <UserAvatar user={user} />
      <UserInfo user={user} />
      <UserActions user={user} />
    </Card>
  );
}

// Bad: Large, monolithic components
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      {/* 200+ lines of JSX */}
    </Card>
  );
}
```

### 2. TypeScript

```tsx
// Good: Explicit types
interface Props {
  title: string;
  onClick: () => void;
}

function Button({ title, onClick }: Props) {
  return <button onClick={onClick}>{title}</button>;
}

// Bad: Implicit any
function Button({ title, onClick }) {
  return <button onClick={onClick}>{title}</button>;
}
```

### 3. Error Handling

```tsx
// Good: Comprehensive error handling
try {
  const data = await apiClient.get('/users/me');
  setUser(data);
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unknown error occurred');
  }
}

// Bad: Silent failures
try {
  const data = await apiClient.get('/users/me');
  setUser(data);
} catch (error) {
  // Silent failure
}
```

### 4. Performance

```tsx
// Good: Memoization
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  const processedData = useMemo(() => processData(data), [data]);
  return <div>{processedData}</div>;
});

// Good: Code splitting
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### 5. Accessibility

```tsx
// Good: Semantic HTML and ARIA
<button
  aria-label="Close dialog"
  onClick={onClose}
>
  <CloseIcon aria-hidden="true" />
</button>

// Good: Form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

## Common Patterns

### Loading States

```tsx
function Page() {
  const { data, isLoading, error } = useQuery(...);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <Content data={data} />;
}
```

### Optimistic Updates

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previousTodos = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos);
  },
});
```

### Infinite Scroll

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['expenses'],
  queryFn: ({ pageParam = 1 }) => apiClient.requestPaginated('/expenses', pageParam),
  getNextPageParam: (lastPage) => lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
});
```

## Debugging

### React DevTools

- Install browser extension
- Inspect component tree
- View props and state
- Profile performance

### Console Logging

```tsx
console.log('Data:', data);
console.table(users);
console.time('operation');
// ... code
console.timeEnd('operation');
```

### Error Boundaries

```tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

## Next Steps

- Review [API Integration Guide](./API_INTEGRATION.md)
- Learn about [UI Components](./UI_COMPONENTS.md)
- Check [Frontend Setup Guide](./FRONTEND_SETUP.md)
