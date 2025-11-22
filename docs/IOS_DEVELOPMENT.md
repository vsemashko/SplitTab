# iOS Development Guide

Comprehensive guide for developing the SplitTab iOS application.

## Table of Contents

1. [Architecture](#architecture)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Key Concepts](#key-concepts)
5. [API Integration](#api-integration)
6. [UI Development](#ui-development)
7. [State Management](#state-management)
8. [Testing](#testing)
9. [Best Practices](#best-practices)

## Architecture

SplitTab iOS follows the **MVVM (Model-View-ViewModel)** architecture pattern:

```
┌─────────────┐
│    View     │ ← SwiftUI Views
│  (SwiftUI)  │
└──────┬──────┘
       │ Binds to
       ▼
┌─────────────┐
│  ViewModel  │ ← Business Logic
│(@Published) │
└──────┬──────┘
       │ Uses
       ▼
┌─────────────┐
│   Service   │ ← API Calls
│  (Async)    │
└──────┬──────┘
       │ Returns
       ▼
┌─────────────┐
│    Model    │ ← Data Structures
│ (Codable)   │
└─────────────┘
```

### Benefits

- **Separation of Concerns**: UI, business logic, and data are separated
- **Testability**: ViewModels can be unit tested
- **Reusability**: Services and models can be reused
- **Maintainability**: Clear structure makes code easier to maintain

## Project Structure

```
ios/SplitTab/
├── App/                    # App lifecycle
│   ├── SplitTabApp.swift  # App entry point
│   ├── AppDelegate.swift  # App delegate
│   └── ContentView.swift  # Root content view
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
├── Services/               # Business logic
│   ├── API/
│   ├── Auth/
│   ├── Storage/
│   └── Networking/
├── Utilities/              # Helpers
│   ├── AppConfig.swift
│   ├── ThemeManager.swift
│   └── Validators.swift
├── Resources/              # Assets
└── Config/                 # Configuration
    ├── Info.plist
    └── Config.xcconfig
```

## Development Setup

### Requirements

- macOS 13+ (Ventura or later)
- Xcode 15+
- Swift 5.9+
- iOS 16+ SDK

### Initial Setup

1. **Open Project**
   ```bash
   cd ios
   open SplitTab.xcodeproj
   ```

2. **Configure Team**
   - Select project in navigator
   - Select target
   - Go to "Signing & Capabilities"
   - Select your development team

3. **Run on Simulator**
   - Select simulator (e.g., iPhone 15)
   - Press `Cmd + R`

## Key Concepts

### 1. Models

Models represent data structures and conform to `Codable` for JSON serialization:

```swift
struct User: Codable, Identifiable {
    let id: String
    var name: String
    var email: String
    // ...
}
```

### 2. ViewModels

ViewModels handle business logic and state:

```swift
@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    func login(email: String, password: String) async {
        isLoading = true
        do {
            user = try await AuthenticationService.shared.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
```

### 3. Views

SwiftUI views are declarative and reactive:

```swift
struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        VStack {
            TextField("Email", text: $email)
            SecureField("Password", text: $password)

            Button("Login") {
                Task {
                    await authViewModel.login(email: email, password: password)
                }
            }
        }
    }
}
```

### 4. Services

Services handle API calls and business logic:

```swift
actor AuthenticationService {
    static let shared = AuthenticationService()

    func login(email: String, password: String) async throws -> User {
        let request = LoginRequest(email: email, password: password)
        let response: AuthResponse = try await NetworkManager.shared.request(
            .login,
            method: .post,
            body: request
        )
        return response.user
    }
}
```

## API Integration

### Network Manager

The `NetworkManager` handles all HTTP requests:

```swift
// GET request
let user: User = try await NetworkManager.shared.request(.currentUser)

// POST request
let expense: Expense = try await NetworkManager.shared.request(
    .expenses,
    method: .post,
    body: expenseData
)

// Paginated request
let groups: PaginatedResponse<Group> = try await NetworkManager.shared.requestPaginated(
    .groups,
    page: 1,
    limit: 20
)

// File upload
let receipt: Receipt = try await NetworkManager.shared.upload(
    .uploadReceipt(expenseId),
    fileData: imageData,
    fileName: "receipt.jpg",
    mimeType: "image/jpeg"
)
```

### Error Handling

```swift
do {
    let user = try await NetworkManager.shared.request(.currentUser)
    // Handle success
} catch let error as APIError {
    // Handle API error
    print(error.error.message)
} catch {
    // Handle other errors
    print(error.localizedDescription)
}
```

## UI Development

### SwiftUI Basics

**Layout:**
```swift
VStack(spacing: 16) {
    Text("Title")
    HStack {
        Image(systemName: "person")
        Text("User")
    }
}
```

**Modifiers:**
```swift
Text("Hello")
    .font(.title)
    .foregroundColor(.blue)
    .padding()
    .background(Color.gray.opacity(0.2))
    .cornerRadius(8)
```

**State:**
```swift
@State private var name = ""
@StateObject private var viewModel = MyViewModel()
@EnvironmentObject var authViewModel: AuthenticationViewModel
```

### Navigation

**NavigationView:**
```swift
NavigationView {
    List {
        NavigationLink("Profile") {
            ProfileView()
        }
    }
    .navigationTitle("Settings")
}
```

**Sheets:**
```swift
@State private var showSheet = false

Button("Show") {
    showSheet = true
}
.sheet(isPresented: $showSheet) {
    DetailView()
}
```

## State Management

### @State

For local view state:

```swift
@State private var isExpanded = false
```

### @StateObject

For view models owned by the view:

```swift
@StateObject private var viewModel = GroupsViewModel()
```

### @EnvironmentObject

For shared state across views:

```swift
@EnvironmentObject var authViewModel: AuthenticationViewModel
```

### @Published

In ViewModels to trigger view updates:

```swift
class MyViewModel: ObservableObject {
    @Published var items: [Item] = []
}
```

## Testing

### Unit Tests

Test ViewModels and Services:

```swift
@MainActor
class AuthenticationViewModelTests: XCTestCase {
    func testLogin() async throws {
        let viewModel = AuthenticationViewModel()

        await viewModel.login(email: "test@example.com", password: "password")

        XCTAssertNotNil(viewModel.user)
        XCTAssertNil(viewModel.errorMessage)
    }
}
```

### UI Tests

Test user flows:

```swift
class LoginUITests: XCTestCase {
    func testLoginFlow() {
        let app = XCUIApplication()
        app.launch()

        let emailField = app.textFields["Email"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password")

        app.buttons["Login"].tap()

        XCTAssertTrue(app.staticTexts["Dashboard"].exists)
    }
}
```

## Best Practices

### 1. Code Organization

- Keep files small and focused (< 300 lines)
- One view/model/viewmodel per file
- Group related files in folders

### 2. Naming Conventions

- Views: `LoginView`, `GroupDetailView`
- ViewModels: `AuthenticationViewModel`, `ExpensesViewModel`
- Services: `AuthenticationService`, `GroupService`
- Models: `User`, `Expense`, `Group`

### 3. SwiftUI Best Practices

- Extract complex views into separate components
- Use `@MainActor` for ViewModels
- Prefer `let` over `var` when possible
- Use meaningful variable names

### 4. Async/Await

- Use `async/await` for asynchronous operations
- Wrap in `Task` when calling from synchronous code
- Handle errors with `do-catch`

### 5. Memory Management

- Use `weak` references in closures to avoid retain cycles
- Properly cancel async tasks when views disappear
- Use `@StateObject` instead of `@ObservedObject` for owned objects

### 6. Security

- Store sensitive data in Keychain
- Never log passwords or tokens
- Validate all user input
- Use HTTPS for all network requests

### 7. Performance

- Use `LazyVStack` and `LazyHStack` for long lists
- Implement pagination for large data sets
- Cache images and frequently accessed data
- Profile with Instruments regularly

## Common Patterns

### Loading State

```swift
struct MyView: View {
    @StateObject private var viewModel = MyViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if let error = viewModel.errorMessage {
                ErrorView(message: error)
            } else {
                ContentView(data: viewModel.data)
            }
        }
    }
}
```

### Pull to Refresh

```swift
List(items) { item in
    ItemRow(item: item)
}
.refreshable {
    await viewModel.refresh()
}
```

### Search

```swift
@State private var searchText = ""

List(filteredItems) { item in
    ItemRow(item: item)
}
.searchable(text: $searchText)
```

## Debugging

### Print Debugging

```swift
print("Debug: \(variable)")
debugPrint(object)
```

### Breakpoints

- Click line number to add breakpoint
- `Cmd + \` to toggle breakpoint
- Use conditional breakpoints for complex scenarios

### View Debugging

- `Debug View Hierarchy`: Debug > View Debugging > Capture View Hierarchy
- SwiftUI Inspector: Click Preview to inspect

### Network Debugging

- Use Xcode Network Debugger
- Print request/response in NetworkManager
- Use Charles Proxy for detailed inspection

## Resources

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Swift.org](https://swift.org)
- [Apple Developer Forums](https://developer.apple.com/forums/)
- [Hacking with Swift](https://www.hackingwithswift.com)

## Next Steps

- Review [API Integration Guide](./API_INTEGRATION.md)
- Learn about [UI Components](./UI_COMPONENTS.md)
- Check [Frontend Setup Guide](./FRONTEND_SETUP.md)
