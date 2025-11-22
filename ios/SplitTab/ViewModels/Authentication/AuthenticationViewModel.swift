//
//  AuthenticationViewModel.swift
//  SplitTab
//
//  Authentication view model
//

import Foundation
import SwiftUI

@MainActor
class AuthenticationViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var currentUser: User?
    @Published var errorMessage: String?

    init() {
        // Auto-restore authentication state
    }

    // MARK: - Restore State

    func restoreAuthenticationState() async {
        isLoading = true

        // Check if we have tokens
        let hasAccessToken = await TokenManager.shared.isAccessTokenValid()
        let hasRefreshToken = await TokenManager.shared.getRefreshToken() != nil

        if hasAccessToken || hasRefreshToken {
            // Try to refresh token if needed
            if !hasAccessToken && hasRefreshToken {
                await AuthenticationService.shared.refreshTokenIfNeeded()
            }

            // Get current user
            if let user = await UserManager.shared.getCurrentUser() {
                currentUser = user
                isAuthenticated = true
            } else {
                // Fetch user from API
                await fetchCurrentUser()
            }
        }

        isLoading = false
    }

    // MARK: - Login

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let user = try await AuthenticationService.shared.login(email: email, password: password)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Register

    func register(email: String, password: String, name: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let user = try await AuthenticationService.shared.register(
                email: email,
                password: password,
                name: name
            )
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - OAuth

    func loginWithGoogle(token: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let user = try await AuthenticationService.shared.loginWithGoogle(token: token)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func loginWithApple(token: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let user = try await AuthenticationService.shared.loginWithApple(token: token)
            currentUser = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Logout

    func logout() async {
        isLoading = true

        do {
            try await AuthenticationService.shared.logout()
            currentUser = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Password Reset

    func forgotPassword(email: String) async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            try await AuthenticationService.shared.forgotPassword(email: email)
            isLoading = false
            return true
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            return false
        }
    }

    // MARK: - Private Helpers

    private func fetchCurrentUser() async {
        do {
            let user: User = try await NetworkManager.shared.request(.currentUser)
            await UserManager.shared.saveCurrentUser(user)
            currentUser = user
            isAuthenticated = true
        } catch {
            // Failed to fetch user, clear auth state
            await TokenManager.shared.clearAllTokens()
            isAuthenticated = false
        }
    }
}
