//
//  ExpenseRow.swift
//  SplitTab
//
//  Expense Row Component
//

import SwiftUI

struct ExpenseRow: View {
    let expense: Expense
    var showGroup: Bool = true

    var body: some View {
        HStack(spacing: 12) {
            // Category Icon
            Image(systemName: expense.category.iconName)
                .font(.title2)
                .foregroundColor(.primary)
                .frame(width: 40, height: 40)
                .background(Color.primary.opacity(0.1))
                .clipShape(Circle())

            // Expense Details
            VStack(alignment: .leading, spacing: 4) {
                Text(expense.description)
                    .font(.headline)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    if showGroup, let groupName = expense.group?.name {
                        Text(groupName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.1))
                            .cornerRadius(4)
                    }

                    Text(expense.category.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if let payer = expense.payer {
                    Text("Paid by \(payer.name)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Amount and Date
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatCurrency(expense.amount, currency: expense.currency))
                    .font(.headline)
                    .foregroundColor(.primary)

                Text(formatDate(expense.expenseDate))
                    .font(.caption)
                    .foregroundColor(.secondary)
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

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

#Preview {
    List {
        ExpenseRow(expense: Expense(
            id: "1",
            groupId: "group1",
            description: "Dinner at restaurant",
            amount: 125.50,
            currency: "USD",
            paidBy: "user1",
            expenseDate: Date(),
            category: .food,
            receiptUrl: nil,
            notes: nil,
            createdAt: Date(),
            updatedAt: Date(),
            participants: nil,
            payer: User(
                id: "user1",
                email: "john@example.com",
                emailVerified: true,
                name: "John Doe",
                profilePictureUrl: nil,
                phoneNumber: nil,
                phoneVerified: false,
                defaultCurrency: "USD",
                timezone: "UTC",
                language: "en",
                googleId: nil,
                appleId: nil,
                twoFactorEnabled: false,
                lastLoginAt: nil,
                createdAt: Date(),
                updatedAt: Date()
            ),
            group: Group(
                id: "group1",
                name: "Weekend Trip",
                description: nil,
                imageUrl: nil,
                currency: "USD",
                createdBy: "user1",
                isActive: true,
                createdAt: Date(),
                updatedAt: Date(),
                members: nil,
                memberCount: nil,
                totalExpenses: nil,
                yourBalance: nil
            )
        ))
    }
}
