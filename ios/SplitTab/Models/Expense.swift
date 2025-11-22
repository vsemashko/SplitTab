//
//  Expense.swift
//  SplitTab
//
//  Expense data model
//

import Foundation

struct Expense: Codable, Identifiable, Hashable {
    let id: String
    var groupId: String
    var description: String
    var amount: Double
    var currency: String
    var paidBy: String
    var expenseDate: Date
    var category: ExpenseCategory
    var receiptUrl: String?
    var notes: String?
    var createdAt: Date
    var updatedAt: Date

    // Relationships
    var participants: [ExpenseParticipant]?
    var payer: User?
    var group: Group?

    enum CodingKeys: String, CodingKey {
        case id
        case groupId = "group_id"
        case description
        case amount
        case currency
        case paidBy = "paid_by"
        case expenseDate = "expense_date"
        case category
        case receiptUrl = "receipt_url"
        case notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case participants
        case payer
        case group
    }
}

struct ExpenseParticipant: Codable, Identifiable, Hashable {
    let id: String
    let expenseId: String
    let userId: String
    let share: Double
    let shareType: ShareType
    var isPaid: Bool
    let createdAt: Date

    // User details
    var user: User?

    enum CodingKeys: String, CodingKey {
        case id
        case expenseId = "expense_id"
        case userId = "user_id"
        case share
        case shareType = "share_type"
        case isPaid = "is_paid"
        case createdAt = "created_at"
        case user
    }
}

enum ShareType: String, Codable, CaseIterable {
    case equal
    case percentage
    case exact
    case shares

    var displayName: String {
        switch self {
        case .equal:
            return "Split Equally"
        case .percentage:
            return "By Percentage"
        case .exact:
            return "Exact Amounts"
        case .shares:
            return "By Shares"
        }
    }
}

enum ExpenseCategory: String, Codable, CaseIterable {
    case food
    case transport
    case accommodation
    case entertainment
    case shopping
    case utilities
    case other

    var displayName: String {
        rawValue.capitalized
    }

    var iconName: String {
        switch self {
        case .food:
            return "fork.knife"
        case .transport:
            return "car.fill"
        case .accommodation:
            return "house.fill"
        case .entertainment:
            return "ticket.fill"
        case .shopping:
            return "cart.fill"
        case .utilities:
            return "lightbulb.fill"
        case .other:
            return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Expense Creation

struct ExpenseCreate: Codable {
    var groupId: String
    var description: String
    var amount: Double
    var currency: String
    var paidBy: String
    var expenseDate: Date
    var category: ExpenseCategory
    var notes: String?
    var participants: [ExpenseParticipantCreate]

    enum CodingKeys: String, CodingKey {
        case groupId = "group_id"
        case description
        case amount
        case currency
        case paidBy = "paid_by"
        case expenseDate = "expense_date"
        case category
        case notes
        case participants
    }
}

struct ExpenseParticipantCreate: Codable {
    var userId: String
    var share: Double
    var shareType: ShareType

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case share
        case shareType = "share_type"
    }
}

// MARK: - Expense Update

struct ExpenseUpdate: Codable {
    var description: String?
    var amount: Double?
    var expenseDate: Date?
    var category: ExpenseCategory?
    var notes: String?

    enum CodingKeys: String, CodingKey {
        case description
        case amount
        case expenseDate = "expense_date"
        case category
        case notes
    }
}
