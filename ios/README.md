# SplitTab iOS App

Native iOS application for SplitTab - the smart expense splitting platform.

## Requirements

- Xcode 15.0+
- iOS 16.0+
- Swift 5.9+
- CocoaPods or Swift Package Manager

## Architecture

This app follows the MVVM (Model-View-ViewModel) architecture pattern with SwiftUI:

```
SplitTab/
├── App/                    # App lifecycle and entry point
│   ├── SplitTabApp.swift
│   ├── AppDelegate.swift
│   └── ContentView.swift
├── Models/                 # Data models
│   ├── User.swift
│   ├── Group.swift
│   ├── Expense.swift
│   ├── Settlement.swift
│   ├── AuthModels.swift
│   └── APIResponse.swift
├── ViewModels/             # View models (MVVM)
│   ├── Authentication/
│   ├── Expenses/
│   ├── Groups/
│   ├── Settlements/
│   └── Profile/
├── Views/                  # SwiftUI views
│   ├── Authentication/
│   ├── Expenses/
│   ├── Groups/
│   ├── Settlements/
│   ├── Profile/
│   └── Shared/
├── Services/               # Business logic and API
│   ├── API/
│   ├── Auth/
│   ├── Storage/
│   └── Networking/
├── Utilities/              # Helper utilities
│   ├── AppConfig.swift
│   ├── ThemeManager.swift
│   └── Validators.swift
├── Resources/              # Assets and resources
└── Config/                 # Configuration files
    ├── Info.plist
    └── Config.xcconfig
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/splittab.git
cd splittab/ios
```

### 2. Configure API Endpoint

Edit `SplitTab/Utilities/AppConfig.swift` and update the API configuration:

```swift
static var apiHost: String {
    #if DEBUG
    return "localhost:3000"  // Your local backend
    #else
    return "api.splittab.com"  // Production API
    #endif
}
```

### 3. Configure OAuth (Optional)

If using OAuth authentication:

1. Get your Google OAuth Client ID from Google Cloud Console
2. Get your Apple Sign In configuration from Apple Developer Portal
3. Update `AppConfig.swift`:

```swift
static let googleClientId = "YOUR_GOOGLE_CLIENT_ID"
static let appleClientId = "YOUR_APPLE_CLIENT_ID"
```

### 4. Install Dependencies

#### Using Swift Package Manager (Recommended)

Dependencies are managed in `Package.swift`. Xcode will automatically resolve them.

#### Using CocoaPods (Alternative)

```bash
pod install
open SplitTab.xcworkspace
```

### 5. Build and Run

1. Open `SplitTab.xcodeproj` (or `.xcworkspace` if using CocoaPods)
2. Select your target device or simulator
3. Press `Cmd + R` to build and run

## Features

### ✅ Implemented

- **Authentication**
  - Email/Password login and registration
  - OAuth (Google, Apple) integration ready
  - Password reset flow
  - Email verification
  - Secure token storage with Keychain

- **API Integration**
  - RESTful API client
  - JWT authentication
  - Automatic token refresh
  - Error handling

- **UI/UX**
  - SwiftUI-based modern interface
  - Dark mode support
  - Tab-based navigation
  - Responsive layouts

### 🚧 In Progress

- **Groups Management**
  - Create and manage groups
  - Invite members
  - Group settings

- **Expenses**
  - Add expenses
  - Split by equal/percentage/exact amounts
  - Receipt upload
  - Expense history

- **Settlements**
  - View balances
  - Record payments
  - Settlement history

### 📋 Planned

- Push notifications
- Offline mode with Core Data
- Receipt OCR scanning
- Multi-currency support
- Export to CSV/PDF
- Advanced analytics

## Development

### Code Style

- Follow Swift API Design Guidelines
- Use SwiftLint for code formatting
- Write self-documenting code with clear naming

### Testing

```bash
# Run unit tests
cmd + U

# Run UI tests
cmd + U (with UI Test target selected)
```

### Building for Release

1. Update version in `Config.xcconfig`
2. Build configuration: Release
3. Archive the app (Product > Archive)
4. Submit to App Store Connect

## API Integration

The app communicates with the SplitTab backend API. Key services:

- **NetworkManager**: Core networking layer
- **AuthenticationService**: Authentication operations
- **TokenManager**: Secure token management
- **APIEndpoint**: Endpoint definitions

### Example API Call

```swift
// Fetch user profile
let user: User = try await NetworkManager.shared.request(.currentUser)

// Create expense
let expense = ExpenseCreate(...)
let created: Expense = try await NetworkManager.shared.request(
    .expenses,
    method: .post,
    body: expense
)
```

## Security

- Passwords are never stored locally
- JWT tokens stored in iOS Keychain
- HTTPS/TLS for all API communication
- Certificate pinning (production)
- Biometric authentication support (planned)

## Troubleshooting

### Cannot connect to API

1. Check `AppConfig.swift` has correct API host
2. Ensure backend is running
3. For localhost, ensure Info.plist allows local networking

### OAuth not working

1. Verify OAuth client IDs in `AppConfig.swift`
2. Check URL scheme configuration
3. Ensure proper entitlements

### Build errors

1. Clean build folder: `Cmd + Shift + K`
2. Delete derived data
3. Re-install dependencies

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Copyright © 2025 SplitTab. All rights reserved.

## Support

For issues and questions:
- Email: support@splittab.com
- GitHub Issues: https://github.com/yourusername/splittab/issues
