import Foundation
import Combine

@MainActor
class SettlementListViewModel: ObservableObject {
    @Published var settlements: [Settlement] = []
    @Published var groups: [Group] = []
    @Published var stats: SettlementStats?
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchQuery = ""
    @Published var filterStatus: SettlementStatus?
    @Published var filterGroupId: String?
    @Published var sortOption: SortOption = .dateDesc

    private let apiService: APIService
    private var cancellables = Set<AnyCancellable>()
    private(set) var currentUserId: String = ""

    enum SortOption: String, CaseIterable {
        case dateDesc = "Newest First"
        case dateAsc = "Oldest First"
        case amountDesc = "Highest Amount"
        case amountAsc = "Lowest Amount"
    }

    init(apiService: APIService = .shared) {
        self.apiService = apiService
    }

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let settlementsData = apiService.get(
                endpoint: "/settlements",
                responseType: SettlementsResponse.self
            )
            async let groupsData = apiService.get(
                endpoint: "/groups",
                responseType: [Group].self
            )
            async let userData = apiService.get(
                endpoint: "/users/me",
                responseType: User.self
            )

            let (settlementsResp, fetchedGroups, user) = try await (settlementsData, groupsData, userData)

            settlements = settlementsResp.settlements
            groups = fetchedGroups
            currentUserId = user.id

            calculateStats()

        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func confirmSettlement(_ id: String) async throws {
        _ = try await apiService.post(
            endpoint: "/settlements/\(id)/confirm",
            body: EmptyBody(),
            responseType: Settlement.self
        )

        if let index = settlements.firstIndex(where: { $0.id == id }) {
            settlements[index].status = .confirmed
        }

        calculateStats()
    }

    func cancelSettlement(_ id: String) async throws {
        _ = try await apiService.post(
            endpoint: "/settlements/\(id)/cancel",
            body: EmptyBody(),
            responseType: Settlement.self
        )

        if let index = settlements.firstIndex(where: { $0.id == id }) {
            settlements[index].status = .cancelled
        }

        calculateStats()
    }

    func deleteSettlement(_ id: String) async throws {
        try await apiService.delete(endpoint: "/settlements/\(id)")
        settlements.removeAll { $0.id == id }
        calculateStats()
    }

    var filteredAndSortedSettlements: [Settlement] {
        var filtered = settlements

        // Search filter
        if !searchQuery.isEmpty {
            filtered = filtered.filter { settlement in
                settlement.payer?.name?.localizedCaseInsensitiveContains(searchQuery) ?? false ||
                settlement.payee?.name?.localizedCaseInsensitiveContains(searchQuery) ?? false ||
                settlement.group?.name?.localizedCaseInsensitiveContains(searchQuery) ?? false ||
                settlement.notes?.localizedCaseInsensitiveContains(searchQuery) ?? false
            }
        }

        // Status filter
        if let status = filterStatus {
            filtered = filtered.filter { $0.status == status }
        }

        // Group filter
        if let groupId = filterGroupId {
            filtered = filtered.filter { $0.groupId == groupId }
        }

        // Sort
        return filtered.sorted { settlement1, settlement2 in
            switch sortOption {
            case .dateDesc:
                return settlement1.createdAt > settlement2.createdAt
            case .dateAsc:
                return settlement1.createdAt < settlement2.createdAt
            case .amountDesc:
                return settlement1.amount > settlement2.amount
            case .amountAsc:
                return settlement1.amount < settlement2.amount
            }
        }
    }

    var pendingSettlements: [Settlement] {
        filteredAndSortedSettlements.filter { $0.status == .pending }
    }

    var confirmedSettlements: [Settlement] {
        filteredAndSortedSettlements.filter { $0.status == .confirmed }
    }

    var cancelledSettlements: [Settlement] {
        filteredAndSortedSettlements.filter { $0.status == .cancelled }
    }

    private func calculateStats() {
        let pending = settlements.filter { $0.status == .pending }.count
        let confirmed = settlements.filter { $0.status == .confirmed }.count
        let cancelled = settlements.filter { $0.status == .cancelled }.count

        let totalSettled = settlements
            .filter { $0.status == .confirmed }
            .reduce(0.0) { $0 + $1.amount }

        let avgAmount = confirmed > 0 ? totalSettled / Double(confirmed) : 0

        stats = SettlementStats(
            totalSettled: totalSettled,
            pendingSettlements: pending,
            completedSettlements: confirmed,
            cancelledSettlements: cancelled,
            averageSettlementAmount: avgAmount,
            currency: "USD"
        )
    }
}

// Helper structs
private struct SettlementsResponse: Codable {
    let settlements: [Settlement]
    let total: Int
}

private struct EmptyBody: Codable {}
