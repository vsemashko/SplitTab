import Foundation
import Combine

@MainActor
class BalanceDashboardViewModel: ObservableObject {
    @Published var balanceSummary: BalanceSummary?
    @Published var groups: [Group] = []
    @Published var selectedGroupId: String?
    @Published var suggestions: [SettlementSuggestion] = []
    @Published var isLoading = false
    @Published var error: String?

    private let apiService: APIService
    private var cancellables = Set<AnyCancellable>()

    init(apiService: APIService = .shared) {
        self.apiService = apiService
    }

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let groupsData = apiService.get(endpoint: "/groups", responseType: [Group].self)
            async let currentUser = apiService.get(endpoint: "/users/me", responseType: User.self)

            let (fetchedGroups, user) = try await (groupsData, currentUser)

            groups = fetchedGroups
            await calculateBalances(userId: user.id)

        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadSuggestions(for groupId: String) async {
        do {
            suggestions = try await apiService.get(
                endpoint: "/groups/\(groupId)/settlements/suggestions",
                responseType: [SettlementSuggestion].self
            )
        } catch {
            print("Error loading suggestions: \(error)")
        }
    }

    private func calculateBalances(userId: String) async {
        var groupBalances: [GroupBalance] = []

        for group in groups {
            do {
                async let expenses = apiService.get(
                    endpoint: "/groups/\(group.id)/expenses",
                    responseType: [Expense].self
                )
                async let settlements = apiService.get(
                    endpoint: "/settlements?groupId=\(group.id)",
                    responseType: SettlementsResponse.self
                )

                let (expensesData, settlementsData) = try await (expenses, settlements)

                var memberBalances: [String: MemberBalance] = [:]

                // Initialize member balances
                for member in group.members ?? [] {
                    memberBalances[member.userId] = MemberBalance(
                        userId: member.userId,
                        userName: member.user?.name ?? "Unknown",
                        balance: 0
                    )
                }

                // Calculate from expenses
                for expense in expensesData {
                    for participant in expense.participants ?? [] {
                        let paid = participant.paidAmount ?? 0
                        let owed = participant.owedAmount ?? 0
                        memberBalances[participant.userId]?.balance += paid - owed
                    }
                }

                // Adjust for confirmed settlements
                for settlement in settlementsData.settlements where settlement.status == "confirmed" {
                    memberBalances[settlement.payerId]?.balance -= settlement.amount
                    memberBalances[settlement.payeeId]?.balance += settlement.amount
                }

                let userBalance = memberBalances[userId]?.balance ?? 0

                let personBalances = memberBalances.values
                    .filter { $0.userId != userId && abs($0.balance) > 0.01 }
                    .map { member in
                        PersonBalance(
                            userId: member.userId,
                            userName: member.userName,
                            userProfilePicture: nil,
                            balance: -member.balance, // Invert for display
                            currency: group.currency ?? "USD"
                        )
                    }

                let groupBalance = GroupBalance(
                    groupId: group.id,
                    groupName: group.name,
                    netBalance: userBalance,
                    currency: group.currency ?? "USD",
                    members: personBalances
                )

                groupBalances.append(groupBalance)

            } catch {
                print("Error calculating balance for group \(group.id): \(error)")
            }
        }

        let totalOwed = groupBalances.reduce(0.0) { sum, group in
            sum + group.members.filter { $0.balance > 0 }.reduce(0.0) { $0 + $1.balance }
        }

        let totalOwing = groupBalances.reduce(0.0) { sum, group in
            sum + group.members.filter { $0.balance < 0 }.reduce(0.0) { $0 + abs($1.balance) }
        }

        let allPersonBalances = groupBalances.flatMap { $0.members }

        balanceSummary = BalanceSummary(
            totalOwed: totalOwed,
            totalOwing: totalOwing,
            netBalance: totalOwed - totalOwing,
            currency: "USD",
            byGroup: groupBalances,
            byPerson: allPersonBalances
        )
    }

    func createSettlement(suggestion: SettlementSuggestion) async throws {
        let settlement = SettlementCreate(
            groupId: selectedGroupId,
            payerId: suggestion.payerId,
            payeeId: suggestion.payeeId,
            amount: suggestion.amount,
            notes: "Settlement from smart suggestion"
        )

        _ = try await apiService.post(
            endpoint: "/settlements",
            body: settlement,
            responseType: Settlement.self
        )

        await loadData()
        if let groupId = selectedGroupId {
            await loadSuggestions(for: groupId)
        }
    }

    func createAllSettlements() async throws {
        for suggestion in suggestions {
            let settlement = SettlementCreate(
                groupId: selectedGroupId,
                payerId: suggestion.payerId,
                payeeId: suggestion.payeeId,
                amount: suggestion.amount,
                notes: "Settlement from smart suggestion"
            )

            _ = try await apiService.post(
                endpoint: "/settlements",
                body: settlement,
                responseType: Settlement.self
            )
        }

        await loadData()
        if let groupId = selectedGroupId {
            await loadSuggestions(for: groupId)
        }
    }
}

// Helper structs
private struct MemberBalance {
    let userId: String
    let userName: String
    var balance: Double
}

private struct SettlementsResponse: Codable {
    let settlements: [Settlement]
    let total: Int
}
