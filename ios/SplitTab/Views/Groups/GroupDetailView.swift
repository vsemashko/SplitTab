//
//  GroupDetailView.swift
//  SplitTab
//
//  Group Detail View
//

import SwiftUI

struct GroupDetailView: View {
    @StateObject private var viewModel: GroupDetailViewModel
    @State private var selectedTab = 0
    @State private var showAddExpense = false

    init(groupId: String) {
        _viewModel = StateObject(wrappedValue: GroupDetailViewModel(groupId: groupId))
    }

    var body: some View {
        ZStack {
            if viewModel.isLoading && viewModel.group == nil {
                // Loading state
                VStack(spacing: 16) {
                    ProgressView()
                    Text("Loading group...")
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
                            await viewModel.fetchData()
                        }
                    }
                    .buttonStyle(.bordered)
                }
            } else if let group = viewModel.group {
                // Group detail content
                ScrollView {
                    VStack(spacing: 20) {
                        // Group Header
                        GroupHeaderView(group: group, isAdmin: viewModel.isUserAdmin())

                        // Stats
                        GroupStatsCardsView(stats: viewModel.stats)

                        // Tabs
                        Picker("", selection: $selectedTab) {
                            Text("Overview").tag(0)
                            Text("Expenses").tag(1)
                            Text("Members").tag(2)
                            Text("Balances").tag(3)
                            Text("Activity").tag(4)
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal)

                        // Tab Content
                        TabView(selection: $selectedTab) {
                            OverviewTab(
                                viewModel: viewModel,
                                onAddExpense: { showAddExpense = true }
                            )
                            .tag(0)

                            ExpensesTab(
                                viewModel: viewModel,
                                onAddExpense: { showAddExpense = true }
                            )
                            .tag(1)

                            MembersTab(viewModel: viewModel)
                                .tag(2)

                            BalancesTab(viewModel: viewModel)
                                .tag(3)

                            ActivityTab(viewModel: viewModel)
                                .tag(4)
                        }
                        .tabViewStyle(.page(indexDisplayMode: .never))
                        .frame(height: 600)
                    }
                }
                .refreshable {
                    await viewModel.fetchData()
                }
            }
        }
        .navigationTitle(viewModel.group?.name ?? "Group")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if viewModel.isUserAdmin() {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: GroupSettingsView(groupId: viewModel.groupId)) {
                        Image(systemName: "gear")
                    }
                }
            }
        }
        .sheet(isPresented: $showAddExpense) {
            CreateExpenseView(preselectedGroupId: viewModel.groupId)
        }
        .task {
            await viewModel.fetchData()
        }
    }
}

struct GroupHeaderView: View {
    let group: Group
    let isAdmin: Bool

    var body: some View {
        VStack(spacing: 12) {
            // Avatar
            if let imageUrl = group.imageUrl {
                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    GroupAvatarPlaceholder(name: group.name)
                }
                .frame(width: 80, height: 80)
                .clipShape(Circle())
            } else {
                GroupAvatarPlaceholder(name: group.name)
                    .frame(width: 80, height: 80)
            }

            // Name and badge
            HStack(spacing: 8) {
                Text(group.name)
                    .font(.title2)
                    .fontWeight(.bold)

                if isAdmin {
                    RoleBadge(role: .admin)
                }
            }

            // Description
            if let description = group.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct GroupStatsCardsView: View {
    let stats: GroupStats

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(
                title: "Members",
                value: "\(stats.totalMembers)",
                icon: "person.2.fill",
                color: .blue
            )

            StatCard(
                title: "Expenses",
                value: "\(stats.totalExpenses)",
                icon: "dollarsign.circle.fill",
                color: .green
            )

            StatCard(
                title: "Total",
                value: formatCurrency(stats.totalAmount, stats.currency),
                icon: "chart.line.uptrend.xyaxis",
                color: .purple
            )

            StatCard(
                title: "Your Balance",
                value: formatCurrency(stats.yourBalance, stats.currency),
                icon: "dollarsign.circle.fill",
                color: stats.yourBalance >= 0 ? .green : .red
            )
        }
        .padding(.horizontal)
    }

