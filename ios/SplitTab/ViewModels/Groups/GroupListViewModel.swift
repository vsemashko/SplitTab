//
//  GroupListViewModel.swift
//  SplitTab
//
//  Group List View Model
//

import Foundation
import Combine

@MainActor
class GroupListViewModel: ObservableObject {
    @Published var groups: [Group] = []
    @Published var filteredGroups: [Group] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchText = ""
    @Published var roleFilter: RoleFilter = .all
    @Published var sortOption: SortOption = .createdDesc

    private let networkManager = NetworkManager.shared
    private var cancellables = Set<AnyCancellable>()
    private var currentUserId: String?

    enum RoleFilter: String, CaseIterable {
        case all = "All Groups"
        case admin = "Admin"
        case member = "Member"
    }

    enum SortOption: String, CaseIterable {
        case createdDesc = "Newest First"
        case nameAsc = "Name (A-Z)"
        case nameDesc = "Name (Z-A)"
        case membersDesc = "Most Members"
    }

    init() {
        setupSearchDebounce()
        setupFilterObservers()
        Task {
            await loadCurrentUser()
        }
    }

    private func setupSearchDebounce() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.applyFilters()
            }
            .store(in: &cancellables)
    }

    private func setupFilterObservers() {
        Publishers.CombineLatest($roleFilter, $sortOption)
            .sink { [weak self] _ in
                self?.applyFilters()
            }
            .store(in: &cancellables)
    }

    private func loadCurrentUser() async {
        do {
            let endpoint = APIEndpoint.currentUser
            let response: APIResponse<User> = try await networkManager.request(endpoint)
            currentUserId = response.data?.id
        } catch {
            print("Failed to load current user: \(error)")
        }
    }

    func fetchGroups() async {
        isLoading = true
        error = nil

        do {
            let endpoint = APIEndpoint.groups
            let response: APIResponse<[Group]> = try await networkManager.request(endpoint)
            groups = response.data ?? []
            applyFilters()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteGroup(_ group: Group) async throws {
        let endpoint = APIEndpoint.group(group.id)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .delete)

        // Remove from local state
        groups.removeAll { $0.id == group.id }
        applyFilters()
    }

    func leaveGroup(_ group: Group) async throws {
        let endpoint = APIEndpoint.leaveGroup(group.id)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint, method: .post)

        // Remove from local state
        groups.removeAll { $0.id == group.id }
        applyFilters()
    }

    func applyFilters() {
        var result = groups

        // Search filter
        if !searchText.isEmpty {
            result = result.filter { group in
                group.name.localizedCaseInsensitiveContains(searchText) ||
                (group.description?.localizedCaseInsensitiveContains(searchText) ?? false)
            }
        }

        // Role filter
        if roleFilter != .all, let userId = currentUserId {
            result = result.filter { group in
                guard let userMember = group.members?.first(where: { $0.userId == userId }) else {
                    return false
                }

                switch roleFilter {
                case .admin:
                    return userMember.role == .owner || userMember.role == .admin
                case .member:
                    return userMember.role == .member
                case .all:
                    return true
                }
            }
        }

        // Apply sorting
        switch sortOption {
        case .createdDesc:
            result.sort { $0.createdAt > $1.createdAt }
        case .nameAsc:
            result.sort { $0.name < $1.name }
        case .nameDesc:
            result.sort { $0.name > $1.name }
        case .membersDesc:
            result.sort { ($0.memberCount ?? 0) > ($1.memberCount ?? 0) }
        }

        filteredGroups = result
    }

    func isUserAdmin(for group: Group) -> Bool {
        guard let userId = currentUserId,
              let userMember = group.members?.first(where: { $0.userId == userId }) else {
            return false
        }
        return userMember.role == .owner || userMember.role == .admin
    }

    // Stats
    var totalGroups: Int {
        groups.count
    }

    var adminGroups: Int {
        guard let userId = currentUserId else { return 0 }
        return groups.filter { group in
            guard let userMember = group.members?.first(where: { $0.userId == userId }) else {
                return false
            }
            return userMember.role == .owner || userMember.role == .admin
        }.count
    }

    var totalMembers: Int {
        groups.reduce(0) { $0 + ($1.memberCount ?? 0) }
    }
}
