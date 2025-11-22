//
//  GroupDetailViewModel.swift
//  SplitTab
//
//  Group Detail View Model
//

import Foundation
import Combine

@MainActor
class GroupDetailViewModel: ObservableObject {
    @Published var group: Group?
    @Published var expenses: [Expense] = []
    @Published var balances: [Balance] = []
    @Published var activities: [Activity] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var currentUserId: String?

    private let networkManager = NetworkManager.shared
    let groupId: String

    init(groupId: String) {
        self.groupId = groupId
    }

    func fetchData() async {
        isLoading = true
        error = nil

        do {
            async let groupData = fetchGroup()
            async let expensesData = fetchExpenses()
            async let balancesData = fetchBalances()
            async let activitiesData = fetchActivities()
            async let userData = fetchCurrentUser()

            let (group, expenses, balances, activities, user) = try await (
                groupData, expensesData, balancesData, activitiesData, userData
            )

            self.group = group
            self.expenses = expenses
            self.balances = balances
            self.activities = activities
            self.currentUserId = user.id
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func fetchGroup() async throws -> Group {
        let endpoint = APIEndpoint.group(groupId)
        let response: APIResponse<Group> = try await networkManager.request(endpoint)
        guard let group = response.data else {
            throw NSError(domain: "GroupError", code: 404, userInfo: [NSLocalizedDescriptionKey: "Group not found"])
        }
        return group
    }

    private func fetchExpenses() async throws -> [Expense] {
        let endpoint = APIEndpoint.groupExpenses(groupId: groupId)
        let response: APIResponse<[Expense]> = try await networkManager.request(endpoint)
        return response.data ?? []
    }

    private func fetchBalances() async throws -> [Balance] {
        let endpoint = APIEndpoint.groupBalances(groupId)
        let response: APIResponse<[Balance]> = try await networkManager.request(endpoint)
        return response.data ?? []
    }

    private func fetchActivities() async throws -> [Activity] {
        let endpoint = APIEndpoint.groupActivity(groupId)
        let response: APIResponse<[Activity]> = try await networkManager.request(endpoint)
        return response.data ?? []
    }

    private func fetchCurrentUser() async throws -> User {
        let endpoint = APIEndpoint.currentUser
        let response: APIResponse<User> = try await networkManager.request(endpoint)
        guard let user = response.data else {
            throw NSError(domain: "UserError", code: 404, userInfo: [NSLocalizedDescriptionKey: "User not found"])
        }
        return user
    }

    func deleteExpense(_ expense: Expense) async throws {
        let endpoint = APIEndpoint.deleteExpense(id: expense.id)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .delete)

        // Remove from local state
        expenses.removeAll { $0.id == expense.id }
    }

    func isUserAdmin() -> Bool {
        guard let group = group,
              let userId = currentUserId,
              let userMember = group.members?.first(where: { $0.userId == userId }) else {
            return false
        }
        return userMember.role == .owner || userMember.role == .admin
    }

    // Stats
    var stats: GroupStats {
        GroupStats(
            totalMembers: group?.memberCount ?? 0,
            totalExpenses: expenses.count,
            totalAmount: group?.totalExpenses ?? 0,
            yourBalance: group?.yourBalance ?? 0,
            currency: group?.currency ?? "USD"
        )
    }
}

struct GroupStats {
    let totalMembers: Int
    let totalExpenses: Int
    let totalAmount: Double
    let yourBalance: Double
    let currency: String
}

// Activity model
struct Activity: Codable, Identifiable {
    let id: String
    let type: ActivityType
    let description: String
    let user: ActivityUser?
    let metadata: ActivityMetadata?
    let createdAt: Date

    enum ActivityType: String, Codable {
        case expenseAdded = "expense_added"
        case memberJoined = "member_joined"
        case memberLeft = "member_left"
        case settingsChanged = "settings_changed"
        case settlementMade = "settlement_made"
        case roleChanged = "role_changed"
    }

    struct ActivityUser: Codable {
        let name: String
        let profilePictureUrl: String?

        enum CodingKeys: String, CodingKey {
            case name
            case profilePictureUrl = "profile_picture_url"
        }
    }

    struct ActivityMetadata: Codable {
        let amount: Double?
        let currency: String?
        let expenseName: String?
        let settingChanged: String?
        let newRole: String?
        let oldRole: String?

        enum CodingKeys: String, CodingKey {
            case amount
            case currency
            case expenseName = "expense_name"
            case settingChanged = "setting_changed"
            case newRole = "new_role"
            case oldRole = "old_role"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case type
        case description
        case user
        case metadata
        case createdAt = "created_at"
    }
}

// Balance model
struct Balance: Codable, Identifiable {
    var id: String { "\(userId)_\(otherUserId)" }
    let userId: String
    let otherUserId: String
    let amount: Double
    let currency: String
    let otherUser: User?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case otherUserId = "other_user_id"
        case amount
        case currency
        case otherUser = "other_user"
    }
}
