import SwiftUI

struct SettlementRow: View {
    let settlement: Settlement
    let currentUserId: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with status
            HStack {
                HStack(spacing: 8) {
                    // Payer Avatar
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 32, height: 32)
                        .overlay(
                            Text(settlement.payer?.name?.prefix(1).uppercased() ?? "U")
                                .font(.caption)
                                .fontWeight(.semibold)
                        )

                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    // Payee Avatar
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 32, height: 32)
                        .overlay(
                            Text(settlement.payee?.name?.prefix(1).uppercased() ?? "U")
                                .font(.caption)
                                .fontWeight(.semibold)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(settlement.payer?.name ?? "Unknown")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            Image(systemName: "arrow.right")
                                .font(.caption2)
                                .foregroundColor(.secondary)

                            Text(settlement.payee?.name ?? "Unknown")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }

                        if let groupName = settlement.group?.name {
                            Text(groupName)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()

                StatusBadge(status: settlement.status)
            }

            // Amount and details
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(formatCurrency(settlement.amount))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)

                    if let paymentMethod = settlement.paymentMethod {
                        Text("via \(getPaymentMethodLabel(paymentMethod))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(settlement.createdAt, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if settlement.payerId == currentUserId {
                        Text("You paid")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.orange)
                    } else if settlement.payeeId == currentUserId {
                        Text("You received")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.green)
                    }
                }
            }

            // Notes if available
            if let notes = settlement.notes, !notes.isEmpty {
                Text(notes)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(6)
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
        formatter.currencyCode = settlement.currency ?? "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }

    private func getPaymentMethodLabel(_ method: PaymentMethod) -> String {
        switch method {
        case .cash: return "Cash"
        case .creditCard: return "Credit Card"
        case .debitCard: return "Debit Card"
        case .bankTransfer: return "Bank Transfer"
        case .venmo: return "Venmo"
        case .paypal: return "PayPal"
        case .zelle: return "Zelle"
        case .applePay: return "Apple Pay"
        case .googlePay: return "Google Pay"
        case .other: return "Other"
        }
    }
}
