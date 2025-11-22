//
//  APIEndpoint.swift
//  SplitTab
//
//  API endpoint definitions
//

import Foundation

struct APIEndpoint {
    let path: String
    var queryItems: [URLQueryItem]?

    var url: URL? {
        var components = URLComponents()
        components.scheme = AppConfig.apiScheme
        components.host = AppConfig.apiHost
        components.path = "/\(AppConfig.apiVersion)/\(path)"
        components.queryItems = queryItems

        return components.url
    }
}

extension APIEndpoint {
    // MARK: - Authentication

    static let login = APIEndpoint(path: "auth/login")
    static let register = APIEndpoint(path: "auth/register")
    static let refreshToken = APIEndpoint(path: "auth/refresh")
    static let logout = APIEndpoint(path: "auth/logout")
    static let forgotPassword = APIEndpoint(path: "auth/forgot-password")
    static let resetPassword = APIEndpoint(path: "auth/reset-password")
    static let changePassword = APIEndpoint(path: "auth/change-password")
    static let verifyEmail = APIEndpoint(path: "auth/verify-email")
    static let resendVerification = APIEndpoint(path: "auth/resend-verification")

    // OAuth
    static let googleAuth = APIEndpoint(path: "auth/google")
    static let appleAuth = APIEndpoint(path: "auth/apple")

    // MARK: - Users

    static let currentUser = APIEndpoint(path: "users/me")
    static func user(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "users/\(id)")
    }
    static let updateProfile = APIEndpoint(path: "users/me")
    static let uploadProfilePicture = APIEndpoint(path: "users/me/profile-picture")

    // MARK: - Groups

    static let groups = APIEndpoint(path: "groups")
    static func group(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(id)")
    }
    static func groupMembers(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/members")
    }
    static func addGroupMember(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/members")
    }
    static func removeGroupMember(_ groupId: String, _ memberId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/members/\(memberId)")
    }
    static func leaveGroup(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/leave")
    }

    // MARK: - Expenses

    static let expenses = APIEndpoint(path: "expenses")
    static let createExpense = APIEndpoint(path: "expenses")
    static func expense(id: String) -> APIEndpoint {
        APIEndpoint(path: "expenses/\(id)")
    }
    static func updateExpense(id: String) -> APIEndpoint {
        APIEndpoint(path: "expenses/\(id)")
    }
    static func deleteExpense(id: String) -> APIEndpoint {
        APIEndpoint(path: "expenses/\(id)")
    }
    static func groupExpenses(groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/expenses")
    }
    static func groupMembers(groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/members")
    }
    static func uploadReceipt(expenseId: String) -> APIEndpoint {
        APIEndpoint(path: "expenses/\(expenseId)/receipt")
    }

    // MARK: - Settlements

    static let settlements = APIEndpoint(path: "settlements")
    static func settlement(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "settlements/\(id)")
    }
    static func groupSettlements(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/settlements")
    }
    static func markSettlementPaid(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "settlements/\(id)/mark-paid")
    }
    static func cancelSettlement(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "settlements/\(id)/cancel")
    }

    // MARK: - Balances

    static let balances = APIEndpoint(path: "balances")
    static func groupBalances(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/balances")
    }
    static func userBalance(_ userId: String) -> APIEndpoint {
        APIEndpoint(path: "balances/user/\(userId)")
    }

    // MARK: - Activity

    static let activity = APIEndpoint(path: "activity")
    static func groupActivity(_ groupId: String) -> APIEndpoint {
        APIEndpoint(path: "groups/\(groupId)/activity")
    }

    // MARK: - Notifications

    static let notifications = APIEndpoint(path: "notifications")
    static func markNotificationRead(_ id: String) -> APIEndpoint {
        APIEndpoint(path: "notifications/\(id)/read")
    }
    static let markAllNotificationsRead = APIEndpoint(path: "notifications/mark-all-read")
    static let registerDeviceToken = APIEndpoint(path: "notifications/device-token")
}
