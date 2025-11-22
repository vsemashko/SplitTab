//
//  AuthenticationGate.swift
//  SplitTab
//
//  Authentication guard for protected views
//

import SwiftUI

/// A view that acts as an authentication gate
/// Shows authentication view when user is not authenticated
/// Shows content when user is authenticated
struct AuthenticationGate<Content: View>: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel
    @ViewBuilder let content: () -> Content

    var body: some View {
        Group {
            if authViewModel.isLoading {
                // Show loading state while checking authentication
                LoadingView()
            } else if authViewModel.isAuthenticated {
                // User is authenticated, show protected content
                content()
            } else {
                // User is not authenticated, show authentication view
                AuthenticationView()
                    .environmentObject(authViewModel)
            }
        }
        .task {
            // Restore authentication state when the view appears
            await authViewModel.restoreAuthenticationState()
        }
    }
}

/// Loading view shown while checking authentication state
struct LoadingView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.blue, .purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.white)

                Text("SplitTab")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)
                    .padding(.top, 20)
            }
        }
    }
}

// MARK: - Protected View Modifier

/// A view modifier that protects a view behind authentication
struct ProtectedViewModifier: ViewModifier {
    @EnvironmentObject var authViewModel: AuthenticationViewModel

    func body(content: Content) -> some View {
        Group {
            if authViewModel.isAuthenticated {
                content
            } else {
                // Redirect to authentication if not authenticated
                AuthenticationView()
                    .environmentObject(authViewModel)
            }
        }
    }
}

extension View {
    /// Protects this view behind authentication
    /// User must be authenticated to see this view
    func requiresAuthentication() -> some View {
        modifier(ProtectedViewModifier())
    }
}

// MARK: - Route Guard

/// A helper to check authentication status before navigation
struct RouteGuard {
    let authViewModel: AuthenticationViewModel

    /// Check if user is authenticated
    var isAuthenticated: Bool {
        authViewModel.isAuthenticated
    }

    /// Navigate to a protected destination if authenticated
    /// Returns true if navigation should proceed, false otherwise
    func canNavigate(to destination: ProtectedRoute) -> Bool {
        guard isAuthenticated else {
            return false
        }

        // Additional route-specific checks can be added here
        switch destination {
        case .dashboard:
            return true
        case .groups:
            return true
        case .expenses:
            return true
        case .settlements:
            return true
        case .profile:
            return true
        }
    }

    /// Check if user has permission for a specific action
    func hasPermission(for action: UserAction) -> Bool {
        guard isAuthenticated else {
            return false
        }

        // Check specific permissions based on user role or status
        guard let user = authViewModel.currentUser else {
            return false
        }

        switch action {
        case .createGroup:
            return user.emailVerified
        case .addExpense:
            return user.emailVerified
        case .settlePayment:
            return user.emailVerified
        case .inviteMember:
            return user.emailVerified
        case .changeSettings:
            return true
        }
    }
}

// MARK: - Protected Routes

enum ProtectedRoute {
    case dashboard
    case groups
    case expenses
    case settlements
    case profile
}

// MARK: - User Actions

enum UserAction {
    case createGroup
    case addExpense
    case settlePayment
    case inviteMember
    case changeSettings
}

// MARK: - Authentication Wrapper View

/// Wrapper view that handles authentication state for the entire app
struct AuthenticationWrapper<Content: View>: View {
    @StateObject private var authViewModel = AuthenticationViewModel()
    @ViewBuilder let content: () -> Content

    var body: some View {
        AuthenticationGate {
            content()
        }
        .environmentObject(authViewModel)
    }
}

// MARK: - Preview

struct AuthenticationGate_Previews: PreviewProvider {
    static var previews: some View {
        AuthenticationGate {
            Text("Protected Content")
        }
        .environmentObject(AuthenticationViewModel())
    }
}
