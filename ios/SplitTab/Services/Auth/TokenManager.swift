//
//  TokenManager.swift
//  SplitTab
//
//  Manages authentication tokens
//

import Foundation
import Security

actor TokenManager {
    static let shared = TokenManager()

    private let accessTokenKey = "com.splittab.accessToken"
    private let refreshTokenKey = "com.splittab.refreshToken"
    private let tokenExpiryKey = "com.splittab.tokenExpiry"

    private init() {}

    // MARK: - Access Token

    func saveAccessToken(_ token: String, expiresIn: Int) async {
        await KeychainManager.shared.save(token, forKey: accessTokenKey)

        let expiryDate = Date().addingTimeInterval(TimeInterval(expiresIn))
        UserDefaults.standard.set(expiryDate, forKey: tokenExpiryKey)
    }

    func getAccessToken() async -> String? {
        // Check if token is expired
        if let expiryDate = UserDefaults.standard.object(forKey: tokenExpiryKey) as? Date {
            if Date() >= expiryDate {
                // Token expired, try to refresh
                return nil
            }
        }

        return await KeychainManager.shared.get(accessTokenKey)
    }

    func clearAccessToken() async {
        await KeychainManager.shared.delete(accessTokenKey)
        UserDefaults.standard.removeObject(forKey: tokenExpiryKey)
    }

    // MARK: - Refresh Token

    func saveRefreshToken(_ token: String) async {
        await KeychainManager.shared.save(token, forKey: refreshTokenKey)
    }

    func getRefreshToken() async -> String? {
        return await KeychainManager.shared.get(refreshTokenKey)
    }

    func clearRefreshToken() async {
        await KeychainManager.shared.delete(refreshTokenKey)
    }

    // MARK: - Clear All

    func clearAllTokens() async {
        await clearAccessToken()
        await clearRefreshToken()
    }

    // MARK: - Token Status

    func isAccessTokenValid() async -> Bool {
        if let expiryDate = UserDefaults.standard.object(forKey: tokenExpiryKey) as? Date {
            return Date() < expiryDate
        }
        return false
    }
}
