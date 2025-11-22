//
//  AppConfig.swift
//  SplitTab
//
//  Application configuration
//

import Foundation

struct AppConfig {
    // MARK: - API Configuration

    static var apiScheme: String {
        #if DEBUG
        return "http"
        #else
        return "https"
        #endif
    }

    static var apiHost: String {
        #if DEBUG
        return "localhost:3000"
        #else
        return "api.splittab.com"
        #endif
    }

    static let apiVersion = "v1"

    // MARK: - App Information

    static let appName = "SplitTab"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"

    // MARK: - Feature Flags

    static let enableAnalytics = true
    static let enableCrashReporting = true
    static let enablePushNotifications = true

    // MARK: - OAuth

    static let googleClientId = "YOUR_GOOGLE_CLIENT_ID"
    static let appleClientId = "YOUR_APPLE_CLIENT_ID"

    // MARK: - Pagination

    static let defaultPageSize = 20
    static let maxPageSize = 100

    // MARK: - Cache

    static let cacheExpiryMinutes = 5

    // MARK: - Validation

    static let minPasswordLength = 8
    static let maxNameLength = 100
}
