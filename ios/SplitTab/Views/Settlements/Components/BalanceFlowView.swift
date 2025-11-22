import SwiftUI

struct BalanceFlowView: View {
    let balances: [PersonBalance]
    let currentUserId: String

    var creditors: [PersonBalance] {
        balances.filter { $0.balance > 0 }
    }

    var debtors: [PersonBalance] {
        balances.filter { $0.balance < 0 }
    }

    var body: some View {
        VStack(spacing: 24) {
            // Creditors (People who are owed money)
            if !creditors.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("People who are owed money")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)

                    ForEach(creditors, id: \.userId) { creditor in
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Text(creditor.userName.prefix(1).uppercased())
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                )

                            VStack(alignment: .leading, spacing: 2) {
                                Text(creditor.userName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)

                                Text("is owed")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text("+\(formatCurrency(creditor.balance))")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                        .padding(12)
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(10)
                    }
                }
            }

            // Flow indicator
            if !creditors.isEmpty && !debtors.isEmpty {
                HStack {
                    Divider()
                    Image(systemName: "arrow.down")
                        .foregroundColor(.secondary)
                    Divider()
                }
                .frame(height: 20)
            }

            // Debtors (People who owe money)
            if !debtors.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("People who owe money")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)

                    ForEach(debtors, id: \.userId) { debtor in
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Text(debtor.userName.prefix(1).uppercased())
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                )

                            VStack(alignment: .leading, spacing: 2) {
                                Text(debtor.userName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)

                                Text("owes")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text(formatCurrency(abs(debtor.balance)))
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                        }
                        .padding(12)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(10)
                    }
                }
            }

            // Empty state
            if creditors.isEmpty && debtors.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.green)

                    Text("All balanced!")
                        .font(.headline)

                    Text("No money owed")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}
