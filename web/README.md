# SplitTab Web Application

Modern web application for SplitTab - the smart expense splitting platform built with Next.js 14.

## Features

- ⚡ **Next.js 14** with App Router
- 🎨 **Tailwind CSS** for styling
- 🎭 **TypeScript** for type safety
- 🔐 **JWT Authentication** with automatic token refresh
- 🎯 **React Query** for data fetching and caching
- 🎨 **Radix UI** components
- 🌙 **Dark mode** support
- 📱 **Responsive** design
- ♿ **Accessible** components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: Axios + React Query
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Theme**: next-themes

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Backend API running (see `/backend` directory)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/splittab.git
cd splittab/web
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_VERSION=v1
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── groups/            # Groups management
│   │   ├── expenses/          # Expenses tracking
│   │   ├── settlements/       # Settlements
│   │   ├── profile/           # User profile
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── features/         # Feature-specific components
│   │   └── layout/           # Layout components
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   │   ├── api-client.ts     # API client
│   │   └── utils.ts          # Utility functions
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts          # Shared types
│   └── styles/                # Global styles
│       └── globals.css       # Global CSS
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check
npm run format           # Format code with Prettier

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage report
```

## Development Guidelines

### Code Style

- Follow TypeScript strict mode
- Use functional components with hooks
- Follow the Airbnb JavaScript Style Guide
- Use Prettier for code formatting
- Write meaningful variable and function names

### Component Guidelines

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Add loading and error states

### API Integration

Use the centralized API client:

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const user = await apiClient.get<User>('/users/me');

// POST request
const expense = await apiClient.post<Expense>('/expenses', expenseData);

// Paginated request
const groups = await apiClient.requestPaginated<Group>('/groups', 1, 20);

// File upload
const receipt = await apiClient.upload<Receipt>('/expenses/123/receipt', file);
```

### Authentication

Use the Auth context:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // Use authentication methods
}
```

### Styling

Use Tailwind CSS utility classes:

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
  <h2 className="text-xl font-semibold">Title</h2>
</div>
```

### Forms

Use React Hook Form with Zod validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## Building for Production

```bash
# Build the application
npm run build

# Test production build locally
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build Docker image
docker build -t splittab-web .

# Run container
docker run -p 3001:3001 splittab-web
```

### Manual Deployment

```bash
# Build
npm run build

# Copy .next directory, public directory, and package.json to server
# Install production dependencies
npm install --production

# Start server
npm run start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_VERSION` | API version | `v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SplitTab` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3001` |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Server-side rendering for initial page load
- Code splitting and lazy loading
- Image optimization with Next.js Image
- API response caching
- Optimistic UI updates

## Security

- XSS protection
- CSRF protection
- Content Security Policy headers
- Secure cookie handling
- Input validation and sanitization

## Troubleshooting

### Cannot connect to API

1. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
2. Ensure backend server is running
3. Check browser console for CORS errors

### Build fails

1. Clear `.next` directory: `rm -rf .next`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run type-check`

### Styles not working

1. Ensure Tailwind CSS is properly configured
2. Check `globals.css` is imported in layout
3. Clear browser cache

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linting and type checking
5. Submit a pull request

## License

Copyright © 2025 SplitTab. All rights reserved.

## Support

For issues and questions:
- Email: support@splittab.com
- GitHub Issues: https://github.com/yourusername/splittab/issues
- Documentation: https://docs.splittab.com
