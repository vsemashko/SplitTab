//
//  GroupCard.swift
//  SplitTab
//
//  Group Card Component
//

import SwiftUI

struct GroupCard: View {
    let group: Group
    let isAdmin: Bool
    var onDelete: (() -> Void)?
    var onLeave: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .top, spacing: 12) {
                // Group Avatar
                if let imageUrl = group.imageUrl {
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        GroupAvatarPlaceholder(name: group.name)
                    }
                    .frame(width: 50, height: 50)
                    .clipShape(Circle())
                } else {
                    GroupAvatarPlaceholder(name: group.name)
                        .frame(width: 50, height: 50)
                }

                // Group Info
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(group.name)
                            .font(.headline)
                            .lineLimit(1)

                        if isAdmin {
                            RoleBadge(role: .admin)
                        }
                    }

                    if let description = group.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Stats
            HStack(spacing: 16) {
                StatItem(
                    icon: "person.2.fill",
                    label: "Members",
                    value: "\(group.memberCount ?? 0)"
                )

                StatItem(
                    icon: "dollarsign.circle.fill",
                    label: "Expenses",
                    value: formatCurrency(group.totalExpenses ?? 0, currency: group.currency)
                )

                StatItem(
                    icon: "chart.line.uptrend.xyaxis",
                    label: "Balance",
                    value: formatCurrency(group.yourBalance ?? 0, currency: group.currency),
                    valueColor: balanceColor(group.yourBalance ?? 0)
                )
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }

    private func formatCurrency(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "$0"
    }

    private func balanceColor(_ balance: Double) -> Color {
        if balance > 0 {
            return .green
        } else if balance < 0 {
            return .red
        }
        return .primary
    }
}

struct StatItem: View {
    let icon: String
    let label: String
    let value: String
    var valueColor: Color = .primary

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                Text(label)
                    .font(.caption2)
            }
            .foregroundColor(.secondary)

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(valueColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct GroupAvatarPlaceholder: View {
    let name: String

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.blue.opacity(0.2))

            Image(systemName: "person.2.fill")
                .font(.title2)
                .foregroundColor(.blue)
        }
    }
}

#Preview {
    GroupCard(
        group: Group(
            id: "1",
            name: "Trip to Paris",
            description: "Summer vacation expenses",
            imageUrl: nil,
            currency: "USD",
            createdBy: "user1",
            isActive: true,
            createdAt: Date(),
            updatedAt: Date(),
            members: nil,
            memberCount: 5,
            totalExpenses: 1250.50,
            yourBalance: -125.00
        ),
        isAdmin: true
    )
    .padding()
}
