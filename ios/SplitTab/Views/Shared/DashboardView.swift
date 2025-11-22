//
//  DashboardView.swift
//  SplitTab
//
//  Main dashboard view
//

import SwiftUI

struct DashboardView: View {
    @State private var totalBalance: Double = 0.0
    @State private var recentActivity: [String] = []

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Balance Card
                BalanceCardView(balance: totalBalance)
                    .padding(.horizontal)

                // Quick Actions
                QuickActionsView()
                    .padding(.horizontal)

                // Recent Activity
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Activity")
                        .font(.headline)
                        .padding(.horizontal)

                    // Activity list placeholder
                    ForEach(0..<5) { index in
                        ActivityRowView()
                            .padding(.horizontal)
                    }
                }
                .padding(.top)
            }
            .padding(.top)
        }
        .navigationTitle("Dashboard")
    }
}

struct BalanceCardView: View {
    let balance: Double

    var body: some View {
        VStack(spacing: 12) {
            Text("Total Balance")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.9))

            Text(balance >= 0 ? "+$\(abs(balance), specifier: "%.2f")" : "-$\(abs(balance), specifier: "%.2f")")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)

            HStack(spacing: 16) {
                BalanceInfoView(title: "You owe", amount: 0.0)
                Divider()
                    .frame(height: 30)
                    .background(Color.white.opacity(0.3))
                BalanceInfoView(title: "Owed to you", amount: 0.0)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .shadow(radius: 5)
    }
}

struct BalanceInfoView: View {
    let title: String
    let amount: Double

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
            Text("$\(amount, specifier: "%.2f")")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
        }
    }
}

struct QuickActionsView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                QuickActionButton(icon: "plus.circle.fill", title: "Add Expense", color: .blue)
                QuickActionButton(icon: "person.3.fill", title: "New Group", color: .green)
                QuickActionButton(icon: "dollarsign.circle.fill", title: "Settle Up", color: .orange)
            }
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.white)
                .frame(width: 50, height: 50)
                .background(color)
                .cornerRadius(12)

            Text(title)
                .font(.caption)
                .foregroundColor(.primary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ActivityRowView: View {
    var body: some View {
        HStack {
            Image(systemName: "fork.knife")
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 4) {
                Text("Dinner at Restaurant")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("2 hours ago")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text("$45.00")
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct GroupsListView: View {
    var body: some View {
        List {
            ForEach(0..<10) { index in
                HStack {
                    Image(systemName: "person.3.fill")
                        .foregroundColor(.blue)
                    Text("Group \(index + 1)")
                }
            }
        }
        .navigationTitle("Groups")
    }
}

struct ActivityView: View {
    var body: some View {
        List {
            ForEach(0..<20) { index in
                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.orange)
                    Text("Activity \(index + 1)")
                }
            }
        }
        .navigationTitle("Activity")
    }
}

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthenticationViewModel

    var body: some View {
        List {
            Section {
                if let user = authViewModel.currentUser {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)

                        VStack(alignment: .leading) {
                            Text(user.name)
                                .font(.title2)
                                .fontWeight(.semibold)
                            Text(user.email)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical)
                }
            }

            Section("Settings") {
                NavigationLink("Edit Profile") {
                    Text("Edit Profile")
                }
                NavigationLink("Preferences") {
                    Text("Preferences")
                }
                NavigationLink("Privacy & Security") {
                    Text("Privacy & Security")
                }
            }

            Section {
                Button("Logout", role: .destructive) {
                    Task {
                        await authViewModel.logout()
                    }
                }
            }
        }
        .navigationTitle("Profile")
    }
}
