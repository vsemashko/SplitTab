//
//  AuthenticationService.swift
//  SplitTab
//
//  Handles all authentication operations
//

import Foundation
import AuthenticationServices

actor AuthenticationService {
    static let shared = AuthenticationService()

    private init() {}

    // MARK: - Login

    func login(email: String, password: String) async throws -> User {
        let request = LoginRequest(email: email, password: password)
        let response: AuthResponse = try await NetworkManager.shared.request(
            .login,
            method: .post,
            body: request,
            requiresAuth: false
        )

        await saveAuthTokens(response)
        return response.user
    }

    // MARK: - Register

    func register(email: String, password: String, name: String) async throws -> User {
        let request = RegisterRequest(email: email, password: password, name: name)
        let response: AuthResponse = try await NetworkManager.shared.request(
            .register,
            method: .post,
            body: request,
            requiresAuth: false
        )

        await saveAuthTokens(response)
        return response.user
    }

    // MARK: - OAuth

    func loginWithGoogle(token: String) async throws -> User {
        let request = OAuthRequest(provider: "google", token: token)
        let response: AuthResponse = try await NetworkManager.shared.request(
            .googleAuth,
            method: .post,
            body: request,
            requiresAuth: false
        )

        await saveAuthTokens(response)
        return response.user
    }

    func loginWithApple(token: String) async throws -> User {
        let request = OAuthRequest(provider: "apple", token: token)
        let response: AuthResponse = try await NetworkManager.shared.request(
            .appleAuth,
            method: .post,
            body: request,
            requiresAuth: false
        )

        await saveAuthTokens(response)
        return response.user
    }

    // MARK: - Logout

    func logout() async throws {
        // Call logout endpoint
        try await NetworkManager.shared.requestEmpty(.logout, method: .post, requiresAuth: true)

        // Clear tokens
        await TokenManager.shared.clearAllTokens()

        // Clear user data
        await UserManager.shared.clearCurrentUser()
    }

    // MARK: - Token Refresh

    func refreshTokenIfNeeded() async {
        guard let refreshToken = await TokenManager.shared.getRefreshToken() else {
            return
        }

        do {
            let request = RefreshTokenRequest(refreshToken: refreshToken)
            let response: RefreshTokenResponse = try await NetworkManager.shared.request(
                .refreshToken,
                method: .post,
                body: request,
                requiresAuth: false
            )

            await TokenManager.shared.saveAccessToken(response.accessToken, expiresIn: response.expiresIn)
        } catch {
            print("Failed to refresh token: \(error)")
            // Clear tokens on failure
            await TokenManager.shared.clearAllTokens()
        }
    }

    func forceRefreshToken() async throws {
        guard let refreshToken = await TokenManager.shared.getRefreshToken() else {
            throw AuthError.noRefreshToken
        }

        let request = RefreshTokenRequest(refreshToken: refreshToken)
        let response: RefreshTokenResponse = try await NetworkManager.shared.request(
            .refreshToken,
            method: .post,
            body: request,
            requiresAuth: false
        )

        await TokenManager.shared.saveAccessToken(response.accessToken, expiresIn: response.expiresIn)
    }

    // MARK: - Password Reset

    func forgotPassword(email: String) async throws {
        let request = ForgotPasswordRequest(email: email)
        try await NetworkManager.shared.requestEmpty(
            .forgotPassword,
            method: .post,
            body: request,
            requiresAuth: false
        )
    }

    func resetPassword(token: String, newPassword: String) async throws {
        let request = ResetPasswordRequest(token: token, newPassword: newPassword)
        try await NetworkManager.shared.requestEmpty(
            .resetPassword,
            method: .post,
            body: request,
            requiresAuth: false
        )
    }

    func changePassword(currentPassword: String, newPassword: String) async throws {
        let request = ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword)
        try await NetworkManager.shared.requestEmpty(
            .changePassword,
            method: .post,
            body: request,
            requiresAuth: true
        )
    }

    // MARK: - Email Verification

    func verifyEmail(token: String) async throws {
        let request = VerifyEmailRequest(token: token)
        try await NetworkManager.shared.requestEmpty(
            .verifyEmail,
            method: .post,
            body: request,
            requiresAuth: false
        )
    }

    func resendVerification(email: String) async throws {
        let request = ResendVerificationRequest(email: email)
        try await NetworkManager.shared.requestEmpty(
            .resendVerification,
            method: .post,
            body: request,
            requiresAuth: false
        )
    }

    // MARK: - Private Helpers

    private func saveAuthTokens(_ response: AuthResponse) async {
        await TokenManager.shared.saveAccessToken(response.accessToken, expiresIn: response.expiresIn)
        await TokenManager.shared.saveRefreshToken(response.refreshToken)
        await UserManager.shared.saveCurrentUser(response.user)
    }
}

// MARK: - Auth Error

enum AuthError: Error, LocalizedError {
    case noRefreshToken
    case invalidCredentials
    case tokenExpired

    var errorDescription: String? {
        switch self {
        case .noRefreshToken:
            return "No refresh token available"
        case .invalidCredentials:
            return "Invalid credentials"
        case .tokenExpired:
            return "Token expired"
        }
    }
}
