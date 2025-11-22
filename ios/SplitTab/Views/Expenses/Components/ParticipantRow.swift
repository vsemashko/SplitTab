//
//  ParticipantRow.swift
//  SplitTab
//
//  Participant Row Component
//

import SwiftUI

struct ParticipantRow: View {
    let participant: ExpenseParticipant
    let amount: Double
    let currency: String
    let isPayer: Bool

    var body: some View {
        HStack(spacing: 12) {
            // User Avatar
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.2))
                    .frame(width: 40, height: 40)

                Text(participant.user?.name.prefix(1).uppercased() ?? "?")
                    .font(.headline)
                    .foregroundColor(.blue)
            }

            // User Info
            VStack(alignment: .leading, spacing: 4) {
                Text(participant.user?.name ?? "Unknown")
                    .font(.subheadline)
                    .fontWeight(.medium)

                HStack(spacing: 4) {
                    Text(participant.user?.email ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if isPayer {
                        Text("(Paid)")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }

            Spacer()

            // Amount Info
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatCurrency(amount, currency: currency))
                    .font(.subheadline)
                    .fontWeight(.semibold)

                if participant.shareType == .percentage {
                    Text("\(String(format: "%.1f", participant.share))%")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                } else if participant.shareType == .shares {
                    Text("\(String(format: "%.0f", participant.share)) shares")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                if participant.isPaid {
                    Text("Settled")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.2))
                        .foregroundColor(.green)
                        .cornerRadius(4)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func formatCurrency(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}
