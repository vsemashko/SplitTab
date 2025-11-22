# Frontend Setup Guide

Complete guide for setting up and developing the SplitTab frontend applications (Web and iOS).

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Web Application Setup](#web-application-setup)
4. [iOS Application Setup](#ios-application-setup)
5. [Shared Library](#shared-library)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

## Overview

SplitTab has two frontend applications:

- **Web**: Next.js 14 application with React and TypeScript
- **iOS**: Native SwiftUI application for iPhone and iPad
- **Shared**: TypeScript library with common types and API client

## Prerequisites

### General Requirements

- Git
- Node.js 18+ and npm 9+
- Code editor (VS Code, Xcode, etc.)
- Backend API running (see `/backend` directory)

### Web-Specific Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)

### iOS-Specific Requirements

- macOS 13+ (Ventura or later)
- Xcode 15+
- iOS 16+ device or simulator

## Web Application Setup

### 1. Navigate to Web Directory

```bash
cd /path/to/SplitTab/web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the environment template:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME=SplitTab
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

### 5. Build for Production

```bash
npm run build
npm run start
```

## iOS Application Setup

### 1. Navigate to iOS Directory

```bash
cd /path/to/SplitTab/ios
```

### 2. Open Project in Xcode

```bash
open SplitTab.xcodeproj
```

Or double-click `SplitTab.xcodeproj` in Finder.

### 3. Configure API Endpoint

Edit `SplitTab/Utilities/AppConfig.swift`:

```swift
static var apiHost: String {
    #if DEBUG
    return "localhost:3000"  // Your local backend
    #else
    return "api.splittab.com"
    #endif
}
```

### 4. Select Target Device

In Xcode:
1. Select a simulator or connected device from the device menu
2. Recommended: iPhone 15 or later simulator

### 5. Build and Run

Press `Cmd + R` or click the Play button in Xcode.

## Shared Library

The shared library contains TypeScript types and API client used by both web and iOS applications.

### Setup

```bash
cd /path/to/SplitTab/shared
npm install
```

### Build

```bash
npm run build
```

### Use in Projects

The shared library is used as a local npm package:

**In web application:**

```typescript
import { createAPIClient, User, Group } from '@splittab/shared';
```

**In iOS application:**

The Swift app includes equivalent type definitions in the Models directory.

## Development Workflow

### Web Development

1. Start backend API: `cd backend && npm run dev`
2. Start web app: `cd web && npm run dev`
3. Make changes to source files
4. Hot reload will update automatically
5. Run linter: `npm run lint`
6. Run type check: `npm run type-check`

### iOS Development

1. Start backend API: `cd backend && npm run dev`
2. Open iOS project in Xcode
3. Make changes to Swift files
4. Build and run (Cmd + R)
5. Use Xcode's built-in debugging tools

### Testing Changes

**Web:**
```bash
cd web
npm run test
```

**iOS:**
In Xcode, press `Cmd + U` to run tests.

## Docker Development

### Web Application

Build and run with Docker:

```bash
cd web
docker build -t splittab-web .
docker run -p 3001:3001 splittab-web
```

Or use Docker Compose:

```bash
docker-compose up web
```

## Environment Variables

### Web Application

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_VERSION` | API version | `v1` |
| `NEXT_PUBLIC_APP_NAME` | App name | `SplitTab` |
| `NEXT_PUBLIC_APP_URL` | App URL | `http://localhost:3001` |

### iOS Application

Configure in `AppConfig.swift`:

- `apiHost`: Backend API host
- `apiScheme`: http/https
- `googleClientId`: Google OAuth client ID
- `appleClientId`: Apple Sign In client ID

## Troubleshooting

### Web Application

**Cannot connect to API**
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Ensure backend is running: `cd backend && npm run dev`
- Check browser console for errors

**Build fails**
```bash
# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

**Type errors**
```bash
# Run type check to see all errors
npm run type-check
```

### iOS Application

**Cannot connect to API**
- Check `AppConfig.swift` has correct API configuration
- For localhost, ensure Info.plist allows local networking
- Check Xcode console for network errors

**Build errors**
- Clean build folder: `Cmd + Shift + K`
- Delete derived data: `Xcode > Preferences > Locations > Derived Data`
- Reinstall dependencies if using CocoaPods: `pod install`

**Simulator issues**
- Reset simulator: `Device > Erase All Content and Settings`
- Restart Xcode
- Try different simulator device

## Development Tips

### Web

1. **Use React DevTools**: Install browser extension for debugging
2. **Hot Reload**: Changes auto-reload during development
3. **Component Preview**: Use Storybook (if configured)
4. **API Mocking**: Use MSW for testing without backend

### iOS

1. **Live Preview**: Use SwiftUI Preview canvas (Option + Cmd + Return)
2. **Breakpoints**: Set breakpoints to debug code execution
3. **View Hierarchy**: Use Debug View Hierarchy to inspect UI
4. **Memory**: Use Instruments to profile memory usage

## Next Steps

- [Web Development Guide](./WEB_DEVELOPMENT.md)
- [iOS Development Guide](./IOS_DEVELOPMENT.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [UI Components Guide](./UI_COMPONENTS.md)

## Support

For help with frontend setup:
- Check troubleshooting section above
- Review relevant development guide
- Ask team members
- Create GitHub issue

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
