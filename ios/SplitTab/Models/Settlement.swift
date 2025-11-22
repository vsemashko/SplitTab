//
//  Settlement.swift
//  SplitTab
//
//  Settlement data model
//

import Foundation

struct Settlement: Codable, Identifiable, Hashable {
    let id: String
    var groupId: String
    var fromUserId: String
    var toUserId: String
    var amount: Double
    var currency: String
    var status: SettlementStatus
    var paymentMethod: PaymentMethod?
    var notes: String?
    var settledAt: Date?
    var createdAt: Date
    var updatedAt: Date

    // Relationships
    var fromUser: User?
    var toUser: User?
    var group: Group?

    enum CodingKeys: String, CodingKey {
        case id
        case groupId = "group_id"
        case fromUserId = "from_user_id"
        case toUserId = "to_user_id"
        case amount
        case currency
        case status
        case paymentMethod = "payment_method"
        case notes
        case settledAt = "settled_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case fromUser = "from_user"
        case toUser = "to_user"
        case group
    }
}

enum SettlementStatus: String, Codable, CaseIterable {
    case pending
    case completed
    case cancelled

    var displayName: String {
        rawValue.capitalized
    }

    var color: String {
        switch self {
        case .pending:
            return "orange"
        case .completed:
            return "green"
        case .cancelled:
            return "gray"
        }
    }
}

enum PaymentMethod: String, Codable, CaseIterable {
    case cash
    case bankTransfer = "bank_transfer"
    case paypal
    case venmo
    case other

    var displayName: String {
        switch self {
        case .cash:
            return "Cash"
        case .bankTransfer:
            return "Bank Transfer"
        case .paypal:
            return "PayPal"
        case .venmo:
            return "Venmo"
        case .other:
            return "Other"
        }
    }

    enum CodingKeys: String, CodingKey {
        case cash
        case bankTransfer = "bank_transfer"
        case paypal
        case venmo
        case other
    }
}

// MARK: - Settlement Creation

struct SettlementCreate: Codable {
    var groupId: String
    var fromUserId: String
    var toUserId: String
    var amount: Double
    var currency: String
    var paymentMethod: PaymentMethod?
    var notes: String?

    enum CodingKeys: String, CodingKey {
        case groupId = "group_id"
        case fromUserId = "from_user_id"
        case toUserId = "to_user_id"
        case amount
        case currency
        case paymentMethod = "payment_method"
        case notes
    }
}

// MARK: - Balance

struct Balance: Codable, Identifiable, Hashable {
    var id: String { "\(userId)-\(otherUserId)" }
    let userId: String
    let otherUserId: String
    let amount: Double
    let currency: String

    // User details
    var otherUser: User?

    var isOwed: Bool {
        amount > 0
    }

    var absoluteAmount: Double {
        abs(amount)
    }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case otherUserId = "other_user_id"
        case amount
        case currency
        case otherUser = "other_user"
    }
}
