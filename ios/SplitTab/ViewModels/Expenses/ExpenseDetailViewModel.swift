//
//  ExpenseDetailViewModel.swift
//  SplitTab
//
//  Expense Detail View Model
//

import Foundation

@MainActor
class ExpenseDetailViewModel: ObservableObject {
    @Published var expense: Expense?
    @Published var isLoading = false
    @Published var error: String?
    @Published var showDeleteAlert = false
    @Published var isDeleting = false

    private let networkManager = NetworkManager.shared
    private let expenseId: String

    init(expenseId: String) {
        self.expenseId = expenseId
    }

    func fetchExpense() async {
        isLoading = true
        error = nil

        do {
            let endpoint = APIEndpoint.expense(id: expenseId)
            let response: APIResponse<Expense> = try await networkManager.request(endpoint)
            expense = response.data
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteExpense() async throws {
        isDeleting = true
        defer { isDeleting = false }

        let endpoint = APIEndpoint.deleteExpense(id: expenseId)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint)
    }

    func calculateParticipantAmount(participant: ExpenseParticipant) -> Double {
        guard let expense = expense else { return 0 }

        switch participant.shareType {
        case .equal:
            let count = Double(expense.participants?.count ?? 1)
            return expense.amount / count
        case .percentage:
            return expense.amount * (participant.share / 100)
        case .exact:
            return participant.share
        case .shares:
            let totalShares = expense.participants?.reduce(0.0) { $0 + $1.share } ?? 1
            return expense.amount * (participant.share / totalShares)
        }
    }

    func formatCurrency(_ amount: Double, currency: String = "USD") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}
