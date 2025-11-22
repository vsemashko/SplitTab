# @splittab/shared

Shared TypeScript library for SplitTab containing API client and type definitions used across web and mobile applications.

## Installation

```bash
npm install @splittab/shared
```

## Usage

### API Client

```typescript
import { createAPIClient } from '@splittab/shared';

const apiClient = createAPIClient({
  baseURL: 'https://api.splittab.com',
  apiVersion: 'v1',
  getAccessToken: async () => {
    // Return access token from storage
    return localStorage.getItem('access_token');
  },
  onTokenExpired: async () => {
    // Handle token expiration (refresh or redirect to login)
    console.log('Token expired');
  },
  onError: (error) => {
    // Global error handler
    console.error('API Error:', error);
  },
});

// Make requests
const user = await apiClient.get('/users/me');
const groups = await apiClient.requestPaginated('/groups', 1, 20);
```

### Types

```typescript
import type { User, Group, Expense, Settlement } from '@splittab/shared';

const user: User = {
  id: '123',
  email: 'user@example.com',
  name: 'John Doe',
  // ... other fields
};
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Clean
npm run clean
```

## License

MIT
