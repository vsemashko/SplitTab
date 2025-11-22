//
//  GroupSettingsViewModel.swift
//  SplitTab
//
//  Group Settings View Model
//

import Foundation
import Combine

@MainActor
class GroupSettingsViewModel: ObservableObject {
    @Published var group: Group?
    @Published var name = ""
    @Published var description = ""
    @Published var selectedCurrency = "USD"
    @Published var isLoading = false
    @Published var isUpdating = false
    @Published var error: String?
    @Published var validationErrors: [String: String] = [:]
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
            async let userData = fetchCurrentUser()

            let (group, user) = try await (groupData, userData)

            self.group = group
            self.currentUserId = user.id

            // Set form values
            name = group.name
            description = group.description ?? ""
            selectedCurrency = group.currency
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

    private func fetchCurrentUser() async throws -> User {
        let endpoint = APIEndpoint.currentUser
        let response: APIResponse<User> = try await networkManager.request(endpoint)
        guard let user = response.data else {
            throw NSError(domain: "UserError", code: 404, userInfo: [NSLocalizedDescriptionKey: "User not found"])
        }
        return user
    }

    func validate() -> Bool {
        validationErrors.removeAll()

        if name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            validationErrors["name"] = "Group name is required"
        } else if name.count < 2 {
            validationErrors["name"] = "Group name must be at least 2 characters"
        } else if name.count > 100 {
            validationErrors["name"] = "Group name must not exceed 100 characters"
        }

        if description.count > 500 {
            validationErrors["description"] = "Description must not exceed 500 characters"
        }

        return validationErrors.isEmpty
    }

    func updateGroup() async throws {
        guard validate() else {
            throw NSError(
                domain: "ValidationError",
                code: 400,
                userInfo: [NSLocalizedDescriptionKey: validationErrors.values.first ?? "Validation failed"]
            )
        }

        isUpdating = true
        error = nil

        defer { isUpdating = false }

        let groupUpdate = GroupUpdate(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description.isEmpty ? nil : description.trimmingCharacters(in: .whitespacesAndNewlines),
            imageUrl: nil,
            currency: selectedCurrency
        )

        let endpoint = APIEndpoint.group(groupId)
        let response: APIResponse<Group> = try await networkManager.request(
            endpoint,
            method: .patch,
            body: groupUpdate
        )

        if let updatedGroup = response.data {
            group = updatedGroup
        }
    }

    func inviteMembers(emails: [String]) async throws {
        let endpoint = APIEndpoint.addGroupMember(groupId)
        let body = ["emails": emails]
        let _: APIResponse<EmptyResponse> = try await networkManager.request(
            endpoint,
            method: .post,
            body: body
        )

        // Refresh group data
        let groupData = try await fetchGroup()
        group = groupData
    }

    func changeMemberRole(memberId: String, newRole: GroupRole) async throws {
        let endpoint = APIEndpoint.removeGroupMember(groupId, memberId) // Using same endpoint structure
        let body = ["role": newRole.rawValue]
        let _: APIResponse<EmptyResponse> = try await networkManager.request(
            endpoint,
            method: .patch,
            body: body
        )

        // Update local state
        if let memberIndex = group?.members?.firstIndex(where: { $0.id == memberId }) {
            group?.members?[memberIndex].role = newRole
        }
    }

    func removeMember(memberId: String) async throws {
        let endpoint = APIEndpoint.removeGroupMember(groupId, memberId)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .delete)

        // Update local state
        group?.members?.removeAll { $0.id == memberId }
        if let memberCount = group?.memberCount {
            group?.memberCount = memberCount - 1
        }
    }

    func leaveGroup() async throws {
        let endpoint = APIEndpoint.leaveGroup(groupId)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .post)
    }

    func deleteGroup() async throws {
        let endpoint = APIEndpoint.group(groupId)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .delete)
    }

    func isUserAdmin() -> Bool {
        guard let group = group,
              let userId = currentUserId,
              let userMember = group.members?.first(where: { $0.userId == userId }) else {
            return false
        }
        return userMember.role == .owner || userMember.role == .admin
    }

    func isUserOwner() -> Bool {
        guard let group = group,
              let userId = currentUserId,
              let userMember = group.members?.first(where: { $0.userId == userId }) else {
            return false
        }
        return userMember.role == .owner
    }
}
