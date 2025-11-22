import SwiftUI

struct BalanceDashboardView: View {
    @StateObject private var viewModel = BalanceDashboardViewModel()
    @State private var showingSuggestions = false
    @State private var isCreatingSettlement = false
    @State private var showingError = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Summary Cards
                if let summary = viewModel.balanceSummary {
                    VStack(spacing: 16) {
                        // Total Owed to You
                        SummaryCard(
                            title: "Total Owed to You",
                            amount: summary.totalOwed,
                            currency: summary.currency,
                            color: .green,
                            icon: "arrow.up.right.circle.fill"
                        )

                        // Total You Owe
                        SummaryCard(
                            title: "Total You Owe",
                            amount: summary.totalOwing,
                            currency: summary.currency,
                            color: .red,
                            icon: "arrow.down.left.circle.fill"
                        )

                        // Net Balance
                        SummaryCard(
                            title: "Net Balance",
                            amount: summary.netBalance,
                            currency: summary.currency,
                            color: summary.netBalance >= 0 ? .blue : .orange,
                            icon: "dollarsign.circle.fill"
                        )
                    }
                    .padding(.horizontal)
                }

                // Group Filter
                if !viewModel.groups.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Filter by Group")
                            .font(.headline)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                GroupFilterChip(
                                    title: "All Groups",
                                    isSelected: viewModel.selectedGroupId == nil,
                                    action: {
                                        viewModel.selectedGroupId = nil
                                    }
                                )

                                ForEach(viewModel.groups) { group in
                                    GroupFilterChip(
                                        title: group.name,
                                        isSelected: viewModel.selectedGroupId == group.id,
                                        action: {
                                            viewModel.selectedGroupId = group.id
                                            Task {
                                                await viewModel.loadSuggestions(for: group.id)
                                            }
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }

                // Settlement Suggestions
                if let selectedGroupId = viewModel.selectedGroupId,
                   !viewModel.suggestions.isEmpty {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundColor(.yellow)

                            Text("Smart Suggestions")
                                .font(.headline)

                            Spacer()

                            Button(action: {
                                Task {
                                    isCreatingSettlement = true
                                    do {
                                        try await viewModel.createAllSettlements()
                                    } catch {
                                        viewModel.error = error.localizedDescription
                                        showingError = true
                                    }
                                    isCreatingSettlement = false
                                }
                            }) {
                                if isCreatingSettlement {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Settle All")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.blue)
                                        .cornerRadius(8)
                                }
                            }
                            .disabled(isCreatingSettlement)
                        }
                        .padding(.horizontal)

                        ForEach(Array(viewModel.suggestions.enumerated()), id: \.offset) { index, suggestion in
                            SuggestionCard(
                                suggestion: suggestion,
                                index: index,
                                currentUserId: "",
                                isCreated: false,
                                onCreate: {
                                    Task {
                                        do {
                                            try await viewModel.createSettlement(suggestion: suggestion)
                                        } catch {
                                            viewModel.error = error.localizedDescription
                                            showingError = true
                                        }
                                    }
                                }
                            )
                            .padding(.horizontal)
                        }
                    }
                }

                // Balance Flow
                if let summary = viewModel.balanceSummary,
                   !summary.byPerson.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Balance Flow")
                            .font(.headline)
                            .padding(.horizontal)

                        BalanceFlowView(
                            balances: summary.byPerson,
                            currentUserId: ""
                        )
                        .padding(.horizontal)
                    }
                }

                // Balance Breakdown
                if let summary = viewModel.balanceSummary {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Balance Breakdown")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(summary.byGroup, id: \.groupId) { groupBalance in
                            if !groupBalance.members.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text(groupBalance.groupName)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .padding(.horizontal)

                                    ForEach(groupBalance.members, id: \.userId) { member in
                                        BalanceCard(
                                            balance: member,
                                            currentUserId: "",
                                            onSettleUp: { userId, amount in
                                                // Navigate to create settlement
                                            }
                                        )
                                        .padding(.horizontal)
                                    }
                                }
                            }
                        }
                    }
                }

                // Empty State
                if viewModel.balanceSummary?.byGroup.isEmpty == true {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)

                        Text("All Settled Up!")
                            .font(.title2)
                            .fontWeight(.bold)

                        Text("You have no outstanding balances")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 60)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Balances")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    Task {
                        await viewModel.loadData()
                    }
                }) {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.1))
            }
        }
    }
}

struct SummaryCard: View {
    let title: String
    let amount: Double
    let currency: String
    let color: Color
    let icon: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(color.opacity(0.8))

                Text(formatCurrency(amount))
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(color)
            }

            Spacer()

            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(color.opacity(0.8))
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(16)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

struct GroupFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray6))
                .cornerRadius(20)
        }
    }
}
