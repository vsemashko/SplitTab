import SwiftUI

struct BalanceCard: View {
    let balance: PersonBalance
    let currentUserId: String
    var onSettleUp: ((String, Double) -> Void)?

    var body: some View {
        HStack(spacing: 16) {
            // User Avatar
            Circle()
                .fill(Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text(balance.userName.prefix(1).uppercased())
                        .font(.title3)
                        .fontWeight(.semibold)
                )

            // User Info
            VStack(alignment: .leading, spacing: 4) {
                Text(balance.userName)
                    .font(.headline)

                HStack(spacing: 4) {
                    Image(systemName: balance.balance > 0 ? "arrow.up.right" : "arrow.down.left")
                        .font(.caption)
                        .foregroundColor(balance.balance > 0 ? .green : .red)

                    Text(balance.balance > 0 ? "owes you" : "you owe")
                        .font(.caption)
                        .foregroundColor(balance.balance > 0 ? .green : .red)
                }
            }

            Spacer()

            // Amount and Action
            VStack(alignment: .trailing, spacing: 8) {
                Text(formatCurrency(abs(balance.balance)))
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(balance.balance > 0 ? .green : .red)

                if balance.balance < 0, let onSettleUp = onSettleUp {
                    Button(action: {
                        onSettleUp(balance.userId, abs(balance.balance))
                    }) {
                        Text("Settle Up")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = balance.currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}
