import SwiftUI

struct BalanceBreakdownView: View {
    let groupBalances: [GroupBalance]
    let currentUserId: String
    var onSettleUp: ((String, Double, String?) -> Void)?

    @State private var selectedView: ViewMode = .byGroup

    enum ViewMode: String, CaseIterable {
        case byGroup = "By Group"
        case allBalances = "All Balances"
    }

    var body: some View {
        VStack(spacing: 0) {
            // View Mode Picker
            Picker("View", selection: $selectedView) {
                ForEach(ViewMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            // Content
            ScrollView {
                VStack(spacing: 20) {
                    switch selectedView {
                    case .byGroup:
                        ForEach(groupBalances, id: \.groupId) { groupBalance in
                            if !groupBalance.members.isEmpty {
                                GroupBalanceSection(
                                    groupBalance: groupBalance,
                                    currentUserId: currentUserId,
                                    onSettleUp: onSettleUp
                                )
                            }
                        }

                    case .allBalances:
                        let allBalances = groupBalances.flatMap { $0.members }
                        ForEach(allBalances, id: \.userId) { balance in
                            BalanceCard(
                                balance: balance,
                                currentUserId: currentUserId,
                                onSettleUp: onSettleUp != nil ? { userId, amount in
                                    onSettleUp?(userId, amount, nil)
                                } : nil
                            )
                        }
                    }

                    if groupBalances.allSatisfy({ $0.members.isEmpty }) {
                        EmptyBalanceState()
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Balance Breakdown")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct GroupBalanceSection: View {
    let groupBalance: GroupBalance
    let currentUserId: String
    var onSettleUp: ((String, Double, String?) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Group Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(groupBalance.groupName)
                        .font(.title3)
                        .fontWeight(.bold)

                    Text("Net: \(formatCurrency(abs(groupBalance.netBalance)))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Net Balance Badge
                HStack(spacing: 4) {
                    Image(systemName: groupBalance.netBalance >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                        .foregroundColor(groupBalance.netBalance >= 0 ? .green : .red)

                    Text(formatCurrency(abs(groupBalance.netBalance)))
                        .fontWeight(.semibold)
                }
                .foregroundColor(groupBalance.netBalance >= 0 ? .green : .red)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    (groupBalance.netBalance >= 0 ? Color.green : Color.red)
                        .opacity(0.1)
                )
                .cornerRadius(8)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Member Balances
            ForEach(groupBalance.members, id: \.userId) { member in
                BalanceCard(
                    balance: member,
                    currentUserId: currentUserId,
                    onSettleUp: onSettleUp != nil ? { userId, amount in
                        onSettleUp?(userId, amount, groupBalance.groupId)
                    } : nil
                )
            }
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = groupBalance.currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

struct EmptyBalanceState: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)

            Text("All Settled Up!")
                .font(.title2)
                .fontWeight(.bold)

            Text("You have no outstanding balances.\nGreat job keeping things even!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 60)
    }
}
