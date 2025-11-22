import SwiftUI

struct SuggestionCard: View {
    let suggestion: SettlementSuggestion
    let index: Int
    let currentUserId: String
    let isCreated: Bool
    var onCreate: (() -> Void)?

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                // Index badge
                Text("#\(index + 1)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue)
                    .cornerRadius(6)

                // Flow visualization
                HStack(spacing: 8) {
                    VStack(spacing: 4) {
                        Circle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text(suggestion.payerName.prefix(1).uppercased())
                                    .font(.caption)
                                    .fontWeight(.semibold)
                            )

                        Text(suggestion.payerName)
                            .font(.caption2)
                            .lineLimit(1)
                            .frame(maxWidth: 60)
                    }

                    VStack(spacing: 4) {
                        Image(systemName: "arrow.right")
                            .foregroundColor(.secondary)

                        Text(formatCurrency(suggestion.amount))
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }

                    VStack(spacing: 4) {
                        Circle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Text(suggestion.payeeName.prefix(1).uppercased())
                                    .font(.caption)
                                    .fontWeight(.semibold)
                            )

                        Text(suggestion.payeeName)
                            .font(.caption2)
                            .lineLimit(1)
                            .frame(maxWidth: 60)
                    }
                }

                if suggestion.payerId == currentUserId {
                    Text("You pay")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.orange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(6)
                }

                Spacer()
            }

            // Action button
            if isCreated {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)

                    Text("Created")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.green)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            } else if let onCreate = onCreate {
                Button(action: onCreate) {
                    Text("Create Settlement")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(isCreated ? Color.green.opacity(0.05) : Color(.systemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCreated ? Color.green.opacity(0.3) : Color.clear, lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = suggestion.currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}
