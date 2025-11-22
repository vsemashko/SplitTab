//
//  ExpenseListView.swift
//  SplitTab
//
//  Expense List View
//

import SwiftUI

struct ExpenseListView: View {
    @StateObject private var viewModel = ExpenseListViewModel()
    @State private var showFilters = false
    @State private var showCreateExpense = false
    @State private var groups: [Group] = []

    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading && viewModel.expenses.isEmpty {
                    // Loading state
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Loading expenses...")
                            .foregroundColor(.secondary)
                    }
                } else if let error = viewModel.error {
                    // Error state
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 48))
                            .foregroundColor(.red)

                        Text("Error")
                            .font(.headline)

                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        Button("Retry") {
                            Task {
                                await viewModel.fetchExpenses()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                } else if viewModel.filteredExpenses.isEmpty {
                    // Empty state
                    VStack(spacing: 16) {
                        Image(systemName: "dollarsign.circle")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary)

                        Text("No Expenses")
                            .font(.title2)
                            .fontWeight(.semibold)

                        Text(viewModel.expenses.isEmpty ?
                             "Get started by adding your first expense" :
                             "Try adjusting your filters")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        if viewModel.expenses.isEmpty {
                            Button {
                                showCreateExpense = true
                            } label: {
                                Label("Add Expense", systemImage: "plus")
                            }
                            .buttonStyle(.borderedProminent)
                            .padding(.top)
                        }
                    }
                    .padding()
                } else {
                    // Expense list
                    List {
                        // Stats section
                        Section {
                            ExpenseStatsView(expenses: viewModel.expenses)
                        }

                        // Expenses
                        Section {
                            ForEach(viewModel.filteredExpenses) { expense in
                                NavigationLink(destination: ExpenseDetailView(expenseId: expense.id)) {
                                    ExpenseRow(expense: expense, showGroup: true)
                                }
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        Task {
                                            do {
                                                try await viewModel.deleteExpense(expense)
                                            } catch {
                                                // Show error alert
                                            }
                                        }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                        } header: {
                            HStack {
                                Text("Expenses")
                                Spacer()
                                Text("\(viewModel.filteredExpenses.count)")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.fetchExpenses()
                    }
                }
            }
            .navigationTitle("Expenses")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "Search expenses")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateExpense = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                ExpenseFiltersSheet(viewModel: viewModel, groups: groups)
            }
            .sheet(isPresented: $showCreateExpense) {
                CreateExpenseView()
            }
            .task {
                await viewModel.fetchExpenses()
                await loadGroups()
            }
        }
    }

    private func loadGroups() async {
        do {
            let endpoint = APIEndpoint.groups
            let response: APIResponse<[Group]> = try await NetworkManager.shared.request(endpoint)
            groups = response.data ?? []
        } catch {
            print("Failed to load groups: \(error)")
        }
    }
}

struct ExpenseStatsView: View {
    let expenses: [Expense]

    var totalSpent: Double {
        expenses.reduce(0) { $0 + $1.amount }
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 16) {
                StatCard(
                    title: "Total Expenses",
                    value: "\(expenses.count)",
                    icon: "list.bullet",
                    color: .blue
                )

                StatCard(
                    title: "Total Spent",
                    value: formatCurrency(totalSpent),
                    icon: "dollarsign.circle",
                    color: .green
                )
            }
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    ExpenseListView()
}
