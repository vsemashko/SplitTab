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
    var payerId: String
    var payeeId: String
    var amount: Double
    var currency: String?
    var status: SettlementStatus
    var paymentMethod: PaymentMethod?
    var referenceNumber: String?
    var proofOfPaymentUrl: String?
    var notes: String?
    var settledAt: Date?
    var createdAt: Date
    var updatedAt: Date

    // Relationships
    var payer: User?
    var payee: User?
    var group: Group?

    enum CodingKeys: String, CodingKey {
        case id
        case groupId
        case payerId
        case payeeId
        case amount
        case currency
        case status
        case paymentMethod
        case referenceNumber
        case proofOfPaymentUrl
        case notes
        case settledAt
        case createdAt
        case updatedAt
        case payer
        case payee
        case group
    }
}

enum SettlementStatus: String, Codable, CaseIterable {
    case pending
    case confirmed
    case cancelled

    var displayName: String {
        rawValue.capitalized
    }

    var color: String {
        switch self {
        case .pending:
            return "orange"
        case .confirmed:
            return "green"
        case .cancelled:
            return "gray"
        }
    }
}

enum PaymentMethod: String, Codable, CaseIterable {
    case cash
    case creditCard = "credit_card"
    case debitCard = "debit_card"
    case bankTransfer = "bank_transfer"
    case venmo
    case paypal
    case zelle
    case applePay = "apple_pay"
    case googlePay = "google_pay"
    case other

    var displayName: String {
        switch self {
        case .cash:
            return "Cash"
        case .creditCard:
            return "Credit Card"
        case .debitCard:
            return "Debit Card"
        case .bankTransfer:
            return "Bank Transfer"
        case .venmo:
            return "Venmo"
        case .paypal:
            return "PayPal"
        case .zelle:
            return "Zelle"
        case .applePay:
            return "Apple Pay"
        case .googlePay:
            return "Google Pay"
        case .other:
            return "Other"
        }
    }
}

// MARK: - Settlement Creation

struct SettlementCreate: Codable {
    var groupId: String?
    var payerId: String
    var payeeId: String
    var amount: Double
    var paymentMethod: PaymentMethod?
    var referenceNumber: String?
    var notes: String?
    var settledAt: String?
}

// MARK: - Settlement Update

struct SettlementUpdate: Codable {
    var amount: Double?
    var paymentMethod: PaymentMethod?
    var referenceNumber: String?
    var notes: String?
    var status: SettlementStatus?
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

// MARK: - Balance Summary

struct BalanceSummary: Codable {
    let totalOwed: Double
    let totalOwing: Double
    let netBalance: Double
    let currency: String
    let byGroup: [GroupBalance]
    let byPerson: [PersonBalance]
}

// MARK: - Group Balance

struct GroupBalance: Codable {
    let groupId: String
    let groupName: String
    let netBalance: Double
    let currency: String
    let members: [PersonBalance]
}

// MARK: - Person Balance

struct PersonBalance: Codable {
    let userId: String
    let userName: String
    let userProfilePicture: String?
    let balance: Double
    let currency: String
}

// MARK: - Settlement Suggestion

struct SettlementSuggestion: Codable {
    let payerId: String
    let payerName: String
    let payeeId: String
    let payeeName: String
    let amount: Double
    let currency: String
}

// MARK: - Settlement Stats

struct SettlementStats: Codable {
    let totalSettled: Double
    let pendingSettlements: Int
    let completedSettlements: Int
    let cancelledSettlements: Int
    let averageSettlementAmount: Double
    let currency: String
}
