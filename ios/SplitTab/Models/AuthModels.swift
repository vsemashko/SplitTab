//
//  AuthModels.swift
//  SplitTab
//
//  Authentication related models
//

import Foundation

// MARK: - Authentication Request Models

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let name: String

    enum CodingKeys: String, CodingKey {
        case email
        case password
        case name
    }
}

struct OAuthRequest: Codable {
    let provider: String
    let token: String
}

// MARK: - Authentication Response Models

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
    let expiresIn: Int

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
        case expiresIn = "expires_in"
    }
}

struct RefreshTokenRequest: Codable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

struct RefreshTokenResponse: Codable {
    let accessToken: String
    let expiresIn: Int

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case expiresIn = "expires_in"
    }
}

// MARK: - Password Reset

struct ForgotPasswordRequest: Codable {
    let email: String
}

struct ResetPasswordRequest: Codable {
    let token: String
    let newPassword: String

    enum CodingKeys: String, CodingKey {
        case token
        case newPassword = "new_password"
    }
}

struct ChangePasswordRequest: Codable {
    let currentPassword: String
    let newPassword: String

    enum CodingKeys: String, CodingKey {
        case currentPassword = "current_password"
        case newPassword = "new_password"
    }
}

// MARK: - Email Verification

struct VerifyEmailRequest: Codable {
    let token: String
}

struct ResendVerificationRequest: Codable {
    let email: String
}
