import SwiftUI

struct StatusBadge: View {
    let status: SettlementStatus

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: iconName)
                .font(.caption2)

            Text(statusText)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(backgroundColor)
        .foregroundColor(foregroundColor)
        .cornerRadius(8)
    }

    private var iconName: String {
        switch status {
        case .pending: return "clock"
        case .confirmed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }

    private var statusText: String {
        switch status {
        case .pending: return "Pending"
        case .confirmed: return "Confirmed"
        case .cancelled: return "Cancelled"
        }
    }

    private var backgroundColor: Color {
        switch status {
        case .pending: return Color.yellow.opacity(0.2)
        case .confirmed: return Color.green.opacity(0.2)
        case .cancelled: return Color.gray.opacity(0.2)
        }
    }

    private var foregroundColor: Color {
        switch status {
        case .pending: return .orange
        case .confirmed: return .green
        case .cancelled: return .gray
        }
    }
}
