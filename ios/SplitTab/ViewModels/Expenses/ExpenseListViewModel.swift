//
//  ExpenseListViewModel.swift
//  SplitTab
//
//  Expense List View Model
//

import Foundation
import Combine

@MainActor
class ExpenseListViewModel: ObservableObject {
    @Published var expenses: [Expense] = []
    @Published var filteredExpenses: [Expense] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchText = ""
    @Published var selectedCategory: ExpenseCategory?
    @Published var selectedGroupId: String?
    @Published var startDate: Date?
    @Published var endDate: Date?
    @Published var sortOption: SortOption = .dateDesc

    private let networkManager = NetworkManager.shared
    private var cancellables = Set<AnyCancellable>()

    enum SortOption: String, CaseIterable {
        case dateDesc = "Newest First"
        case dateAsc = "Oldest First"
        case amountDesc = "Highest Amount"
        case amountAsc = "Lowest Amount"
        case group = "Group Name"
    }

    init() {
        setupSearchDebounce()
        setupFilterObservers()
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
        Publishers.CombineLatest4(
            $selectedCategory,
            $selectedGroupId,
            $startDate,
            $endDate
        )
        .sink { [weak self] _ in
            self?.applyFilters()
        }
        .store(in: &cancellables)

        $sortOption
            .sink { [weak self] _ in
                self?.applyFilters()
            }
            .store(in: &cancellables)
    }

    func fetchExpenses() async {
        isLoading = true
        error = nil

        do {
            let endpoint = APIEndpoint.expenses
            let response: APIResponse<[Expense]> = try await networkManager.request(endpoint)
            expenses = response.data ?? []
            applyFilters()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteExpense(_ expense: Expense) async throws {
        let endpoint = APIEndpoint.deleteExpense(id: expense.id)
        let _: APIResponse<EmptyResponse> = try await networkManager.request(endpoint)

        // Remove from local state
        expenses.removeAll { $0.id == expense.id }
        applyFilters()
    }

    func applyFilters() {
        var result = expenses

        // Search filter
        if !searchText.isEmpty {
            result = result.filter { expense in
                expense.description.localizedCaseInsensitiveContains(searchText)
            }
        }

        // Category filter
        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }

        // Group filter
        if let groupId = selectedGroupId {
            result = result.filter { $0.groupId == groupId }
        }

        // Date range filter
        if let start = startDate {
            result = result.filter { $0.expenseDate >= start }
        }

        if let end = endDate {
            result = result.filter { $0.expenseDate <= end }
        }

        // Apply sorting
        switch sortOption {
        case .dateDesc:
            result.sort { $0.expenseDate > $1.expenseDate }
        case .dateAsc:
            result.sort { $0.expenseDate < $1.expenseDate }
        case .amountDesc:
            result.sort { $0.amount > $1.amount }
        case .amountAsc:
            result.sort { $0.amount < $1.amount }
        case .group:
            result.sort { ($0.group?.name ?? "") < ($1.group?.name ?? "") }
        }

        filteredExpenses = result
    }

    func resetFilters() {
        searchText = ""
        selectedCategory = nil
        selectedGroupId = nil
        startDate = nil
        endDate = nil
        sortOption = .dateDesc
    }
}

struct EmptyResponse: Codable {}
