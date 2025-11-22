//
//  UserManager.swift
//  SplitTab
//
//  Manages current user data
//

import Foundation

actor UserManager {
    static let shared = UserManager()

    private let currentUserKey = "com.splittab.currentUser"
    private var cachedUser: User?

    private init() {}

    // MARK: - Current User

    func saveCurrentUser(_ user: User) {
        cachedUser = user

        if let encoded = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(encoded, forKey: currentUserKey)
        }
    }

    func getCurrentUser() -> User? {
        if let user = cachedUser {
            return user
        }

        if let data = UserDefaults.standard.data(forKey: currentUserKey),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            cachedUser = user
            return user
        }

        return nil
    }

    func clearCurrentUser() {
        cachedUser = nil
        UserDefaults.standard.removeObject(forKey: currentUserKey)
    }

    func updateCurrentUser(_ user: User) {
        saveCurrentUser(user)
    }
}