    private func formatCurrency(_ amount: Double, _ currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

// Tab Views
struct OverviewTab: View {
    @ObservedObject var viewModel: GroupDetailViewModel
    let onAddExpense: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Recent Expenses
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Recent Expenses")
                        .font(.headline)
                    Spacer()
                    Button(action: onAddExpense) {
                        Label("Add", systemImage: "plus")
                            .font(.caption)
                    }
                }

                if viewModel.expenses.prefix(5).isEmpty {
                    Text("No expenses yet")
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else {
                    ForEach(Array(viewModel.expenses.prefix(5))) { expense in
                        NavigationLink(destination: ExpenseDetailView(expenseId: expense.id)) {
                            ExpenseRow(expense: expense, showGroup: false)
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct ExpensesTab: View {
    @ObservedObject var viewModel: GroupDetailViewModel
    let onAddExpense: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("All Expenses")
                    .font(.headline)
                Spacer()
                Button(action: onAddExpense) {
                    Label("Add", systemImage: "plus")
                }
            }
            .padding(.horizontal)

            if viewModel.expenses.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "dollarsign.circle")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    Text("No expenses yet")
                        .font(.headline)
                    Button(action: onAddExpense) {
                        Label("Add First Expense", systemImage: "plus")
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.expenses) { expense in
                            NavigationLink(destination: ExpenseDetailView(expenseId: expense.id)) {
                                ExpenseRow(expense: expense, showGroup: false)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}

struct MembersTab: View {
    @ObservedObject var viewModel: GroupDetailViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Members")
                .font(.headline)
                .padding(.horizontal)

            if let members = viewModel.group?.members {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(members) { member in
                            MemberRow(
                                member: member,
                                isCurrentUser: member.userId == viewModel.currentUserId,
                                canManage: false
                            )
                            .padding(.horizontal)
                        }
                    }
                }
            }
        }
    }
}

struct BalancesTab: View {
    @ObservedObject var viewModel: GroupDetailViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Balances")
                .font(.headline)
                .padding(.horizontal)

            if viewModel.balances.isEmpty {
                Text("No balances to show")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.balances) { balance in
                            BalanceRow(balance: balance, currency: viewModel.group?.currency ?? "USD")
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}

struct BalanceRow: View {
    let balance: Balance
    let currency: String

    var body: some View {
        HStack {
            UserAvatarPlaceholder(name: balance.otherUser?.name ?? "U")
                .frame(width: 40, height: 40)

            VStack(alignment: .leading) {
                Text(balance.otherUser?.name ?? "Unknown")
                    .font(.headline)
                Text(balance.amount > 0 ? "owes you" : "you owe")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(formatCurrency(abs(balance.amount), currency))
                .font(.headline)
                .foregroundColor(balance.amount > 0 ? .green : .red)
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(10)
    }

    private func formatCurrency(_ amount: Double, _ currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }
}

struct ActivityTab: View {
    @ObservedObject var viewModel: GroupDetailViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity Feed")
                .font(.headline)
                .padding(.horizontal)

            if viewModel.activities.isEmpty {
                Text("No activity yet")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.activities) { activity in
                            ActivityRow(activity: activity)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}

struct ActivityRow: View {
    let activity: Activity

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: activityIcon)
                .foregroundColor(activityColor)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                if let userName = activity.user?.name {
                    Text("\(userName) \(activity.description)")
                        .font(.subheadline)
                } else {
                    Text(activity.description)
                        .font(.subheadline)
                }

                Text(formatDate(activity.createdAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(10)
    }

    private var activityIcon: String {
        switch activity.type {
        case .expenseAdded: return "receipt.fill"
        case .memberJoined: return "person.badge.plus.fill"
        case .memberLeft: return "person.badge.minus.fill"
        case .settingsChanged: return "gear.fill"
        case .settlementMade: return "dollarsign.circle.fill"
        case .roleChanged: return "shield.fill"
        }
    }

    private var activityColor: Color {
        switch activity.type {
        case .expenseAdded: return .blue
        case .memberJoined: return .green
        case .memberLeft: return .red
        case .settingsChanged: return .gray
        case .settlementMade: return .green
        case .roleChanged: return .purple
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    NavigationStack {
        GroupDetailView(groupId: "sample-group-id")
    }
}
