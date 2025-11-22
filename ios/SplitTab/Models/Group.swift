//
//  Group.swift
//  SplitTab
//
//  Group data model
//

import Foundation

struct Group: Codable, Identifiable, Hashable {
    let id: String
    var name: String
    var description: String?
    var imageUrl: String?
    var currency: String
    var createdBy: String
    var isActive: Bool
    var createdAt: Date
    var updatedAt: Date

    // Computed properties
    var members: [GroupMember]?
    var memberCount: Int?
    var totalExpenses: Double?
    var yourBalance: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case imageUrl = "image_url"
        case currency
        case createdBy = "created_by"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case members
        case memberCount = "member_count"
        case totalExpenses = "total_expenses"
        case yourBalance = "your_balance"
    }
}

struct GroupMember: Codable, Identifiable, Hashable {
    let id: String
    let groupId: String
    let userId: String
    let role: GroupRole
    let joinedAt: Date

    // User details
    var user: User?

    enum CodingKeys: String, CodingKey {
        case id
        case groupId = "group_id"
        case userId = "user_id"
        case role
        case joinedAt = "joined_at"
        case user
    }
}

enum GroupRole: String, Codable, CaseIterable {
    case owner
    case admin
    case member

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Group Creation

struct GroupCreate: Codable {
    var name: String
    var description: String?
    var currency: String
    var memberEmails: [String]?

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case currency
        case memberEmails = "member_emails"
    }
}

// MARK: - Group Update

struct GroupUpdate: Codable {
    var name: String?
    var description: String?
    var imageUrl: String?
    var currency: String?

    enum CodingKeys: String, CodingKey {
        case name
        case description
        case imageUrl = "image_url"
        case currency
    }
}
