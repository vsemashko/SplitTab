//
//  ExpenseDetailView.swift
//  SplitTab
//
//  Expense Detail View
//

import SwiftUI

struct ExpenseDetailView: View {
    let expenseId: String
    @StateObject private var viewModel: ExpenseDetailViewModel
    @State private var showEditView = false
    @State private var showDeleteConfirmation = false
    @State private var selectedReceipt: String?
    @Environment(\.dismiss) var dismiss

    init(expenseId: String) {
        self.expenseId = expenseId
        _viewModel = StateObject(wrappedValue: ExpenseDetailViewModel(expenseId: expenseId))
    }

    var body: some View {
        ZStack {
            if viewModel.isLoading {
                VStack(spacing: 16) {
                    ProgressView()
                    Text("Loading expense...")
                        .foregroundColor(.secondary)
                }
            } else if let error = viewModel.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.red)

                    Text("Error")
                        .font(.headline)

                    Text(error)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    Button("Retry") {
                        Task {
                            await viewModel.fetchExpense()
                        }
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            } else if let expense = viewModel.expense {
                ScrollView {
                    VStack(spacing: 20) {
                        // Header Card
                        ExpenseHeaderCard(expense: expense, viewModel: viewModel)

                        // Participant Breakdown
                        ParticipantBreakdownCard(expense: expense, viewModel: viewModel)

                        // Receipt Images
                        if let receiptUrl = expense.receiptUrl {
                            ReceiptImagesCard(receiptUrl: receiptUrl, selectedReceipt: $selectedReceipt)
                        }

                        // Activity Log
                        ActivityLogCard(expense: expense)
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Expense Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        showEditView = true
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }

                    Button(role: .destructive) {
                        showDeleteConfirmation = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showEditView) {
            if let expense = viewModel.expense {
                ExpenseEditView(expense: expense)
            }
        }
        .sheet(item: $selectedReceipt) { url in
            ReceiptImageViewer(imageUrl: url)
        }
        .alert("Delete Expense", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task {
                    do {
                        try await viewModel.deleteExpense()
                        dismiss()
                    } catch {
                        // Show error
                    }
                }
            }
        } message: {
            Text("Are you sure you want to delete this expense? This action cannot be undone.")
        }
        .task {
            await viewModel.fetchExpense()
        }
    }
}

struct ExpenseHeaderCard: View {
    let expense: Expense
    let viewModel: ExpenseDetailViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                CategoryIconView(category: expense.category, size: 50)

                VStack(alignment: .leading, spacing: 4) {
                    Text(expense.description)
                        .font(.title2)
                        .fontWeight(.bold)

                    HStack(spacing: 8) {
                        Text(expense.category.displayName)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.secondary.opacity(0.2))
                            .cornerRadius(4)

                        if let group = expense.group {
                            Text(group.name)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue.opacity(0.2))
                                .cornerRadius(4)
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(viewModel.formatCurrency(expense.amount, currency: expense.currency))
                        .font(.title)
                        .fontWeight(.bold)

                    Text(formatDate(expense.expenseDate))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Paid By")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(expense.payer?.name ?? "Unknown")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Text(expense.payer?.email ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Created")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatDateTime(expense.createdAt))
                        .font(.caption)
                        .fontWeight(.medium)
                }
            }

            if let notes = expense.notes {
                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Notes")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(notes)
                        .font(.subheadline)
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.secondary.opacity(0.1))
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct ParticipantBreakdownCard: View {
    let expense: Expense
    let viewModel: ExpenseDetailViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Split Breakdown")
                .font(.headline)

            if let participants = expense.participants {
                ForEach(participants) { participant in
                    ParticipantRow(
                        participant: participant,
                        amount: viewModel.calculateParticipantAmount(participant: participant),
                        currency: expense.currency,
                        isPayer: participant.userId == expense.paidBy
                    )

                    if participant.id != participants.last?.id {
                        Divider()
                    }
                }

                Divider()
                    .background(Color.primary)

                HStack {
                    Text("Total")
                        .font(.headline)
                    Spacer()
                    Text(viewModel.formatCurrency(expense.amount, currency: expense.currency))
                        .font(.title2)
                        .fontWeight(.bold)
                }
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct ReceiptImagesCard: View {
    let receiptUrl: String
    @Binding var selectedReceipt: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "doc.text")
                Text("Receipt Images")
                    .font(.headline)
            }

            AsyncImage(url: URL(string: receiptUrl)) { image in
                image
                    .resizable()
                    .scaledToFill()
                    .frame(height: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .onTapGesture {
                        selectedReceipt = receiptUrl
                    }
            } placeholder: {
                Rectangle()
                    .fill(Color.secondary.opacity(0.2))
                    .frame(height: 200)
                    .overlay(ProgressView())
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct ActivityLogCard: View {
    let expense: Expense

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activity")
                .font(.headline)

            VStack(alignment: .leading, spacing: 12) {
                ActivityLogItem(
                    icon: "plus.circle.fill",
                    title: "Expense created",
                    date: expense.createdAt,
                    color: .blue
                )

                if expense.updatedAt != expense.createdAt {
                    ActivityLogItem(
                        icon: "pencil.circle.fill",
                        title: "Expense updated",
                        date: expense.updatedAt,
                        color: .orange
                    )
                }
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct ActivityLogItem: View {
    let icon: String
    let title: String
    let date: Date
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text(formatDateTime(date))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
    }

    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct ReceiptImageViewer: View {
    let imageUrl: String
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    ProgressView()
                }
            }
            .navigationTitle("Receipt")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// Make String identifiable for sheet presentation
extension String: Identifiable {
    public var id: String { self }
}

#Preview {
    NavigationStack {
        ExpenseDetailView(expenseId: "1")
    }
}
