import SwiftUI

struct SettlementStatsView: View {
    let stats: SettlementStats

    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatCard(
                title: "Total Settled",
                value: formatCurrency(stats.totalSettled),
                icon: "dollarsign.circle.fill",
                color: .blue
            )

            StatCard(
                title: "Pending",
                value: "\(stats.pendingSettlements)",
                icon: "clock.fill",
                color: .orange
            )

            StatCard(
                title: "Completed",
                value: "\(stats.completedSettlements)",
                icon: "checkmark.circle.fill",
                color: .green
            )

            StatCard(
                title: "Cancelled",
                value: "\(stats.cancelledSettlements)",
                icon: "xmark.circle.fill",
                color: .gray
            )
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = stats.currency
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}
