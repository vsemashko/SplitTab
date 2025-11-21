# SplitTab Mobile App

React Native mobile application for SplitTab - an expense sharing and bill splitting platform.

## Tech Stack

- **React Native**: 0.81.5
- **Expo SDK**: 54
- **React**: 19.1.0
- **TypeScript**: 5.9+
- **Navigation**: React Navigation v7
- **State Management**: Zustand + React Query
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **API**: Axios
- **Real-time**: Socket.IO Client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API endpoints
```

3. Start the development server:

```bash
npm start
```

4. Run on specific platform:

```bash
npm run ios      # iOS Simulator (macOS only)
npm run android  # Android Emulator
npm run web      # Web browser
```

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API clients and endpoints
│   ├── assets/           # Images, icons, fonts
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom React hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   ├── services/         # Business logic services
│   ├── store/            # State management (Zustand)
│   ├── theme/            # Theme configuration
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── __tests__/            # Test files
└── App.tsx               # Root component
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run build:ios` - Build for iOS (requires EAS)
- `npm run build:android` - Build for Android (requires EAS)

## Configuration

### Environment Variables

Create a `.env` file with:

```env
API_BASE_URL=http://localhost:3000/v1
WS_URL=ws://localhost:3000
APP_ENV=development
```

### TypeScript

Path aliases are configured in `tsconfig.json`:

```typescript
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api';
```

## Development

### Code Style

- ESLint for code quality
- Prettier for code formatting
- TypeScript for type safety

### State Management

- **Zustand**: Local state management
- **React Query**: Server state, caching, and synchronization

### API Integration

The app connects to the SplitTab backend API. See `src/api/` for API client implementation.

### Real-time Updates

WebSocket connection for real-time notifications:

- Group updates
- Expense additions
- Balance changes
- Settlement confirmations

## Building for Production

### iOS

```bash
npm run build:ios
```

### Android

```bash
npm run build:android
```

Requires EAS (Expo Application Services) account.

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## License

Proprietary - SplitTab

## Support

For issues and questions, please contact the development team.
