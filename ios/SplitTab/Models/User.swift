//
//  User.swift
//  SplitTab
//
//  User data model
//

import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: String
    var email: String
    var emailVerified: Bool
    var name: String
    var profilePictureUrl: String?
    var phoneNumber: String?
    var phoneVerified: Bool

    // Preferences
    var defaultCurrency: String
    var timezone: String
    var language: String

    // OAuth
    var googleId: String?
    var appleId: String?

    // Security
    var twoFactorEnabled: Bool

    // Metadata
    var lastLoginAt: Date?
    var createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case emailVerified = "email_verified"
        case name
        case profilePictureUrl = "profile_picture_url"
        case phoneNumber = "phone_number"
        case phoneVerified = "phone_verified"
        case defaultCurrency = "default_currency"
        case timezone
        case language
        case googleId = "google_id"
        case appleId = "apple_id"
        case twoFactorEnabled = "two_factor_enabled"
        case lastLoginAt = "last_login_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - User Profile Update

struct UserProfileUpdate: Codable {
    var name: String?
    var phoneNumber: String?
    var defaultCurrency: String?
    var timezone: String?
    var language: String?

    enum CodingKeys: String, CodingKey {
        case name
        case phoneNumber = "phone_number"
        case defaultCurrency = "default_currency"
        case timezone
        case language
    }
}
